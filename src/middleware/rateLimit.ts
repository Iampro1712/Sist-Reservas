import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Ventana de tiempo en milisegundos
  maxRequests: number // Máximo número de requests por ventana
  message?: string // Mensaje personalizado
  skipSuccessfulRequests?: boolean // No contar requests exitosos
  skipFailedRequests?: boolean // No contar requests fallidos
}

interface RequestRecord {
  count: number
  resetTime: number
}

// Store en memoria para rate limiting (en producción usar Redis)
const requestStore = new Map<string, RequestRecord>()

// Limpiar registros expirados cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Demasiadas solicitudes, intenta de nuevo más tarde',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config

  return function rateLimit(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      // Obtener IP del cliente
      const clientIP = getClientIP(request)
      const key = `${clientIP}:${request.nextUrl.pathname}`
      
      const now = Date.now()
      const resetTime = now + windowMs
      
      // Obtener o crear registro para esta IP
      let record = requestStore.get(key)
      
      if (!record || now > record.resetTime) {
        // Crear nuevo registro o resetear si expiró
        record = {
          count: 0,
          resetTime
        }
        requestStore.set(key, record)
      }
      
      // Incrementar contador
      record.count++
      
      // Verificar si excede el límite
      if (record.count > maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000)
        
        return NextResponse.json({
          success: false,
          error: message,
          retryAfter: `${retryAfter} segundos`
        }, {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetTime.toString(),
            'Retry-After': retryAfter.toString()
          }
        })
      }
      
      // Ejecutar el handler original
      const response = await handler(request)
      
      // Agregar headers de rate limit a la respuesta
      const remaining = Math.max(0, maxRequests - record.count)
      response.headers.set('X-RateLimit-Limit', maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', record.resetTime.toString())
      
      // Opcional: no contar requests exitosos/fallidos
      if (
        (skipSuccessfulRequests && response.status < 400) ||
        (skipFailedRequests && response.status >= 400)
      ) {
        record.count--
      }
      
      return response
    }
  }
}

// Configuraciones predefinidas
export const strictRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 10, // 10 requests por 15 minutos
  message: 'Demasiadas solicitudes. Límite: 10 requests por 15 minutos'
})

export const moderateRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // 100 requests por 15 minutos
  message: 'Demasiadas solicitudes. Límite: 100 requests por 15 minutos'
})

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5, // 5 intentos de login por 15 minutos
  message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos'
})

export const generalRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  maxRequests: 60, // 60 requests por minuto
  message: 'Demasiadas solicitudes. Límite: 60 requests por minuto'
})

// Función para obtener la IP del cliente
function getClientIP(request: NextRequest): string {
  // Intentar obtener IP de headers de proxy
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback para desarrollo local
  return request.ip || '127.0.0.1'
}
