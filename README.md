# Sistema de Reservas - Backend Completo

Un sistema completo de reservas con disponibilidad en tiempo real, notificaciones automáticas y gestión de calendarios, construido con Next.js, Prisma, PostgreSQL, Socket.io y JWT.

## 🏢 ¿Para qué tipo de negocio?

Este sistema es **adaptable** para cualquier negocio que maneje citas o reservas:

### 🏥 **Clínicas y Consultorios**
- Consultas médicas generales
- Especialistas (dermatólogos, cardiólogos, etc.)
- Terapias y tratamientos
- Laboratorios y estudios

### 💇 **Salones de Belleza y Spas**
- Cortes de pelo y peinados
- Tratamientos faciales
- Masajes y relajación
- Manicure y pedicure

### 🍽️ **Restaurantes y Cafeterías**
- Reservas de mesas
- Eventos privados
- Cenas especiales
- Servicios de catering

### 🏋️ **Gimnasios y Centros Deportivos**
- Clases grupales (yoga, pilates, spinning)
- Entrenamiento personal
- Canchas deportivas
- Equipos especializados

### 🎓 **Centros Educativos**
- Tutorías personalizadas
- Clases particulares
- Asesorías académicas
- Talleres y cursos

### 🚗 **Talleres y Servicios Técnicos**
- Reparación de vehículos
- Mantenimiento preventivo
- Servicios a domicilio
- Consultoría técnica

### 🏨 **Hoteles y Turismo**
- Reservas de habitaciones
- Tours y excursiones
- Servicios de spa
- Actividades recreativas

**Datos de prueba incluidos**: Clínica médica y salón de belleza

## 🚀 Características

### 🔒 **API v1.1.0 - Nueva Versión con Rate Limiting**

- **Autenticación JWT**: Sistema seguro de autenticación con roles (Admin, Provider, Client)
- **Rate Limiting**: Protección contra abuso de APIs con límites personalizados
  - **Autenticación**: 5 intentos por 15 minutos (login/register)
  - **APIs Generales**: 100 requests por 15 minutos (servicios, reservas)
  - **Health Check**: 60 requests por minuto
  - **Storage**: Redis para producción, memoria local como fallback
- **Gestión de Servicios**: CRUD completo para servicios con horarios personalizables
- **Sistema de Reservas**: Reservas con validación de disponibilidad y conflictos
- **Disponibilidad en Tiempo Real**: Socket.io para actualizaciones instantáneas
- **Notificaciones Automáticas**: Emails y notificaciones programadas
- **Gestión de Calendarios**: Horarios flexibles por día de la semana
- **Validación Robusta**: Zod para validación de datos
- **Base de Datos**: PostgreSQL con Prisma ORM

## 🛠️ Tecnologías

- **Backend**: Next.js 15 (API Routes)
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Cache/Rate Limiting**: Redis (opcional)
- **Autenticación**: JWT + bcrypt
- **Tiempo Real**: Socket.io
- **Validación**: Zod
- **Emails**: Nodemailer
- **Tareas Programadas**: node-cron
- **Fechas**: date-fns
- **Frontend**: React + Tailwind CSS

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd sistema-reservas
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/reservas"

# JWT Secret
JWT_SECRET="tu-jwt-secret-super-seguro"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASS="tu-app-password"

# Redis Configuration (Rate Limiting - v1.1.0)
# Opción 1: Configuración individual (recomendada)
REDIS_HOST="tu-host-redis"
REDIS_PORT=14042
REDIS_USERNAME="default"
REDIS_PASSWORD="tu-redis-password"

# Opción 2: URL completa (alternativa)
# REDIS_URL="redis://username:password@host:port"

# App Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-nextauth-secret"
```

4. **Configurar la base de datos**
```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Poblar con datos de prueba
npm run db:seed
```

5. **Configurar Redis (Opcional - Rate Limiting v1.1.0)**

Redis es **opcional** pero **recomendado** para producción. Sin Redis, el rate limiting usa memoria local.

### 🔧 **Opciones de Redis**

**Para Desarrollo Local:**
```bash
# Instalar Redis localmente
sudo apt install redis-server  # Ubuntu/Debian
brew install redis             # macOS

