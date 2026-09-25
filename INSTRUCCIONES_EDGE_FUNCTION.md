# Instrucciones para Configurar Edge Function de Emails

## 🎯 Problema Identificado

**Error CORS:** `Access to fetch at 'https://api.resend.com/emails' from origin 'https://origen-spa.onrender.com' has been blocked by CORS policy`

**Causa Raíz:** La API de Resend **no permite llamadas directas desde el navegador** (frontend). Resend está diseñado para ser usado exclusivamente desde servidores (backend).

**Solución Correcta:** Usar Edge Function de Supabase como intermediario. Las Edge Functions corren en el servidor de Supabase, por lo que no tienen restricciones CORS.

## 🔧 Pasos para Configurar Edge Function

### Paso 1: Configurar RESEND_API_KEY en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto (origen-spa)
3. Ve a **Edge Functions** (en el menú lateral)
4. Haz clic en **send-email** (o crea una nueva función con ese nombre)
5. En la sección **Environment Variables**, agrega:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxx
   ```
   *(Reemplaza con tu API key real de Resend)*

### Paso 2: Actualizar el código de la Edge Function (CRÍTICO)

1. En el editor de la Edge Function `send-email`, borra todo el código actual
2. Copia el código de `supabase/functions/send-email/index.ts` (versión actualizada con headers CORS manuales)
3. Pégalo en el editor
4. Haz clic en **Save**
5. Haz clic en **Deploy**
6. **IMPORTANTE:** Espera a que el despliegue termine (debería mostrar "Deployed successfully")

### Paso 3: Verificar el despliegue

1. Ve a la pestaña **Logs** de la Edge Function
2. Debería ver logs indicando que la función está activa
3. Si hay errores, revísalos en los logs

### Paso 4: Probar la Edge Function

Puedes probar la Edge Function directamente desde el navegador o con curl:

```bash
curl -X POST 'https://TU-PROYECTO.supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer TU-ANON-KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "emailCliente": "test@example.com",
    "nombreCliente": "Test User",
    "tipoEmail": "enriquecimiento",
    "datos": {
      "tokenEnriquecimiento": "TEST-TOKEN",
      "origen": "https://origen-spa.onrender.com"
    }
  }'
```

## 🎯 Cómo Funciona la Solución

### Antes (Fallaba):
```
Frontend (Render) → Resend API ❌
(Error CORS: Resend no permite llamadas desde navegador)
```

### Ahora (Funciona):
```
Frontend (Render) → Supabase Edge Function → Resend API ✅
(Edge Function corre en servidor, sin restricciones CORS)
```

## 📋 Arquitectura Implementada

### emailService.js (Frontend)
```javascript
// Llama a Edge Function de Supabase
const { data, error } = await client.functions.invoke('send-email', {
  body: {
    emailCliente,
    nombreCliente,
    tipoEmail,
    datos
  }
})
```

### Edge Function (Servidor Supabase)
```typescript
// Recibe la petición del frontend
// Llama a Resend API desde el servidor (sin CORS)
// Retorna resultado al frontend
const resendResponse = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${resendApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* email data */ })
})
```

## 🔍 Troubleshooting

### Si la Edge Function no funciona:

1. **Verificar que esté desplegada:**
   - Ve a Supabase Dashboard → Edge Functions
   - Deberías ver `send-email` en la lista
   - El estado debe ser "Active"

2. **Verificar la API Key de Resend:**
   - Ve a Resend Dashboard → API Keys
   - Copia la API key correcta
   - Actualízala en Supabase Edge Function → Environment Variables

3. **Revisar logs de la Edge Function:**
   - Ve a Supabase Dashboard → Edge Functions → send-email → Logs
   - Busca errores específicos
   - Los errores te dirán exactamente qué está fallando

4. **Verificar permisos:**
   - Ve a Supabase Dashboard → Edge Functions → send-email
   - Asegúrate de que esté configurada para permitir llamadas anónimas
   - O usa autenticación si es necesario

### Errores Comunes:

**Error: "RESEND_API_KEY no configurada"**
- Solución: Agrega la API key en Environment Variables de la Edge Function

**Error: "Function not found"**
- Solución: Verifica que la Edge Function esté desplegada con el nombre exacto `send-email`

**Error: "Permission denied"**
- Solución: Verifica los permisos de la Edge Function en Supabase

## � Después de la Configuración

1. **Probar desde el frontend:**
   - Ve a `https://origen-spa.onrender.com/staff/leads`
   - Intenta enviar un email de enriquecimiento
   - Debería funcionar sin errores CORS

2. **Verificar el email:**
   - Revisa la bandeja de entrada del email de prueba
   - Deberías recibir el email con el link del formulario

3. **Monitorear logs:**
   - Ve a Supabase Dashboard → Edge Functions → send-email → Logs
   - Verifica que los emails se estén enviando correctamente

## 📞 Soporte

Si tienes problemas:
- **Documentación Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Documentación Resend**: https://resend.com/docs/api-reference/emails/send-email
- **Logs de Edge Function**: Siempre revisa los logs primero para diagnósticos

---

**Estado actual:** emailService.js actualizado para usar Edge Function. 
**Próximo paso:** Configurar Edge Function en Supabase con RESEND_API_KEY.
**Tiempo estimado:** 10-15 minutos para configuración completa.