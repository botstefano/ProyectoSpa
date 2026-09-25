# Configuración de Edge Function para Emails

## 📋 Problema Solucionado

El error CORS al llamar a la API de Resend directamente desde el navegador:
```
Access to fetch at 'https://api.resend.com/emails' from origin 'https://origen-spa.onrender.com' 
has been blocked by CORS policy
```

## 🔧 Solución: Edge Function de Supabase

Hemos creado una Edge Function que actúa como intermediario, solucionando:
- ✅ Problemas de CORS
- ✅ Seguridad (API key no expuesta en el cliente)
- ✅ Control sobre las peticiones
- ✅ Arquitectura más robusta

## 🚀 Pasos para Configurar

### 1. Instalar Supabase CLI (si no lo tienes)

```bash
npm install -g supabase
```

### 2. Autenticarte con Supabase

```bash
supabase login
```

### 3. Conectar a tu proyecto

```bash
supabase link --project-ref TU_PROJECT_REF
```

*Tu PROJECT_REF está en la URL de tu proyecto Supabase: `https://supabase.com/dashboard/project/TU_PROJECT_REF`*

### 4. Desplegar la Edge Function

```bash
cd "C:\Users\UJED\Documents\origen-spa\origen-spa"
supabase functions deploy send-email
```

### 5. Configurar la API Key de Resend en Supabase

Ve a tu dashboard de Supabase:
1. Navega a **Edge Functions**
2. Selecciona la función `send-email`
3. Ve a **Settings** → **Environment Variables**
4. Agrega esta variable:

```env
RESEND_API_KEY=re_Yz3AjW1G... (tu key completa de Resend)
```

### 6. Verificar el despliegue

En el dashboard de Supabase, ve a **Edge Functions** → `send-email` → **Logs** para verificar que la función está funcionando correctamente.

## 🧪 Probar la Edge Function

Puedes probar la función directamente desde el dashboard de Supabase:

1. Ve a **Edge Functions** → `send-email`
2. Haz clic en **Invoke**
3. Usa este payload de prueba:

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

## 📊 Cómo Funciona

**Antes (con problema CORS):**
```
Navegador → Resend API ❌ (CORS block)
```

**Ahora (con Edge Function):**
```
Navegador → Supabase Edge Function → Resend API ✅
```

## 🔍 Monitoreo

- **Logs de la función:** Supabase Dashboard → Edge Functions → send-email → Logs
- **Emails enviados:** Resend Dashboard → Emails
- **Errores:** Revisa los logs si hay problemas con el envío

## 🎯 Ventajas

1. **Sin CORS:** Las llamadas desde el navegador funcionan correctamente
2. **Más seguro:** La API key de Resend está en el servidor, no en el cliente
3. **Escalable:** Supabase maneja el tráfico automáticamente
4. **Monitoreable:** Logs y métricas integradas
5. **Flexible:** Fácil agregar más tipos de emails

## 📝 Notas

- La Edge Function soporta dos tipos de emails: `enriquecimiento` y `pago`
- Los templates HTML están integrados en la función
- Puedes agregar más tipos de emails extendiendo el switch case
- La función maneja automáticamente los headers CORS