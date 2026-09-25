# Instrucciones para Configurar Edge Function (Método Dashboard)

## 🚀 Método Rápido: Configuración Manual en Dashboard

Este método es más rápido y evita problemas de instalación del CLI.

### Paso 1: Acceder al Dashboard de Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto (origen-spa)

### Paso 2: Crear la Edge Function

1. En el menú lateral, navega a **"Edge Functions"**
2. Haz clic en **"New Edge Function"**
3. Nombre de la función: `send-email`
4. Haz clic en **"Create"**

### Paso 3: Pegar el código de la función

1. En el editor de código que aparece, borra el código de ejemplo
2. Copia todo el contenido de este archivo:
   `supabase/functions/send-email/index.ts`
3. Pégalo en el editor
4. Haz clic en **"Save"**

### Paso 4: Configurar la Variable de Entorno

1. En la página de la función `send-email`, haz clic en **"Settings"**
2. Navega a **"Environment Variables"**
3. Haz clic en **"New Variable"**
4. Nombre: `RESEND_API_KEY`
5. Valor: `re_Yz3AjW1G...` (tu key completa de Resend)
6. Haz clic en **"Save"**

### Paso 5: Desplegar la Función

1. Haz clic en **"Deploy"** en la parte superior
2. Espera a que el despliegue se complete (aprox. 1-2 minutos)
3. Verás un mensaje de confirmación cuando esté listo

### Paso 6: Verificar el Despliegue

1. Ve a **"Logs"** en la página de la función
2. Deberías ver logs indicando que la función está activa
3. No debería haber errores de despliegue

### Paso 7: Probar la Función

1. En la página de la función, haz clic en **"Invoke"**
2. Usa este payload de prueba:

```json
{
  "emailCliente": "test@example.com",
  "nombreCliente": "Cliente Test",
  "tipoEmail": "enriquecimiento",
  "datos": {
    "tokenEnriquecimiento": "TEST-TOKEN-123",
    "origen": "https://origen-spa.onrender.com"
  }
}
```

3. Haz clic en **"Invoke"**
4. Deberías recibir una respuesta exitosa:
```json
{
  "success": true,
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "mensaje": "Email enviado exitosamente"
}
```

### Paso 8: Probar en tu Aplicación

1. Recarga tu aplicación: `https://origen-spa.onrender.com`
2. Ve a `/staff/leads`
3. Selecciona un lead con email
4. Haz clic en "Enviar email de enriquecimiento"
5. **Debería funcionar sin error CORS**
6. Verifica tu email para confirmar que recibiste el mensaje

## 🔍 Verificación Final

En lugar del error CORS anterior:
```
Access to fetch at 'https://api.resend.com/emails' from origin 'https://origen-spa.onrender.com' 
has been blocked by CORS policy
```

Deberías ver en la consola:
```json
{
  "success": true,
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "mensaje": "Email enviado exitosamente"
}
```

## 📊 Confirmación en Resend

1. Ve a [Resend Dashboard](https://resend.com/dashboard)
2. Navega a **"Emails"**
3. Deberías ver el email enviado con estado "delivered"

## ⚠️ Si hay problemas

1. **Verifica los logs** en Supabase Dashboard → Edge Functions → send-email → Logs
2. **Verifica la API key** esté configurada correctamente
3. **Verifica el código** esté completo en la función
4. **Intenta redeployar** la función

## 🎯 Ventajas de este método

- ✅ Más rápido (sin instalación de CLI)
- ✅ Interfaz visual intuitiva
- ✅ Logs en tiempo real
- ✅ Fácil de debugging
- ✅ No requiere configuración adicional