# En .env
REDIS_HOST="localhost"
REDIS_PORT=6379
```

**Para Producción (Redis Cloud - Recomendado):**
```bash
# En .env o variables de Netlify
REDIS_HOST="tu-host-redis"
REDIS_PORT=14042
REDIS_USERNAME="default"
REDIS_PASSWORD="tu-password"
```

**Proveedores Recomendados:**
- **Redis Cloud**: Plan gratuito 30MB
- **Upstash**: Serverless Redis
- **Railway**: Redis con plan gratuito

5. **Iniciar el servidor**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 🗄️ Base de Datos

### Modelos Principales

- **User**: Usuarios del sistema (Admin, Provider, Client)
- **Service**: Servicios ofrecidos por los proveedores
- **Schedule**: Horarios disponibles por servicio y día
- **Reservation**: Reservas realizadas por los clientes
- **Notification**: Notificaciones del sistema

### Comandos Útiles

```bash
# Ver la base de datos en Prisma Studio
npx prisma studio

# Resetear la base de datos
npm run db:reset

# Solo poblar datos
npm run db:seed
```

## 🔐 Autenticación

### Usuarios de Prueba

| Rol | Email | Contraseña | Descripción |
|-----|-------|------------|-------------|
| Admin | admin@reservas.com | 123456 | Administrador del sistema |
| Provider | doctor@clinica.com | 123456 | Médico - Consultas |
| Provider | estilista@salon.com | 123456 | Estilista - Belleza |
| Client | cliente1@email.com | 123456 | Cliente de prueba |
| Client | cliente2@email.com | 123456 | Cliente de prueba |

### Flujo de Autenticación

1. **Registro**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login`
3. **Perfil**: `GET /api/auth/me` (requiere token)

## 📡 APIs Disponibles

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener perfil (requiere auth)

### Servicios
- `GET /api/services` - Listar servicios
- `POST /api/services` - Crear servicio (Provider/Admin)
- `GET /api/services/[id]` - Obtener servicio
- `PUT /api/services/[id]` - Actualizar servicio (Owner/Admin)
- `DELETE /api/services/[id]` - Eliminar servicio (Owner/Admin)

### Reservas
- `GET /api/reservations` - Listar reservas (filtradas por rol)
- `POST /api/reservations` - Crear reserva (Client)
- `GET /api/reservations/[id]` - Obtener reserva
- `PUT /api/reservations/[id]` - Actualizar reserva
- `DELETE /api/reservations/[id]` - Eliminar reserva (Admin)

### Disponibilidad
- `GET /api/availability?serviceId=X&date=Y` - Verificar disponibilidad
- `GET /api/schedules?serviceId=X` - Obtener horarios
- `POST /api/schedules` - Crear horario (Provider/Admin)

## 🔧 Ejemplos de Uso

### Registrar Usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@usuario.com",
    "password": "123456",
    "name": "Nuevo Usuario"
  }'
```

### Crear Reserva
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "serviceId": "service-id",
    "date": "2025-06-30T00:00:00.000Z",
    "startTime": "10:00",
    "notes": "Primera consulta"
  }'
```

### Verificar Disponibilidad
```bash
curl "http://localhost:3000/api/availability?serviceId=service-id&date=2025-06-30"
```

## ⚡ Tiempo Real (Socket.io)

### Eventos Disponibles

**Cliente → Servidor:**
- `join-service-room` - Unirse a sala de servicio
- `leave-service-room` - Salir de sala de servicio

**Servidor → Cliente:**
- `reservation-update` - Actualización de reserva
- `availability-update` - Cambio de disponibilidad
- `notification` - Nueva notificación

### Conexión
```javascript
import io from 'socket.io-client'

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
})

// Escuchar actualizaciones
socket.on('reservation-update', (reservation) => {
  console.log('Reserva actualizada:', reservation)
})

socket.on('availability-update', (data) => {
  console.log('Disponibilidad actualizada:', data)
})
```

## 📧 Sistema de Notificaciones

### Tipos de Notificaciones
- `RESERVATION_CONFIRMED` - Reserva confirmada
- `RESERVATION_CANCELLED` - Reserva cancelada
- `RESERVATION_REMINDER` - Recordatorio de cita
- `SCHEDULE_CHANGE` - Cambio de horario
- `SYSTEM_NOTIFICATION` - Notificación del sistema

### Tareas Programadas
- **Recordatorios diarios** (9:00 AM) - Envía recordatorios para citas del día siguiente
- **Limpieza de notificaciones** (Domingos 2:00 AM) - Elimina notificaciones antiguas
- **Actualización de reservas** (Cada hora) - Marca reservas pasadas como NO_SHOW
- **Recordatorios de confirmación** (Cada 30 min) - Notifica reservas pendientes

## 🏗️ Arquitectura

