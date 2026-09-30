import { useState, useEffect } from "react";
import { obtenerLeads, calificarLead, aceptarPropuesta, actualizarLead, calificarLeadAutomatico } from "./api/leadsApi";
import { obtenerNotificacionesPendientes, marcarNotificacionLeida } from "../../lib/notificaciones";
import { enviarEmailEnriquecimiento, tieneEnriquecimientoCompletado } from "../enriquecimiento/api/enriquecimientoApi";
import { enviarEmailPropuestaConChatbot } from "../propuestas/api/propuestasApi";
import { generarPropuestaConMistral } from "../../lib/mistralService";
import { logger } from "../../lib/logger";
import StaffUniversalNav from "../../shared/components/StaffUniversalNav";

const TABS = ["Perfil", "Propuesta", "Historial", "Notas", "Actividades"];

function tempClass(t) {
  if (t === "Caliente") return "ln-temp caliente";
  if (t === "Tibio")    return "ln-temp tibio";
  return "ln-temp frio";
}

function calcularTemperatura(score) {
  if (score >= 70) return "Caliente";
  if (score >= 40) return "Tibio";
  return "Frio";
}

function generarIniciales(nombre) {
  if (!nombre) return "??";
  const partes = nombre.trim().split(" ");
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  return nombre.substring(0, 2).toUpperCase();
}

function ScoreRing({ score }) {
  const r = 28, c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const col = score >= 70 ? "#b7d2b9" : score >= 40 ? "#e8ca8f" : "#D9AFA0";
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(243,238,226,0.1)" strokeWidth="6"/>
      <circle cx="36" cy="36" r={r} fill="none" stroke={col} strokeWidth="6"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 36 36)" style={{transition:"stroke-dashoffset .6s ease"}}/>
      <text x="36" y="41" textAnchor="middle" fill={col} fontSize="15" fontWeight="700"
        fontFamily="Manrope,sans-serif">{score}</text>
    </svg>
  );
}

// Iconos SVG
function IcoBell()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function IcoCaret()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>; }
function IcoCal()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/></svg>; }
function IcoHome()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IcoMsg()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>; }
function IcoStar()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IcoSearch() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/></svg>; }
function IcoCheck()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}><circle cx="7" cy="7" r="7" fill="rgba(183,210,185,0.18)"/><path d="M4 7l2 2 4-4" stroke="#b7d2b9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IcoSend()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }
function IcoSave()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function IcoWA()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>; }
function IcoEmail()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function IcoTrash()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>; }
function IcoPlus()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IcoPhone()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>; }

