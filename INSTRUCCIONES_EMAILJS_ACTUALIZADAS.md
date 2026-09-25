# Instrucciones para Configurar EmailJS (Versión Simplificada)

El sistema usa **2 templates** de EmailJS (limitación del plan gratuito):
- Template General (para enriquecimiento y propuesta)
- Template Pago

## 1. Configurar Templates en EmailJS

### Template General (para enriquecimiento y propuesta)
- **Nombre:** Template General
- **Subject:** Origen Spa & Bienestar - Información importante
- **To Email:** `{{to_email}}`
- **Content:**
```
Hola {{to_name}},

{{link_enriquecimiento}}

Gracias por tu interés en Origen Spa & Bienestar. Para ofrecerte una experiencia personalizada, necesitamos algunos datos adicionales.

Completa tu perfil aquí: {{link_enriquecimiento}}

Este enlace expira en 7 días.

{{link_propuesta}}

Tenemos una propuesta personalizada para ti basada en tu interés en {{servicio}}.

Precio: {{precio}}

Revisa y negocia tu propuesta aquí: {{link_propuesta}}

Este enlace te permite interactuar con nuestro asistente virtual para personalizar tu propuesta.

El enlace expira en 7 días.

Si tienes alguna pregunta, no dudes en contactarnos.

© 2026 Origen Spa & Bienestar
```
- **Variables:** `{{to_email}}`, `{{to_name}}`, `{{link_enriquecimiento}}`, `{{link_propuesta}}`, `{{servicio}}`, `{{precio}}`

### Template de Pago
- **Nombre:** Template Pago
- **Subject:** Completa tu pago - Origen Spa & Bienestar
- **To Email:** `{{to_email}}`
- **Content:**
```
Hola {{to_name}},

Gracias por tu contratación de {{servicio}}.

Monto total: {{monto}}

Completa tu pago aquí: {{link_pago}}

Aceptamos múltiples métodos de pago: Efectivo, Tarjeta, Transferencia, Yape/Plin.

Si tienes alguna pregunta sobre el pago, no dudes en contactarnos.

© 2026 Origen Spa & Bienestar
```
- **Variables:** `{{to_email}}`, `{{to_name}}`, `{{link_pago}}`, `{{monto}}`, `{{servicio}}`

## 2. Obtener los Template IDs

Después de crear los 2 templates en EmailJS, copia cada Template ID:
- Template General: `template_xxxxxxxxx`
- Template Pago: `template_xxxxxxxxx`

## 3. Configurar Variables de Entorno

### En tu `.env` local:
```env
VITE_EMAILJS_SERVICE_ID=service_cenvarb
VITE_EMAILJS_TEMPLATE_GENERAL=template_xxxxxxxxx  # template general (enriquecimiento + propuesta)
VITE_EMAILJS_TEMPLATE_PAGO=template_xxxxxxxxx     # template de pago
VITE_EMAILJS_PUBLIC_KEY=FMWx0QaWavNw660Ax
```

### En Render Dashboard:
Ve a tu proyecto en Render → Environment Variables y agrega las mismas 4 variables.

## 4. Probar el Sistema

1. **Probar Email de Enriquecimiento:**
   - Ve a `/staff/leads`
   - Selecciona un lead y envía formulario de enriquecimiento
   - Deberías recibir el email con el link correcto

2. **Probar Email de Propuesta:**
   - En el mismo lead, envía propuesta
   - Deberías recibir el email con el link del chatbot

3. **Probar Email de Pago:**
   - Ve a `/staff/payers`
   - Envía email de pago a un cliente
   - Deberías recibir el email con el link de pago

## Variables Enviadas por Tipo de Email

### Enriquecimiento:
- `{{to_email}}` - Email del cliente
- `{{to_name}}` - Nombre del cliente
- `{{link_enriquecimiento}}` - Enlace al formulario de enriquecimiento

### Propuesta:
- `{{to_email}}` - Email del cliente
- `{{to_name}}` - Nombre del cliente
- `{{link_propuesta}}` - Enlace al chatbot de propuestas
- `{{servicio}}` - Servicio de interés
- `{{precio}}` - Precio de la propuesta

### Pago:
- `{{to_email}}` - Email del cliente
- `{{to_name}}` - Nombre del cliente
- `{{link_pago}}` - Enlace al formulario de pago
- `{{monto}}` - Monto total a pagar
- `{{servicio}}` - Servicio contratado