```
src/
├── app/
│   ├── api/                 # API Routes
│   │   ├── auth/           # Autenticación
│   │   ├── services/       # Servicios
│   │   ├── reservations/   # Reservas
│   │   ├── schedules/      # Horarios
│   │   └── availability/   # Disponibilidad
│   ├── globals.css         # Estilos globales
│   ├── layout.tsx          # Layout principal
│   └── page.tsx            # Página principal
├── lib/
│   ├── prisma.ts           # Cliente de Prisma
│   ├── jwt.ts              # Utilidades JWT
│   ├── auth.ts             # Hash de contraseñas
│   ├── email.ts            # Sistema de emails
│   ├── socket.ts           # Socket.io server
│   ├── scheduler.ts        # Tareas programadas
│   └── validations.ts      # Esquemas Zod
├── middleware/
│   └── auth.ts             # Middleware de autenticación
├── types/
│   └── index.ts            # Tipos TypeScript
└── utils/                  # Utilidades generales

prisma/
├── schema.prisma           # Esquema de base de datos
├── seed.ts                 # Datos de prueba
└── migrations/             # Migraciones
```

## 🔒 Seguridad

- **JWT Tokens**: Autenticación stateless con expiración
- **Bcrypt**: Hash seguro de contraseñas (12 rounds)
- **Validación**: Zod para validar todos los inputs
- **Autorización**: Middleware basado en roles
- **CORS**: Configurado para desarrollo y producción

## 🚀 Despliegue en Netlify

### 🔒 **Versión v1.1.0 con Rate Limiting**
Esta versión incluye protección automática contra abuso de APIs. El rate limiting se activa automáticamente en producción.

### 📋 Preparación del Proyecto

El proyecto ya está configurado para Netlify con:
- ✅ `netlify.toml` configurado
- ✅ `next.config.js` optimizado para Netlify
- ✅ Funciones serverless preparadas
- ✅ Variables de entorno documentadas

### 🔧 Configuración Paso a Paso

#### 1. **Preparar Base de Datos (Supabase - Recomendado)**

