import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Sistema de Reservas API funcionando correctamente',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth/*',
        services: '/api/services/*',
        reservations: '/api/reservations/*',
        schedules: '/api/schedules',
        availability: '/api/availability'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error en el sistema',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
