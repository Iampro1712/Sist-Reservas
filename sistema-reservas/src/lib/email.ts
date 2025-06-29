import nodemailer from 'nodemailer'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Configuración del transportador de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Configuración de email no encontrada, simulando envío...')
      console.log(`Email simulado enviado a: ${options.to}`)
      console.log(`Asunto: ${options.subject}`)
      return true
    }

    const info = await transporter.sendMail({
      from: `"Sistema de Reservas" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    })

    console.log('Email enviado:', info.messageId)
    return true
  } catch (error) {
    console.error('Error enviando email:', error)
    return false
  }
}

// Templates de email
export const emailTemplates = {
  reservationConfirmed: (data: {
    userName: string
    serviceName: string
    date: Date
    startTime: string
    providerName: string
    totalPrice: number
  }) => ({
    subject: 'Reserva Confirmada - Sistema de Reservas',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Tu reserva ha sido confirmada!</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalles de tu reserva:</h3>
          <p><strong>Servicio:</strong> ${data.serviceName}</p>
          <p><strong>Fecha:</strong> ${format(data.date, 'EEEE, d MMMM yyyy', { locale: es })}</p>
          <p><strong>Hora:</strong> ${data.startTime}</p>
          <p><strong>Proveedor:</strong> ${data.providerName}</p>
          <p><strong>Precio:</strong> $${data.totalPrice.toFixed(2)}</p>
        </div>
        
        <p>Hola ${data.userName},</p>
        <p>Tu reserva ha sido confirmada exitosamente. Te esperamos en la fecha y hora programada.</p>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Recordatorio:</strong> Por favor llega 10 minutos antes de tu cita.</p>
        </div>
        
        <p>Si necesitas cancelar o reprogramar tu cita, por favor contáctanos con al menos 24 horas de anticipación.</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Este es un email automático, por favor no respondas a este mensaje.
        </p>
      </div>
    `,
    text: `
      ¡Tu reserva ha sido confirmada!
      
      Detalles de tu reserva:
      - Servicio: ${data.serviceName}
      - Fecha: ${format(data.date, 'EEEE, d MMMM yyyy', { locale: es })}
      - Hora: ${data.startTime}
      - Proveedor: ${data.providerName}
      - Precio: $${data.totalPrice.toFixed(2)}
      
      Hola ${data.userName},
      Tu reserva ha sido confirmada exitosamente. Te esperamos en la fecha y hora programada.
      
      Recordatorio: Por favor llega 10 minutos antes de tu cita.
      
      Si necesitas cancelar o reprogramar tu cita, por favor contáctanos con al menos 24 horas de anticipación.
    `
  }),

  reservationCancelled: (data: {
    userName: string
    serviceName: string
    date: Date
    startTime: string
  }) => ({
    subject: 'Reserva Cancelada - Sistema de Reservas',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Reserva Cancelada</h2>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalles de la reserva cancelada:</h3>
          <p><strong>Servicio:</strong> ${data.serviceName}</p>
          <p><strong>Fecha:</strong> ${format(data.date, 'EEEE, d MMMM yyyy', { locale: es })}</p>
          <p><strong>Hora:</strong> ${data.startTime}</p>
        </div>
        
        <p>Hola ${data.userName},</p>
        <p>Tu reserva ha sido cancelada como solicitaste.</p>
        <p>Esperamos poder atenderte en una próxima oportunidad.</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Este es un email automático, por favor no respondas a este mensaje.
        </p>
      </div>
    `,
    text: `
      Reserva Cancelada
      
      Detalles de la reserva cancelada:
      - Servicio: ${data.serviceName}
      - Fecha: ${format(data.date, 'EEEE, d MMMM yyyy', { locale: es })}
      - Hora: ${data.startTime}
      
      Hola ${data.userName},
      Tu reserva ha sido cancelada como solicitaste.
      Esperamos poder atenderte en una próxima oportunidad.
    `
  }),

  reservationReminder: (data: {
    userName: string
    serviceName: string
    date: Date
    startTime: string
    providerName: string
  }) => ({
    subject: 'Recordatorio de Cita - Mañana',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Recordatorio de tu cita</h2>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Tu cita es mañana:</h3>
          <p><strong>Servicio:</strong> ${data.serviceName}</p>
          <p><strong>Fecha:</strong> ${format(data.date, 'EEEE, d MMMM yyyy', { locale: es })}</p>
          <p><strong>Hora:</strong> ${data.startTime}</p>
          <p><strong>Proveedor:</strong> ${data.providerName}</p>
        </div>
        
        <p>Hola ${data.userName},</p>
        <p>Este es un recordatorio de que tienes una cita programada para mañana.</p>
        <p>Por favor confirma tu asistencia y llega 10 minutos antes de la hora programada.</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Este es un email automático, por favor no respondas a este mensaje.
        </p>
      </div>
    `,
    text: `
      Recordatorio de tu cita
      
      Tu cita es mañana:
      - Servicio: ${data.serviceName}
      - Fecha: ${format(data.date, 'EEEE, d MMMM yyyy', { locale: es })}
      - Hora: ${data.startTime}
      - Proveedor: ${data.providerName}
      
      Hola ${data.userName},
      Este es un recordatorio de que tienes una cita programada para mañana.
      Por favor confirma tu asistencia y llega 10 minutos antes de la hora programada.
    `
  })
}
