import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { signToken } from '@/lib/jwt'
import { validateData, registerSchema } from '@/lib/validations'
import { ApiResponse, AuthResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const validation = validateData(registerSchema, body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.errors.join(', ')
      }, { status: 400 })
    }

    const { email, password, name, phone } = validation.data

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'El email ya está registrado'
      }, { status: 409 })
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'CLIENT' // Por defecto todos son clientes
      }
    })

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
      message: 'Usuario registrado exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