1. Ve a [Supabase](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a Settings > Database
4. Copia la connection string (URI)
5. Guarda la URL para las variables de entorno

**Alternativas gratuitas:**
- [Neon](https://neon.tech) - PostgreSQL serverless
- [PlanetScale](https://planetscale.com) - MySQL serverless
- [Railway](https://railway.app) - PostgreSQL con plan gratuito

#### 2. **Configurar Email (SendGrid - Recomendado)**

1. Ve a [SendGrid](https://sendgrid.com) y crea una cuenta
2. Crea una API Key en Settings > API Keys
3. Verifica tu dominio de email
4. Guarda las credenciales para las variables de entorno

**Alternativas:**
- Gmail con App Password
- Mailgun
- Amazon SES

#### 3. **Desplegar en Netlify**

1. **Conectar Repositorio**
   ```bash
   # Subir código a GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/sistema-reservas.git
   git push -u origin main
   ```

2. **Crear Sitio en Netlify**
   - Ve a [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Conecta tu repositorio de GitHub
   - Configuración automática detectada

3. **Configurar Variables de Entorno**

   En Netlify Dashboard > Site settings > Environment variables:

   ```env
   # Base de datos (Supabase)
   DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

   # Redis (Rate Limiting v1.1.0 - Opcional pero recomendado)
   REDIS_HOST=tu-host-redis
   REDIS_PORT=14042
   REDIS_USERNAME=default
   REDIS_PASSWORD=tu-redis-password

   # JWT (genera uno seguro)
   JWT_SECRET=tu-jwt-secret-super-seguro-para-produccion-256-bits

   # Email (SendGrid)
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=SG.tu-sendgrid-api-key

   # App
   NEXTAUTH_URL=https://tu-sitio.netlify.app
   NEXTAUTH_SECRET=otro-secret-diferente-para-nextauth
   NODE_ENV=production
   ```

4. **Configurar Build Settings**

   En Netlify Dashboard > Site settings > Build & deploy:
   ```
   Build command: npm run build
   Publish directory: .next
   Functions directory: .netlify/functions
   ```

5. **Configurar Base de Datos**
   ```bash
   # En tu máquina local, conectado a la DB de producción
   DATABASE_URL="tu-url-de-supabase" npx prisma migrate deploy
   DATABASE_URL="tu-url-de-supabase" npx prisma db seed
   ```

#### 4. **Verificar Despliegue**

1. **Probar APIs**
   ```bash
   curl https://tu-sitio.netlify.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@reservas.com","password":"123456"}'
   ```

2. **Verificar Logs**
   - Netlify Dashboard > Functions > View logs
   - Buscar errores en las funciones serverless

### 🔒 Variables de Entorno Completas

```env
# === BASE DE DATOS ===
# Supabase (recomendado)
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# Neon (alternativa)
# DATABASE_URL="postgresql://[user]:[password]@[endpoint]/[dbname]"

# === REDIS (RATE LIMITING v1.1.0) ===
# Redis Cloud (recomendado para producción)
REDIS_HOST="tu-host-redis"
REDIS_PORT=14042
REDIS_USERNAME="default"
REDIS_PASSWORD="tu-redis-password"

# Alternativa: URL completa
# REDIS_URL="redis://username:password@host:port"

# === AUTENTICACIÓN ===
JWT_SECRET="genera-un-secret-de-256-bits-super-seguro"
NEXTAUTH_SECRET="otro-secret-diferente-para-nextauth"
NEXTAUTH_URL="https://tu-sitio.netlify.app"

# === EMAIL ===
# SendGrid (recomendado para producción)
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT=587
EMAIL_USER="apikey"
EMAIL_PASS="SG.tu-sendgrid-api-key"

# Gmail (para desarrollo)
# EMAIL_HOST="smtp.gmail.com"
# EMAIL_PORT=587
# EMAIL_USER="tu-email@gmail.com"
# EMAIL_PASS="tu-app-password"

# === APLICACIÓN ===
NODE_ENV="production"
```

### 🛠️ Comandos de Producción

```bash
# Construir para Netlify
npm run build

# Migrar base de datos en producción
DATABASE_URL="tu-url-produccion" npx prisma migrate deploy

# Poblar datos iniciales
DATABASE_URL="tu-url-produccion" npx prisma db seed

# Ver logs de Prisma
DEBUG=prisma:* npm run build
```

### 🔍 Troubleshooting Netlify

#### Errores Comunes:

1. **"Function timeout"**
   ```toml
   # En netlify.toml
   [functions]
   timeout = 30
   ```

2. **"Module not found: @prisma/client"**
   ```bash
   # Asegurar que Prisma se genera en build
   npm run postbuild
   ```

3. **"Database connection failed"**
   - Verificar DATABASE_URL en variables de entorno
   - Confirmar que la DB acepta conexiones externas
   - Revisar whitelist de IPs en Supabase

4. **"CORS errors"**
   ```javascript
   // En next.config.js
   async headers() {
     return [
       {
         source: '/api/:path*',
         headers: [
           { key: 'Access-Control-Allow-Origin', value: '*' },
           { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
         ],
       },
     ]
   }
   ```

### 📊 Monitoreo

1. **Netlify Analytics**: Tráfico y rendimiento
2. **Function Logs**: Errores de APIs
3. **Supabase Dashboard**: Métricas de base de datos
4. **SendGrid Analytics**: Estadísticas de emails

### 💰 Costos Estimados (Planes Gratuitos)

- **Netlify**: 100GB bandwidth, 300 build minutes/mes
- **Supabase**: 500MB DB, 2GB bandwidth/mes
- **SendGrid**: 100 emails/día
- **Total**: $0/mes para proyectos pequeños

### 🚀 Optimizaciones para Producción

1. **Caché de APIs**
   ```javascript
   // En headers de respuesta
   'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
   ```

2. **Compresión**
   ```toml
   # En netlify.toml
   [[headers]]
   for = "/*"
   [headers.values]
   X-Content-Type-Options = "nosniff"
   X-Frame-Options = "DENY"
   ```

3. **Rate Limiting**
   ```javascript
   // Implementar en middleware
   const rateLimit = require('express-rate-limit')
   ```

## 🧪 Testing

### Probar APIs con curl

**Flujo completo de prueba:**

1. **Registrar usuario**
2. **Hacer login**
3. **Crear servicio** (como provider)
4. **Crear horarios**
5. **Verificar disponibilidad**
6. **Crear reserva**
7. **Actualizar reserva**

Ver ejemplos completos en la sección de APIs.

## 🔄 Changelog

### v1.1.0 (2024-06-29) - Rate Limiting
- ✨ **Nueva Feature**: Rate Limiting implementado para protección de APIs
- 🔒 **Seguridad**: Protección contra ataques de fuerza bruta en autenticación
- 📊 **Límites configurados**:
  - Autenticación (login/register): 5 intentos por 15 minutos
  - APIs generales (servicios, reservas): 100 requests por 15 minutos
  - Health check: 60 requests por minuto
- 📈 **Headers informativos**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 🚨 **Respuestas HTTP 429**: Cuando se exceden los límites
- 🌐 **Compatible con Netlify**: Detección automática de IP desde headers de proxy
- 🗄️ **Redis Integration**: Soporte para Redis como storage (opcional, fallback a memoria)

### v1.0.0 (2024-06-28) - Lanzamiento Inicial
- 🎉 **Sistema completo de reservas** con autenticación JWT
- 📅 **Gestión de servicios y horarios** personalizables
- 🔔 **Notificaciones automáticas** por email
- ⚡ **Tiempo real** con Socket.io
- 🗄️ **Base de datos PostgreSQL** con Prisma ORM

## 📝 Notas de Desarrollo

- **Socket.io**: Actualmente comentado en server.js, requiere configuración TypeScript
- **Emails**: Configurar SMTP real para producción
- **Base de datos**: Usar PostgreSQL en producción (Supabase recomendado)
- **Logs**: Implementar sistema de logs para producción
- **Rate Limiting**: ✅ **Implementado en v1.1.0** - Protección automática contra abuso de APIs

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Verifica los logs del servidor
3. Asegúrate de que la base de datos esté funcionando
4. Verifica las variables de entorno

**Logs útiles:**
```bash
# Ver logs de Prisma
DEBUG=prisma:* npm run dev

# Ver logs de Next.js
DEBUG=* npm run dev
```

## ✅ Checklist de Despliegue

### Antes de Subir a GitHub
- [ ] Verificar que `.env` está en `.gitignore`
- [ ] Crear `.env.example` con variables de ejemplo
- [ ] Probar `npm run build` localmente
- [ ] Verificar que todas las APIs funcionan
- [ ] Documentar cambios en README

### Configuración de Servicios Externos
- [ ] **Base de Datos**: Crear proyecto en Supabase/Neon
- [ ] **Email**: Configurar SendGrid/Gmail App Password
- [ ] **Dominio**: (Opcional) Configurar dominio personalizado

### Configuración en Netlify
- [ ] Conectar repositorio de GitHub
- [ ] Configurar variables de entorno
- [ ] Verificar build settings
- [ ] Probar deploy preview
- [ ] Configurar dominio personalizado (opcional)

### Post-Despliegue
- [ ] Migrar base de datos: `npx prisma migrate deploy`
- [ ] Poblar datos iniciales: `npx prisma db seed`
- [ ] Probar todas las APIs en producción
- [ ] Verificar envío de emails
- [ ] Configurar monitoreo

### Script de Despliegue Rápido
```bash
# Ejecutar script de preparación
./deploy.sh

# O manualmente:
npm install
npx prisma generate
npm run build
```

## 🎯 Resumen del Sistema

### 🏢 **Tipo de Negocio**: Genérico y Adaptable
- ✅ Clínicas y consultorios médicos
- ✅ Salones de belleza y spas
- ✅ Restaurantes y cafeterías
- ✅ Gimnasios y centros deportivos
- ✅ Centros educativos y tutorías
- ✅ Talleres y servicios técnicos
- ✅ Hoteles y turismo

### 🚀 **Estado Actual**: Completamente Funcional
- ✅ Backend completo con APIs REST
- ✅ Autenticación JWT con roles
- ✅ Sistema de reservas con validación
- ✅ Gestión de disponibilidad en tiempo real
- ✅ Notificaciones por email
- ✅ Tareas programadas automáticas
- ✅ Base de datos con datos de prueba
- ✅ Documentación completa
- ✅ Configurado para Netlify

### 🔧 **Tecnologías Principales**
- **Frontend**: Next.js 15 + React + Tailwind CSS
- **Backend**: Next.js API Routes + TypeScript
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Autenticación**: JWT + bcrypt
- **Tiempo Real**: Socket.io (configurado)
- **Emails**: Nodemailer + Templates HTML
- **Validación**: Zod schemas
- **Despliegue**: Netlify + Supabase

### 📊 **Métricas del Proyecto**
- **APIs**: 15+ endpoints funcionales con Rate Limiting (v1.1.0)
- **Modelos**: 5 modelos de base de datos
- **Usuarios de prueba**: 5 roles diferentes
- **Servicios de ejemplo**: 4 servicios configurados
- **Horarios**: Sistema flexible por días
- **Notificaciones**: 5 tipos diferentes
- **Seguridad**: Rate limiting en 3 niveles diferentes
- **Documentación**: README completo con ejemplos

### 🎨 **Branding y UI**
- **Nombre**: ReservaFácil
- **Colores**: Azul (#2563eb) como color principal
- **Favicon**: Diseño personalizado con calendario
- **Logo**: Emoji de calendario (📅) con diseño moderno
- **Tipografía**: Geist Sans (optimizada para web)
- **Responsive**: Diseño adaptable a móviles y desktop

### 📱 **Favicon**
- `favicon.svg` - Favicon vectorial con diseño de calendario personalizado

### 🛠️ **Herramientas de Desarrollo**
- `deploy.sh` - Script de preparación para despliegue
