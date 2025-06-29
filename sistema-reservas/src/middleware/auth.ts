import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload & { id: string }
}

export async function authenticateUser(request: NextRequest): Promise<{ user: JWTPayload & { id: string } } | { error: string }> {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return { error: 'Token de acceso requerido' }
  }

  const payload = verifyToken(token)
  if (!payload) {
    return { error: 'Token inválido o expirado' }
  }

  // Verificar que el usuario existe en la base de datos
  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  })

  if (!user) {
    return { error: 'Usuario no encontrado' }
  }

  return { user: { ...payload, id: payload.userId } }
}

export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const authResult = await authenticateUser(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Agregar el usuario al request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = authResult.user

    return handler(authenticatedRequest)
  }
}

export function requireRole(roles: string[]) {
  return function(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (request: NextRequest) => {
      const authResult = await authenticateUser(request)
      
      if ('error' in authResult) {
        return NextResponse.json(
          { success: false, error: authResult.error },
          { status: 401 }
        )
      }

      if (!roles.includes(authResult.user.role)) {
        return NextResponse.json(
          { success: false, error: 'No tienes permisos para realizar esta acción' },
          { status: 403 }
        )
      }

      // Agregar el usuario al request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = authResult.user

      return handler(authenticatedRequest)
    }
  }
}

// Middleware específicos para roles
export const requireAdmin = requireRole(['ADMIN'])
export const requireProvider = requireRole(['ADMIN', 'PROVIDER'])
export const requireClient = requireRole(['ADMIN', 'PROVIDER', 'CLIENT'])
