import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthenticatedRequest } from '@/middleware/auth'
import { validateData, updateReservationSchema } from '@/lib/validations'
import { ApiResponse } from '@/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET - Obtener reserva por ID
async function getHandler(request: AuthenticatedRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const userId = request.user!.id
    const userRole = request.user!.role

    const reservation = await prisma.reservation.findUnique({
      where: { id },
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
            description: true,
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

    if (!reservation) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Reserva no encontrada'
      }, { status: 404 })
    }

    // Verificar permisos
    const canAccess = 
      userRole === 'ADMIN' ||
      reservation.userId === userId ||
      (userRole === 'PROVIDER' && reservation.service.provider.id === userId)

    if (!canAccess) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No tienes permisos para ver esta reserva'
      }, { status: 403 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: reservation
    })

  } catch (error) {
    console.error('Error obteniendo reserva:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// PUT - Actualizar reserva
async function putHandler(request: AuthenticatedRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const userId = request.user!.id
    const userRole = request.user!.role

    // Validar datos de entrada
    const validation = validateData(updateReservationSchema, body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.errors.join(', ')
      }, { status: 400 })
    }

    // Verificar que la reserva existe
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            providerId: true
          }
        }
      }
    })

    if (!existingReservation) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Reserva no encontrada'
      }, { status: 404 })
    }

    // Verificar permisos para actualizar
    const canUpdate = 
      userRole === 'ADMIN' ||
      (userRole === 'PROVIDER' && existingReservation.service.providerId === userId) ||
      (userRole === 'CLIENT' && existingReservation.userId === userId && validation.data.status === 'CANCELLED')

    if (!canUpdate) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No tienes permisos para modificar esta reserva'
      }, { status: 403 })
    }

    // Los clientes solo pueden cancelar sus propias reservas
    if (userRole === 'CLIENT' && validation.data.status && validation.data.status !== 'CANCELLED') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Solo puedes cancelar tus reservas'
      }, { status: 403 })
    }

    // Actualizar reserva
    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: validation.data,
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
      data: updatedReservation,
      message: 'Reserva actualizada exitosamente'
    })

  } catch (error) {
    console.error('Error actualizando reserva:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// DELETE - Eliminar reserva (solo admin)
async function deleteHandler(request: AuthenticatedRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const userRole = request.user!.role

    // Solo admins pueden eliminar reservas
    if (userRole !== 'ADMIN') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No tienes permisos para eliminar reservas'
      }, { status: 403 })
    }

    // Verificar que la reserva existe
    const existingReservation = await prisma.reservation.findUnique({
      where: { id }
    })

    if (!existingReservation) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Reserva no encontrada'
      }, { status: 404 })
    }

    // Eliminar reserva
    await prisma.reservation.delete({
      where: { id }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Reserva eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error eliminando reserva:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticateUser(request))
  if ('error' in authResult) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
  }
  const authenticatedRequest = request as AuthenticatedRequest
  authenticatedRequest.user = authResult.user
  return getHandler(authenticatedRequest, context)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticateUser(request))
  if ('error' in authResult) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
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
  const authenticatedRequest = request as AuthenticatedRequest
  authenticatedRequest.user = authResult.user
  return deleteHandler(authenticatedRequest, context)
}
