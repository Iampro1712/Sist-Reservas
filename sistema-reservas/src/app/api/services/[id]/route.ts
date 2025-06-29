import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthenticatedRequest } from '@/middleware/auth'
import { validateData, updateServiceSchema } from '@/lib/validations'
import { ApiResponse } from '@/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET - Obtener servicio por ID
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        schedules: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
        },
        _count: {
          select: {
            reservations: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Servicio no encontrado'
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: service
    })

  } catch (error) {
    console.error('Error obteniendo servicio:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// PUT - Actualizar servicio (solo el proveedor o admin)
async function putHandler(request: AuthenticatedRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const userId = request.user!.id
    const userRole = request.user!.role

    // Validar datos de entrada
    const validation = validateData(updateServiceSchema, body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.errors.join(', ')
      }, { status: 400 })
    }

    // Verificar que el servicio existe
    const existingService = await prisma.service.findUnique({
      where: { id }
    })

    if (!existingService) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Servicio no encontrado'
      }, { status: 404 })
    }

    // Verificar permisos (solo el proveedor del servicio o admin)
    if (userRole !== 'ADMIN' && existingService.providerId !== userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No tienes permisos para modificar este servicio'
      }, { status: 403 })
    }

    // Actualizar servicio
    const updatedService = await prisma.service.update({
      where: { id },
      data: validation.data,
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
      data: updatedService,
      message: 'Servicio actualizado exitosamente'
    })

  } catch (error) {
    console.error('Error actualizando servicio:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// DELETE - Eliminar servicio (solo el proveedor o admin)
async function deleteHandler(request: AuthenticatedRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const userId = request.user!.id
    const userRole = request.user!.role

    // Verificar que el servicio existe
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reservations: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED'] }
              }
            }
          }
        }
      }
    })

    if (!existingService) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Servicio no encontrado'
      }, { status: 404 })
    }

    // Verificar permisos
    if (userRole !== 'ADMIN' && existingService.providerId !== userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No tienes permisos para eliminar este servicio'
      }, { status: 403 })
    }

    // Verificar que no tenga reservas activas
    if (existingService._count.reservations > 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No se puede eliminar un servicio con reservas activas'
      }, { status: 400 })
    }

    // Eliminar servicio
    await prisma.service.delete({
      where: { id }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Servicio eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error eliminando servicio:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticateUser(request))
  if ('error' in authResult) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
  }
  if (!['ADMIN', 'PROVIDER'].includes(authResult.user.role)) {
    return NextResponse.json({ success: false, error: 'No tienes permisos para realizar esta acción' }, { status: 403 })
  }
  const authenticatedRequest = request as AuthenticatedRequest
  authenticatedRequest.user = authResult.user
  return putHandler(authenticatedRequest, context)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticateUser(request))
  if ('error' in authResult) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
  }
  if (!['ADMIN', 'PROVIDER'].includes(authResult.user.role)) {
    return NextResponse.json({ success: false, error: 'No tienes permisos para realizar esta acción' }, { status: 403 })
  }
  const authenticatedRequest = request as AuthenticatedRequest
  authenticatedRequest.user = authResult.user
  return deleteHandler(authenticatedRequest, context)
}
