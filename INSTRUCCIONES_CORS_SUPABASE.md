# Solución CORS Alternativa - Configuración en Supabase

## 🎯 Problema
La Edge Function no está funcionando correctamente con CORS. Vamos a usar una solución más simple.

## 🔧 Solución: Configurar CORS en Supabase Project Settings

### Paso 1: Ir a Project Settings en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto (origen-spa)
3. Ve a **"Project Settings"**
4. Navega a **"API"**

### Paso 2: Configurar CORS

1. En la sección de API, busca **"CORS"** o **"Cross-Origin Resource Sharing"**
2. Agrega estos orígenes permitidos:

```
https://origen-spa.onrender.com
http://localhost:5173
http://localhost:3000
```

3. Si no ves la sección CORS, busca en **"Database"** → **"Settings"** → **"API"**

### Paso 3: Revertir emailService.js a llamadas directas

Voy a revertir el código para usar llamadas directas a Resend pero con CORS configurado en Supabase.

## 🚀 Alternativa: Usar Webhook de Supabase

Si CORS no funciona, podemos usar Webhooks de Supabase como intermediario.

## 📋 Opción más simple: Probar primero sin Edge Function

Voy a revertir temporalmente a la versión anterior pero con mejor manejo de errores para que al menos el formulario funcione, aunque los emails estén en modo simulación.