export default function LeadsStaffPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selId, setSelId] = useState(null);
  const [tab, setTab] = useState("Perfil");
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);

  // Estados interactivos para Historial
  const [interaccionesMap, setInteraccionesMap] = useState({});
  const [nuevoTipoInteraccion, setNuevoTipoInteraccion] = useState("Llamada");
  const [nuevoDetalleInteraccion, setNuevoDetalleInteraccion] = useState("");
  const [filtroHistorial, setFiltroHistorial] = useState("Todos");

  // Estados interactivos para Notas
  const [notasMap, setNotasMap] = useState({});
  const [nuevaCategoriaNota, setNuevaCategoriaNota] = useState("General");
  const [nuevaNotaTexto, setNuevaNotaTexto] = useState("");

  // Estados interactivos para Actividades
  const [actividadesMap, setActividadesMap] = useState({});
  const [nuevoTituloActividad, setNuevoTituloActividad] = useState("");
  const [nuevoTipoActividad, setNuevoTipoActividad] = useState("Llamada");
  const [nuevaFechaActividad, setNuevaFechaActividad] = useState("");
  const [nuevaPrioridadActividad, setNuevaPrioridadActividad] = useState("Media");
  const [filtroActividad, setFiltroActividad] = useState("Pendientes");

  // Automatizaciones de Campaña de Propuestas por Correo (Configuradas dinámicamente por IA)
  const [analyzingAutomation, setAnalyzingAutomation] = useState(false);
  const [automatizacionCorreoMap, setAutomatizacionCorreoMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('crm_automatizaciones_correo') || '{}');
    } catch (_) {
      return {};
    }
  });

  function show(msg) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  useEffect(() => {
    async function cargarDatos() {
      try {
        const data = await obtenerLeads();
        
        const leadsMapeados = data.map(dbLead => {
          const det = Array.isArray(dbLead.lead_detalle) ? dbLead.lead_detalle[0] : dbLead.lead_detalle;
          const desc = Array.isArray(dbLead.descarga) ? dbLead.descarga[0] : dbLead.descarga;
          const est = Array.isArray(dbLead.estado_contacto) ? dbLead.estado_contacto[0] : dbLead.estado_contacto;
          const enriquecimiento = Array.isArray(dbLead.enriquecimiento_contacto) ? dbLead.enriquecimiento_contacto[0] : dbLead.enriquecimiento_contacto;

          const scoreReal = det?.lead_score || 0;
          const interesReal = desc?.interes || "Tratamiento facial";
          const nombrePlano = interesReal.charAt(0).toUpperCase() + interesReal.slice(1);
          const comoConocio = est?.nombre_estado === 'buyer' ? 'Instagram Ads' : 'TikTok Ads';
          
          // Verificar si tiene datos de enriquecimiento completados
          const tieneEnriquecimiento = Boolean(enriquecimiento && enriquecimiento.completado);
          const tipoPielCapturada = desc?.tipo_piel || "";
          
          // Si tiene enriquecimiento completado, mostrar datos; si no, dejar vacíos
          const datosPerfil = {
            nombre: dbLead.nombre || "",
            edad: tieneEnriquecimiento ? (enriquecimiento.edad || "") : "",
            telefono: dbLead.telefono || "",
            email: dbLead.email || "", 
            distrito: tieneEnriquecimiento ? (enriquecimiento.distrito || "") : ""
          };

          const datosGustos = {
            tratamiento: nombrePlano,
            tipoPiel: tipoPielCapturada ? (tipoPielCapturada.charAt(0).toUpperCase() + tipoPielCapturada.slice(1)) : "",
            aroma: tieneEnriquecimiento ? (enriquecimiento.preferencia_aroma || "") : "",
            musica: tieneEnriquecimiento ? (enriquecimiento.preferencia_musica || "") : "",
            horario: tieneEnriquecimiento ? (enriquecimiento.disponibilidad || "") : "",
            temperatura: tieneEnriquecimiento ? (enriquecimiento.preferencia_temperatura || "Templada") : "",
            otras: tieneEnriquecimiento 
              ? (enriquecimiento.otras_preferencias || (enriquecimiento.sensibilidad_piel ? `Sensibilidad: ${enriquecimiento.sensibilidad_piel}` : "")) 
              : ""
          };

          const datosEstudiante = {
            especialidad: tieneEnriquecimiento ? (enriquecimiento.especialidad || enriquecimiento.ocupacion || "") : "",
            nivel: tieneEnriquecimiento ? (enriquecimiento.nivel_estudios || "") : "",
            universidad: tieneEnriquecimiento ? (enriquecimiento.universidad || "") : ""
          };

          const datosLaboral = {
            empresa: tieneEnriquecimiento ? (enriquecimiento.empresa || "") : "",
            cargo: tieneEnriquecimiento ? (enriquecimiento.cargo || enriquecimiento.ocupacion || "") : "",
            situacion: tieneEnriquecimiento ? (enriquecimiento.situacion_laboral || "") : ""
          };

          const datosOtros = {
            comoConocio: comoConocio,
            citaAgendada: tieneEnriquecimiento ? "Pendiente de agendar" : "",
            observaciones: tieneEnriquecimiento 
              ? `Motivo: ${enriquecimiento.motivo_principal || 'No especificado'}. Frecuencia deseada: ${enriquecimiento.frecuencia_deseada || 'No especificado'}. Presupuesto: ${enriquecimiento.presupuesto || 'No especificado'}.`
              : "Contacto captado en landing page. Pendiente de completar formulario de enriquecimiento.",
            fechaRegistro: new Date(dbLead.fecha_registro).toLocaleDateString('es-ES'),
            enriquecimientoCompletado: tieneEnriquecimiento,
            fechaEnriquecimiento: tieneEnriquecimiento && enriquecimiento.fecha_completado 
              ? new Date(enriquecimiento.fecha_completado).toLocaleDateString('es-ES')
              : null
          };
          
          return {
            id: dbLead.id_contacto,
            iniciales: generarIniciales(dbLead.nombre),
            nombre: dbLead.nombre,
            servicio: nombrePlano,
            score: scoreReal,
            temp: calcularTemperatura(scoreReal),
            cita: "Pendiente de agendar",
            interes: nombrePlano,
            frase: tieneEnriquecimiento ? "Perfil enriquecido completado" : "Capturado desde la landing page.",
            tags: tieneEnriquecimiento 
              ? ["#PerfilCompleto", `#${nombrePlano.replace(/\s+/g, '')}`]
              : ["#LeadNuevo", `#${nombrePlano.replace(/\s+/g, '')}`],
            
            perfil: datosPerfil,
            gustos: datosGustos,
            estudiante: datosEstudiante,
            laboral: datosLaboral,
            otros: datosOtros,
            propuesta: det?.datos_propuesta ? {
              ...det.datos_propuesta,
              aceptada: Boolean(det?.propuesta_aceptada),
              fecha_aceptacion: det?.fecha_aceptacion || null
            } : { 
              nombre: `Paquete ${nombrePlano}`, 
              desc: "Propuesta personalizada adaptada al interés del cliente.",
              tags: ["Recomendado", "Bienestar"],
              duracion: "60 min", precioRegular: "S/ 150.00", precioEspecial: "S/ 120.00", ahorro: "S/ 30.00", descuento: "20%",
              incluye: "Evaluación inicial, tratamiento y seguimiento.",
              aceptada: Boolean(det?.propuesta_aceptada),
              fecha_aceptacion: det?.fecha_aceptacion || null
            },
            porQue: ["Se adapta a su interés inicial.", "Resultados visibles desde la primera sesión.", "Contribuye a su bienestar."],
            notas: tieneEnriquecimiento 
              ? "Lead con perfil enriquecido completado el " + datosOtros.fechaEnriquecimiento
              : "Lead ingresado mediante formulario público. Pendiente de enriquecimiento."
          };
        });
        
        // --- FALLBACK DEMO ---
        // Si Supabase devuelve 0 registros, se muestran datos de ejemplo.
        const MOCK_LEADS = [
          { id:1, iniciales:'CR', nombre:'Camila Rodriguez', servicio:'Ritual de relajacion', score:87, temp:'Caliente', cita:'Mie 22 oct 10:00', interes:'Ritual de relajacion', frase:'Busco desestresarme tras largas semanas de trabajo.', tags:['#EstresSevero','#RitualRelax'], perfil:{nombre:'Camila Rodriguez',edad:'29 años',telefono:'+51 912 345 678',email:'camila.r@gmail.com',distrito:'Miraflores'}, gustos:{tratamiento:'Ritual de relajacion',tipoPiel:'Mixta',aroma:'Lavanda',musica:'Sonidos de naturaleza',horario:'Fines de semana 9-12',temperatura:'Calida',otras:'Prefiere sesiones sin ruido externo'}, estudiante:{especialidad:'Diseño grafico',nivel:'Universitaria egresada',universidad:'Toulouse Lautrec'}, laboral:{empresa:'Freelance',cargo:'Diseñadora Senior',situacion:'Independiente'}, otros:{comoConocio:'Instagram Ads',citaAgendada:'Mie 22 oct 10:00',observaciones:'Muy motivada, ya fue en otra oportunidad a un spa.',fechaRegistro:'15/09/2026',enriquecimientoCompletado:true,fechaEnriquecimiento:'16/09/2026'}, propuesta:{nombre:'Paquete Ritual Relax Premium',desc:'Sesion completa de relajacion profunda con aromaterapia y musica personalizada.',tags:['Recomendado','Bienestar'],duracion:'90 min',precioRegular:'S/ 180.00',precioEspecial:'S/ 144.00',ahorro:'S/ 36.00',descuento:'20%',incluye:'Aromaterapia, masaje relajante, barro volcanico y te de hierbas.'}, porQue:['Historial de estres alto y ritmo laboral intenso.','Responde muy bien a la aromaterapia de lavanda.','Alta disponibilidad de pago y fidelidad potencial.'], notas:'Lead caliente. Muy receptiva al ritual premium.' },
          { id:2, iniciales:'VP', nombre:'Valeria Paredes', servicio:'Masaje descontracturante', score:74, temp:'Caliente', cita:'Jue 23 oct 15:00', interes:'Masaje descontracturante', frase:'Tengo contracturas por trabajar en computadora todo el dia.', tags:['#DoloresCronicos','#MasajeDeep'], perfil:{nombre:'Valeria Paredes',edad:'34 años',telefono:'+51 923 456 789',email:'v.paredes@empresa.pe',distrito:'San Isidro'}, gustos:{tratamiento:'Masaje descontracturante',tipoPiel:'Normal',aroma:'Eucalipto',musica:'Clasica instrumental',horario:'Tardes entre semana',temperatura:'Calida intensa',otras:'Zona lumbar y cervical como prioridad'}, estudiante:{especialidad:'Administracion',nivel:'Postgrado',universidad:'ESAN'}, laboral:{empresa:'BCP',cargo:'Gerente de proyectos',situacion:'Ejecutiva'}, otros:{comoConocio:'Google Ads',citaAgendada:'Jue 23 oct 15:00',observaciones:'Interesada en plan mensual.',fechaRegistro:'14/09/2026',enriquecimientoCompletado:true,fechaEnriquecimiento:'15/09/2026'}, propuesta:{nombre:'Plan Mensual Anti-Contracturas',desc:'4 sesiones mensuales de masaje descontracturante con enfoque en zona lumbar y cervical.',tags:['Plan Mensual','Mas Vendido'],duracion:'60 min c/u',precioRegular:'S/ 560.00',precioEspecial:'S/ 420.00',ahorro:'S/ 140.00',descuento:'25%',incluye:'4 masajes, aceite de eucalipto premium y seguimiento de evolucion.'}, porQue:['Dolor cronico documentado con alta recurrencia.','Perfil ejecutivo con presupuesto disponible.','Interes explicito en plan mensual.'], notas:'Candidata ideal para membresia mensual.' },
          { id:3, iniciales:'LP', nombre:'Luciana Pacheco', servicio:'Facial anti-edad', score:62, temp:'Tibio', cita:'', interes:'Facial anti-edad', frase:'Quiero empezar a cuidar mi piel antes de que sea tarde.', tags:['#LeadNuevo','#FacialAntiEdad'], perfil:{nombre:'Luciana Pacheco',edad:'',telefono:'+51 934 567 890',email:'lupacheco@hotmail.com',distrito:''}, gustos:{tratamiento:'Facial anti-edad',tipoPiel:'Sensible',aroma:'',musica:'',horario:'',temperatura:'',otras:''}, estudiante:{especialidad:'',nivel:'',universidad:''}, laboral:{empresa:'',cargo:'',situacion:''}, otros:{comoConocio:'Instagram Ads',citaAgendada:'',observaciones:'Contacto captado en landing page. Pendiente de completar formulario de enriquecimiento.',fechaRegistro:'13/09/2026',enriquecimientoCompletado:false,fechaEnriquecimiento:null}, propuesta:{nombre:'Ritual Facial Anti-Edad Express',desc:'Tratamiento facial con acido hialuronico y colageno marino.',tags:['Anti-edad','Piel Sensible'],duracion:'75 min',precioRegular:'S/ 200.00',precioEspecial:'S/ 160.00',ahorro:'S/ 40.00',descuento:'20%',incluye:'Limpieza profunda, serum anti-edad, mascarilla y protector solar.'}, porQue:['Interes preventivo temprano.','Piel sensible requiere productos premium.','Referida por clienta activa.'], notas:'Lead captado desde la landing. Formulario de enriquecimiento pendiente.' },
          { id:4, iniciales:'AM', nombre:'Andrea Muñoz', servicio:'Envoltura corporal', score:45, temp:'Tibio', cita:'', interes:'Envoltura corporal', frase:'Quiero verme bien para una reunion importante.', tags:['#LeadNuevo','#EnvolturaCorporal'], perfil:{nombre:'Andrea Muñoz',edad:'',telefono:'+51 945 678 901',email:'andreamunoz@outlook.com',distrito:''}, gustos:{tratamiento:'Envoltura corporal',tipoPiel:'Seca',aroma:'',musica:'',horario:'',temperatura:'',otras:''}, estudiante:{especialidad:'',nivel:'',universidad:''}, laboral:{empresa:'',cargo:'',situacion:''}, otros:{comoConocio:'TikTok Ads',citaAgendada:'',observaciones:'Contacto captado en landing page. Pendiente de completar formulario de enriquecimiento.',fechaRegistro:'16/09/2026',enriquecimientoCompletado:false,fechaEnriquecimiento:null}, propuesta:{nombre:'Paquete Evento Especial',desc:'Envoltura corporal + exfoliacion + ritual express para ocasion especial.',tags:['Evento','Primera Visita'],duracion:'90 min',precioRegular:'S/ 160.00',precioEspecial:'S/ 120.00',ahorro:'S/ 40.00',descuento:'25%',incluye:'Envoltura, exfoliacion natural, masaje express y kit de bienvenida.'}, porQue:['Motivacion clara de corto plazo.','TikTok Ads indica perfil de decision impulsiva.'], notas:'Lead nuevo pendiente de enriquecimiento.' },
          { id:5, iniciales:'DS', nombre:'Diana Salcedo', servicio:'Reflexologia', score:38, temp:'Frio', cita:'', interes:'Reflexologia', frase:'Me lo recomendo mi medico para el estres cronico.', tags:['#LeadNuevo','#Reflexologia'], perfil:{nombre:'Diana Salcedo',edad:'',telefono:'+51 956 789 012',email:'dianasalcedo@yahoo.com',distrito:''}, gustos:{tratamiento:'Reflexologia',tipoPiel:'Grasa',aroma:'',musica:'',horario:'',temperatura:'',otras:''}, estudiante:{especialidad:'',nivel:'',universidad:''}, laboral:{empresa:'',cargo:'',situacion:''}, otros:{comoConocio:'Instagram Ads',citaAgendada:'',observaciones:'Contacto captado en landing page. Pendiente de completar formulario de enriquecimiento.',fechaRegistro:'12/09/2026',enriquecimientoCompletado:false,fechaEnriquecimiento:null}, propuesta:{nombre:'Sesion Reflexologia Terapeutica',desc:'Sesion de reflexologia plantar y corporal con enfoque en puntos de estres.',tags:['Terapeutico','Medico Referido'],duracion:'60 min',precioRegular:'S/ 120.00',precioEspecial:'S/ 96.00',ahorro:'S/ 24.00',descuento:'20%',incluye:'Evaluacion inicial, reflexologia completa y recomendaciones.'}, porQue:['Referencia medica aumenta credibilidad.','Perfil de salud sensible al discurso terapeutico.'], notas:'Pendiente de enviar formulario de enriquecimiento.' }
        ];

        const finalLeads = leadsMapeados.length > 0 ? leadsMapeados : MOCK_LEADS;
        setLeads(finalLeads);
        
        const params = new URLSearchParams(window.location.search);
        const targetId = params.get('cliente') || params.get('recompra');
        if (targetId) {
          const match = finalLeads.find(l => String(l.id) === String(targetId) || String(l.id_contacto) === String(targetId));
          setSelId(match ? match.id : (finalLeads[0]?.id || 1));
        } else if (finalLeads.length > 0) {
          setSelId(finalLeads[0].id);
        }
      } catch (err) {
        console.warn('[Leads] Sin conexión a BD, usando datos demo:', err?.message || err);
        const DEMO = [
          { id:1, iniciales:'CR', nombre:'Camila Rodriguez', servicio:'Ritual de relajacion', score:87, temp:'Caliente', cita:'Mie 22 oct 10:00', interes:'Ritual de relajacion', frase:'Busco desestresarme tras largas semanas de trabajo.', tags:['#EstresSevero','#RitualRelax'], perfil:{nombre:'Camila Rodriguez',edad:'29 anios',telefono:'+51 912 345 678',email:'camila.r@gmail.com',distrito:'Miraflores'}, gustos:{tratamiento:'Ritual de relajacion',aroma:'Lavanda',musica:'Sonidos de naturaleza',horario:'Fines de semana',temperatura:'Calida',otras:'Sin ruido externo'}, estudiante:{especialidad:'Diseno grafico',nivel:'Egresada',universidad:'Toulouse Lautrec'}, laboral:{empresa:'Freelance',cargo:'Disenadora Senior',situacion:'Independiente'}, otros:{comoConocio:'Instagram Ads',citaAgendada:'Mie 22 oct 10:00',observaciones:'Muy motivada.',fechaRegistro:'15/09/2026',enriquecimientoCompletado:true,fechaEnriquecimiento:'16/09/2026'}, propuesta:{nombre:'Paquete Ritual Relax Premium',desc:'Sesion completa de relajacion profunda.',tags:['Recomendado','Bienestar'],duracion:'90 min',precioRegular:'S/ 180.00',precioEspecial:'S/ 144.00',ahorro:'S/ 36.00',descuento:'20%',incluye:'Aromaterapia, masaje relajante y te de hierbas.'}, porQue:['Estres alto.','Responde bien a la aromaterapia.','Alta fidelidad potencial.'], notas:'Lead caliente. DEMO MODE.' },
          { id:2, iniciales:'MG', nombre:'Maria Gonzales', servicio:'Masaje de piedras calientes', score:91, temp:'Caliente', cita:'Mar 21 oct 09:00', interes:'Masaje de piedras calientes', frase:'Soy clienta frecuente, quiero probar algo nuevo.', tags:['#ClienteFiel','#UpsellPremium'], perfil:{nombre:'Maria Gonzales',edad:'38 anios',telefono:'+51 967 890 123',email:'mariagonza@gmail.com',distrito:'Barranco'}, gustos:{tratamiento:'Masaje de piedras calientes',aroma:'Sandalo',musica:'Jazz suave',horario:'Martes manana',temperatura:'Muy calida',otras:'Sin restricciones'}, estudiante:{especialidad:'Psicologia',nivel:'Licenciada',universidad:'PUCP'}, laboral:{empresa:'Consultora',cargo:'Psicologa',situacion:'Independiente'}, otros:{comoConocio:'Clienta recurrente',citaAgendada:'Mar 21 oct 09:00',observaciones:'5 visitas anteriores.',fechaRegistro:'10/09/2026',enriquecimientoCompletado:true,fechaEnriquecimiento:'11/09/2026'}, propuesta:{nombre:'Experiencia Premium',desc:'Ritual con piedras volcanicas.',tags:['Premium','VIP'],duracion:'100 min',precioRegular:'S/ 240.00',precioEspecial:'S/ 192.00',ahorro:'S/ 48.00',descuento:'20%',incluye:'Masaje, aromaterapia y reflexologia.'}, porQue:['Score 91 — clienta mas valiosa.','5 visitas previas.','Candidata a VIP.'], notas:'Ofrecer membresia VIP. DEMO MODE.' }
        ];
        setLeads(DEMO);
        setSelId(DEMO[0].id);
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, []);

  // Cargar notificaciones periódicamente
  useEffect(() => {
    async function cargarNotificaciones() {
      try {
        const notifs = await obtenerNotificacionesPendientes('leads');
        setNotifications(notifs);
      } catch (error) {
        console.warn('[Leads] Aviso cargando notificaciones:', error?.message || error);
      }
    }
    
    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  async function handleMarkAsRead(idNotificacion) {
    try {
      await marcarNotificacionLeida(idNotificacion);
      setNotifications(prev => prev.filter(n => n.id_notificacion !== idNotificacion));
    } catch (error) {
      console.warn('[Leads] Aviso marcando notificación como leída:', error?.message || error);
    }
  }

  const handleUpdateScore = async (id, newScore) => {
    try {
      const result = await calificarLead(id, newScore);
      
      if (result.success) {
        setLeads(prev => prev.map(l => 
          l.id === id ? { ...l, score: newScore, temp: calcularTemperatura(newScore) } : l
        ));
        show("Lead Score actualizado con éxito");
      } else {
        show(result.error?.message || "Error al actualizar Score");
      }
    } catch (err) {
      logger.error('LeadsStaffPage', 'Error en handleUpdateScore', { err });
      show("Error al actualizar Score");
    }
  };

  const handleAutoScore = async () => {
    if (!lead) return;
    
    try {
      const datosContacto = {
        fuente: lead.otros?.comoConocio || 'Orgánico',
        email: lead.perfil?.email,
        telefono: lead.perfil?.telefono,
        interes: lead.interes?.toLowerCase() || 'facial',
        tipoPiel: lead.gustos?.tipoPiel || 'no_se',
        fecha_registro: lead.otros?.fechaRegistro
      };

      const datosEnriquecimiento = {
        completado: Boolean(lead.otros?.enriquecimientoCompletado),
        presupuesto: lead.otros?.observaciones,
        frecuencia_deseada: lead.otros?.observaciones,
        preferencia_aroma: lead.gustos?.aroma,
        preferencia_musica: lead.gustos?.musica,
        preferencia_temperatura: lead.gustos?.temperatura,
        motivo_principal: lead.otros?.observaciones
      };

      const datosPropuesta = {
        aceptada: Boolean(lead.propuesta?.aceptada),
        estado: lead.propuesta?.aceptada ? 'aceptada' : (lead.propuesta ? 'enviada' : 'ninguna'),
        enviada: Boolean(lead.propuesta?.nombre)
      };
      
      const result = await calificarLeadAutomatico(lead.id, datosContacto, datosEnriquecimiento, datosPropuesta);
      
      if (result.success) {
        const newScore = result.data?.score || 50;
        setLeads(prev => prev.map(l => 
          l.id === lead.id ? { ...l, score: newScore, temp: calcularTemperatura(newScore) } : l
        ));
        show(`✅ Lead Score unificado (Buyers + Enriquecimiento + Propuesta): ${newScore}/100`);
      } else {
        show(result.error?.message || "Error en calificación automática");
      }
    } catch (err) {
      logger.error('LeadsStaffPage', 'Error en calificación automática', { err });
      show("Error en calificación automática");
    }
  };

  // --- GESTIÓN DE HISTORIAL ---
  function getLeadHistorial(leadItem) {
    if (!leadItem) return [];
    if (interaccionesMap[leadItem.id]) {
      return interaccionesMap[leadItem.id];
    }
    try {
      const stored = localStorage.getItem(`crm_historial_${leadItem.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    const base = [
      {
        id: `h-reg-${leadItem.id}`,
        tipo: 'Registro',
        titulo: 'Contacto captado en Landing Page',
        detalle: `Interés registrado: ${leadItem.interes}. Canal: ${leadItem.otros?.comoConocio || 'Instagram Ads'}. Descarga de Guía de cuidado facial.`,
        fecha: leadItem.otros?.fechaRegistro ? `${leadItem.otros.fechaRegistro} 09:30` : '15/09/2026 09:30',
        autor: 'Sistema'
      }
    ];

    if (leadItem.otros?.enriquecimientoCompletado) {
      base.push({
        id: `h-enr-${leadItem.id}`,
        tipo: 'Enriquecimiento',
        titulo: 'Formulario de enriquecimiento completado',
        detalle: `Preferencias recopiladas: Aroma ${leadItem.gustos?.aroma || 'Lavanda'}, Música ${leadItem.gustos?.musica || 'Naturaleza'}, Piel ${leadItem.gustos?.tipoPiel || 'Normal'} y Temperatura ${leadItem.gustos?.temperatura || 'Templada'}.`,
        fecha: leadItem.otros?.fechaEnriquecimiento ? `${leadItem.otros.fechaEnriquecimiento} 11:20` : '16/09/2026 11:20',
        autor: 'Cliente'
      });
    }

    if (leadItem.propuesta?.nombre) {
      base.push({
        id: `h-prop-${leadItem.id}`,
        tipo: 'Propuesta',
        titulo: `Propuesta activa: ${leadItem.propuesta.nombre}`,
        detalle: `Precio ${leadItem.propuesta.precioEspecial || 'S/ 120.00'} (${leadItem.propuesta.duracion || '60 min'}). ${leadItem.propuesta.aceptada ? 'Aprobada por el cliente vía email' : 'Pendiente de aprobación'}.`,
        fecha: leadItem.propuesta.fecha_aceptacion ? new Date(leadItem.propuesta.fecha_aceptacion).toLocaleString('es-ES') : 'Vigente',
        autor: 'Staff Origen Spa'
      });
    }

    return base;
  }

  function registrarEventoHistorial(leadId, evento) {
    const currentLead = leads.find(l => l.id === leadId);
    const existing = interaccionesMap[leadId] || getLeadHistorial(currentLead);
    const nuevo = {
      id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipo: evento.tipo || 'Llamada',
      titulo: evento.titulo || 'Interacción registrada',
      detalle: evento.detalle || '',
      fecha: new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      autor: evento.autor || 'Staff Origen Spa'
    };
    const updated = [nuevo, ...existing];
    setInteraccionesMap(prev => ({ ...prev, [leadId]: updated }));
    try {
      localStorage.setItem(`crm_historial_${leadId}`, JSON.stringify(updated));
    } catch (_) {}
  }

  const handleAgregarInteraccionManual = (e) => {
    e.preventDefault();
    if (!lead || !nuevoDetalleInteraccion.trim()) return;

    registrarEventoHistorial(lead.id, {
      tipo: nuevoTipoInteraccion,
      titulo: `${nuevoTipoInteraccion} con ${fn}`,
      detalle: nuevoDetalleInteraccion.trim(),
      autor: 'Staff Origen Spa'
    });

    setNuevoDetalleInteraccion("");
    show("✅ Interacción registrada en el Historial");
  };

  // --- GESTIÓN DE NOTAS ---
  function getLeadNotas(leadItem) {
    if (!leadItem) return [];
    if (notasMap[leadItem.id]) {
      return notasMap[leadItem.id];
    }
    try {
      const stored = localStorage.getItem(`crm_notas_${leadItem.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    const base = [];
    if (leadItem.notas) {
      base.push({
        id: `n-init-${leadItem.id}`,
        categoria: 'General',
        texto: leadItem.notas,
        fecha: leadItem.otros?.fechaRegistro ? `${leadItem.otros.fechaRegistro} 10:00` : '15/09/2026 10:00',
        autor: 'Staff Origen Spa'
      });
    }
    if (leadItem.otros?.observaciones) {
      base.push({
        id: `n-obs-${leadItem.id}`,
        categoria: 'Preferencia',
        texto: leadItem.otros.observaciones,
        fecha: leadItem.otros?.fechaRegistro ? `${leadItem.otros.fechaRegistro} 10:05` : '15/09/2026 10:05',
        autor: 'Sistema'
      });
    }
    return base;
  }

  const handleAgregarNota = (e) => {
    e.preventDefault();
    if (!lead || !nuevaNotaTexto.trim()) return;

    const currentLeadNotas = notasMap[lead.id] || getLeadNotas(lead);
    const nuevaNota = {
      id: `n-${Date.now()}`,
      categoria: nuevaCategoriaNota,
      texto: nuevaNotaTexto.trim(),
      fecha: new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      autor: 'Staff Origen Spa'
    };

    const updated = [nuevaNota, ...currentLeadNotas];
    setNotasMap(prev => ({ ...prev, [lead.id]: updated }));
    try {
      localStorage.setItem(`crm_notas_${lead.id}`, JSON.stringify(updated));
    } catch (_) {}

    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, notas: nuevaNotaTexto.trim() } : l));

    registrarEventoHistorial(lead.id, {
      tipo: 'Nota',
      titulo: `Nota interna (${nuevaCategoriaNota})`,
      detalle: nuevaNotaTexto.trim(),
      autor: 'Staff Origen Spa'
    });

    setNuevaNotaTexto("");
    show("✅ Nota guardada exitosamente");
  };

  const handleEliminarNota = (notaId) => {
    if (!lead) return;
    const current = notasMap[lead.id] || getLeadNotas(lead);
    const updated = current.filter(n => n.id !== notaId);
    setNotasMap(prev => ({ ...prev, [lead.id]: updated }));
    try {
      localStorage.setItem(`crm_notas_${lead.id}`, JSON.stringify(updated));
    } catch (_) {}
    show("Nota eliminada");
  };

  // --- GESTIÓN DE ACTIVIDADES ---
  function getLeadActividades(leadItem) {
    if (!leadItem) return [];
    if (actividadesMap[leadItem.id]) {
      return actividadesMap[leadItem.id];
    }
    try {
      const stored = localStorage.getItem(`crm_actividades_${leadItem.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    return [
      {
        id: `act-1-${leadItem.id}`,
        titulo: `Llamada para coordinar horario (${leadItem.gustos?.horario || 'Turno preferido'})`,
        tipo: 'Llamada',
        fechaProgramada: 'Mañana 10:30 AM',
        prioridad: leadItem.score >= 70 ? 'Alta' : 'Media',
        completada: false
      },
      {
        id: `act-2-${leadItem.id}`,
        titulo: `Enviar confirmación de protocolo de cabina privada por WhatsApp`,
        tipo: 'WhatsApp',
        fechaProgramada: 'En 48 horas',
        prioridad: 'Media',
        completada: false
      },
      {
        id: `act-3-${leadItem.id}`,
        titulo: `Validación de insumos orgánicos para piel ${leadItem.gustos?.tipoPiel || 'del cliente'}`,
        tipo: 'Tarea',
        fechaProgramada: 'Previo a cita',
        prioridad: 'Normal',
        completada: true
      }
    ];
  }

  const handleAgregarActividad = (e) => {
    e.preventDefault();
    if (!lead || !nuevoTituloActividad.trim()) return;

    const currentActs = actividadesMap[lead.id] || getLeadActividades(lead);
    const nuevaAct = {
      id: `act-${Date.now()}`,
      titulo: nuevoTituloActividad.trim(),
      tipo: nuevoTipoActividad,
      fechaProgramada: nuevaFechaActividad.trim() || 'Por coordinar',
      prioridad: nuevaPrioridadActividad,
      completada: false
    };

    const updated = [nuevaAct, ...currentActs];
    setActividadesMap(prev => ({ ...prev, [lead.id]: updated }));
    try {
      localStorage.setItem(`crm_actividades_${lead.id}`, JSON.stringify(updated));
    } catch (_) {}

    setNuevoTituloActividad("");
    setNuevaFechaActividad("");
    show("✅ Actividad programada con éxito");
  };

  const handleToggleActividad = (actId) => {
    if (!lead) return;
    const current = actividadesMap[lead.id] || getLeadActividades(lead);
    const updated = current.map(a => a.id === actId ? { ...a, completada: !a.completada } : a);
    setActividadesMap(prev => ({ ...prev, [lead.id]: updated }));
    try {
      localStorage.setItem(`crm_actividades_${lead.id}`, JSON.stringify(updated));
    } catch (_) {}
    show("Estado de actividad actualizado");
  };

  const handleEliminarActividad = (actId) => {
    if (!lead) return;
    const current = actividadesMap[lead.id] || getLeadActividades(lead);
    const updated = current.filter(a => a.id !== actId);
    setActividadesMap(prev => ({ ...prev, [lead.id]: updated }));
    try {
      localStorage.setItem(`crm_actividades_${lead.id}`, JSON.stringify(updated));
    } catch (_) {}
    show("Actividad eliminada");
  };

  // Helper: Determina de forma inteligente el horario y ambiente óptimo según el perfil del lead
  const obtenerHorarioYAmbienteIA = (currentLead) => {
    if (!currentLead) return { horario: '18:30 hrs', explicacionHorario: 'Horario post-jornada laboral', ambiente: 'Lavanda Silvestre & Luz Ámbar' };

    let horario = '18:30 hrs';
    let explicacionHorario = 'Horario post-jornada laboral';

    const horarioPref = (currentLead.gustos?.horario || '').toLowerCase();
    const situacion = (currentLead.laboral?.situacion || currentLead.laboral?.cargo || currentLead.estudiante?.nivel || '').toLowerCase();

    if (horarioPref.includes('fin') || horarioPref.includes('sabado') || horarioPref.includes('domingo') || horarioPref.includes('9-12') || horarioPref.includes('manana')) {
      horario = '10:00 hrs';
      explicacionHorario = 'Franja matutina de fin de semana (según disponibilidad)';
    } else if (horarioPref.includes('tarde') || situacion.includes('gerente') || situacion.includes('ejecutiv') || situacion.includes('banco') || situacion.includes('empresa')) {
      horario = '18:30 hrs';
      explicacionHorario = 'Tarde post-oficina para descarga de estrés y contracturas';
    } else if (situacion.includes('freelance') || situacion.includes('independiente')) {
      horario = '16:00 hrs';
      explicacionHorario = 'Media tarde (mayor calma y privacidad en cabina)';
    } else if (situacion.includes('estudiante') || situacion.includes('universit')) {
      horario = '11:30 hrs';
      explicacionHorario = 'Mediodía flexible entre actividades académicas';
    }

    const aroma = currentLead.gustos?.aroma || 'Lavanda relajante';
    const musica = currentLead.gustos?.musica || 'Sonidos de la naturaleza & cuencos tibetanos';
    const temp = currentLead.gustos?.temperatura || 'Cálida envolvente';
    const ambiente = `Aroma: ${aroma} · Música: ${musica} · Temp: ${temp} · Luz tenue cálida`;

    return {
      horario,
      explicacionHorario,
      aroma,
      musica,
      temperatura: temp,
      ambiente
    };
  };

  // Helper: Genera dinámicamente las razones por las que una propuesta es ideal para este lead
  const calcularRazonesDinamicas = (currentLead, currentPropuesta) => {
    if (!currentLead) return [];
    const razones = [];
    const interes = (currentLead.interes || currentLead.servicio || 'bienestar').toLowerCase();
    const nombreLead = currentLead.nombre ? currentLead.nombre.split(' ')[0] : 'el cliente';
    const gustos = currentLead.gustos || {};
    const perfil = currentLead.perfil || {};
    const otros = currentLead.otros || {};
    const laboral = currentLead.laboral || {};
    const observaciones = (otros.observaciones || currentLead.frase || '').toLowerCase();

    // 1. Motivo de consulta o necesidad corporal/facial específica
    if (observaciones.includes('estres') || observaciones.includes('desestresar') || observaciones.includes('cansancio') || observaciones.includes('largas semanas')) {
      razones.push(`Protocolo anti-estrés diseñado para contrarrestar la fatiga y carga laboral de ${nombreLead}.`);
    } else if (observaciones.includes('contractura') || observaciones.includes('dolor') || observaciones.includes('lumbar') || observaciones.includes('cervical')) {
      razones.push(`Terapia focalizada en contracturas y tensión muscular en cuello y zona lumbar.`);
    } else if (interes.includes('facial') || gustos.tipoPiel) {
      const piel = gustos.tipoPiel ? `para piel ${gustos.tipoPiel.toLowerCase()}` : 'con diagnóstico dérmico';
      razones.push(`Tratamiento facial no invasivo formulado ${piel}, aportando nutrición y luminosidad profunda.`);
    } else if (observaciones.includes('reunion') || observaciones.includes('evento') || observaciones.includes('ocasion')) {
      razones.push(`Renovación inmediata pensada para lucir radiante en su próxima ocasión especial.`);
    } else {
      razones.push(`Diseñado a la medida de su interés inicial en ${currentLead.interes || 'bienestar integral'}.`);
    }

    // 2. Personalización sensorial (Aroma, música, temperatura)
    if (gustos.aroma && gustos.musica) {
      razones.push(`Aromaterapia de ${gustos.aroma} y armonización sonora con ${gustos.musica.toLowerCase()} para inducir desconexión total.`);
    } else if (gustos.aroma) {
      razones.push(`Incorpora aceites esenciales de ${gustos.aroma}, seleccionados según sus gustos olfativos.`);
    } else if (gustos.temperatura) {
      razones.push(`Ambiente térmico con toallas y cabina templadas a temperatura ${gustos.temperatura.toLowerCase()}.`);
    } else {
      razones.push(`Cabina climatizada con luz tenue y esencias botánicas para máxima privacidad.`);
    }

    // 3. Situación laboral o ritmo diario
    if (gustos.horario) {
      razones.push(`Horario adaptable a su disponibilidad declarada (${gustos.horario}).`);
    } else if (laboral.cargo || laboral.empresa) {
      razones.push(`Ideal para ejecutivas y profesionales (${laboral.cargo || 'ritmo activo'}) que buscan un respiro sin perder tiempo.`);
    } else if (perfil.distrito) {
      razones.push(`Ubicación de fácil acceso para citas coordinadas desde ${perfil.distrito}.`);
    }

    // 4. Beneficio de la propuesta y valor comercial
    if (currentPropuesta?.descuento && currentPropuesta?.descuento !== '0%') {
      razones.push(`Tarifa preferencial de bienvenida con ${currentPropuesta.descuento} de beneficio (${currentPropuesta.precioEspecial || currentPropuesta.precio}).`);
    } else if (currentLead.score >= 70) {
      razones.push(`Lead de alta prioridad (Score ${currentLead.score}/100) con seguimiento personalizado incluido.`);
    }

    return razones.slice(0, 3);
  };

  // Determina con IA la estrategia completa de campaña: cadencia (días), horario y ambiente
  const analizarEstrategiaAutomatizacionIA = (currentLead) => {
    if (!currentLead) {
      return {
        cadenciaDias: 2,
        cadenciaTexto: 'Cada 2 días',
        motivoCadencia: 'Cadencia estándar de conversión',
        horario: '18:30 hrs',
        explicacionHorario: 'Horario post-jornada laboral',
        ambiente: 'Lavanda Silvestre & Luz Ámbar'
      };
    }

    const score = Number(currentLead.score) || 50;
    const observaciones = ((currentLead.otros?.observaciones || '') + ' ' + (currentLead.frase || '')).toLowerCase();
    const urgenciaAlta = observaciones.includes('dolor') || observaciones.includes('contractura') || observaciones.includes('urgente') || observaciones.includes('evento') || observaciones.includes('boda') || observaciones.includes('viaje');

    // Cadencia determinada por IA según score y urgencia
    let cadenciaDias = 3;
    let cadenciaTexto = 'Cada 3 días';
    let motivoCadencia = 'Interés moderado (Lead Tibio); cadencia equilibrada para no saturar';

    if (score >= 75 || urgenciaAlta) {
      cadenciaDias = 2;
      cadenciaTexto = 'Cada 2 días';
      motivoCadencia = `Lead de alta temperatura (Score ${score}/100)${urgenciaAlta ? ' con necesidad inmediata' : ''}; seguimiento dinámico prioritario`;
    } else if (score < 45) {
      cadenciaDias = 4;
      cadenciaTexto = 'Cada 4 días';
      motivoCadencia = `Lead en fase exploratoria (Score ${score}/100); secuencia espaciada de nutrición y valor`;
    }

    // Horario determinado por IA según hábitos y profesión
    let horario = '18:30 hrs';
    let explicacionHorario = 'Horario post-jornada laboral';

    const horarioPref = (currentLead.gustos?.horario || '').toLowerCase();
    const situacion = (currentLead.laboral?.situacion || currentLead.laboral?.cargo || currentLead.estudiante?.nivel || '').toLowerCase();

    if (horarioPref.includes('fin') || horarioPref.includes('sabado') || horarioPref.includes('domingo') || horarioPref.includes('9-12') || horarioPref.includes('manana')) {
      horario = '10:00 hrs';
      explicacionHorario = 'Franja matutina de fin de semana (según disponibilidad)';
    } else if (horarioPref.includes('tarde') || situacion.includes('gerente') || situacion.includes('ejecutiv') || situacion.includes('banco') || situacion.includes('empresa') || situacion.includes('oficina')) {
      horario = '18:30 hrs';
      explicacionHorario = 'Tarde post-oficina para descarga de estrés y contracturas';
    } else if (situacion.includes('freelance') || situacion.includes('independiente') || situacion.includes('consultor')) {
      horario = '16:00 hrs';
      explicacionHorario = 'Media tarde con mayor calma y privacidad en cabina';
    } else if (situacion.includes('estudiante') || situacion.includes('universit')) {
      horario = '11:30 hrs';
      explicacionHorario = 'Mediodía flexible entre actividades académicas';
    }

    // Ambiente sensorial
    const aroma = currentLead.gustos?.aroma || 'Lavanda relajante';
    const musica = currentLead.gustos?.musica || 'Sonidos de la naturaleza & cuencos tibetanos';
    const temp = currentLead.gustos?.temperatura || 'Cálida envolvente';
    const ambiente = `Aroma: ${aroma} · Música: ${musica} · Temp: ${temp} · Luz tenue cálida`;

    return {
      cadenciaDias,
      cadenciaTexto,
      motivoCadencia,
      horario,
      explicacionHorario,
      aroma,
      musica,
      temperatura: temp,
      ambiente
    };
  };

  // --- AUTOMATIZACIÓN DE CAMPAÑA POR CORREO (DETERMINADA POR IA AL MOMENTO) ---
  const handleToggleAutomatizacionCorreo = async () => {
    if (!lead || analyzingAutomation) return;
    const emailDestino = lead.perfil?.email;
    if (!emailDestino) {
      show("⚠️ El lead no tiene correo electrónico registrado para automatizar envíos");
      return;
    }

    const estaActiva = Boolean(automatizacionCorreoMap[lead.id]?.activa);

    if (estaActiva) {
      // Pausar automatización
      const updatedMap = {
        ...automatizacionCorreoMap,
        [lead.id]: { activa: false, fechaPausa: new Date().toISOString() }
      };
      setAutomatizacionCorreoMap(updatedMap);
      try {
        localStorage.setItem('crm_automatizaciones_correo', JSON.stringify(updatedMap));
      } catch (_) {}

      registrarEventoHistorial(lead.id, {
        tipo: 'Email',
        titulo: 'Campaña por correo pausada',
        detalle: `Se pausó el envío automatizado de propuestas variadas por correo a ${emailDestino}.`,
        autor: 'Agente de Campaña'
      });

      show("⏸️ Automatización de correos pausada");
      return;
    }

    // Activar automatización: la IA determina la cadencia, horario y ambiente en este momento
    setAnalyzingAutomation(true);
    show(`🧠 Analizando perfil, hábitos y score de ${fn} con IA...`);

    // Breve pausa para feedback visual del proceso de IA
    await new Promise(r => setTimeout(r, 650));

    const estrategia = analizarEstrategiaAutomatizacionIA(lead);

    const nuevaConfig = {
      activa: true,
      cadenciaDias: estrategia.cadenciaDias,
      cadenciaTexto: estrategia.cadenciaTexto,
      motivoCadencia: estrategia.motivoCadencia,
      horario: estrategia.horario,
      explicacionHorario: estrategia.explicacionHorario,
      ambiente: estrategia.ambiente,
      email: emailDestino,
      fechaInicio: new Date().toISOString(),
      proximoEnvio: `En ${estrategia.cadenciaDias} días a las ${estrategia.horario}`
    };

    const updatedMap = {
      ...automatizacionCorreoMap,
      [lead.id]: nuevaConfig
    };
    setAutomatizacionCorreoMap(updatedMap);
    try {
      localStorage.setItem('crm_automatizaciones_correo', JSON.stringify(updatedMap));
    } catch (_) {}

    // Crear actividad programada en pestaña "Actividades"
    const nuevaActividad = {
      id: `auto-email-${Date.now()}`,
      titulo: `Secuencia Correo (Día +${estrategia.cadenciaDias}): Enviar propuesta variada alternativa a ${emailDestino}`,
      tipo: 'Email',
      fechaProgramada: `En ${estrategia.cadenciaDias} días a las ${estrategia.horario}`,
      prioridad: estrategia.cadenciaDias <= 2 ? 'Alta' : 'Media',
      completada: false,
      automatica: true
    };

    const currentActs = actividadesMap[lead.id] || getLeadActividades(lead);
    const updatedActs = [nuevaActividad, ...currentActs];
    setActividadesMap(prev => ({ ...prev, [lead.id]: updatedActs }));
    try {
      localStorage.setItem(`crm_actividades_${lead.id}`, JSON.stringify(updatedActs));
    } catch (_) {}

    // Registrar en Historial
    registrarEventoHistorial(lead.id, {
      tipo: 'Email',
      titulo: `Campaña automatizada por correo activada (${estrategia.cadenciaTexto})`,
      detalle: `La IA asignó envíos ${estrategia.cadenciaTexto} a las ${estrategia.horario}. Motivo: ${estrategia.motivoCadencia}. Ambiente: ${estrategia.ambiente}.`,
      autor: 'Agente de Campaña IA'
    });

    setAnalyzingAutomation(false);
    show(`✨ Automatización activada: la IA fijó envíos ${estrategia.cadenciaTexto} a las ${estrategia.horario}`);
  };

  // --- GENERACIÓN DE PROPUESTAS (IA MISTRAL O CATÁLOGO RÁPIDO) ---
  const handleGenerarNuevaPropuesta = async (usarIA = true) => {
    if (!lead || generatingProposal) return;

    if (usarIA) {
      setGeneratingProposal(true);
      show("✨ Consultando a Mistral AI con los datos recopilados...");
      try {
        const leadData = {
          nombre: lead.perfil.nombre,
          edad: lead.perfil.edad,
          distrito: lead.perfil.distrito,
          interes: lead.gustos.tratamiento || lead.interes || lead.servicio,
          tipoPiel: lead.gustos.tipoPiel,
          aroma: lead.gustos.aroma,
          musica: lead.gustos.musica,
          temperatura: lead.gustos.temperatura,
          horario: lead.gustos.horario,
          otrasPreferencias: lead.gustos.otras,
          motivo: lead.otros.observaciones,
          cargo: lead.laboral.cargo,
          empresa: lead.laboral.empresa,
          especialidad: lead.estudiante.especialidad,
          score: lead.score
        };

        const result = await generarPropuestaConMistral(leadData);
        if (result.success && result.propuesta) {
          const nuevaPropuesta = {
            ...result.propuesta,
            aceptada: false,
            fecha_aceptacion: null
          };
          const porQueNuevos = result.porQue || [
            `Diseñado especialmente para su perfil de ${lead.interes}.`,
            `Incorpora sus notas sensoriales preferidas (${lead.gustos.aroma || 'aromaterapia'}).`,
            `Excelente tarifa de bienvenida con atención personalizada garantizada.`
          ];

          setLeads(prev => prev.map(l => {
            if (l.id === lead.id) {
              return {
                ...l,
                propuesta: nuevaPropuesta,
                porQue: porQueNuevos
              };
            }
            return l;
          }));

          actualizarLead(lead.id, null, {
            datos_propuesta: nuevaPropuesta,
            propuesta_aceptada: false
          }).catch(err => {
            logger.warn('LeadsStaffPage', 'Aviso guardando propuesta en background:', { err });
          });

          registrarEventoHistorial(lead.id, {
            tipo: 'Propuesta',
            titulo: `Propuesta generada con ${result.motor || 'IA Mistral'}`,
            detalle: `${nuevaPropuesta.nombre} — ${nuevaPropuesta.precioEspecial} (${nuevaPropuesta.duracion}). Adaptada a sus preferencias de aroma, música y piel.`,
            autor: result.motor || 'Mistral AI'
          });

          show(`✨ Propuesta generada con ${result.motor || 'IA Mistral'}: ${nuevaPropuesta.nombre}`);
          setGeneratingProposal(false);
          return;
        }
      } catch (err) {
        logger.error('LeadsStaffPage', 'Error generando propuesta con IA:', { err });
      } finally {
        setGeneratingProposal(false);
      }
    }

    // Catálogo rápido de rotación determinística
    ejecutarRotacionCatalogo();
  };

  const ejecutarRotacionCatalogo = () => {
    if (!lead) return;

    const interes = (lead.interes || lead.servicio || 'facial').toLowerCase();
    const nombreLead = lead.nombre ? lead.nombre.split(' ')[0] : 'Cliente';
    const tieneEnriquecimiento = Boolean(lead.otros?.enriquecimientoCompletado);
    const aroma = lead.gustos?.aroma || 'Lavanda';
    const musica = lead.gustos?.musica || 'Relajante';
    const tipoPiel = lead.gustos?.tipoPiel ? `para piel ${lead.gustos.tipoPiel.toLowerCase()}` : '';
    const tempAgua = lead.gustos?.temperatura || 'Templada';

    const CATALOGO_PAQUETES = {
      facial: [
        {
          nombre: `Ritual Facial Glow & Hidratación Profunda`,
          desc: `Diseñado para ${nombreLead} ${tipoPiel}, incluye evaluación dérmica, extracción ultrasónica, mascarilla de colágeno y sueros antioxidantes.`,
          tags: ["Facial", "Hidratación", "Piel Radiante"],
          duracion: "75 min",
          precioRegular: "S/ 190.00",
          precioEspecial: "S/ 145.00",
          ahorro: "S/ 45.00",
          descuento: "24%",
          incluye: `Diagnóstico dérmico computarizado, limpieza profunda, mascarilla adaptada a su piel, masaje facial linfático y protección solar mineral.`
        },
        {
          nombre: `Plan Facial Rejuvenecedor & Anti-Fatiga`,
          desc: `Terapia facial intensiva con ácido hialurónico puro, radiofrecuencia suave y crioterapia calmante para revitalizar el rostro de ${nombreLead}.`,
          tags: ["Anti-Edad", "Lifting", "Especial"],
          duracion: "90 min",
          precioRegular: "S/ 230.00",
          precioEspecial: "S/ 175.00",
          ahorro: "S/ 55.00",
          descuento: "24%",
          incluye: `Higiene facial médica, suero hialurónico concentrado, radiofrecuencia reafirmante, velo de colágeno y crema de seda.`
        },
        {
          nombre: `Sesión Express Detox Facial Purificante`,
          desc: `Sesión ágil y efectiva para purificar poros en profundidad y devolver luminosidad inmediata sin agredir la piel.`,
          tags: ["Express", "Limpieza", "Acceso Rápido"],
          duracion: "50 min",
          precioRegular: "S/ 130.00",
          precioEspecial: "S/ 99.00",
          ahorro: "S/ 31.00",
          descuento: "24%",
          incluye: `Exfoliación suave, vapor de ozono, extracción focalizada y mascarilla refrescante descongestiva.`
        },
        {
          nombre: `Ritual Facial Antiox Vitamina C & Oro Coloidal`,
          desc: `Tratamiento iluminador premium que neutraliza el daño celular y aporta tersura y vitalidad inmediata al cutis.`,
          tags: ["Iluminador", "Vitamina C", "Premium"],
          duracion: "80 min",
          precioRegular: "S/ 210.00",
          precioEspecial: "S/ 159.00",
          ahorro: "S/ 51.00",
          descuento: "24%",
          incluye: `Microdermoabrasión suave con punta de diamante, ampolla concentrada de Vitamina C estabilizada, mascarilla hidroplástica y masaje kobido.`
        }
      ],
      corporal: [
        {
          nombre: `Ritual Envoltura Corporal Desintoxicante & Firmeza`,
          desc: `Experiencia corporal completa con exfoliación botánica de sales minerales y envoltura mineralizante de lodo volcánico.`,
          tags: ["Corporal", "Detox", "Renovación"],
          duracion: "80 min",
          precioRegular: "S/ 180.00",
          precioEspecial: "S/ 139.00",
          ahorro: "S/ 41.00",
          descuento: "23%",
          incluye: `Exfoliación botánica de cuerpo completo, envoltura desintoxicante, ducha sensorial a temperatura ${tempAgua.toLowerCase()} y emulsión hidratante selladora.`
        },
        {
          nombre: `Circuito Reductor & Drenaje Linfático Activo`,
          desc: `Terapia combinada para desinflamar, modelar el contorno corporal y activar la microcirculación linfática.`,
          tags: ["Drenaje", "Modelador", "Bienestar"],
          duracion: "70 min",
          precioRegular: "S/ 200.00",
          precioEspecial: "S/ 150.00",
          ahorro: "S/ 50.00",
          descuento: "25%",
          incluye: `Drenaje linfático manual especializado, gel criogénico reafirmante, presoterapia secuencial y plan de hidratación botánica.`
        },
        {
          nombre: `Exfoliación Sensorial con Sales Termales & Cacao`,
          desc: `Renovación epidérmica profunda enriquecida con manteca de cacao pura y aceites nutritivos para una piel sedosa y nutrida.`,
          tags: ["Exfoliación", "Nutrición", "Sensorial"],
          duracion: "60 min",
          precioRegular: "S/ 160.00",
          precioEspecial: "S/ 120.00",
          ahorro: "S/ 40.00",
          descuento: "25%",
          incluye: `Pulido corporal con sales termales marinas, envoltura tibia de cacao nutritivo, hidroterapia y masaje relajante ligero.`
        },
        {
          nombre: `Tratamiento Corporal Modelador & Tonificante Pro`,
          desc: `Protocolo intensivo enfocado en firmeza y tonificación de zonas localizadas con fitocomplejos activos.`,
          tags: ["Tonificante", "Firmeza", "Pro"],
          duracion: "75 min",
          precioRegular: "S/ 220.00",
          precioEspecial: "S/ 165.00",
          ahorro: "S/ 55.00",
          descuento: "25%",
          incluye: `Exfoliación focalizada, masaje reductor modelador manual, aparatología reafirmante y crema tensora de cafeína botánica.`
        }
      ],
      relajacion: [
        {
          nombre: `Ritual de Relajación Profunda con Aromaterapia`,
          desc: `Sesión multisensorial personalizada con aceites esenciales de ${aroma}, ambientación con ${musica.toLowerCase()} y toallas térmicas.`,
          tags: ["Relajación", "Anti-Estrés", "Aromaterapia"],
          duracion: "80 min",
          precioRegular: "S/ 180.00",
          precioEspecial: "S/ 135.00",
          ahorro: "S/ 45.00",
          descuento: "25%",
          incluye: `Masaje relajante en cuerpo completo, aceites tibios esenciales de ${aroma}, compresa cervical térmica y té botánico al finalizar.`
        },
        {
          nombre: `Terapia Descontracturante & Piedras Calientes`,
          desc: `Enfoque terapéutico en espalda, cuello y hombros para liberar sobrecargas musculares, contracturas y fatiga postural de ${nombreLead}.`,
          tags: ["Descontracturante", "Piedras Calientes", "Terapéutico"],
          duracion: "90 min",
          precioRegular: "S/ 210.00",
          precioEspecial: "S/ 160.00",
          ahorro: "S/ 50.00",
          descuento: "24%",
          incluye: `Masaje deep-tissue localizado, colocación de piedras volcánicas basálticas a temperatura controlada y bálsamo herbal reconfortante.`
        },
        {
          nombre: `Masaje Deep-Tissue & Alivio Cervico-Dorsal`,
          desc: `Presión profunda dirigida a nudos musculares y rigidez acumulada por jornadas de trabajo prolongadas.`,
          tags: ["Deep-Tissue", "Cervical", "Espalda"],
          duracion: "60 min",
          precioRegular: "S/ 170.00",
          precioEspecial: "S/ 129.00",
          ahorro: "S/ 41.00",
          descuento: "24%",
          incluye: `Técnicas miofasciales de descompresión muscular, ventosa suave localizada, toallas tibias con esencias y estiramientos asistidos.`
        },
        {
          nombre: `Experiencia Holística Sensorial Origen Spa`,
          desc: `El ritual insignia del spa: combinación armónica de reflexología, masaje corporal sedativo y aromaterapia de lavanda y cítricos.`,
          tags: ["Insignia", "Holístico", "VIP"],
          duracion: "100 min",
          precioRegular: "S/ 240.00",
          precioEspecial: "S/ 180.00",
          ahorro: "S/ 60.00",
          descuento: "25%",
          incluye: `Bienvenida podal con sales relajantes, masaje integral cuerpo completo, masaje craneal hindú y degustación de infusión orgánica.`
        }
      ],
      terapeutico: [
        {
          nombre: `Sesión Reflexología Podal & Bienestar Integral`,
          desc: `Estimulación de zonas reflejas podales para desbloquear canales energéticos y calmar el sistema nervioso central.`,
          tags: ["Reflexología", "Alivio", "Natural"],
          duracion: "60 min",
          precioRegular: "S/ 140.00",
          precioEspecial: "S/ 105.00",
          ahorro: "S/ 35.00",
          descuento: "25%",
          incluye: `Baño podal con sales de magnesio y aceites botánicos, digitopresión en puntos reflejos clave, masaje calmante de piernas y té digestivo.`
        },
        {
          nombre: `Circuito Terapéutico Anti-Estrés Ejecutivo`,
          desc: `Protocolo rápido y contundente diseñado para personas con alta carga mental y muscular acumulada.`,
          tags: ["Ejecutivo", "Anti-Estrés", "Rápido"],
          duracion: "70 min",
          precioRegular: "S/ 190.00",
          precioEspecial: "S/ 145.00",
          ahorro: "S/ 45.00",
          descuento: "24%",
          incluye: `Masaje focalizado en trapecio y zona lumbar, terapia con piedras calientes, aromaterapia respiratoria de eucalipto y compresa ocular de lavanda.`
        },
        {
          nombre: `Terapia de Armonización & Drenaje Corporal`,
          desc: `Equilibrio corporal mediante movimientos rítmicos sedantes que estimulan el retorno circulatorio y la relajación profunda.`,
          tags: ["Armonización", "Drenaje", "Salud"],
          duracion: "75 min",
          precioRegular: "S/ 180.00",
          precioEspecial: "S/ 135.00",
          ahorro: "S/ 45.00",
          descuento: "25%",
          incluye: `Drenaje manual suave, aceites tibios calmantes, compresas térmicas cervicales y sesión de descanso en sala sensorial.`
        }
      ]
    };

    let categoria = 'facial';
    if (interes.includes('corporal') || interes.includes('envoltura') || interes.includes('exfolia') || interes.includes('reductor')) {
      categoria = 'corporal';
    } else if (interes.includes('reflex') || interes.includes('podal') || interes.includes('terapeut')) {
      categoria = 'terapeutico';
    } else if (interes.includes('masaje') || interes.includes('relaj') || interes.includes('piedras') || interes.includes('contract')) {
      categoria = 'relajacion';
    }

    const opciones = CATALOGO_PAQUETES[categoria] || CATALOGO_PAQUETES.facial;
    const propActual = lead.propuesta?.nombre || '';
    const actualIdx = opciones.findIndex(op => op.nombre === propActual);
    const nextIdx = actualIdx >= 0 ? (actualIdx + 1) % opciones.length : 0;
    const nuevaOpcion = opciones[nextIdx];

    const porQueActualizados = [
      `Alineado a su interés principal en tratamientos de ${interes}.`,
      tieneEnriquecimiento && lead.gustos?.aroma 
        ? `Incorpora sus notas sensoriales y aroma preferido (${aroma}).` 
        : `Ideal para quienes buscan resultados notables y relajación desde la 1era cita.`,
      tieneEnriquecimiento && lead.gustos?.horario 
        ? `Horario adaptable a su disponibilidad (${lead.gustos.horario}).` 
        : `Excelente relación de valor con 24% - 25% de beneficio de bienvenida.`
    ];

    const propuestaCompleta = {
      ...nuevaOpcion,
      aceptada: false,
      fecha_aceptacion: null
    };

    setLeads(prev => prev.map(l => {
      if (l.id === lead.id) {
        return {
          ...l,
          propuesta: propuestaCompleta,
          porQue: porQueActualizados
        };
      }
      return l;
    }));

    actualizarLead(lead.id, null, {
      datos_propuesta: nuevaOpcion,
      propuesta_aceptada: false
    }).catch(err => {
      logger.warn('LeadsStaffPage', 'Aviso guardando propuesta en background:', { err });
    });

    registrarEventoHistorial(lead.id, {
      tipo: 'Propuesta',
      titulo: `Propuesta actualizada del catálogo: ${nuevaOpcion.nombre}`,
      detalle: `${nuevaOpcion.desc} Precio especial: ${nuevaOpcion.precioEspecial}.`,
      autor: 'Staff Origen Spa'
    });

    show(`🔄 Propuesta del catálogo seleccionada: ${nuevaOpcion.nombre}`);
  };

  const handleSaveChanges = async () => {
    if (!lead) return;
    
    try {
      // Preparar datos del contacto para actualizar
      const datosContacto = {
        nombre: lead.perfil.nombre,
        telefono: lead.perfil.telefono,
        email: lead.perfil.email
      };

      // Preparar datos del lead_detalle para actualizar
      const datosLeadDetalle = {
        lead_score: lead.score
      };

      await actualizarLead(lead.id, datosContacto, datosLeadDetalle);
      
      show("✅ Cambios guardados exitosamente");
    } catch (err) {
      console.error('[Leads] Error guardando cambios:', err);
      show("Error al guardar cambios. Verifica la conexión a Supabase.");
    }
  };

  const handleEnviarEnriquecimiento = async () => {
    if (!lead) return;
    
    try {
      const emailCliente = lead.perfil.email;
      const nombreCliente = lead.perfil.nombre;
      
      if (!emailCliente || emailCliente === "No provisto") {
        show("❌ El lead no tiene email registrado. No se puede enviar el formulario de enriquecimiento.");
        return;
      }

      const result = await enviarEmailEnriquecimiento(lead.id, emailCliente, nombreCliente);
      
      if (result.success) {
        if (result.data.emailEnviado) {
          show(`✅ Email de enriquecimiento enviado a ${emailCliente}`);
        } else {
          show(`⚠️ Formulario creado pero email no enviado. Link manual: ${result.data.linkManual}`);
        }
      } else {
        show(result.error?.message || "Error al enviar email de enriquecimiento");
      }
    } catch (err) {
      logger.error('LeadsStaffPage', 'Error enviando enriquecimiento', { err });
      show("Error al enviar email de enriquecimiento");
    }
  };

  const handleEnviarPropuestaChatbot = async () => {
    if (!lead) return;
    
    try {
      const emailCliente = lead.perfil.email;
      const nombreCliente = lead.perfil.nombre;
      
      if (!emailCliente || emailCliente === "No provisto") {
        show("❌ El lead no tiene email registrado. No se puede enviar la propuesta.");
        return;
      }

      // Preparar datos de la propuesta inicial normalizando valores numéricos
      const cleanNum = (val, fallback) => {
        if (typeof val === 'number') return val;
        if (!val) return fallback;
        const n = parseFloat(String(val).replace(/[^\d.]/g, ''));
        return isNaN(n) ? fallback : n;
      };

      const datosPropuesta = {
        servicio: lead.propuesta?.nombre || lead.interes || 'Servicio personalizado',
        precio: cleanNum(lead.propuesta?.precioEspecial, 120),
        precioRegular: cleanNum(lead.propuesta?.precioRegular, 150),
        duracion: lead.propuesta?.duracion || '60 min',
        descuento: lead.propuesta?.descuento || '0%',
        incluye: lead.propuesta?.incluye || 'Evaluación inicial, tratamiento y seguimiento',
        descripcion: lead.propuesta?.desc || 'Propuesta personalizada de Origen Spa'
      };

      const result = await enviarEmailPropuestaConChatbot(lead.id, emailCliente, nombreCliente, datosPropuesta);
      
      if (result.success) {
        if (result.data.emailEnviado) {
          show(`✅ Propuesta con chatbot enviada a ${emailCliente}`);
        } else {
          show(`⚠️ Propuesta creada pero email no enviado. Link manual: ${result.data.linkManual}`);
        }
      } else {
        show(result.error?.message || "Error al enviar propuesta");
      }
    } catch (err) {
      logger.error('LeadsStaffPage', 'Error enviando propuesta chatbot', { err });
      show("Error al enviar propuesta");
    }
  };

  // Función para manejar cambios en objetos anidados (ej: perfil.nombre)
  const handleFieldChange = (category, field, value) => {
    setLeads(prev => prev.map(l => {
      if (l.id === selId) {
        return {
          ...l,
          [category]: {
            ...l[category],
            [field]: value
          }
        };
      }
      return l;
    }));
  };

  // Función para manejar cambios en campos de la raíz del lead (ej: temp)
  const handleRootChange = (field, value) => {
    setLeads(prev => prev.map(l => 
      l.id === selId ? { ...l, [field]: value } : l
    ));
  };

  const list = leads.filter(l =>
    l.nombre?.toLowerCase().includes(query.toLowerCase()) ||
    l.servicio?.toLowerCase().includes(query.toLowerCase())
  );

  const lead = leads.find(l => l.id === selId) || leads[0];
  const fn = lead ? lead.nombre.split(" ")[0] : "";

  if (loading) {
    return <div className="ln-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><h2>Cargando leads desde Supabase...</h2></div>;
  }

  if (!lead) {
    return <div className="ln-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><h2>No hay leads registrados aún.</h2></div>;
  }

  return (
    <div className="ln-shell">
      {/* ══ NAVBAR ══ */}
      <StaffUniversalNav activePhase="leads" />

      {/* ══ LAYOUT ══ */}
      <div className="ln-layout">

        {/* ── SIDEBAR ── */}
        <aside className="ln-sidebar">
          <p className="ln-sidebar-title">Buscar Lead</p>
          <div className="ln-search">
            <input type="text" placeholder="Buscar por nombre..." value={query} onChange={e => setQuery(e.target.value)} />
            <IcoSearch/>
          </div>
          <ul className="ln-list">
            {list.map(l => (
              <li key={l.id}
                className={"ln-item" + (l.id === selId ? " active" : "")}
                onClick={() => { setSelId(l.id); setTab("Perfil"); }}>
                <div className="ln-item-av">{l.iniciales}</div>
                <div className="ln-item-info">
                  <strong>{l.nombre}</strong>
                  <span>{l.servicio}</span>
                </div>
                <div className="ln-item-right">
                  <span className="ln-score-pill">{l.score}</span>
                  <span className={tempClass(l.temp)}>{l.temp}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="ln-list-note">Mostrando {list.length} leads</p>
        </aside>

        {/* ── MAIN ── */}
        <main className="ln-main">

          {/* Page title */}
          <div className="ln-page-header">
            <div>
              <h1 className="ln-page-title">Perfil de Negociación</h1>
              <p className="ln-page-sub">Consulta y gestiona la información del lead para una atención personalizada</p>
            </div>
            <button className="ln-back-btn" onClick={() => show("Volviendo al listado...")}>← Volver al listado</button>
          </div>

          {/* Lead hero mini */}
          <div className="ln-hero" style={{ padding: '1rem 1.5rem', alignItems: 'center' }}>
            <div className="ln-hero-body" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                <h2 className="ln-hero-name" style={{ fontSize: '1.4rem' }}>{lead.nombre}</h2>
                <p className="ln-hero-sub" style={{ fontSize: '0.8rem' }}>Lead calificado - Interesada en {lead.interes.toLowerCase()}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>Estado del lead:</span>
                  <select className="ln-select-input" value={lead.temp} onChange={(e) => handleRootChange('temp', e.target.value)} style={{ background: 'var(--color-bg)', color: 'var(--color-ink)', border: '1px solid var(--color-line)', padding: '0.3rem 0.5rem', borderRadius: '4px' }}>
                    <option value="Caliente">Caliente</option>
                    <option value="Tibio">Tibio</option>
                    <option value="Frio">Frío</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(200,155,92,0.1)', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid rgba(200,155,92,0.3)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>Lead Score:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={lead.score} 
                      onChange={(e) => {
                        const newScore = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        handleUpdateScore(lead.id, newScore);
                      }}
                      style={{ 
                        width: '60px', 
                        background: 'var(--color-bg)', 
                        color: 'var(--color-ink)', 
                        border: '1px solid var(--color-line)', 
                        padding: '0.3rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '1.2rem',
                        fontWeight: '700'
                      }}
                    />
                    <span style={{fontSize:'0.9rem', color:'gray'}}>/ 100</span>
                    <button 
                      type="button"
                      onClick={() => handleUpdateScore(lead.id, Math.min(100, lead.score + 10))}
                      style={{ 
                        background: 'var(--color-accent)', 
                        color: 'var(--color-ink-on-contrast)', 
                        border: 'none', 
                        padding: '0.3rem 0.6rem', 
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      +10
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleUpdateScore(lead.id, Math.max(0, lead.score - 10))}
                      style={{ 
                        background: 'rgba(243,238,226,0.1)', 
                        color: 'var(--color-ink)', 
                        border: '1px solid var(--color-line)', 
                        padding: '0.3rem 0.6rem', 
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      -10
                    </button>
                    <button 
                      type="button"
                      onClick={handleAutoScore}
                      style={{ 
                        background: 'rgba(183,210,185,0.2)', 
                        color: '#b7d2b9', 
                        border: '1px solid rgba(183,210,185,0.4)', 
                        padding: '0.3rem 0.8rem', 
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="ln-tabs">
            {TABS.map(t => (
              <button key={t} className={"ln-tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
                {t === "Perfil"      && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
                {t === "Propuesta"   && <IcoStar/>}
                {t === "Historial"   && <IcoCal/>}
                {t === "Notas"       && <IcoMsg/>}
                {t === "Actividades" && <IcoHome/>}
                {t}
              </button>
            ))}
          </div>

          {/* ── TAB: PERFIL (CAMPOS REACTIVOS) ── */}
          {tab === "Perfil" && (
            <>
              {/* Alerta de estado si el formulario no ha sido completado */}
              {!lead.otros.enriquecimientoCompletado && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(200, 155, 92, 0.12)',
                  border: '1px solid rgba(200, 155, 92, 0.35)',
                  borderRadius: '6px',
                  padding: '1rem 1.4rem',
                  marginBottom: '1.5rem',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <strong style={{ color: 'var(--color-accent)', display: 'block', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                      📋 Formulario de Enriquecimiento Pendiente
                    </strong>
                    <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.8rem', margin: 0 }}>
                      Este usuario solo ha enviado el formulario básico inicial de la página pública (Buyers). Los campos detallados de gustos, educación y ámbito laboral se habilitarán una vez que complete el formulario enviado por email.
                    </p>
                  </div>
                  <button 
                    className="ln-btn-ghost" 
                    onClick={handleEnviarEnriquecimiento}
                    style={{ background: 'var(--color-accent)', color: 'var(--color-ink-on-contrast)', border: 'none', fontWeight: '600' }}
                  >
                    <IcoSend/> Enviar Formulario por Email
                  </button>
                </div>
              )}

              <div className="ln-grid-2">
                
                {/* Datos Captados en Buyers (Siempre visibles) */}
                <article className="ln-card">
                  <h3 className="ln-card-title" style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <span>Datos de Captación (Buyers)</span>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(183, 210, 185, 0.2)', color: '#b7d2b9', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                      Verificado
                    </span>
                  </h3>
                  <div className="ln-form-grid">
                    <div className="ln-form-group">
                      <label>Nombre completo:</label>
                      <input type="text" value={lead.perfil.nombre || ""} onChange={e => handleFieldChange('perfil', 'nombre', e.target.value)} className="ln-input" />
                    </div>
                    <div className="ln-form-group">
                      <label>Teléfono / WhatsApp:</label>
                      <input type="text" value={lead.perfil.telefono || ""} onChange={e => handleFieldChange('perfil', 'telefono', e.target.value)} className="ln-input" />
                    </div>
                    <div className="ln-form-group">
                      <label>Correo electrónico:</label>
                      <input type="email" value={lead.perfil.email || ""} onChange={e => handleFieldChange('perfil', 'email', e.target.value)} className="ln-input" />
                    </div>
                    <div className="ln-form-group">
                      <label>Interés inicial:</label>
                      <input type="text" value={lead.gustos.tratamiento || lead.servicio || ""} readOnly className="ln-input" style={{ background: 'rgba(243,238,226,0.05)' }} />
                    </div>
                    {lead.gustos.tipoPiel && (
                      <div className="ln-form-group">
                        <label>Tipo de piel:</label>
                        <input type="text" value={lead.gustos.tipoPiel} readOnly className="ln-input" style={{ background: 'rgba(243,238,226,0.05)' }} />
                      </div>
                    )}
                    {lead.otros.enriquecimientoCompletado && (
                      <>
                        <div className="ln-form-group">
                          <label>Edad:</label>
                          <input type="text" value={lead.perfil.edad || ""} onChange={e => handleFieldChange('perfil', 'edad', e.target.value)} className="ln-input" />
                        </div>
                        <div className="ln-form-group">
                          <label>Distrito:</label>
                          <input type="text" value={lead.perfil.distrito || ""} onChange={e => handleFieldChange('perfil', 'distrito', e.target.value)} className="ln-input" />
                        </div>
                      </>
                    )}
                  </div>
                </article>

                {/* Si no está completado, mostrar tarjeta informativa o los campos solo si está completado */}
                {lead.otros.enriquecimientoCompletado ? (
                  <>
                    {/* Gustos y Preferencias (Enriquecido) */}
                    <article className="ln-card">
                      <h3 className="ln-card-title" style={{marginBottom: '1rem'}}>Gustos y Preferencias</h3>
                      <div className="ln-form-grid">
                        <div className="ln-form-group">
                          <label>Tratamiento de interés:</label>
                          <select value={lead.gustos.tratamiento || ""} onChange={e => handleFieldChange('gustos', 'tratamiento', e.target.value)} className="ln-input">
                            <option value={lead.gustos.tratamiento}>{lead.gustos.tratamiento}</option>
                            <option value="Tratamiento corporal">Tratamiento corporal</option>
                            <option value="Masajes relajantes">Masajes relajantes</option>
                            <option value="Tratamiento facial">Tratamiento facial</option>
                          </select>
                        </div>
                        <div className="ln-form-group">
                          <label>Aroma preferido:</label>
                          <input type="text" value={lead.gustos.aroma || ""} onChange={e => handleFieldChange('gustos', 'aroma', e.target.value)} className="ln-input" />
                        </div>
                        <div className="ln-form-group">
                          <label>Música preferida:</label>
                          <input type="text" value={lead.gustos.musica || ""} onChange={e => handleFieldChange('gustos', 'musica', e.target.value)} className="ln-input" />
                        </div>
                        <div className="ln-form-group">
                          <label>Horario preferido:</label>
                          <input type="text" value={lead.gustos.horario || ""} onChange={e => handleFieldChange('gustos', 'horario', e.target.value)} className="ln-input" />
                        </div>
                        <div className="ln-form-group">
                          <label>Temperatura del agua:</label>
                          <input type="text" value={lead.gustos.temperatura || ""} onChange={e => handleFieldChange('gustos', 'temperatura', e.target.value)} className="ln-input" />
                        </div>
                        <div className="ln-form-group" style={{alignItems: 'flex-start'}}>
                          <label style={{marginTop: '0.4rem'}}>Otras preferencias:</label>
                          <textarea value={lead.gustos.otras || ""} onChange={e => handleFieldChange('gustos', 'otras', e.target.value)} className="ln-input" style={{height: '60px', resize: 'none'}} />
                        </div>
                      </div>
                    </article>

                    {/* Datos del Estudiante (Enriquecido) */}
                    <article className="ln-card">
                      <h3 className="ln-card-title" style={{marginBottom: '1rem'}}>Datos de Estudios / Formación</h3>
                      <div className="ln-form-grid">
                        <div className="ln-form-group">
                          <label>Especialidad / Carrera:</label>
                          <input type="text" value={lead.estudiante.especialidad || ""} onChange={e => handleFieldChange('estudiante', 'especialidad', e.target.value)} className="ln-input" />
                        </div>
                        <div className="ln-form-group">
                          <label>Nivel:</label>
                          <input type="text" value={lead.estudiante.nivel || ""} onChange={e => handleFieldChange('estudiante', 'nivel', e.target.value)} className="ln-input" />
                        </div>
                        <div className="ln-form-group">
                          <label>Universidad / Instituto:</label>
                          <input type="text" value={lead.estudiante.universidad || ""} onChange={e => handleFieldChange('estudiante', 'universidad', e.target.value)} className="ln-input" />
                        </div>
                      </div>
                    </article>

                    {/* Datos Laborales (Enriquecido) */}
                    <article className="ln-card">
                      <h3 className="ln-card-title" style={{marginBottom: '1rem'}}>Datos Laborales</h3>
                      <div className="ln-form-grid">
                        <div className="ln-form-group">
                          <label>Empresa:</label>
                          <input type="text" value={lead.laboral.empresa || ""} onChange={e => handleFieldChange('laboral', 'empresa', e.target.value)} className="ln-input" />
                        </div>
                        <div className="ln-form-group">
                          <label>Cargo:</label>
                          <input type="text" value={lead.laboral.cargo || ""} onChange={e => handleFieldChange('laboral', 'cargo', e.target.value)} className="ln-input" />
                        </div>
                        <div className="ln-form-group">
                          <label>Situación laboral:</label>
                          <input type="text" value={lead.laboral.situacion || ""} onChange={e => handleFieldChange('laboral', 'situacion', e.target.value)} className="ln-input" />
                        </div>
                      </div>
                    </article>
                  </>
                ) : (
                  <article className="ln-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2.5rem 1.5rem', background: 'rgba(22, 35, 28, 0.4)', borderStyle: 'dashed' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: '0.8rem', opacity: 0.7 }}>🔒</div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
                      Campos de Perfil en Espera
                    </h3>
                    <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.82rem', maxWidth: '380px', lineHeight: 1.5, marginBottom: '1.2rem' }}>
                      Las secciones de <strong>Gustos y Preferencias</strong>, <strong>Estudios</strong> y <strong>Datos Laborales</strong> permanecen ocultas y vacías hasta que el usuario complete su cuestionario interactivo por correo.
                    </p>
                    <button 
                      className="ln-btn-ghost" 
                      onClick={handleEnviarEnriquecimiento}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                    >
                      <IcoSend/> Reenviar formulario al correo
                    </button>
                  </article>
                )}

                {/* Otros Datos */}
                <article className="ln-card ln-span2">
                  <h3 className="ln-card-title" style={{marginBottom: '1rem'}}>Seguimiento y Registro</h3>
                  <div className="ln-grid-2">
                    <div className="ln-form-grid">
                      <div className="ln-form-group">
                        <label>Cómo nos conoció:</label>
                        <select value={lead.otros.comoConocio || ""} onChange={e => handleFieldChange('otros', 'comoConocio', e.target.value)} className="ln-input">
                          <option value="Instagram Ads">Instagram Ads</option>
                          <option value="TikTok Ads">TikTok Ads</option>
                          <option value="Referido">Referido</option>
                        </select>
                      </div>
                      <div className="ln-form-group">
                        <label>Cita agendada:</label>
                        <div style={{display:'flex', width: '100%', gap:'0.5rem'}}>
                          <input type="text" value={lead.otros.citaAgendada || ""} onChange={e => handleFieldChange('otros', 'citaAgendada', e.target.value)} className="ln-input" placeholder={lead.otros.enriquecimientoCompletado ? "Pendiente de agendar" : "Pendiente de enriquecimiento"} />
                          <button className="ln-btn-ghost" style={{padding: '0 0.8rem'}}><IcoCal/></button>
                        </div>
                      </div>
                      <div className="ln-form-group" style={{alignItems: 'flex-start'}}>
                        <label style={{marginTop: '0.4rem'}}>Observaciones:</label>
                        <textarea value={lead.otros.observaciones || ""} onChange={e => handleFieldChange('otros', 'observaciones', e.target.value)} className="ln-input" style={{height: '60px', resize: 'none'}} />
                      </div>
                    </div>
                    
                    <div className="ln-form-grid">
                      <div className="ln-form-group">
                        <label>Estado del lead:</label>
                        <select value={lead.temp || ""} onChange={(e) => handleRootChange('temp', e.target.value)} className="ln-input">
                          <option value="Caliente">Caliente</option>
                          <option value="Tibio">Tibio</option>
                          <option value="Frio">Frío</option>
                        </select>
                      </div>
                      <div className="ln-form-group">
                        <label>Lead Score (0-100):</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={lead.score} 
                            onChange={(e) => {
                              const newScore = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              handleUpdateScore(lead.id, newScore);
                            }}
                            className="ln-input" 
                            style={{ width: '80px' }}
                          />
                          <button 
                            type="button"
                            onClick={() => handleUpdateScore(lead.id, Math.min(100, lead.score + 10))}
                            className="ln-btn-ghost"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            +10
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleUpdateScore(lead.id, Math.max(0, lead.score - 10))}
                            className="ln-btn-ghost"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            -10
                          </button>
                        </div>
                        <small style={{ color: 'var(--color-ink-muted)', fontSize: '0.7rem' }}>
                          Score ≥ 50: Transición automática a LEAD
                        </small>
                      </div>
                      <div className="ln-form-group">
                        <label>Fecha de registro:</label>
                        <input type="text" value={lead.otros.fechaRegistro || ""} readOnly className="ln-input" style={{background: 'rgba(243,238,226,0.05)'}} />
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              {/* Botonera inferior */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--color-line)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  {!lead.otros.enriquecimientoCompletado ? (
                    <button 
                      className="ln-btn-ghost" 
                      onClick={handleEnviarEnriquecimiento}
                      style={{ background: 'rgba(200, 155, 92, 0.1)', color: 'var(--color-accent)', border: '1px solid rgba(200, 155, 92, 0.3)' }}
                    >
                      <IcoSend/> Enviar Formulario Enriquecimiento
                    </button>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      padding: '0.5rem 1rem', 
                      background: 'rgba(183, 210, 185, 0.1)', 
                      border: '1px solid rgba(183, 210, 185, 0.3)', 
                      borderRadius: '4px',
                      color: '#b7d2b9',
                      fontSize: '0.8rem'
                    }}>
                      <IcoCheck/> Perfil Enriquecido
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button className="ln-btn-ghost" onClick={() => show("Cambios descartados")}>Cancelar</button>
                  <button className="ln-btn-primary" onClick={handleSaveChanges}>
                    <IcoSave/> Guardar Cambios
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── TAB: PROPUESTA ── */}
          {tab === "Propuesta" && (
            <div className="ln-propuesta-layout">
              {/* Centro */}
              <div className="ln-propuesta-center">
                <article className="ln-card ln-prop-card">
                  <div className="ln-prop-head">
                    <div>
                      <h3 className="ln-card-title" style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                        <IcoStar/> Propuesta personalizada
                      </h3>
                      <p className="ln-muted" style={{fontSize:"0.7rem"}}>Diseñada según sus intereses, preferencias y estilo de vida.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        className="ln-btn-primary" 
                        onClick={() => handleGenerarNuevaPropuesta(true)} 
                        disabled={generatingProposal}
                        title="Pedir a la IA Mistral una propuesta diseñada con los datos recopilados del usuario"
                        style={{ 
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.85rem',
                          opacity: generatingProposal ? 0.75 : 1,
                          cursor: generatingProposal ? 'wait' : 'pointer'
                        }}
                      >
                        {generatingProposal ? (
                          <>
                            <span className="spinner" style={{ width: '12px', height: '12px', display: 'inline-block', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                            Generando con IA Mistral...
                          </>
                        ) : (
                          <>
                            <span>✨</span> Generar con IA Mistral
                          </>
                        )}
                      </button>
                      <button 
                        className="ln-btn-ghost" 
                        onClick={() => handleGenerarNuevaPropuesta(false)} 
                        disabled={generatingProposal}
                        title="Rotar a la siguiente opción del catálogo de tratamientos de Origen Spa"
                        style={{ 
                          background: 'rgba(200, 155, 92, 0.12)', 
                          borderColor: 'rgba(200, 155, 92, 0.35)', 
                          color: 'var(--color-accent)', 
                          fontWeight: '600',
                          fontSize: '0.78rem',
                          padding: '0.45rem 0.75rem'
                        }}
                      >
                        🔄 Catálogo Rápido
                      </button>
                    </div>
                  </div>

                  <div className="ln-prop-body">
                    <div className="ln-prop-visual">
                      <div className="ln-prop-visual-overlay">
                        <p style={{fontFamily:"var(--font-display)",fontSize:"1.05rem",marginBottom:"0.3rem"}}>Tu momento, nuestra prioridad</p>
                        <p className="ln-muted" style={{fontSize:"0.7rem"}}>Piel saludable, mente tranquila</p>
                        <div className="ln-prop-visual-badges">
                          <span>✓ Resultados visibles</span>
                          <span>✓ Atención personalizada</span>
                          <span>✓ Ambiente relajante</span>
                        </div>
                      </div>
                    </div>
                    <div className="ln-prop-detail">
                      <span className="ln-recomendado">RECOMENDADO PARA {fn.toUpperCase()}</span>
                      <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.05rem",margin:"0.4rem 0 0.15rem"}}>{lead.propuesta.nombre}</h3>
                      <p className="ln-muted" style={{fontSize:"0.72rem",marginBottom:"0.5rem"}}>{lead.propuesta.desc}</p>
                      <div className="ln-tags" style={{marginBottom:"0.65rem"}}>
                        {lead.propuesta.tags.map(t => <span key={t} className="ln-tag">{t}</span>)}
                      </div>
                      <div className="ln-precio-row">
                        <span className="ln-muted" style={{fontSize:"0.72rem"}}>&#9200; {lead.propuesta.duracion}</span>
                        <span className="ln-muted" style={{fontSize:"0.72rem"}}><s>{lead.propuesta.precioRegular}</s></span>
                        <span className="ln-precio-especial">{lead.propuesta.precioEspecial}</span>
                        <span className="ln-discount">&minus;{lead.propuesta.descuento}</span>
                      </div>
                      <p className="ln-ahorro">Te ahorras {lead.propuesta.ahorro}</p>
                      <p style={{fontSize:"0.72rem",color:"var(--color-ink-muted)"}}>
                        <strong style={{color:"var(--color-ink)"}}>Incluye:</strong> {lead.propuesta.incluye}
                      </p>
                    </div>
                  </div>

                  <div className="ln-prop-footer" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-line)' }}>
                    <div className="ln-info-block" style={{ alignItems: 'flex-start' }}>
                      <IcoCal/>
                      <div>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-accent)' }}>
                          <span>🕒 Horario sugerido por IA</span>
                        </strong>
                        <p style={{ margin: '0.25rem 0', fontWeight: '600', color: 'var(--color-ink)' }}>
                          {lead.propuesta?.horarioSugerido || `${obtenerHorarioYAmbienteIA(lead).horario} (${obtenerHorarioYAmbienteIA(lead).explicacionHorario})`}
                        </p>
                        <small style={{ color: 'var(--color-ink-muted)', fontSize: '0.68rem' }}>
                          Calculado según disponibilidad y ritmo de vida
                        </small>
                      </div>
                    </div>
                    <div className="ln-info-block" style={{ alignItems: 'flex-start' }}>
                      <IcoHome/>
                      <div>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-accent)' }}>
                          <span>🕯️ Ambiente sensorial por IA</span>
                        </strong>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.74rem', color: 'var(--color-ink)', lineHeight: 1.4 }}>
                          {lead.propuesta?.ambienteSugerido || obtenerHorarioYAmbienteIA(lead).ambiente}
                        </p>
                        <small style={{ color: 'var(--color-ink-muted)', fontSize: '0.68rem' }}>
                          Personalizado según aroma, música y piel declarados
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="ln-cta-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.8rem' }}>
                    {lead.propuesta?.aceptada ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1.2rem',
                        background: 'rgba(183, 210, 185, 0.2)',
                        border: '1px solid rgba(183, 210, 185, 0.5)',
                        borderRadius: '4px',
                        color: '#b7d2b9',
                        fontWeight: '600',
                        fontSize: '0.85rem'
                      }}>
                        <IcoCheck/> Propuesta aprobada por el cliente vía Email
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem 1rem',
                        background: 'rgba(200, 155, 92, 0.1)',
                        border: '1px solid rgba(200, 155, 92, 0.3)',
                        borderRadius: '4px',
                        color: 'var(--color-accent)',
                        fontSize: '0.8rem'
                      }} title="El cliente aprueba o negocia la propuesta directamente desde el enlace del email enviado">
                        ⏳ Pendiente de aprobación (exclusiva del cliente vía email)
                      </div>
                    )}

                    <button 
                      className="ln-btn-primary" 
                      onClick={handleEnviarPropuestaChatbot}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <IcoEmail/> Enviar Propuesta al Correo (Chatbot)
                    </button>

                    <button 
                      className="ln-btn-wa" 
                      onClick={() => {
                        const cleanTel = (lead.perfil?.telefono || '').replace(/\D/g, '');
                        const tel = cleanTel.startsWith('51') ? cleanTel : `51${cleanTel}`;
                        const msg = encodeURIComponent(`¡Hola ${fn}! Te saluda el equipo de Origen Spa & Bienestar. Hemos preparado una propuesta especial para ti: ${lead.propuesta?.nombre} a ${lead.propuesta?.precioEspecial}. Te enviamos también los detalles interactivos a tu correo.`);
                        registrarEventoHistorial(lead.id, {
                          tipo: 'WhatsApp',
                          titulo: 'Propuesta compartida por WhatsApp',
                          detalle: `Enlace y detalles de "${lead.propuesta?.nombre}" compartidos al +${tel}.`,
                          autor: 'Staff Origen Spa'
                        });
                        window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
                      }}
                    >
                      <IcoWA/> Compartir por WhatsApp
                    </button>
                  </div>
                </article>
              </div>

              {/* Derecha */}
              <div className="ln-propuesta-right">
                {/* Tarjeta dinámica adaptada al lead y sus gustos */}
                <article className="ln-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "0.7rem" }}>
                    <h3 className="ln-card-title" style={{ margin: 0 }}>¿Por qué es ideal para {fn}?</h3>
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-accent)', background: 'rgba(200,155,92,0.1)', padding: '2px 7px', borderRadius: '10px' }}>
                      Personalizado
                    </span>
                  </div>
                  <ul className="ln-porque">
                    {calcularRazonesDinamicas(lead, lead.propuesta).map((r, i) => (
                      <li key={i}><IcoCheck/><span>{r}</span></li>
                    ))}
                  </ul>
                </article>

                {/* Agente de Campaña por Correo (Configuración determinada por IA al automatizar) */}
                <article className="ln-card" style={{ marginTop: "0.7rem" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "0.55rem" }}>
                    <h3 className="ln-card-title" style={{ margin: 0 }}>🤖 Campaña por Correo</h3>
                    {automatizacionCorreoMap[lead.id]?.activa && (
                      <span style={{ fontSize: '0.68rem', background: 'rgba(183,210,185,0.2)', color: '#b7d2b9', border: '1px solid rgba(183,210,185,0.4)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                        ● Activo (Diseñado por IA)
                      </span>
                    )}
                  </div>

                  {/* Si ya está activa: muestra el diagnóstico y plan determinado por IA */}
                  {automatizacionCorreoMap[lead.id]?.activa ? (
                    <>
                      <div style={{ background: 'rgba(243,238,226,0.03)', border: '1px solid var(--color-line)', borderRadius: '6px', padding: '0.65rem', marginBottom: '0.75rem', fontSize: '0.72rem' }}>
                        {/* Cadencia */}
                        <div style={{ marginBottom: '0.45rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                          <span style={{ color: 'var(--color-accent)' }}>📅</span>
                          <div>
                            <strong style={{ color: 'var(--color-ink)' }}>Cadencia por IA:</strong>
                            <span style={{ marginLeft: '4px', color: 'var(--color-accent)', fontWeight: 600 }}>
                              {automatizacionCorreoMap[lead.id].cadenciaTexto}
                            </span>
                            <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.68rem', marginTop: '1px' }}>
                              {automatizacionCorreoMap[lead.id].motivoCadencia}
                            </div>
                          </div>
                        </div>

                        {/* Horario */}
                        <div style={{ marginBottom: '0.45rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                          <span style={{ color: 'var(--color-accent)' }}>🕒</span>
                          <div>
                            <strong style={{ color: 'var(--color-ink)' }}>Horario sugerido por IA:</strong>
                            <span style={{ marginLeft: '4px', color: 'var(--color-accent)', fontWeight: 600 }}>
                              {automatizacionCorreoMap[lead.id].horario}
                            </span>
                            <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.68rem', marginTop: '1px' }}>
                              {automatizacionCorreoMap[lead.id].explicacionHorario}
                            </div>
                          </div>
                        </div>

                        {/* Ambiente */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                          <span style={{ color: 'var(--color-accent)' }}>🕯️</span>
                          <div>
                            <strong style={{ color: 'var(--color-ink)' }}>Ambiente sensorial por IA:</strong>
                            <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.68rem', marginTop: '2px', lineHeight: 1.4 }}>
                              {automatizacionCorreoMap[lead.id].ambiente}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: "0.72rem", color: "#b7d2b9", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                        Secuencia activa: enviando propuestas variadas <strong>{automatizacionCorreoMap[lead.id].cadenciaTexto.toLowerCase()}</strong> a <strong>{automatizacionCorreoMap[lead.id].email}</strong> a las {automatizacionCorreoMap[lead.id].horario}.
                      </p>
                    </>
                  ) : (
                    /* Si NO está activa: explicación limpia sin fijar parámetros antes de tiempo */
                    <p style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)", lineHeight: 1.55, marginBottom: "0.85rem" }}>
                      Al hacer clic en automatizar, la IA evaluará el perfil, score (temperatura) y hábitos de <strong>{fn}</strong> para determinar la <strong>frecuencia ideal en días</strong>, la <strong>hora de mayor apertura</strong> y la <strong>ambientación de cabina</strong> para enviarle propuestas variadas por correo electrónico a {lead.perfil?.email || 'su correo'}.
                    </p>
                  )}

                  <button 
                    className={automatizacionCorreoMap[lead.id]?.activa ? "ln-btn-ghost" : "ln-btn-primary"}
                    style={{
                      width: "100%",
                      fontSize: "0.74rem",
                      justifyContent: "center",
                      padding: '0.6rem',
                      opacity: analyzingAutomation ? 0.7 : 1,
                      cursor: analyzingAutomation ? 'wait' : 'pointer',
                      ...(automatizacionCorreoMap[lead.id]?.activa ? { border: '1px solid rgba(217,175,160,0.5)', color: '#D9AFA0' } : {})
                    }}
                    onClick={handleToggleAutomatizacionCorreo}
                    disabled={analyzingAutomation}
                  >
                    {analyzingAutomation ? (
                      <>✨ Analizando perfil y hábitos con IA...</>
                    ) : automatizacionCorreoMap[lead.id]?.activa ? (
                      <>⏸️ Pausar Automatización</>
                    ) : (
                      <><IcoSend/> Automatizar con IA (Determinar Cadencia y Hora)</>
                    )}
                  </button>
                </article>
              </div>
            </div>
          )}

          {/* ── TAB: HISTORIAL (TOTALMENTE FUNCIONAL) ── */}
          {tab === "Historial" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Formulario para registrar nueva interacción */}
              <article className="ln-card">
                <h3 className="ln-card-title" style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IcoPlus/> Registrar Nueva Interacción con {fn}
                </h3>
                <form onSubmit={handleAgregarInteraccionManual} style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '180px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Canal / Tipo:</label>
                    <select 
                      value={nuevoTipoInteraccion} 
                      onChange={e => setNuevoTipoInteraccion(e.target.value)}
                      className="ln-input"
                    >
                      <option value="Llamada">📞 Llamada telefónica</option>
                      <option value="WhatsApp">💬 Mensaje WhatsApp</option>
                      <option value="Email">✉️ Correo electrónico</option>
                      <option value="Visita Spa">🏢 Visita al Spa</option>
                      <option value="Nota">📝 Nota de contacto</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: '260px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Detalle del contacto o acuerdo:</label>
                    <input 
                      type="text" 
                      value={nuevoDetalleInteraccion} 
                      onChange={e => setNuevoDetalleInteraccion(e.target.value)}
                      placeholder="Ej: Se llamó a la clienta para coordinar turno de sábado por la tarde. Muy interesada..." 
                      className="ln-input" 
                    />
                  </div>
                  <button type="submit" className="ln-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                    + Registrar en Historial
                  </button>
                </form>
              </article>

              {/* Lista y Filtros de Historial */}
              <article className="ln-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <h3 className="ln-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <IcoCal/> Línea de Tiempo de Interacciones
                    </h3>
                    <p className="ln-muted" style={{ fontSize: '0.75rem' }}>Registro cronológico de todas las interacciones, propuestas y eventos del lead.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {["Todos", "Llamada", "WhatsApp", "Email", "Propuesta", "Registro"].map(f => (
                      <button 
                        key={f} 
                        className={"ln-tag" + (filtroHistorial === f ? " active" : "")}
                        onClick={() => setFiltroHistorial(f)}
                        style={{
                          background: filtroHistorial === f ? 'var(--color-accent)' : 'rgba(243,238,226,0.06)',
                          color: filtroHistorial === f ? 'var(--color-ink-on-contrast)' : 'var(--color-ink-muted)',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.72rem'
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeline visual */}
                {(() => {
                  const items = getLeadHistorial(lead).filter(it => {
                    if (filtroHistorial === "Todos") return true;
                    return it.tipo?.toLowerCase() === filtroHistorial.toLowerCase();
                  });

                  if (items.length === 0) {
                    return (
                      <p className="ln-muted" style={{ textAlign: 'center', padding: '2rem 0', fontSize: '0.82rem' }}>
                        No hay interacciones registradas para este filtro.
                      </p>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {items.map((it, idx) => {
                        let icon = "💬";
                        let badgeBg = "rgba(200, 155, 92, 0.15)";
                        let badgeColor = "var(--color-accent)";

                        if (it.tipo === "Llamada") { icon = "📞"; badgeBg = "rgba(183, 210, 185, 0.2)"; badgeColor = "#b7d2b9"; }
                        else if (it.tipo === "WhatsApp") { icon = "💬"; badgeBg = "rgba(37, 211, 102, 0.2)"; badgeColor = "#25d366"; }
                        else if (it.tipo === "Email") { icon = "✉️"; badgeBg = "rgba(183, 210, 185, 0.2)"; badgeColor = "#b7d2b9"; }
                        else if (it.tipo === "Propuesta") { icon = "✨"; badgeBg = "rgba(200, 155, 92, 0.25)"; badgeColor = "var(--color-accent)"; }
                        else if (it.tipo === "Registro" || it.tipo === "Enriquecimiento") { icon = "📋"; badgeBg = "rgba(217, 175, 160, 0.2)"; badgeColor = "var(--color-clay)"; }
                        else if (it.tipo === "Visita Spa") { icon = "🏢"; badgeBg = "rgba(183, 210, 185, 0.2)"; badgeColor = "#b7d2b9"; }

                        return (
                          <div 
                            key={it.id || idx}
                            style={{
                              display: 'flex',
                              gap: '1rem',
                              padding: '0.9rem 1.1rem',
                              background: 'rgba(15, 30, 23, 0.4)',
                              border: '1px solid var(--color-line)',
                              borderRadius: '6px',
                              alignItems: 'flex-start'
                            }}
                          >
                            <div style={{ 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '50%', 
                              background: badgeBg, 
                              color: badgeColor, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '1rem',
                              flexShrink: 0 
                            }}>
                              {icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                                <strong style={{ fontSize: '0.85rem', color: 'var(--color-ink)' }}>{it.titulo}</strong>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', background: 'rgba(243,238,226,0.06)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                    {it.autor || 'Staff'}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>{it.fecha}</span>
                                </div>
                              </div>
                              <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', lineHeight: 1.5, margin: 0 }}>
                                {it.detalle}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </article>
            </div>
          )}

          {/* ── TAB: NOTAS (TOTALMENTE FUNCIONAL) ── */}
          {tab === "Notas" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Formulario para agregar nueva nota */}
              <article className="ln-card">
                <h3 className="ln-card-title" style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IcoMsg/> Agregar Nota de Asesor para {fn}
                </h3>
                <form onSubmit={handleAgregarNota} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Categoría:</label>
                    {["General", "Preferencia", "Objeción", "Salud / Piel", "Seguimiento"].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNuevaCategoriaNota(cat)}
                        style={{
                          background: nuevaCategoriaNota === cat ? 'var(--color-accent)' : 'rgba(243,238,226,0.06)',
                          color: nuevaCategoriaNota === cat ? 'var(--color-ink-on-contrast)' : 'var(--color-ink-muted)',
                          border: 'none',
                          padding: '0.25rem 0.7rem',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <textarea 
                    className="ln-textarea" 
                    placeholder="Escribe una observación, detalle relevante o preferencia detectada durante la conversación..."
                    value={nuevaNotaTexto} 
                    onChange={e => setNuevaNotaTexto(e.target.value)}
                    style={{ minHeight: '80px', width: '100%', background: 'rgba(15,30,23,0.5)', border: '1px solid var(--color-line)', color: 'var(--color-ink)', padding: '0.6rem', borderRadius: '4px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="ln-btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}>
                      <IcoSave/> Guardar Nota
                    </button>
                  </div>
                </form>
              </article>

              {/* Lista de Notas */}
              <article className="ln-card">
                <div style={{ marginBottom: '1rem' }}>
                  <h3 className="ln-card-title">Cuaderno de Notas del Lead</h3>
                  <p className="ln-muted" style={{ fontSize: '0.75rem' }}>Información clave compartida entre asesores para no olvidar ningún detalle.</p>
                </div>

                {(() => {
                  const notas = getLeadNotas(lead);
                  if (notas.length === 0) {
                    return <p className="ln-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>No hay notas guardadas para este lead.</p>;
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {notas.map(n => (
                        <div 
                          key={n.id}
                          style={{
                            padding: '0.9rem 1.1rem',
                            background: 'rgba(15, 30, 23, 0.45)',
                            border: '1px solid var(--color-line)',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span style={{ 
                                fontSize: '0.68rem', 
                                background: 'rgba(200, 155, 92, 0.2)', 
                                color: 'var(--color-accent)', 
                                padding: '0.15rem 0.5rem', 
                                borderRadius: '4px',
                                fontWeight: '600'
                              }}>
                                {n.categoria || 'General'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                                {n.autor} · {n.fecha}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleEliminarNota(n.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-ink-muted)', cursor: 'pointer', opacity: 0.7 }}
                              title="Eliminar nota"
                            >
                              <IcoTrash/>
                            </button>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--color-ink)', lineHeight: 1.6, margin: 0 }}>
                            {n.texto}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </article>
            </div>
          )}

          {/* ── TAB: ACTIVIDADES (TOTALMENTE FUNCIONAL) ── */}
          {tab === "Actividades" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Formulario para programar nueva actividad */}
              <article className="ln-card">
                <h3 className="ln-card-title" style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IcoCal/> Programar Nueva Tarea o Actividad
                </h3>
                <form onSubmit={handleAgregarActividad} style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '160px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Tipo de tarea:</label>
                    <select 
                      value={nuevoTipoActividad} 
                      onChange={e => setNuevoTipoActividad(e.target.value)}
                      className="ln-input"
                    >
                      <option value="Llamada">📞 Llamada de seguimiento</option>
                      <option value="WhatsApp">💬 Mensaje WhatsApp</option>
                      <option value="Email">✉️ Enviar correo</option>
                      <option value="Cita">🗓️ Cita en cabina</option>
                      <option value="Tarea">📋 Tarea interna</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 2, minWidth: '220px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Descripción de la actividad:</label>
                    <input 
                      type="text" 
                      value={nuevoTituloActividad} 
                      onChange={e => setNuevoTituloActividad(e.target.value)}
                      placeholder="Ej: Confirmar horario de tratamiento y consultar si viene con acompañante" 
                      className="ln-input" 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '150px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Fecha / Plazo:</label>
                    <input 
                      type="text" 
                      value={nuevaFechaActividad} 
                      onChange={e => setNuevaFechaActividad(e.target.value)}
                      placeholder="Ej: Mañana 11:00 AM" 
                      className="ln-input" 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '110px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Prioridad:</label>
                    <select 
                      value={nuevaPrioridadActividad} 
                      onChange={e => setNuevaPrioridadActividad(e.target.value)}
                      className="ln-input"
                    >
                      <option value="Alta">🔴 Alta</option>
                      <option value="Media">🟡 Media</option>
                      <option value="Normal">🟢 Normal</option>
                    </select>
                  </div>
                  <button type="submit" className="ln-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                    + Programar Tarea
                  </button>
                </form>
              </article>

              {/* Lista de Actividades y Filtros */}
              <article className="ln-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <h3 className="ln-card-title">Agenda de Tareas y Seguimiento</h3>
                    <p className="ln-muted" style={{ fontSize: '0.75rem' }}>Control de compromisos y llamadas pendientes para asegurar la conversión.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {["Pendientes", "Completadas", "Todas"].map(f => (
                      <button 
                        key={f} 
                        className={"ln-tag" + (filtroActividad === f ? " active" : "")}
                        onClick={() => setFiltroActividad(f)}
                        style={{
                          background: filtroActividad === f ? 'var(--color-accent)' : 'rgba(243,238,226,0.06)',
                          color: filtroActividad === f ? 'var(--color-ink-on-contrast)' : 'var(--color-ink-muted)',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.72rem'
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const acts = getLeadActividades(lead).filter(a => {
                    if (filtroActividad === "Pendientes") return !a.completada;
                    if (filtroActividad === "Completadas") return a.completada;
                    return true;
                  });

                  if (acts.length === 0) {
                    return (
                      <p className="ln-muted" style={{ textAlign: 'center', padding: '2rem 0', fontSize: '0.82rem' }}>
                        No hay actividades en estado &ldquo;{filtroActividad}&rdquo;.
                      </p>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                      {acts.map(a => {
                        const prioColor = a.prioridad === 'Alta' ? '#D9AFA0' : a.prioridad === 'Media' ? '#C89B5C' : '#b7d2b9';
                        return (
                          <div 
                            key={a.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem 1rem',
                              background: a.completada ? 'rgba(15, 30, 23, 0.25)' : 'rgba(15, 30, 23, 0.5)',
                              border: '1px solid var(--color-line)',
                              borderRadius: '6px',
                              gap: '0.8rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
                              <input 
                                type="checkbox" 
                                checked={a.completada} 
                                onChange={() => handleToggleActividad(a.id)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                              />
                              <div>
                                <span style={{ 
                                  fontSize: '0.82rem', 
                                  color: a.completada ? 'var(--color-ink-muted)' : 'var(--color-ink)',
                                  textDecoration: a.completada ? 'line-through' : 'none',
                                  display: 'block'
                                }}>
                                  {a.titulo}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
                                    📅 {a.fechaProgramada}
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
                                    · Tipo: {a.tipo}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span style={{ 
                                fontSize: '0.68rem', 
                                padding: '0.15rem 0.5rem', 
                                borderRadius: '10px', 
                                background: 'rgba(0,0,0,0.2)', 
                                color: prioColor,
                                border: `1px solid ${prioColor}` 
                              }}>
                                Prioridad {a.prioridad}
                              </span>
                              <button 
                                onClick={() => handleEliminarActividad(a.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-ink-muted)', cursor: 'pointer', opacity: 0.6 }}
                                title="Eliminar tarea"
                              >
                                <IcoTrash/>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </article>
            </div>
          )}

        </main>
      </div>

      <footer className="ln-footer">
        <span>&#169; 2026 Origen Spa &amp; Bienestar</span>
        <span>Sistema de Gestión · Fase 2: LEADS</span>
      </footer>

      {toast && (
        <div 
          className="ln-toast" 
          role="status"
          style={{
            position: 'fixed',
            right: '2rem',
            bottom: '2rem',
            left: 'auto',
            zIndex: 9999,
            minWidth: '280px',
            maxWidth: '450px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            border: '1px solid var(--color-accent)'
          }}
        >
          {toast}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .ln-form-grid { display: flex; flex-direction: column; gap: 0.8rem; }
        .ln-form-group { display: grid; grid-template-columns: 140px 1fr; gap: 1rem; align-items: center; }
        .ln-form-group label { font-size: 0.75rem; color: var(--color-ink-muted); text-align: left; }
        .ln-input { width: 100%; background: rgba(15,30,23,0.5); border: 1px solid var(--color-line); color: var(--color-ink); padding: 0.4rem 0.6rem; border-radius: 4px; font-family: var(--font-body); font-size: 0.8rem; outline: none; transition: border-color 0.2s; }
        .ln-input:focus { border-color: var(--color-accent); }
        .ln-input:read-only { color: var(--color-ink-muted); cursor: default; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}