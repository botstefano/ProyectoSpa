import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient'

const DEMO_CONTACTS = [
  {
    id_contacto: 125,
    nombre: 'Camila Rodríguez Salas',
    telefono: '987 654 321',
    email: 'camila.rodriguez@gmail.com',
    estado_pago: 'Pago confirmado',
    fecha_pago: '2026-09-17',
    servicio_contratado: 'Facial Hidratante',
  },
  {
    id_contacto: 126,
    nombre: 'Andrea Torres Vega',
    telefono: '976 543 210',
    email: 'andrea.t@email.com',
    estado_pago: 'Pago pendiente',
    fecha_pago: null,
    servicio_contratado: 'Masaje Relajante',
  },
  {
    id_contacto: 127,
    nombre: 'Paola Sánchez Díaz',
    telefono: '921 098 765',
    email: 'paola.s@email.com',
    estado_pago: 'Pago confirmado',
    fecha_pago: '2026-09-16',
    servicio_contratado: 'Paquete Bienestar Total',
  },
]

const DEMO_ATTENTIONS = [
  {
    id_atencion: 9001,
    id_contacto: 127,
    tipo_tratamiento: 'Facial hidratante',
    especialista: 'María López',
    fecha_hora_inicio: '2026-06-10T15:00:00-05:00',
    fecha_hora_fin: '2026-06-10T16:02:00-05:00',
    duracion_planificada_min: 60,
    estado_atencion: 'completada',
    preferencias_servicio: 'Aroma lavanda y música relajante.',
    notas: 'Sin incidencias. Se recomendó hidratación domiciliaria.',
    satisfaccion: 5,
    fecha_seguimiento: '2026-06-11T11:00:00-05:00',
    seguimiento_enviado: true,
    proxima_atencion: '2026-07-10',
  },
  {
    id_atencion: 9002,
    id_contacto: 127,
    tipo_tratamiento: 'Masaje relajante',
    especialista: 'Carlos Vega',
    fecha_hora_inicio: '2026-07-08T18:00:00-05:00',
    fecha_hora_fin: '2026-07-08T19:27:00-05:00',
    duracion_planificada_min: 90,
    estado_atencion: 'completada',
    preferencias_servicio: 'Presión media y ambiente silencioso.',
    notas: 'Cliente solicita repetir masaje el próximo mes.',
    satisfaccion: 4,
    fecha_seguimiento: '2026-07-09T10:30:00-05:00',
    seguimiento_enviado: true,
    proxima_atencion: '2026-08-08',
  },
  {
    id_atencion: 9003,
    id_contacto: 125,
    tipo_tratamiento: 'Diagnóstico facial',
    especialista: 'María López',
    fecha_hora_inicio: '2026-08-15T16:00:00-05:00',
    fecha_hora_fin: '2026-08-15T16:42:00-05:00',
    duracion_planificada_min: 45,
    estado_atencion: 'completada',
    preferencias_servicio: 'Prefiere atención por la tarde.',
    notas: 'Piel sensible. Se recomienda tratamiento hidratante suave.',
    satisfaccion: 5,
    fecha_seguimiento: '2026-08-16T09:30:00-05:00',
    seguimiento_enviado: true,
    proxima_atencion: '2026-09-25',
  },
]

const STORAGE_KEY = 'origen_spa_customers_demo_v1'

function readDemoState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // localStorage puede estar bloqueado; el demo sigue funcionando en memoria.
  }

  return { contacts: DEMO_CONTACTS, attentions: DEMO_ATTENTIONS }
}

function writeDemoState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // No bloqueamos el flujo si el navegador impide persistencia local.
  }
}

function normalizePaymentStatus(value = '') {
  return value.trim().toLowerCase().replaceAll('_', ' ')
}

export function isPaymentConfirmed(status) {
  const normalized = normalizePaymentStatus(status)
  return normalized === 'confirmado' || normalized === 'pago confirmado' || normalized === 'pagado'
}

function toCustomer(row) {
  const pago = Array.isArray(row.pago_detalle) ? row.pago_detalle[0] : row.pago_detalle

  return {
    id_contacto: row.id_contacto,
    nombre: row.nombre,
    telefono: row.telefono,
    email: row.email,
    estado_pago: pago?.estado_pago ?? 'Sin pago registrado',
    fecha_pago: pago?.fecha_pago ?? null,
    servicio_contratado: pago?.servicio_contratado || pago?.servicio_contratado 
      ? pago.servicio_contratado 
      : 'Servicio contratado en Fase 3',
  }
}

