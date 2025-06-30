import { NextRequest, NextResponse } from 'next/server'
import { generalRateLimit } from '@/lib/rateLimit'

async function healthHandler(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Sistema de Reservas API funcionando correctamente',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '1.1.0', // Nueva versión con rate limiting
      userAgent: request.headers.get('user-agent') || 'unknown',
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

// Aplicar rate limiting al endpoint de health
export const GET = generalRateLimit(healthHandler)
