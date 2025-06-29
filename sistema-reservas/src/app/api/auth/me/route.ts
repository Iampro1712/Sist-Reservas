import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth'
import { ApiResponse } from '@/types'

async function handler(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.id

    // Obtener datos completos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Error obteniendo perfil:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export const GET = requireAuth(handler)
