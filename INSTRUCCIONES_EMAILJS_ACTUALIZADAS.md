# Instrucciones para Configurar EmailJS (Versión Universal)

El sistema usa **1 solo template universal** de EmailJS para todos los tipos de email:
- Enriquecimiento de datos
- Propuestas personalizadas
- Pagos

## 1. Configurar Template Universal en EmailJS

### Template Universal (para todos los tipos)
- **Nombre:** Template Universal Origen Spa
- **Subject:** Origen Spa & Bienestar - Información importante
- **To Email:** `{{to_email}}`
- **Content:**
```
Hola {{to_name}},

{{link_enriquecimiento}}

📋 COMPLETA TU PERFIL

Gracias por tu interés en Origen Spa & Bienestar. Para ofrecerte una experiencia personalizada, necesitamos algunos datos adicionales.

Completa tu perfil aquí: {{link_enriquecimiento}}

Este enlace expira en 7 días.

{{link_propuesta}}

💰 TU PROPUESTA PERSONALIZADA

Tenemos una propuesta personalizada para ti basada en tu interés en {{servicio}}.

Precio: {{precio}}

Revisa y negocia tu propuesta aquí: {{link_propuesta}}

Este enlace te permite interactuar con nuestro asistente virtual para personalizar tu propuesta según tus necesidades y presupuesto.

El enlace expira en 7 días.

{{link_pago}}

💳 COMPLETA TU PAGO

Gracias por tu contratación de {{servicio}}.

Monto total: {{monto}}

Completa tu pago aquí: {{link_pago}}

Aceptamos múltiples métodos de pago: Efectivo, Tarjeta, Transferencia, Yape/Plin.

Si tienes alguna pregunta, no dudes en contactarnos.

© 2026 Origen Spa & Bienestar
```
- **Variables:** `{{to_email}}`, `{{to_name}}`, `{{link_enriquecimiento}}`, `{{link_propuesta}}`, `{{link_pago}}`, `{{servicio}}`, `{{precio}}`, `{{monto}}`

## 2. Obtener el Template ID

Después de crear el template en EmailJS, copia el Template ID:
- Template Universal: `template_xxxxxxxxx`

## 3. Configurar Variables de Entorno

### En tu `.env` local:
```env
VITE_EMAILJS_SERVICE_ID=service_cenvarb
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxxxx  # template universal
VITE_EMAILJS_PUBLIC_KEY=FMWx0QaWavNw660Ax
```

### En Render Dashboard:
Ve a tu proyecto en Render → Environment Variables y agrega las mismas 3 variables.

## 4. Probar el Sistema

1. **Probar Email de Enriquecimiento:**
   - Ve a `/staff/leads`
   - Selecciona un lead y envía formulario de enriquecimiento
   - Deberías recibir el email con la sección de perfil completada

2. **Probar Email de Propuesta:**
   - En el mismo lead, envía propuesta
   - Deberías recibir el email con la sección de propuesta completada

3. **Probar Email de Pago:**
   - Ve a `/staff/payers`
   - Envía email de pago a un cliente
   - Deberías recibir el email con la sección de pago completada

## Variables Enviadas por Tipo de Email

### Enriquecimiento:
- `{{to_email}}` - Email del cliente
- `{{to_name}}` - Nombre del cliente
- `{{link_enriquecimiento}}` - Enlace al formulario de enriquecimiento
- Las otras variables estarán vacías

### Propuesta:
- `{{to_email}}` - Email del cliente
- `{{to_name}}` - Nombre del cliente
- `{{link_propuesta}}` - Enlace al chatbot de propuestas
- `{{servicio}}` - Servicio de interés
- `{{precio}}` - Precio de la propuesta
- Las otras variables estarán vacías

### Pago:
- `{{to_email}}` - Email del cliente
- `{{to_name}}` - Nombre del cliente
- `{{link_pago}}` - Enlace al formulario de pago
- `{{monto}}` - Monto total a pagar
- `{{servicio}}` - Servicio contratado
- Las otras variables estarán vacías