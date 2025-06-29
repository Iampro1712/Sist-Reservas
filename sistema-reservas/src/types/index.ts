// Tipos de la base de datos (exportados desde Prisma)
export type {
  User,
  Service,
  Schedule,
  Reservation,
  Notification,
  UserRole,
  ReservationStatus,
  NotificationType
} from '@prisma/client'

// Tipos para APIs
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Tipos para autenticación
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  phone?: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
  token: string
}

// Tipos para reservas
export interface CreateReservationRequest {
  serviceId: string
  date: string // ISO date string
  startTime: string // "HH:mm"
  notes?: string
}

export interface UpdateReservationRequest {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  notes?: string
}

// Tipos para servicios
export interface CreateServiceRequest {
  name: string
  description?: string
  duration: number // en minutos
  price: number
}

export interface UpdateServiceRequest {
  name?: string
  description?: string
  duration?: number
  price?: number
  isActive?: boolean
}

// Tipos para horarios
export interface CreateScheduleRequest {
  serviceId: string
  dayOfWeek: number // 0-6 (Domingo a Sábado)
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
}

// Tipos para disponibilidad
export interface AvailabilitySlot {
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface DayAvailability {
  date: string
  slots: AvailabilitySlot[]
}

// Tipos para notificaciones
export interface CreateNotificationRequest {
  userId: string
  type: 'RESERVATION_CONFIRMED' | 'RESERVATION_CANCELLED' | 'RESERVATION_REMINDER' | 'SCHEDULE_CHANGE' | 'SYSTEM_NOTIFICATION'
  title: string
  message: string
  reservationId?: string
}

// Tipos para Socket.io
export interface SocketEvents {
  // Cliente -> Servidor
  'join-room': (userId: string) => void
  'leave-room': (userId: string) => void

  // Servidor -> Cliente
  'reservation-update': (reservation: unknown) => void
  'availability-update': (serviceId: string, date: string) => void
  'notification': (notification: unknown) => void
}

// Tipos para validación
export interface ValidationError {
  field: string
  message: string
}

// Tipos para filtros y paginación
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface ReservationFilters extends PaginationParams {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  serviceId?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
}

export interface ServiceFilters extends PaginationParams {
  isActive?: boolean
  providerId?: string
}
