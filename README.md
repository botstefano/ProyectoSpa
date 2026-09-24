# Origen Spa & Bienestar

Landing page real + base de datos compartida para el proyecto de **Inteligencia de Negocios —
Metodología IMPULSE** (caso "Buyers y Leads de un Spa de Belleza").

- **Fase 1 (BUYERS)** está completa y funcional: landing pública que captura contactos reales.
- **Fase 2 (LEADS)** está completamente implementada con sistema de calificación y propuestas.
- **Fase 3 (PAYERS)** tiene API real conectada a Supabase con gestión de pagos.
- **Fase 4 (CUSTOMERS)** incluye módulo de Atención/Registro de Servicio, seguimiento, KPI y alertas.
- **Flujo conectado**: Las fases están integradas con transiciones automáticas y notificaciones.
- **Mejoras UX**: Navegación optimizada, diseño responsivo, indicadores visuales y SEO mejorado.
- **Seguridad mejorada**: Sistema de autenticación, validación robusta de datos, auditoría de cambios.
- **Calidad de código**: Logging centralizado, manejo de errores estandarizado, sistema de tipos, pruebas unitarias.

## Stack

- **React 18 + Vite** — frontend
- **React Router** — landing pública (`/`) vs. paneles internos (`/staff/...`)
- **Supabase (Postgres)** — base de datos + API, sin backend aparte

## 1. Poner en marcha el proyecto

```bash
npm install
cp .env.example .env
```


## 1.1 PAYERS

La interfaz implementada de la Fase 3 está disponible en:

```text
/staff/payers
```

Ejemplo local:

```text
http://localhost:5173/staff/payers
```

La demo reproduce el flujo de PAYERS sin exigir Supabase:

**Confirmación → Formalización → Cronograma → Registro de pago → Validación → Activación → Seguimiento.**

Incluye datos de demostración, selección de **Efectivo, Tarjeta, Transferencia y Yape/Plin**, registro de monto, fecha, resultado y referencia, actualización visual del saldo/estado, historial, agente IA de cobranza, alerta de impulsamiento y KPIs de la fase.

La demo funciona en memoria. Al cerrar o recargar la página, los pagos registrados se reinician. Cuando el proyecto tenga Supabase configurado, la landing pública conserva su conexión a la base de datos.

## 2. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project** (elige la región más cercana,
   ej. South America).
2. Ve a **SQL Editor** → pega el contenido completo de `supabase/schema.sql` → **Run**.
   Esto crea todas las tablas del modelo E-R de Fase 1, las tablas reservadas para Fases 2-4
   (`lead_detalle`, `pago_detalle`, `atencion_detalle`), el trigger de validación y las políticas
   de seguridad (RLS).
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → pégalo en `.env` como `VITE_SUPABASE_URL`
   - `anon public key` → pégalo en `.env` como `VITE_SUPABASE_ANON_KEY`

## 3. Correr en local

```bash
npm run dev
```

Abre `http://localhost:5173`. Llena el formulario de la landing — debería crear una fila real en
la tabla `contacto` de tu proyecto Supabase (revísalo en **Table Editor**).

## 4. Estructura del proyecto

```
src/
  lib/
    supabaseClient.js     <- cliente único de Supabase, usado por TODAS las fases
    notificaciones.js     <- sistema de notificaciones entre fases
  shared/
    components/           <- Navbar, Footer — reutilizables en cualquier pantalla
  features/
    buyers/                <- FASE 1 (completa)
      BuyersLanding.jsx     <- ensambla la página pública
      components/           <- Hero, WhyUs, Services, LeadForm
      api/buyersApi.js      <- toda la lógica de Supabase de esta fase
    leads/                  <- FASE 2 (completa)
      LeadsStaffPage.jsx    <- panel de negociación con lead score
      api/leadsApi.js       <- calificación, transiciones y notificaciones
    payers/                 <- FASE 3 (API real + UI demo)
      PayersStaffPage.jsx   <- panel de pagos (modo demo)
      api/payersApi.js      <- API real conectada a Supabase
    customers/              <- FASE 4 (implementada: atención + seguimiento + KPI)
      CustomersStaffPage.jsx <- panel de atención al cliente
      api/customersApi.js   <- registro de atenciones y transiciones
supabase/
  schema.sql               <- esquema completo de base de datos (correr una sola vez)
  migrations/
    fase4_customers.sql    <- migración específica para Fase 4
```

## 5. Guía para el equipo (Fases 2, 3 y 4)