/**
 * Lista contactos con su estado de pago. Si Supabase está configurado y tiene datos,
 * los usa; si no, retorna datos de demostración.
 */
export async function listCustomersForAttention() {
  if (!isSupabaseConfigured || !supabase) {
    console.log('[customersApi] Supabase no configurado, usando modo demo')
    return { data: readDemoState().contacts, source: 'demo' }
  }

  try {
    const { data, error } = await supabase
      .from('contacto')
      .select('id_contacto,nombre,telefono,email,pago_detalle(estado_pago,fecha_pago,servicio_contratado)')
      .order('id_contacto', { ascending: false })
      .limit(100)

    if (error) {
      console.warn('[customersApi] Error consultando Supabase, usando demo:', error.message)
      return { data: readDemoState().contacts, source: 'demo' }
    }

    if (!data?.length) {
      console.log('[customersApi] No hay contactos en Supabase, usando demo')
      return { data: readDemoState().contacts, source: 'demo' }
    }

    const customers = data.map(toCustomer)
    
    // Filtrar solo contactos que tienen algún detalle de pago
    const customersWithPayment = customers.filter(c => c.estado_pago !== 'Sin pago registrado')
    
    if (customersWithPayment.length === 0) {
      console.log('[customersApi] No hay contactos con datos de pago en Supabase, usando demo')
      return { data: readDemoState().contacts, source: 'demo' }
    }

    console.log(`[customersApi] Usando ${customersWithPayment.length} contactos desde Supabase`)
    return { data: customersWithPayment, source: 'supabase' }
  } catch (error) {
    console.error('[customersApi] Error inesperado, usando demo:', error.message)
    return { data: readDemoState().contacts, source: 'demo' }
  }
}

export async function listAttentions() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: readDemoState().attentions, source: 'demo' }
  }

  const { data, error } = await supabase
    .from('atencion_detalle')
    .select('id_atencion,id_contacto,tipo_tratamiento,especialista,fecha_hora_inicio,fecha_hora_fin,duracion_planificada_min,estado_atencion,preferencias_servicio,notas,satisfaccion,seguimiento_enviado,fecha_seguimiento,proxima_atencion,created_at')
    .order('fecha_hora_inicio', { ascending: false })
    .limit(250)

  if (error) {
    console.warn('[customersApi] No se pudo leer atencion_detalle; se usa demo:', error.message)
    return { data: readDemoState().attentions, source: 'demo' }
  }

  return { data: data ?? [], source: 'supabase' }
}

async function markContactAsCustomer(idContacto) {
  const { data: estado, error: stateError } = await supabase
    .from('estado_contacto')
    .select('id_estado')
    .eq('nombre_estado', 'customer')
    .single()

  if (stateError) throw stateError

  const { error } = await supabase
    .from('contacto')
    .update({ id_estado: estado.id_estado })
    .eq('id_contacto', idContacto)

  if (error) throw error
}

/** Registra la atención y, si queda completada, evidencia PAYER -> CUSTOMER. */
export async function saveAttention(payload, source) {
  if (source === 'demo' || !isSupabaseConfigured || !supabase) {
    const state = readDemoState()
    const attention = {
      ...payload,
      id_atencion: Date.now(),
    }
    state.attentions = [attention, ...state.attentions]
    writeDemoState(state)
    return attention
  }

  const { data, error } = await supabase
    .from('atencion_detalle')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error

  if (payload.estado_atencion === 'completada') {
    await markContactAsCustomer(payload.id_contacto)
  }

  return data
}

export async function updateAttentionFollowUp(idAtencion, values, source) {
  if (source === 'demo' || !isSupabaseConfigured || !supabase) {
    const state = readDemoState()
    state.attentions = state.attentions.map((item) =>
      item.id_atencion === idAtencion ? { ...item, ...values } : item,
    )
    writeDemoState(state)
    return state.attentions.find((item) => item.id_atencion === idAtencion)
  }

  const { data, error } = await supabase
    .from('atencion_detalle')
    .update(values)
    .eq('id_atencion', idAtencion)
    .select('*')
    .single()

  if (error) throw error
  return data
}
