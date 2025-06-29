import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, AvailabilitySlot, DayAvailability } from '@/types'
import { parseISO } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const date = searchParams.get('date')

    if (!serviceId || !date) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'serviceId y date son requeridos'
      }, { status: 400 })
    }

    // Verificar que el servicio existe
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        schedules: {
          where: { isActive: true }
        }
      }
    })

    if (!service || !service.isActive) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Servicio no encontrado o inactivo'
      }, { status: 404 })
    }

    const requestedDate = parseISO(date)
    const dayOfWeek = requestedDate.getDay()

    // Obtener horarios para el día solicitado
    const daySchedules = service.schedules.filter(schedule => 
      schedule.dayOfWeek === dayOfWeek
    )

    if (daySchedules.length === 0) {
      return NextResponse.json<ApiResponse<DayAvailability>>({
        success: true,
        data: {
          date,
          slots: []
        }
      })
    }

    // Obtener reservas existentes para ese día
    const existingReservations = await prisma.reservation.findMany({
      where: {
        serviceId,
        date: requestedDate,
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      select: {
        startTime: true,
        endTime: true
      }
    })

    // Generar slots de disponibilidad
    const allSlots: AvailabilitySlot[] = []

    for (const schedule of daySchedules) {
      const slots = generateTimeSlots(
        schedule.startTime,
        schedule.endTime,
        service.duration,
        existingReservations
      )
      allSlots.push(...slots)
    }

    // Ordenar slots por hora
    allSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))

    const availability: DayAvailability = {
      date,
      slots: allSlots
    }

    return NextResponse.json<ApiResponse<DayAvailability>>({
      success: true,
      data: availability
    })

  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number,
  existingReservations: { startTime: string; endTime: string }[]
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = []
  
  // Convertir tiempos a minutos para facilitar cálculos
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  
  let currentMinutes = startMinutes
  
  while (currentMinutes + duration <= endMinutes) {
    const slotStart = minutesToTime(currentMinutes)
    const slotEnd = minutesToTime(currentMinutes + duration)
    
    // Verificar si hay conflicto con reservas existentes
    const hasConflict = existingReservations.some(reservation => {
      const reservationStart = timeToMinutes(reservation.startTime)
      const reservationEnd = timeToMinutes(reservation.endTime)
      
      return (
        (currentMinutes >= reservationStart && currentMinutes < reservationEnd) ||
        (currentMinutes + duration > reservationStart && currentMinutes + duration <= reservationEnd) ||
        (currentMinutes <= reservationStart && currentMinutes + duration >= reservationEnd)
      )
    })
    
    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      isAvailable: !hasConflict
    })
    
    // Incrementar en intervalos de 30 minutos (o la duración del servicio si es menor)
    currentMinutes += Math.min(30, duration)
  }
  
  return slots
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}
