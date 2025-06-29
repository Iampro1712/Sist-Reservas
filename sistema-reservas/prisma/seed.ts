import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
  await prisma.notification.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.service.deleteMany()
  await prisma.user.deleteMany()

  // Hash para contraseñas de prueba
  const hashedPassword = await bcrypt.hash('123456', 12)

  // Crear usuarios
  const admin = await prisma.user.create({
    data: {
      email: 'admin@reservas.com',
      password: hashedPassword,
      name: 'Administrador',
      phone: '+1234567890',
      role: 'ADMIN'
    }
  })

  const provider1 = await prisma.user.create({
    data: {
      email: 'doctor@clinica.com',
      password: hashedPassword,
      name: 'Dr. Juan Pérez',
      phone: '+1234567891',
      role: 'PROVIDER'
    }
  })

  const provider2 = await prisma.user.create({
    data: {
      email: 'estilista@salon.com',
      password: hashedPassword,
      name: 'María González',
      phone: '+1234567892',
      role: 'PROVIDER'
    }
  })

  const client1 = await prisma.user.create({
    data: {
      email: 'cliente1@email.com',
      password: hashedPassword,
      name: 'Ana López',
      phone: '+1234567893',
      role: 'CLIENT'
    }
  })

  const client2 = await prisma.user.create({
    data: {
      email: 'cliente2@email.com',
      password: hashedPassword,
      name: 'Carlos Rodríguez',
      phone: '+1234567894',
      role: 'CLIENT'
    }
  })

  console.log('✅ Usuarios creados')

  // Crear servicios
  const consultaMedica = await prisma.service.create({
    data: {
      name: 'Consulta Médica General',
      description: 'Consulta médica general con revisión completa',
      duration: 30,
      price: 50.00,
      providerId: provider1.id
    }
  })

  const consultaEspecialista = await prisma.service.create({
    data: {
      name: 'Consulta Especialista',
      description: 'Consulta con médico especialista',
      duration: 45,
      price: 80.00,
      providerId: provider1.id
    }
  })

  const cortePelo = await prisma.service.create({
    data: {
      name: 'Corte de Pelo',
      description: 'Corte de pelo profesional',
      duration: 45,
      price: 25.00,
      providerId: provider2.id
    }
  })

  const tinte = await prisma.service.create({
    data: {
      name: 'Tinte y Peinado',
      description: 'Servicio completo de tinte y peinado',
      duration: 120,
      price: 60.00,
      providerId: provider2.id
    }
  })

  console.log('✅ Servicios creados')

  // Crear horarios
  // Horarios para consultas médicas (Lunes a Viernes, 8:00-17:00)
  for (let day = 1; day <= 5; day++) {
    await prisma.schedule.create({
      data: {
        serviceId: consultaMedica.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '12:00'
      }
    })

    await prisma.schedule.create({
      data: {
        serviceId: consultaMedica.id,
        dayOfWeek: day,
        startTime: '14:00',
        endTime: '17:00'
      }
    })

    await prisma.schedule.create({
      data: {
        serviceId: consultaEspecialista.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '12:00'
      }
    })

    await prisma.schedule.create({
      data: {
        serviceId: consultaEspecialista.id,
        dayOfWeek: day,
        startTime: '15:00',
        endTime: '17:00'
      }
    })
  }

  // Horarios para salón de belleza (Martes a Sábado, 9:00-18:00)
  for (let day = 2; day <= 6; day++) {
    await prisma.schedule.create({
      data: {
        serviceId: cortePelo.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00'
      }
    })

    await prisma.schedule.create({
      data: {
        serviceId: tinte.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '16:00'
      }
    })
  }

  console.log('✅ Horarios creados')

  // Crear algunas reservas de ejemplo
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  await prisma.reservation.create({
    data: {
      userId: client1.id,
      serviceId: consultaMedica.id,
      date: tomorrow,
      startTime: '09:00',
      endTime: '09:30',
      status: 'CONFIRMED',
      totalPrice: consultaMedica.price,
      notes: 'Primera consulta'
    }
  })

  await prisma.reservation.create({
    data: {
      userId: client2.id,
      serviceId: cortePelo.id,
      date: dayAfterTomorrow,
      startTime: '10:00',
      endTime: '10:45',
      status: 'PENDING',
      totalPrice: cortePelo.price
    }
  })

  console.log('✅ Reservas de ejemplo creadas')

  // Crear notificaciones de ejemplo
  await prisma.notification.create({
    data: {
      userId: client1.id,
      type: 'RESERVATION_CONFIRMED',
      title: 'Reserva Confirmada',
      message: 'Tu consulta médica ha sido confirmada para mañana a las 9:00 AM'
    }
  })

  await prisma.notification.create({
    data: {
      userId: client2.id,
      type: 'RESERVATION_REMINDER',
      title: 'Recordatorio de Cita',
      message: 'Tienes una cita pendiente de confirmación para corte de pelo'
    }
  })

  console.log('✅ Notificaciones creadas')

  console.log('🎉 Seed completado exitosamente!')
  console.log('\n📋 Usuarios de prueba:')
  console.log('Admin: admin@reservas.com / 123456')
  console.log('Doctor: doctor@clinica.com / 123456')
  console.log('Estilista: estilista@salon.com / 123456')
  console.log('Cliente 1: cliente1@email.com / 123456')
  console.log('Cliente 2: cliente2@email.com / 123456')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
