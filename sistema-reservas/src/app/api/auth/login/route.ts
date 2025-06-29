import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { signToken } from '@/lib/jwt'
import { validateData, loginSchema } from '@/lib/validations'
import { ApiResponse, AuthResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const validation = validateData(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.errors.join(', ')
      }, { status: 400 })
    }

    const { email, password } = validation.data

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Credenciales inválidas'
      }, { status: 401 })
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Credenciales inválidas'
      }, { status: 401 })
    }

    // Generar token JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Respuesta sin la contraseña
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    }

    return NextResponse.json<ApiResponse<AuthResponse>>({
      success: true,
      data: response,
      message: 'Login exitoso'
    })

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
