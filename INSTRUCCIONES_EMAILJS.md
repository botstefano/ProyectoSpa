# Instrucciones para Configurar EmailJS (Solución CORS)

## 🎯 Por qué EmailJS

**Proma:** Edge Function de Supabase tiene problemas CORS persistentes que no se pueden resolver fácilmente.

**Solución:** EmailJS es un servicio diseñado específicamente para permitir envío de emails desde el frontend sin problemas CORS.

## 🔧 Pasos para Configurar EmailJS

### Paso 1: Crear cuenta en EmailJS

1. Ve a [EmailJS](https://www.emailjs.com/)
2. Haz clic en **Sign Up** para crear una cuenta gratuita
3. Verifica tu email

### Paso 2: Crear un Email Service

1. En el dashboard de EmailJS, ve a **Email Services**
2. Haz clic en **Add New Service**
3. Selecciona **Gmail** (o tu proveedor de email preferido)
4. Conecta tu cuenta de Gmail
5. EmailJS te guiará para conectar tu cuenta de forma segura

### Paso 3: Crear un Email Template

1. Ve a **Email Templates** en el dashboard
2. Haz clic en **Create New Template**
3. Configura el template:

**Template para Enriquecimiento:**
```
Subject: Completa tu perfil - Origen Spa & Bienestar

Content:
Hola {{to_name}},

Gracias por tu interés en Origen Spa & Bienestar. Para ofrecerte una experiencia 
personalizada y adaptada a tus necesidades, necesitamos algunos datos adicionales.

Completa tu perfil aquí: {{link_enriquecimiento}}

Este enlace expira en 7 días.
El formulario tarda menos de 3 minutos en completarse.

Si tienes alguna pregunta, no dudes en contactarnos.

© 2026 Origen Spa & Bienestar
```

**Variables del template:**
- `to_name` - Nombre del cliente
- `to_email` - Email del cliente
- `link_enriquecimiento` - Link del formulario

4. Haz clic en **Save Template**

### Paso 4: Obtener tus credenciales

1. Ve a **Account** → **General** en EmailJS
2. Copia estas tres credenciales:
   - **Service ID** (algo como `service_xxxxxxxxx`)
   - **Template ID** (algo como `template_xxxxxxxxx`)
   - **Public Key** (algo como `xxxxxxxxxxxxxxxxxxxxxxxx`)

### Paso 5: Configurar en tu proyecto

1. Abre tu archivo `.env` local
2. Agrega las credenciales de EmailJS:
   ```
   VITE_EMAILJS_SERVICE_ID=service_xxxxxxxxx
   VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxxxx
   VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Paso 6: Probar el sistema

1. Reinicia tu servidor local: `npm run dev`
2. Ve a `http://localhost:5173/staff/leads`
3. Intenta enviar un email de enriquecimiento
4. Debería funcionar sin errores CORS

## 📋 Template para Pagos (Opcional)

Si también necesitas emails de pagos, crea un segundo template:

**Template para Pagos:**
```
Subject: Completa tu pago - Origen Spa & Bienestar ({{monto}})

Content:
Hola {{to_name}},

¡Gracias por elegir Origen Spa & Bienestar! Tu servicio ha sido reservado.

**Detalles del pago:**
- Servicio: {{servicio}}
- Total a pagar: {{monto}}

Completa tu pago aquí: {{link_pago}}

© 2026 Origen Spa & Bienestar
```

**Variables adicionales:**
- `monto` - Monto total a pagar
- `servicio` - Nombre del servicio contratado
- `link_pago` - Link del formulario de pago

## 🎯 Ventajas de EmailJS

1. **Sin problemas CORS**: Diseñado específicamente para frontend
2. **Configuración simple**: Solo necesitas 3 credenciales
3. **Plan gratuito**: Hasta 200 emails/mes
4. **Integración fácil**: Solo necesitas cambiar las variables de entorno
5. **Templates visuales**: Editor drag-and-drop para emails

## 🔍 Troubleshooting

**Error: "EmailJS no configurado"**
- Solución: Verifica que las 3 variables de entorno estén en tu `.env`

**Error: "Failed to send"**
- Solución: Verifica que tu Email Service esté conectado correctamente

**Email no llega**
- Solución: Revisa tu carpeta de spam o verifica la configuración de tu Email Service

## 📞 Soporte

- **Documentación EmailJS**: https://www.emailjs.com/docs/
- **Soporte EmailJS**: https://www.emailjs.com/support

---

**Estado actual:** Sistema configurado para usar EmailJS como solución definitiva a CORS.
**Próximo paso:** Configurar cuenta gratuita de EmailJS y agregar credenciales al `.env`.
**Tiempo estimado:** 10-15 minutos para configuración completa.