**No creen su propio proyecto de Supabase.** Todos deben usar el mismo `.env` (compártanlo por un
canal privado del equipo, nunca lo suban al repositorio — ya está en `.gitignore`), para que todos
lean y escriban sobre el mismo `id_contacto`.

Reglas de propiedad de datos (ya reforzadas en `schema.sql` mediante RLS):

| Tabla | Quién puede escribir en ella |
|---|---|
| `contacto`, `visitalanding`, `descarga` | Solo Fase 1 (landing pública) |
| `lead_detalle` | Solo Fase 2 |
| `pago_detalle` | Solo Fase 3 |
| `atencion_detalle` | Solo Fase 4 |

Cada fase **lee** `contacto` para buscar/mostrar al cliente, pero nunca reinserta ni edita esa
tabla — evita duplicar contactos y mantiene la trazabilidad end-to-end que pide la metodología
IMPULSE.

Para construir su pantalla:

1. Sigan el mismo patrón de carpetas que `src/features/buyers/` (`components/`, `api/`, y un
   archivo que ensambla la página).
2. Sus paneles son **internos** (uso del staff, no del público) — no los enlacen desde la landing.
   Cuando agreguen autenticación, usen [Supabase Auth](https://supabase.com/docs/guides/auth) y
   cambien las políticas RLS de su tabla del rol `anon` al rol `authenticated`.
3. Revisen el comentario al inicio de su archivo placeholder
   (`src/features/leads/LeadsStaffPage.jsx`, etc.) — ahí está el detalle de qué tablas usar.

## 5.1 Fase 4 — CUSTOMERS

La ruta interna `/staff/customers` implementa la transición **PAYER → CUSTOMER**. La pantalla:

- consulta el contacto y su `pago_detalle.estado_pago`;
- bloquea la atención cuando el pago no está confirmado;
- registra tratamiento, especialista, tiempos, estado, preferencias y observaciones;
- al cerrar una atención como `completada`, actualiza el estado del contacto a `customer`;
- calcula KPI de satisfacción, recompra, desviación del tiempo de atención y seguimiento en 24 h;
- muestra alertas de impulsamiento para seguimiento, recuperación y reactivación.

Si el proyecto Supabase ya fue creado con una versión anterior de `schema.sql`, ejecutar las migraciones correspondientes:

```bash
# Para habilitar el flujo conectado completo:
supabase/migrations/fase2_leads.sql      # Fase 2 (LEADS)
supabase/migrations/fase3_payers.sql     # Fase 3 (PAYERS)
supabase/migrations/fase4_customers.sql  # Fase 4 (CUSTOMERS)
supabase/migrations/notificaciones.sql # Sistema de notificaciones
```

Ejecutar cada script **una sola vez** desde **Supabase → SQL Editor**. Sin Supabase configurado,
los módulos funcionan en modo demo persistente con `localStorage`, útil para exposición y pruebas locales.

## 6. Desplegar en Render

1. Sube el proyecto a un repositorio de GitHub (ver paso 7 más abajo) — Render despliega desde ahí.
2. Entra a [render.com](https://render.com) → **New → Static Site** → conecta ese repositorio.
   Como el proyecto ya incluye `render.yaml`, Render debería detectar automáticamente:
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`

   Si no lo detecta solo, complétalo a mano con esos mismos valores.
3. En **Environment Variables**, agrega las mismas dos variables de tu `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (Render nunca lee tu `.env` local — como no se sube al repo, hay que configurarlas aquí a mano.)
4. **Create Static Site**. Cada `git push` a `main` vuelve a desplegar automáticamente.

El `routes` con `rewrite` dentro de `render.yaml` hace que rutas como `/staff/leads` funcionen al
recargar la página directamente (sin eso, Render devolvería un 404 porque esas rutas no existen
como archivos reales — las genera React Router en el navegador).

> También dejé un `vercel.json` en el proyecto por si en algún momento prefieren desplegar ahí en
> vez de Render — el mismo repo sirve para cualquiera de los dos sin cambios adicionales.

## 7. Subir a un repositorio

```bash
git init
git add .
git commit -m "Fase 1 (BUYERS): landing y base de datos compartida"
git branch -M main
git remote add origin <URL-de-tu-repo>
git push -u origin main
```

El `.env` con tus credenciales **no se sube** (está en `.gitignore`). Cada integrante debe crear
su propio `.env` local a partir de `.env.example`, usando las mismas credenciales del proyecto
Supabase compartido.
