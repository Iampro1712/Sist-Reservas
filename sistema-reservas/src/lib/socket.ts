import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { verifyToken } from './jwt'

export class SocketManager {
  private io: SocketIOServer
  private userSockets: Map<string, string> = new Map() // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    // Middleware de autenticación
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token
      
      if (!token) {
        return next(new Error('Token requerido'))
      }

      const payload = verifyToken(token)
      if (!payload) {
        return next(new Error('Token inválido'))
      }

      socket.data.user = payload
      next()
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.data.user.userId
      console.log(`Usuario ${userId} conectado con socket ${socket.id}`)

      // Guardar la conexión del usuario
      this.userSockets.set(userId, socket.id)

      // Unir al usuario a su sala personal
      socket.join(`user:${userId}`)

      // Si es proveedor, unirlo a la sala de proveedores
      if (socket.data.user.role === 'PROVIDER' || socket.data.user.role === 'ADMIN') {
        socket.join('providers')
      }

      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log(`Usuario ${userId} desconectado`)
        this.userSockets.delete(userId)
      })

      // Eventos personalizados
      socket.on('join-service-room', (serviceId: string) => {
        socket.join(`service:${serviceId}`)
        console.log(`Usuario ${userId} se unió a la sala del servicio ${serviceId}`)
      })

      socket.on('leave-service-room', (serviceId: string) => {
        socket.leave(`service:${serviceId}`)
        console.log(`Usuario ${userId} salió de la sala del servicio ${serviceId}`)
      })
    })
  }

  // Métodos públicos para emitir eventos
  public notifyUser(userId: string, event: string, data: unknown) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  public notifyProviders(event: string, data: unknown) {
    this.io.to('providers').emit(event, data)
  }

  public notifyServiceSubscribers(serviceId: string, event: string, data: unknown) {
    this.io.to(`service:${serviceId}`).emit(event, data)
  }

  public broadcastToAll(event: string, data: unknown) {
    this.io.emit(event, data)
  }

  // Métodos específicos para el sistema de reservas
  public notifyReservationUpdate(reservation: {
    userId: string
    serviceId: string
    date: string | Date
    service?: {
      provider?: {
        id: string
      }
    }
  }) {
    // Notificar al cliente
    this.notifyUser(reservation.userId, 'reservation-update', reservation)

    // Notificar al proveedor del servicio
    if (reservation.service?.provider?.id) {
      this.notifyUser(reservation.service.provider.id, 'reservation-update', reservation)
    }

    // Notificar a otros usuarios suscritos al servicio sobre cambios de disponibilidad
    this.notifyServiceSubscribers(
      reservation.serviceId,
      'availability-update',
      {
        serviceId: reservation.serviceId,
        date: reservation.date
      }
    )
  }

  public notifyNewNotification(notification: { userId: string; [key: string]: unknown }) {
    this.notifyUser(notification.userId, 'notification', notification)
  }

  public notifyAvailabilityChange(serviceId: string, date: string) {
    this.notifyServiceSubscribers(serviceId, 'availability-update', {
      serviceId,
      date
    })
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys())
  }

  public isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId)
  }
}

// Singleton instance
let socketManager: SocketManager | null = null

export function initializeSocket(server: HTTPServer): SocketManager {
  if (!socketManager) {
    socketManager = new SocketManager(server)
  }
  return socketManager
}

export function getSocketManager(): SocketManager | null {
  return socketManager
}
