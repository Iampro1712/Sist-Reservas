import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitData, setRateLimitData } from '@/lib/redis'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
}

interface RequestRecord {
  count: number
  resetTime: number
}

// Fallback store en memoria cuando Redis no está disponible
const memoryStore = new Map<string, RequestRecord>()

export function createRateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = 'Demasiadas solicitudes, intenta de nuevo más tarde' } = config

  return function rateLimit(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const clientIP = getClientIP(request)
      const key = `ratelimit:${clientIP}:${request.nextUrl.pathname}`

      const now = Date.now()
      const resetTime = now + windowMs
      const ttlSeconds = Math.ceil(windowMs / 1000)

      let record: RequestRecord

      // Intentar usar Redis primero, fallback a memoria
      try {
        const redisData = await getRateLimitData(key)

        if (redisData && now <= redisData.resetTime) {
          // Usar datos existentes de Redis
          record = redisData
          record.count++

          // Actualizar en Redis
          await setRateLimitData(key, record, ttlSeconds)
        } else {
          // Crear nuevo registro en Redis
          record = { count: 1, resetTime }
          await setRateLimitData(key, record, ttlSeconds)
        }

        console.log(`🔒 Rate limit usando Redis: ${key} - ${record.count}/${maxRequests}`)

      } catch (error) {
        console.warn('⚠️  Redis no disponible, usando memoria local:', error)

        // Fallback a memoria local
        let memRecord = memoryStore.get(key)

        if (!memRecord || now > memRecord.resetTime) {
          memRecord = { count: 1, resetTime }
          memoryStore.set(key, memRecord)
        } else {
          memRecord.count++
        }

        record = memRecord

        // Limpiar registros expirados cada 100 requests (optimización)
        if (Math.random() < 0.01) {
          for (const [k, v] of memoryStore.entries()) {
            if (now > v.resetTime) {
              memoryStore.delete(k)
            }
          }
        }
      }

      // Verificar si excede el límite
      if (record.count > maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000)

        return NextResponse.json({
          success: false,
          error: message,
          retryAfter: `${retryAfter} segundos`,
          rateLimitInfo: {
            limit: maxRequests,
            remaining: 0,
            reset: record.resetTime,
            retryAfter
          }
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

      // Ejecutar handler original
      const response = await handler(request)

      // Agregar headers de rate limit
      const remaining = Math.max(0, maxRequests - record.count)
      response.headers.set('X-RateLimit-Limit', maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', record.resetTime.toString())

      return response
    }
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) return cfConnectingIP

  // Fallback para desarrollo local
  return '127.0.0.1'
}

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos'
})

export const moderateRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  message: 'Demasiadas solicitudes. Límite: 100 requests por 15 minutos'
})

export const generalRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000,
  maxRequests: 60,
  message: 'Demasiadas solicitudes. Límite: 60 requests por minuto'
})
