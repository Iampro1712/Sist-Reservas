import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProvider, AuthenticatedRequest } from '@/middleware/auth'
import { validateData, createScheduleSchema } from '@/lib/validations'
import { ApiResponse } from '@/types'
import type { Prisma } from '@prisma/client'

// GET - Obtener horarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')

    const where: Prisma.ScheduleWhereInput = {}
    if (serviceId) where.serviceId = serviceId

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            provider: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { serviceId: 'asc' },
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: schedules
    })

  } catch (error) {
    console.error('Error obteniendo horarios:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// POST - Crear horario (solo ADMIN/PROVIDER)
async function postHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const userId = request.user!.id
    const userRole = request.user!.role

    // Validar datos de entrada
    const validation = validateData(createScheduleSchema, body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.errors.join(', ')
      }, { status: 400 })
    }

    const { serviceId, dayOfWeek, startTime, endTime } = validation.data

    // Verificar que el servicio existe
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Servicio no encontrado'
      }, { status: 404 })
    }

    // Verificar permisos (solo el proveedor del servicio o admin)
    if (userRole !== 'ADMIN' && service.providerId !== userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No tienes permisos para crear horarios para este servicio'
      }, { status: 403 })
    }

    // Verificar que no existe un horario conflictivo
    const conflictingSchedule = await prisma.schedule.findFirst({
      where: {
        serviceId,
        dayOfWeek,
        isActive: true,
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

    if (conflictingSchedule) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Ya existe un horario que se superpone con el horario especificado'
      }, { status: 409 })
    }

    // Crear horario
    const schedule = await prisma.schedule.create({
      data: {
        serviceId,
        dayOfWeek,
        startTime,
        endTime
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            provider: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: schedule,
      message: 'Horario creado exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creando horario:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export const POST = requireProvider(postHandler)
