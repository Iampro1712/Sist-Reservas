import { z } from 'zod'

// Validaciones para autenticación
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional()
})

// Validaciones para servicios
export const createServiceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  duration: z.number().min(15, 'La duración mínima es 15 minutos').max(480, 'La duración máxima es 8 horas'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0')
})

export const updateServiceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  description: z.string().optional(),
  duration: z.number().min(15, 'La duración mínima es 15 minutos').max(480, 'La duración máxima es 8 horas').optional(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
  isActive: z.boolean().optional()
})

// Validaciones para horarios
export const createScheduleSchema = z.object({
  serviceId: z.string().cuid('ID de servicio inválido'),
  dayOfWeek: z.number().min(0, 'Día de la semana inválido').max(6, 'Día de la semana inválido'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)')
}).refine(data => {
  const start = data.startTime.split(':').map(Number)
  const end = data.endTime.split(':').map(Number)
  const startMinutes = start[0] * 60 + start[1]
  const endMinutes = end[0] * 60 + end[1]
  return endMinutes > startMinutes
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endTime']
})

// Validaciones para reservas
export const createReservationSchema = z.object({
  serviceId: z.string().cuid('ID de servicio inválido'),
  date: z.string().datetime('Fecha inválida'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  notes: z.string().optional()
})

export const updateReservationSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  notes: z.string().optional()
})

// Validaciones para notificaciones
export const createNotificationSchema = z.object({
  userId: z.string().cuid('ID de usuario inválido'),
  type: z.enum(['RESERVATION_CONFIRMED', 'RESERVATION_CANCELLED', 'RESERVATION_REMINDER', 'SCHEDULE_CHANGE', 'SYSTEM_NOTIFICATION']),
  title: z.string().min(1, 'El título es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
  reservationId: z.string().cuid('ID de reserva inválido').optional()
})

// Validaciones para filtros
export const paginationSchema = z.object({
  page: z.number().min(1, 'La página debe ser mayor a 0').optional(),
  limit: z.number().min(1, 'El límite debe ser mayor a 0').max(100, 'El límite máximo es 100').optional()
})

export const reservationFiltersSchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  serviceId: z.string().cuid('ID de servicio inválido').optional(),
  userId: z.string().cuid('ID de usuario inválido').optional(),
  dateFrom: z.string().datetime('Fecha desde inválida').optional(),
  dateTo: z.string().datetime('Fecha hasta inválida').optional()
})

export const serviceFiltersSchema = paginationSchema.extend({
  isActive: z.boolean().optional(),
  providerId: z.string().cuid('ID de proveedor inválido').optional()
})

// Función helper para validar datos
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return { success: false, errors }
    }
    return { success: false, errors: ['Error de validación desconocido'] }
  }
}
