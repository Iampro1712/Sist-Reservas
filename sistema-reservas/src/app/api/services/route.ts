import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProvider, AuthenticatedRequest } from '@/middleware/auth'
import { validateData, createServiceSchema, serviceFiltersSchema } from '@/lib/validations'
import { ApiResponse } from '@/types'
import type { Prisma } from '@prisma/client'

// GET - Obtener servicios con filtros
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Convertir strings a tipos apropiados
    const filters = {
      ...queryParams,
      page: queryParams.page ? parseInt(queryParams.page) : undefined,
      limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
      isActive: queryParams.isActive ? queryParams.isActive === 'true' : undefined
    }

    const validation = validateData(serviceFiltersSchema, filters)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.errors.join(', ')
      }, { status: 400 })
    }

    const { page = 1, limit = 10, isActive, providerId } = validation.data

    const where: Prisma.ServiceWhereInput = {}
    if (isActive !== undefined) where.isActive = isActive
    if (providerId) where.providerId = providerId

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              reservations: true,
              schedules: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.service.count({ where })
    ])

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        services,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error obteniendo servicios:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// POST - Crear servicio (solo ADMIN/PROVIDER)
async function postHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const userId = request.user!.id

    // Validar datos de entrada
    const validation = validateData(createServiceSchema, body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.errors.join(', ')
      }, { status: 400 })
    }

    const { name, description, duration, price } = validation.data

    // Crear servicio
    const service = await prisma.service.create({
      data: {
        name,
        description,
        duration,
        price,
        providerId: userId
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: service,
      message: 'Servicio creado exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creando servicio:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export const GET = getHandler
export const POST = requireProvider(postHandler)
