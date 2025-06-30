import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null

export async function getRedisClient() {
  if (!redisClient) {
    // Obtener configuración desde variables de entorno
    const redisHost = process.env.REDIS_HOST
    const redisPort = parseInt(process.env.REDIS_PORT || '6379')
    const redisUsername = process.env.REDIS_USERNAME
    const redisPassword = process.env.REDIS_PASSWORD
    const redisUrl = process.env.REDIS_URL

    if (!redisHost && !redisUrl) {
      console.warn('⚠️  Redis no configurado (REDIS_HOST o REDIS_URL), usando store en memoria')
      return null
    }

    try {
      // Usar URL si está disponible, sino usar configuración individual
      if (redisUrl) {
        redisClient = createClient({
          url: redisUrl,
          socket: {
            connectTimeout: 10000,
          }
        })
      } else {
        redisClient = createClient({
          socket: {
            host: redisHost,
            port: redisPort,
            connectTimeout: 10000,
          },
          username: redisUsername,
          password: redisPassword,
          database: 0
        })
      }
      
      redisClient.on('error', (err) => {
        console.error('❌ Redis Client Error:', err)
      })

      redisClient.on('connect', () => {
        console.log('✅ Redis Client Connected to Redis Cloud')
      })

      await redisClient.connect()
      console.log('✅ Redis conectado exitosamente a Redis Cloud')
      return redisClient
      
    } catch (error) {
      console.error('❌ Error conectando a Redis:', error)
      redisClient = null
      return null
    }
  }

  return redisClient
}

export async function getRateLimitData(key: string) {
  const client = await getRedisClient()
  if (!client) return null

  try {
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('❌ Error getting rate limit data:', error)
    return null
  }
}

export async function setRateLimitData(key: string, data: { count: number; resetTime: number }, ttlSeconds: number) {
  const client = await getRedisClient()
  if (!client) return false

  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('❌ Error setting rate limit data:', error)
    return false
  }
}
