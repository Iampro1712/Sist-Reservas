#!/bin/bash

# Script de despliegue para Netlify
echo "🚀 Preparando despliegue para Netlify..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Generar cliente de Prisma
echo "🔧 Generando cliente de Prisma..."
npx prisma generate

# Construir el proyecto
echo "🏗️ Construyendo proyecto..."
npm run build

# Verificar archivos necesarios
echo "✅ Verificando archivos de configuración..."

if [ ! -f "netlify.toml" ]; then
    echo "❌ Error: netlify.toml no encontrado"
    exit 1
fi

if [ ! -f "next.config.js" ]; then
    echo "❌ Error: next.config.js no encontrado"
    exit 1
fi

if [ ! -f ".env.example" ]; then
    echo "❌ Error: .env.example no encontrado"
    exit 1
fi

echo "✅ Proyecto listo para Netlify!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Sube el código a GitHub"
echo "2. Conecta el repositorio en Netlify"
echo "3. Configura las variables de entorno"
echo "4. Configura la base de datos"
echo ""
echo "📖 Ver README.md para instrucciones detalladas"
