import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth'
import { validateData, createReservationSchema, reservationFiltersSchema } from '@/lib/validations'
import { ApiResponse, ReservationStatus } from '@/types'
import { addMinutes, format, parseISO } from 'date-fns'
import type { Prisma } from '@prisma/client'

// GET - Obtener reservas con filtros
async function getHandler(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const userId = request.user!.id
    const userRole = request.user!.role
    
    // Convertir strings a tipos apropiados
    const filters = {
      ...queryParams,
      page: queryParams.page ? parseInt(queryParams.page) : undefined,
      limit: queryParams.limit ? parseInt(queryParams.limit) : undefined
    }

    const validation = validateData(reservationFiltersSchema, filters)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.errors.join(', ')
      }, { status: 400 })
    }

    const { page = 1, limit = 10, status, serviceId, dateFrom, dateTo } = validation.data

    const where: Prisma.ReservationWhereInput = {}

    // Los clientes solo ven sus propias reservas
    if (userRole === 'CLIENT') {
      where.userId = userId
    }
    // Los proveedores ven reservas de sus servicios
    else if (userRole === 'PROVIDER') {
      where.service = { providerId: userId }
    }
    // Los admins ven todas las reservas (sin filtro adicional)

    if (status) where.status = status as ReservationStatus
    if (serviceId) where.serviceId = serviceId
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
              provider: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' }
      }),
      prisma.reservation.count({ where })
    ])

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        reservations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error obteniendo reservas:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// POST - Crear reserva
async function postHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const userId = request.user!.id

    // Validar datos de entrada
    const validation = validateData(createReservationSchema, body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.errors.join(', ')
      }, { status: 400 })
    }

    const { serviceId, date, startTime, notes } = validation.data

    // Verificar que el servicio existe y está activo
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        schedules: {
          where: { isActive: true }
        }
      }
    })

    if (!service || !service.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Servicio no disponible'
      }, { status: 400 })
    }

    // Convertir fecha y hora
    const reservationDate = parseISO(date)
    const dayOfWeek = reservationDate.getDay()

    // Verificar que el día y hora están en el horario del servicio
    const validSchedule = service.schedules.find(schedule => 
      schedule.dayOfWeek === dayOfWeek &&
      startTime >= schedule.startTime &&
      startTime < schedule.endTime
    )

    if (!validSchedule) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Horario no disponible para este servicio'
      }, { status: 400 })
    }

    // Calcular hora de fin basada en la duración del servicio
    const startDateTime = new Date(`${format(reservationDate, 'yyyy-MM-dd')}T${startTime}:00`)
    const endDateTime = addMinutes(startDateTime, service.duration)
    const endTime = format(endDateTime, 'HH:mm')

    // Verificar que no hay conflictos con otras reservas
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        serviceId,
        date: reservationDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    })

    if (conflictingReservation) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Ya existe una reserva en ese horario'
      }, { status: 409 })
    }

    // Crear reserva
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        serviceId,
        date: reservationDate,
        startTime,
        endTime,
        notes,
        totalPrice: service.price,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            provider: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: reservation,
      message: 'Reserva creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creando reserva:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export const GET = requireAuth(getHandler)
export const POST = requireAuth(postHandler)
