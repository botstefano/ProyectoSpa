import { supabase } from '../../../lib/supabaseClient'
import { notificarLeadCalificado, notificarPropuestaAceptada } from '../../../lib/notificaciones'

export async function obtenerLeads() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('contacto')
    .select(`
      id_contacto,
      nombre,
      telefono,
      email,
      fecha_registro,
      estado_contacto (nombre_estado),
      lead_detalle (*),
      descarga (interes)
    `)
    .order('fecha_registro', { ascending: false })

  if (error) throw error

  return data.filter(c => {
    const estadoObj = Array.isArray(c.estado_contacto) ? c.estado_contacto[0] : c.estado_contacto;
    const estado = estadoObj?.nombre_estado;
    return estado === 'buyer' || estado === 'lead';
  });
}

export async function actualizarPerfilLead(idContacto, datos) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  
  console.log("1. INICIANDO GUARDADO PARA CONTACTO ID:", idContacto);

  // Saneamiento básico
  const emailVal = datos.perfil.email?.trim() === "" ? null : datos.perfil.email?.trim();
  const telefonoVal = datos.perfil.telefono?.trim() === "" ? null : datos.perfil.telefono?.trim();

  // Actualizamos contacto principal
  const { data: resContacto, error: errorContacto } = await supabase
    .from('contacto')
    .update({ nombre: datos.perfil.nombre, telefono: telefonoVal, email: emailVal })
    .eq('id_contacto', idContacto)
    .select(); // Exigimos que nos devuelva lo que guardó

  if (errorContacto) {
    console.error("❌ ERROR AL GUARDAR CONTACTO:", errorContacto);
    throw new Error(`Fallo en datos básicos: ${errorContacto.message}`);
  }
  console.log("✅ PASO 1 (Contacto guardado):", resContacto);

  // Parseo de Edad
  let edadVal = null;
  if (datos.perfil.edad && String(datos.perfil.edad).trim() !== "") {
    edadVal = parseInt(datos.perfil.edad, 10);
    if (isNaN(edadVal)) edadVal = null;
  }

  // Preparamos payload
  const payload = {
    edad: edadVal,
    distrito: datos.perfil.distrito?.trim() || null,
    aroma_preferido: datos.gustos.aroma || null,
    musica_preferida: datos.gustos.musica || null,
    temperatura_agua: datos.gustos.temperatura || null,
    especialidad_estudio: datos.estudiante.especialidad || null,
    universidad: datos.estudiante.universidad || null,
    situacion_laboral: datos.laboral.situacion || null,
    empresa: datos.laboral.empresa?.trim() || null,
    cargo: datos.laboral.cargo?.trim() || null,
    observaciones: datos.otros.observaciones?.trim() || null
  };

  if (datos.score !== undefined && datos.score !== null) {
    payload.lead_score = datos.score;
  }

  console.log("2. PREPARANDO PAYLOAD PARA LEAD_DETALLE:", payload);

  // Verificamos si existe para forzar Update o Insert manualmente
  const { data: existe } = await supabase
    .from('lead_detalle')
    .select('id_contacto')
    .eq('id_contacto', idContacto)
    .maybeSingle();

  let resDetalle, errDetalle;

  if (existe) {
    console.log("-> El usuario ya tiene detalle. Ejecutando UPDATE...");
    const result = await supabase
      .from('lead_detalle')
      .update(payload)
      .eq('id_contacto', idContacto)
      .select();
    resDetalle = result.data;
    errDetalle = result.error;
  } else {
    console.log("-> El usuario NO tiene detalle. Ejecutando INSERT...");
    payload.id_contacto = idContacto;
    const result = await supabase
      .from('lead_detalle')
      .insert([payload])
      .select();
    resDetalle = result.data;
    errDetalle = result.error;
  }

  if (errDetalle) {
    console.error("❌ ERROR AL GUARDAR DETALLE:", errDetalle);
    throw new Error(`Fallo al guardar el perfil: ${errDetalle.message}`);
  }

  console.log("✅ PASO 2 (Detalle guardado correctamente):", resDetalle);
  return { success: true };
}

async function transicionarBuyerALead(idContacto) {
  const { data: estado, error: stateError } = await supabase
    .from('estado_contacto')
    .select('id_estado')
    .eq('nombre_estado', 'lead')
    .single();

  if (stateError) throw stateError;

  const { error } = await supabase
    .from('contacto')
    .update({ id_estado: estado.id_estado })
    .eq('id_contacto', idContacto);

  if (error) throw error;
}

export async function calificarLead(idContacto, score) {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const { data: existe } = await supabase
    .from('lead_detalle')
    .select('id_contacto')
    .eq('id_contacto', idContacto)
    .maybeSingle();

  const payload = { lead_score: score, fecha_calificacion: new Date().toISOString() };

  if (existe) {
    await supabase.from('lead_detalle').update(payload).eq('id_contacto', idContacto);
  } else {
    payload.id_contacto = idContacto;
    await supabase.from('lead_detalle').insert([payload]);
  }

  if (score >= 50) {
    try {
      await transicionarBuyerALead(idContacto);
      await notificarLeadCalificado(idContacto, score);
    } catch (error) {
      console.error('[leadsApi] Error en transición:', error.message);
    }
  }
}

export async function aceptarPropuesta(idContacto, datosPropuesta) {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const { error } = await supabase
    .from('lead_detalle')
    .update({
      propuesta_aceptada: true,
      fecha_aceptacion: new Date().toISOString(),
      datos_propuesta: datosPropuesta
    })
    .eq('id_contacto', idContacto);

  if (error) throw error;

  await notificarPropuestaAceptada(idContacto, datosPropuesta);
  return { success: true, message: 'Propuesta aceptada' };
}