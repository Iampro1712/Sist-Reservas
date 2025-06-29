import * as cron from 'node-cron'
import { prisma } from './prisma'
import { sendEmail, emailTemplates } from './email'
import { getSocketManager } from './socket'
import { addDays } from 'date-fns'

export class TaskScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map()

  constructor() {
    this.initializeTasks()
  }

  private initializeTasks() {
    // Recordatorios diarios a las 9:00 AM
    this.scheduleTask('daily-reminders', '0 9 * * *', this.sendDailyReminders.bind(this))
    
    // Limpieza de notificaciones antiguas - cada domingo a las 2:00 AM
    this.scheduleTask('cleanup-notifications', '0 2 * * 0', this.cleanupOldNotifications.bind(this))
    
    // Actualizar estado de reservas pasadas - cada hora
    this.scheduleTask('update-past-reservations', '0 * * * *', this.updatePastReservations.bind(this))
    
    // Recordatorios de confirmación - cada 30 minutos
    this.scheduleTask('confirmation-reminders', '*/30 * * * *', this.sendConfirmationReminders.bind(this))

    console.log('✅ Tareas programadas inicializadas')
  }

  private scheduleTask(name: string, cronExpression: string, task: () => Promise<void>) {
    const scheduledTask = cron.schedule(cronExpression, async () => {
      try {
        console.log(`🔄 Ejecutando tarea: ${name}`)
        await task()
        console.log(`✅ Tarea completada: ${name}`)
      } catch (error) {
        console.error(`❌ Error en tarea ${name}:`, error)
      }
    }, {
      timezone: "America/Mexico_City" // Ajusta según tu zona horaria
    })

    this.tasks.set(name, scheduledTask)
  }

  // Enviar recordatorios diarios
  private async sendDailyReminders() {
    const tomorrow = addDays(new Date(), 1)
    
    // Obtener reservas confirmadas para mañana
    const tomorrowReservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()),
          lt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)
        },
        status: 'CONFIRMED'
      },
      include: {
        user: true,
        service: {
          include: {
            provider: true
          }
        }
      }
    })

    console.log(`📧 Enviando ${tomorrowReservations.length} recordatorios para mañana`)

    for (const reservation of tomorrowReservations) {
      try {
        // Enviar email
        const emailTemplate = emailTemplates.reservationReminder({
          userName: reservation.user.name,
          serviceName: reservation.service.name,
          date: reservation.date,
          startTime: reservation.startTime,
          providerName: reservation.service.provider.name
        })

        await sendEmail({
          to: reservation.user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        })

        // Crear notificación en la base de datos
        const notification = await prisma.notification.create({
          data: {
            userId: reservation.user.id,
            type: 'RESERVATION_REMINDER',
            title: 'Recordatorio de Cita',
            message: `Tienes una cita mañana: ${reservation.service.name} a las ${reservation.startTime}`,
            reservationId: reservation.id
          }
        })

        // Enviar notificación en tiempo real si el usuario está conectado
        const socketManager = getSocketManager()
        if (socketManager) {
          socketManager.notifyNewNotification(notification)
        }

      } catch (error) {
        console.error(`Error enviando recordatorio para reserva ${reservation.id}:`, error)
      }
    }
  }

  // Limpiar notificaciones antiguas (más de 30 días)
  private async cleanupOldNotifications() {
    const thirtyDaysAgo = addDays(new Date(), -30)
    
    const deletedCount = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        },
        isRead: true
      }
    })

    console.log(`🗑️ Eliminadas ${deletedCount.count} notificaciones antiguas`)
  }

  // Actualizar estado de reservas pasadas
  private async updatePastReservations() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Marcar como NO_SHOW las reservas confirmadas que ya pasaron
    const updatedReservations = await prisma.reservation.updateMany({
      where: {
        date: {
          lt: today
        },
        status: 'CONFIRMED'
      },
      data: {
        status: 'NO_SHOW'
      }
    })

    if (updatedReservations.count > 0) {
      console.log(`📅 Actualizadas ${updatedReservations.count} reservas pasadas a NO_SHOW`)
    }

    // Cancelar automáticamente reservas pendientes de más de 24 horas
    const yesterdayReservations = await prisma.reservation.updateMany({
      where: {
        date: {
          lt: addDays(today, -1)
        },
        status: 'PENDING'
      },
      data: {
        status: 'CANCELLED'
      }
    })

    if (yesterdayReservations.count > 0) {
      console.log(`⏰ Canceladas ${yesterdayReservations.count} reservas pendientes antiguas`)
    }
  }

  // Recordatorios de confirmación para reservas pendientes
  private async sendConfirmationReminders() {
    const tomorrow = addDays(new Date(), 1)
    
    // Obtener reservas pendientes para mañana
    const pendingReservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()),
          lt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)
        },
        status: 'PENDING'
      },
      include: {
        user: true,
        service: {
          include: {
            provider: true
          }
        }
      }
    })

    for (const reservation of pendingReservations) {
      try {
        // Crear notificación para el proveedor
        const notification = await prisma.notification.create({
          data: {
            userId: reservation.service.provider.id,
            type: 'RESERVATION_REMINDER',
            title: 'Reserva Pendiente de Confirmación',
            message: `Tienes una reserva pendiente para mañana: ${reservation.user.name} - ${reservation.service.name} a las ${reservation.startTime}`,
            reservationId: reservation.id
          }
        })

        // Enviar notificación en tiempo real
        const socketManager = getSocketManager()
        if (socketManager) {
          socketManager.notifyNewNotification(notification)
        }

      } catch (error) {
        console.error(`Error enviando recordatorio de confirmación para reserva ${reservation.id}:`, error)
      }
    }
  }

  // Métodos públicos para control manual
  public startTask(taskName: string) {
    const task = this.tasks.get(taskName)
    if (task) {
      task.start()
      console.log(`▶️ Tarea iniciada: ${taskName}`)
    }
  }

  public stopTask(taskName: string) {
    const task = this.tasks.get(taskName)
    if (task) {
      task.stop()
      console.log(`⏸️ Tarea detenida: ${taskName}`)
    }
  }

  public stopAllTasks() {
    this.tasks.forEach((task, name) => {
      task.stop()
      console.log(`⏸️ Tarea detenida: ${name}`)
    })
  }

  public getTaskStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {}
    this.tasks.forEach((task, name) => {
      status[name] = task.getStatus() === 'scheduled'
    })
    return status
  }
}

// Singleton instance
let taskScheduler: TaskScheduler | null = null

export function initializeScheduler(): TaskScheduler {
  if (!taskScheduler) {
    taskScheduler = new TaskScheduler()
  }
  return taskScheduler
}

export function getScheduler(): TaskScheduler | null {
  return taskScheduler
}
