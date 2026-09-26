import { useState, useEffect } from "react";
import { obtenerLeads, calificarLead, aceptarPropuesta, actualizarLead, calificarLeadAutomatico } from "./api/leadsApi";
import { obtenerNotificacionesPendientes, marcarNotificacionLeida } from "../../lib/notificaciones";
import { enviarEmailEnriquecimiento, tieneEnriquecimientoCompletado } from "../enriquecimiento/api/enriquecimientoApi";
import { enviarEmailPropuestaConChatbot } from "../propuestas/api/propuestasApi";
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

export default function LeadsStaffPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selId, setSelId] = useState(null);
  const [tab, setTab] = useState("Perfil");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

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
          const tieneEnriquecimiento = enriquecimiento && enriquecimiento.completado;
          
          // Usar datos de enriquecimiento si están disponibles, si no usar datos básicos
          const datosPerfil = tieneEnriquecimiento ? {
            nombre: dbLead.nombre || "",
            edad: enriquecimiento.edad || "No especificado",
            telefono: dbLead.telefono || "No provisto",
            email: dbLead.email || "No provisto", 
            distrito: enriquecimiento.distrito || "No especificado"
          } : {
            nombre: dbLead.nombre || "",
            edad: "No especificado", 
            telefono: dbLead.telefono || "No provisto",
            email: dbLead.email || "No provisto", 
            distrito: "No especificado"
          };

          const datosGustos = tieneEnriquecimiento ? {
            tratamiento: nombrePlano,
            aroma: enriquecimiento.preferencia_aroma || "No especificado",
            musica: enriquecimiento.preferencia_musica || "No especificado",
            horario: enriquecimiento.disponibilidad || "No especificado",
            temperatura: "Templada",
            otras: enriquecimiento.sensibilidad_piel ? `Sensibilidad: ${enriquecimiento.sensibilidad_piel}` : "No especificado"
          } : {
            tratamiento: nombrePlano,
            aroma: "No especificado",
            musica: "No especificado",
            horario: "No especificado",
            temperatura: "Templada",
            otras: "Completa el formulario de enriquecimiento para más detalles"
          };

          const datosEstudiante = tieneEnriquecimiento ? {
            especialidad: enriquecimiento.ocupacion || "No especificado",
            nivel: "No especificado",
            universidad: "No especificado"
          } : {
            especialidad: "No especificado",
            nivel: "No especificado",
            universidad: "No especificado"
          };

          const datosLaboral = tieneEnriquecimiento ? {
            empresa: "No especificado",
            cargo: enriquecimiento.ocupacion || "No especificado",
            situacion: "No especificado"
          } : {
            empresa: "No especificado",
            cargo: "No especificado",
            situacion: "No especificado"
          };

          const datosOtros = {
            comoConocio: comoConocio,
            citaAgendada: "Pendiente de agendar",
            observaciones: tieneEnriquecimiento 
              ? `Motivo: ${enriquecimiento.motivo_principal || 'No especificado'}. Frecuencia deseada: ${enriquecimiento.frecuencia_deseada || 'No especificado'}. Presupuesto: ${enriquecimiento.presupuesto || 'No especificado'}.`
              : "Datos básicos de contacto. Envía formulario de enriquecimiento para más información.",
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
            propuesta: { 
              nombre: `Paquete ${nombrePlano}`, 
              desc: "Propuesta generada automáticamente basada en el interés.",
              tags: ["Recomendado", "Bienestar"],
              duracion: "60 min", precioRegular: "S/ 150.00", precioEspecial: "S/ 120.00", ahorro: "S/ 30.00", descuento: "20%",
              incluye: "Evaluación inicial, tratamiento y seguimiento." 
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
          { id:1, iniciales:'CR', nombre:'Camila Rodriguez', servicio:'Ritual de relajacion', score:87, temp:'Caliente', cita:'Mie 22 oct 10:00', interes:'Ritual de relajacion', frase:'Busco desestresarme tras largas semanas de trabajo.', tags:['#EstresSevero','#RitualRelax'], perfil:{nombre:'Camila Rodriguez',edad:'29 anios',telefono:'+51 912 345 678',email:'camila.r@gmail.com',distrito:'Miraflores'}, gustos:{tratamiento:'Ritual de relajacion',aroma:'Lavanda',musica:'Sonidos de naturaleza',horario:'Fines de semana 9-12',temperatura:'Calida',otras:'Prefiere sesiones sin ruido externo'}, estudiante:{especialidad:'Diseno grafico',nivel:'Universitaria egresada',universidad:'Toulouse Lautrec'}, laboral:{empresa:'Freelance',cargo:'Disenadora Senior',situacion:'Independiente'}, otros:{comoConocio:'Instagram Ads',citaAgendada:'Mie 22 oct 10:00',observaciones:'Muy motivada, ya fue en otra oportunidad a un spa.',fechaRegistro:'15/09/2026',enriquecimientoCompletado:true,fechaEnriquecimiento:'16/09/2026'}, propuesta:{nombre:'Paquete Ritual Relax Premium',desc:'Sesion completa de relajacion profunda con aromaterapia y musica personalizada.',tags:['Recomendado','Bienestar'],duracion:'90 min',precioRegular:'S/ 180.00',precioEspecial:'S/ 144.00',ahorro:'S/ 36.00',descuento:'20%',incluye:'Aromaterapia, masaje relajante, barro volcanico y te de hierbas.'}, porQue:['Historial de estres alto y ritmo laboral intenso.','Responde muy bien a la aromaterapia de lavanda.','Alta disponibilidad de pago y fidelidad potencial.'], notas:'Lead caliente. Muy receptiva al ritual premium.' },
          { id:2, iniciales:'VP', nombre:'Valeria Paredes', servicio:'Masaje descontracturante', score:74, temp:'Caliente', cita:'Jue 23 oct 15:00', interes:'Masaje descontracturante', frase:'Tengo contracturas por trabajar en computadora todo el dia.', tags:['#DoloresCronicos','#MasajeDeep'], perfil:{nombre:'Valeria Paredes',edad:'34 anios',telefono:'+51 923 456 789',email:'v.paredes@empresa.pe',distrito:'San Isidro'}, gustos:{tratamiento:'Masaje descontracturante',aroma:'Eucalipto',musica:'Clasica instrumental',horario:'Tardes entre semana',temperatura:'Calida intensa',otras:'Zona lumbar y cervical como prioridad'}, estudiante:{especialidad:'Administracion',nivel:'Postgrado',universidad:'ESAN'}, laboral:{empresa:'BCP',cargo:'Gerente de proyectos',situacion:'Ejecutiva'}, otros:{comoConocio:'Google Ads',citaAgendada:'Jue 23 oct 15:00',observaciones:'Interesada en plan mensual.',fechaRegistro:'14/09/2026',enriquecimientoCompletado:true,fechaEnriquecimiento:'15/09/2026'}, propuesta:{nombre:'Plan Mensual Anti-Contracturas',desc:'4 sesiones mensuales de masaje descontracturante con enfoque en zona lumbar y cervical.',tags:['Plan Mensual','Mas Vendido'],duracion:'60 min c/u',precioRegular:'S/ 560.00',precioEspecial:'S/ 420.00',ahorro:'S/ 140.00',descuento:'25%',incluye:'4 masajes, aceite de eucalipto premium y seguimiento de evolucion.'}, porQue:['Dolor cronico documentado con alta recurrencia.','Perfil ejecutivo con presupuesto disponible.','Interes explicito en plan mensual.'], notas:'Candidata ideal para membresia mensual.' },
          { id:3, iniciales:'LP', nombre:'Luciana Pacheco', servicio:'Facial anti-edad', score:62, temp:'Tibio', cita:'Vie 24 oct 11:00', interes:'Facial anti-edad', frase:'Quiero empezar a cuidar mi piel antes de que sea tarde.', tags:['#PrevencionPiel','#FacialPremium'], perfil:{nombre:'Luciana Pacheco',edad:'41 anios',telefono:'+51 934 567 890',email:'lupacheco@hotmail.com',distrito:'La Molina'}, gustos:{tratamiento:'Facial anti-edad',aroma:'Rosa y jazmin',musica:'Meditacion guiada',horario:'Mananas de viernes',temperatura:'Neutra',otras:'Piel sensible, sin fragancias fuertes'}, estudiante:{especialidad:'Dermatologia estetica',nivel:'Interesada',universidad:'UPCH referida'}, laboral:{empresa:'Ama de casa',cargo:'Gestora del hogar',situacion:'Independiente'}, otros:{comoConocio:'Recomendacion amiga',citaAgendada:'Vie 24 oct 11:00',observaciones:'Le preocupa el costo, pero esta interesada.',fechaRegistro:'13/09/2026',enriquecimientoCompletado:false,fechaEnriquecimiento:null}, propuesta:{nombre:'Ritual Facial Anti-Edad Express',desc:'Tratamiento facial con acido hialuronico y colageno marino.',tags:['Anti-edad','Piel Sensible'],duracion:'75 min',precioRegular:'S/ 200.00',precioEspecial:'S/ 160.00',ahorro:'S/ 40.00',descuento:'20%',incluye:'Limpieza profunda, serum anti-edad, mascarilla y protector solar.'}, porQue:['Interes preventivo temprano.','Piel sensible requiere productos premium.','Referida por clienta activa.'], notas:'Necesita ver resultados rapidos. Sugerir sesion de prueba.' },
          { id:4, iniciales:'AM', nombre:'Andrea Munoz', servicio:'Envoltura corporal', score:45, temp:'Tibio', cita:'Pendiente', interes:'Envoltura corporal', frase:'Quiero verme bien para una reunion importante el proximo mes.', tags:['#EventoProximo','#BodiesculptBody'], perfil:{nombre:'Andrea Munoz',edad:'27 anios',telefono:'+51 945 678 901',email:'andreamunoz@outlook.com',distrito:'Surco'}, gustos:{tratamiento:'Envoltura corporal',aroma:'Citricos',musica:'Pop suave',horario:'Fines de semana',temperatura:'Calida',otras:'Primera vez en spa'}, estudiante:{especialidad:'Marketing digital',nivel:'Egresada',universidad:'UPC'}, laboral:{empresa:'Agencia digital',cargo:'Community Manager',situacion:'Junior'}, otros:{comoConocio:'TikTok Ads',citaAgendada:'Pendiente',observaciones:'Motivacion puntual para evento.',fechaRegistro:'16/09/2026',enriquecimientoCompletado:false,fechaEnriquecimiento:null}, propuesta:{nombre:'Paquete Evento Especial',desc:'Envoltura corporal + exfoliacion + ritual express para ocasion especial.',tags:['Evento','Primera Visita'],duracion:'90 min',precioRegular:'S/ 160.00',precioEspecial:'S/ 120.00',ahorro:'S/ 40.00',descuento:'25%',incluye:'Envoltura, exfoliacion natural, masaje express y kit de bienvenida.'}, porQue:['Motivacion clara de corto plazo.','TikTok Ads indica perfil de decision impulsiva.','Potencial de convertir en cliente recurrente.'], notas:'Agendar antes del evento. Mostrar fotos de resultados.' },
          { id:5, iniciales:'DS', nombre:'Diana Salcedo', servicio:'Reflexologia', score:38, temp:'Frio', cita:'Pendiente', interes:'Reflexologia', frase:'Me lo recomendo mi medico para el estres cronico.', tags:['#IndicesMedicos','#Reflexologia'], perfil:{nombre:'Diana Salcedo',edad:'52 anios',telefono:'+51 956 789 012',email:'dianasalcedo@yahoo.com',distrito:'Pueblo Libre'}, gustos:{tratamiento:'Reflexologia',aroma:'Sin preferencia',musica:'Silencio',horario:'Mananas entre semana',temperatura:'Neutra',otras:'Referida por medico internista'}, estudiante:{especialidad:'Enfermeria',nivel:'Tecnica',universidad:'CENFOTUR'}, laboral:{empresa:'Clinica San Pablo',cargo:'Tecnica enfermeria',situacion:'Dependiente'}, otros:{comoConocio:'Referencia medica',citaAgendada:'Pendiente',observaciones:'Necesita explicacion detallada del procedimiento.',fechaRegistro:'12/09/2026',enriquecimientoCompletado:false,fechaEnriquecimiento:null}, propuesta:{nombre:'Sesion Reflexologia Terapeutica',desc:'Sesion de reflexologia plantar y corporal con enfoque en puntos de estres.',tags:['Terapeutico','Medico Referido'],duracion:'60 min',precioRegular:'S/ 120.00',precioEspecial:'S/ 96.00',ahorro:'S/ 24.00',descuento:'20%',incluye:'Evaluacion inicial, reflexologia completa y recomendaciones.'}, porQue:['Referencia medica aumenta credibilidad.','Perfil de salud sensible al discurso terapeutico.','Score bajo por falta de contacto previo.'], notas:'Llamar para explicar el procedimiento antes de agendar.' },
          { id:6, iniciales:'MG', nombre:'Maria Gonzales', servicio:'Masaje de piedras calientes', score:91, temp:'Caliente', cita:'Mar 21 oct 09:00', interes:'Masaje de piedras calientes', frase:'Soy clienta frecuente, quiero probar algo nuevo este mes.', tags:['#ClienteFiel','#UpsellPremium'], perfil:{nombre:'Maria Gonzales',edad:'38 anios',telefono:'+51 967 890 123',email:'mariagonza@gmail.com',distrito:'Barranco'}, gustos:{tratamiento:'Masaje de piedras calientes',aroma:'Sandalo y vetiver',musica:'Jazz suave',horario:'Martes o jueves manana',temperatura:'Muy calida',otras:'Sin restricciones, ha probado varios tratamientos'}, estudiante:{especialidad:'Psicologia',nivel:'Licenciada',universidad:'PUCP'}, laboral:{empresa:'Consultora independiente',cargo:'Psicologa organizacional',situacion:'Independiente'}, otros:{comoConocio:'Clienta recurrente',citaAgendada:'Mar 21 oct 09:00',observaciones:'5 visitas anteriores. Candidata a membresia premium.',fechaRegistro:'10/09/2026',enriquecimientoCompletado:true,fechaEnriquecimiento:'11/09/2026'}, propuesta:{nombre:'Experiencia Premium Piedras Calientes',desc:'Ritual completo con piedras volcanicas, aceites esenciales premium y musica personalizada.',tags:['Premium','Clienta VIP'],duracion:'100 min',precioRegular:'S/ 240.00',precioEspecial:'S/ 192.00',ahorro:'S/ 48.00',descuento:'20%',incluye:'Masaje con piedras volcanicas, aromaterapia premium y reflexologia express.'}, porQue:['Score 91 — la clienta mas valiosa del pipeline.','5 visitas previas — NPS estimado muy alto.','Perfecta para membresia anual VIP.'], notas:'Ofrecer membresia VIP anual. Muy alta probabilidad de cierre.' },
          { id:7, iniciales:'PP', nombre:'Patricia Perez', servicio:'Aromaterapia', score:55, temp:'Tibio', cita:'Sab 26 oct 14:00', interes:'Aromaterapia', frase:'Vi el anuncio en Instagram y me parecio muy bonito el lugar.', tags:['#VisualBrand','#InstagramLead'], perfil:{nombre:'Patricia Perez',edad:'31 anios',telefono:'+51 978 901 234',email:'pperez.lifestyle@gmail.com',distrito:'Magdalena'}, gustos:{tratamiento:'Aromaterapia',aroma:'Todos - le encanta experimentar',musica:'Playlist relajante de Spotify',horario:'Fines de semana tarde',temperatura:'Cualquiera',otras:'Muy activa en redes sociales'}, estudiante:{especialidad:'Comunicaciones',nivel:'Egresada',universidad:'USIL'}, laboral:{empresa:'Empresa de moda',cargo:'PR Influencer Relations',situacion:'Dependiente'}, otros:{comoConocio:'Instagram Ads',citaAgendada:'Sab 26 oct 14:00',observaciones:'Micro-influencer (8k seguidores). Alto valor de referidos potenciales.',fechaRegistro:'17/09/2026',enriquecimientoCompletado:true,fechaEnriquecimiento:'17/09/2026'}, propuesta:{nombre:'Experiencia Aromaterapia Instagrameable',desc:'Sesion sensorial de aromaterapia con setup visual premium para redes sociales.',tags:['Instagrameable','Social Media'],duracion:'75 min',precioRegular:'S/ 150.00',precioEspecial:'S/ 105.00',ahorro:'S/ 45.00',descuento:'30%',incluye:'Aromaterapia completa, setup fotografico y kit de aceites esenciales.'}, porQue:['Micro-influencer con 8k seguidores — marketing organico.','Decision por imagen.','30% de descuento a cambio de contenido en RRSS.'], notas:'Coordinar sesion fotografica. Pedir permiso para usar contenido.' },
          { id:8, iniciales:'CF', nombre:'Carolina Flores', servicio:'Exfoliacion corporal', score:29, temp:'Frio', cita:'Pendiente', interes:'Exfoliacion corporal', frase:'Busque spas en Google y aparecieron ustedes.', tags:['#SearchLead','#TopFunnel'], perfil:{nombre:'Carolina Flores',edad:'24 anios',telefono:'+51 989 012 345',email:'carol.flores24@gmail.com',distrito:'Los Olivos'}, gustos:{tratamiento:'Exfoliacion corporal',aroma:'Sin preferencia definida',musica:'Sin preferencia',horario:'Flexible',temperatura:'No sabe',otras:'Primera vez considerando un spa'}, estudiante:{especialidad:'Contabilidad',nivel:'Estudiante universitaria',universidad:'UNMSM'}, laboral:{empresa:'Tienda retail',cargo:'Cajera part-time',situacion:'Estudiante-trabajadora'}, otros:{comoConocio:'Google Search',citaAgendada:'Pendiente',observaciones:'Budget limitado. Necesita nurturing y demostracion de valor.',fechaRegistro:'18/09/2026',enriquecimientoCompletado:false,fechaEnriquecimiento:null}, propuesta:{nombre:'Starter Pack Exfoliacion',desc:'Sesion introductoria de exfoliacion corporal — el primer paso hacia el bienestar.',tags:['Introductorio','Precio Accesible'],duracion:'45 min',precioRegular:'S/ 90.00',precioEspecial:'S/ 63.00',ahorro:'S/ 27.00',descuento:'30%',incluye:'Exfoliacion natural, hidratacion post-exfoliacion y cupon de 15% para segunda visita.'}, porQue:['Google Search indica intencion activa de busqueda.','Score bajo por desconocimiento — no por falta de interes.','Precio de entrada bajo — ideal para convertir y fidelizar.'], notas:'Enviar informacion del lugar con fotos. Cupon de descuento en primer mensaje.' }
        ];

        const finalLeads = leadsMapeados.length > 0 ? leadsMapeados : MOCK_LEADS;
        setLeads(finalLeads);
        if (finalLeads.length > 0) setSelId(finalLeads[0].id);
      } catch (err) {
        console.error('[Leads] Sin conexion a BD, usando datos demo:', err);
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
        console.error('[Leads] Error cargando notificaciones:', error);
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
      console.error('[Leads] Error marcando notificación como leída:', error);
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
        tipoPiel: 'no_se', // No tenemos este dato directo
        fecha_registro: lead.otros?.fechaRegistro
      };
      
      const result = await calificarLeadAutomatico(lead.id, datosContacto);
      
      if (result.success) {
        const newScore = result.data?.score || 50;
        setLeads(prev => prev.map(l => 
          l.id === lead.id ? { ...l, score: newScore, temp: calcularTemperatura(newScore) } : l
        ));
        show(`✅ Lead Score calculado automáticamente: ${newScore}/100`);
      } else {
        show(result.error?.message || "Error en calificación automática");
      }
    } catch (err) {
      logger.error('LeadsStaffPage', 'Error en calificación automática', { err });
      show("Error en calificación automática");
    }
  };

  const handleAcceptProposal = async () => {
    if (!lead) return;
    
    try {
      const datosPropuesta = {
        nombre: lead.propuesta.nombre,
        precio: lead.propuesta.precioEspecial,
        duracion: lead.propuesta.duracion,
        incluye: lead.propuesta.incluye,
        descuento: lead.propuesta.descuento
      };
      
      const result = await aceptarPropuesta(lead.id, datosPropuesta);
      
      if (result.success) {
        // Actualizar el estado local del lead
        setLeads(prev => prev.map(l => 
          l.id === lead.id ? { 
            ...l, 
            propuesta: { 
              ...l.propuesta, 
              aceptada: true,
              fecha_aceptacion: new Date().toISOString()
            }
          } : l
        ));
        
        show("✅ Propuesta aceptada. El lead ahora está listo para Fase 3 (PAYERS)");
      } else {
        show(result.error?.message || "Error al aceptar propuesta");
      }
    } catch (err) {
      logger.error('LeadsStaffPage', 'Error aceptando propuesta', { err });
      show("Error al aceptar propuesta. Verifica la conexión a Supabase.");
    }
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

      // Preparar datos de la propuesta inicial
      const datosPropuesta = {
        servicio: lead.interes || 'Servicio general',
        precio: lead.propuesta?.precioEspecial || 120,
        precioRegular: lead.propuesta?.precioRegular || 150,
        duracion: lead.propuesta?.duracion || '60 min',
        descuento: lead.propuesta?.descuento || '0%',
        incluye: lead.propuesta?.incluye || 'Evaluación inicial, tratamiento y seguimiento'
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
              <div className="ln-grid-2">
                
                {/* Datos Personales */}
                <article className="ln-card">
                  <h3 className="ln-card-title" style={{marginBottom: '1rem'}}>Datos Personales</h3>
                  <div className="ln-form-grid">
                    <div className="ln-form-group">
                      <label>Nombre completo:</label>
                      <input type="text" value={lead.perfil.nombre || ""} onChange={e => handleFieldChange('perfil', 'nombre', e.target.value)} className="ln-input" />
                    </div>
                    <div className="ln-form-group">
                      <label>Edad:</label>
                      <input type="text" value={lead.perfil.edad || ""} onChange={e => handleFieldChange('perfil', 'edad', e.target.value)} className="ln-input" />
                    </div>
                    <div className="ln-form-group">
                      <label>Teléfono:</label>
                      <input type="text" value={lead.perfil.telefono || ""} onChange={e => handleFieldChange('perfil', 'telefono', e.target.value)} className="ln-input" />
                    </div>
                    <div className="ln-form-group">
                      <label>Correo electrónico:</label>
                      <input type="email" value={lead.perfil.email || ""} onChange={e => handleFieldChange('perfil', 'email', e.target.value)} className="ln-input" />
                    </div>
                    <div className="ln-form-group">
                      <label>Distrito:</label>
                      <input type="text" value={lead.perfil.distrito || ""} onChange={e => handleFieldChange('perfil', 'distrito', e.target.value)} className="ln-input" />
                    </div>
                  </div>
                </article>

                {/* Gustos y Preferencias */}
                <article className="ln-card">
                  <h3 className="ln-card-title" style={{marginBottom: '1rem'}}>Gustos y Preferencias</h3>
                  <div className="ln-form-grid">
                    <div className="ln-form-group">
                      <label>Tratamiento de interés:</label>
                      <select value={lead.gustos.tratamiento || ""} onChange={e => handleFieldChange('gustos', 'tratamiento', e.target.value)} className="ln-input">
                        <option value={lead.gustos.tratamiento}>{lead.gustos.tratamiento}</option>
                        <option value="Tratamiento corporal">Tratamiento corporal</option>
                        <option value="Masajes relajantes">Masajes relajantes</option>
                      </select>
                    </div>
                    <div className="ln-form-group">
                      <label>Aroma preferido:</label>
                      <select value={lead.gustos.aroma || ""} onChange={e => handleFieldChange('gustos', 'aroma', e.target.value)} className="ln-input">
                        <option value="Lavanda">Lavanda</option>
                        <option value="Cítrico">Cítrico</option>
                        <option value="Eucalipto">Eucalipto</option>
                        <option value="Vainilla">Vainilla</option>
                      </select>
                    </div>
                    <div className="ln-form-group">
                      <label>Música preferida:</label>
                      <select value={lead.gustos.musica || ""} onChange={e => handleFieldChange('gustos', 'musica', e.target.value)} className="ln-input">
                        <option value="Música relajante">Música relajante</option>
                        <option value="Sonidos de la naturaleza">Sonidos de la naturaleza</option>
                        <option value="Piano instrumental">Piano instrumental</option>
                      </select>
                    </div>
                    <div className="ln-form-group">
                      <label>Horario preferido:</label>
                      <select value={lead.gustos.horario || ""} onChange={e => handleFieldChange('gustos', 'horario', e.target.value)} className="ln-input">
                        <option value="Sábados, tarde">Sábados, tarde</option>
                        <option value="Lunes a Viernes, mañana">Lunes a Viernes, mañana</option>
                        <option value="Lunes a Viernes, noche">Lunes a Viernes, noche</option>
                      </select>
                    </div>
                    <div className="ln-form-group">
                      <label>Temperatura del agua:</label>
                      <select value={lead.gustos.temperatura || ""} onChange={e => handleFieldChange('gustos', 'temperatura', e.target.value)} className="ln-input">
                        <option value="Templada">Templada</option>
                        <option value="Caliente">Caliente</option>
                        <option value="Fría">Fría</option>
                      </select>
                    </div>
                    <div className="ln-form-group" style={{alignItems: 'flex-start'}}>
                      <label style={{marginTop: '0.4rem'}}>Otras preferencias:</label>
                      <textarea value={lead.gustos.otras || ""} onChange={e => handleFieldChange('gustos', 'otras', e.target.value)} className="ln-input" style={{height: '60px', resize: 'none'}} />
                    </div>
                  </div>
                </article>

                {/* Datos del Estudiante */}
                <article className="ln-card">
                  <h3 className="ln-card-title" style={{marginBottom: '1rem'}}>Datos del Estudiante</h3>
                  <div className="ln-form-grid">
                    <div className="ln-form-group">
                      <label>Especialidad:</label>
                      <select value={lead.estudiante.especialidad || ""} onChange={e => handleFieldChange('estudiante', 'especialidad', e.target.value)} className="ln-input">
                        <option value="Administración">Administración</option>
                        <option value="Ingeniería">Ingeniería</option>
                        <option value="Medicina">Medicina</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div className="ln-form-group">
                      <label>Nivel:</label>
                      <select value={lead.estudiante.nivel || ""} onChange={e => handleFieldChange('estudiante', 'nivel', e.target.value)} className="ln-input">
                        <option value="8vo ciclo">8vo ciclo</option>
                        <option value="Egresado">Egresado</option>
                      </select>
                    </div>
                    <div className="ln-form-group">
                      <label>Universidad:</label>
                      <select value={lead.estudiante.universidad || ""} onChange={e => handleFieldChange('estudiante', 'universidad', e.target.value)} className="ln-input">
                        <option value="UPN">UPN</option>
                        <option value="UCV">UCV</option>
                        <option value="UNT">UNT</option>
                      </select>
                    </div>
                  </div>
                </article>

                {/* Datos Laborales */}
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
                      <select value={lead.laboral.situacion || ""} onChange={e => handleFieldChange('laboral', 'situacion', e.target.value)} className="ln-input">
                        <option value="Actualmente trabajando">Actualmente trabajando</option>
                        <option value="Desempleado">Desempleado</option>
                        <option value="Independiente">Independiente</option>
                      </select>
                    </div>
                  </div>
                </article>

                {/* Otros Datos */}
                <article className="ln-card ln-span2">
                  <h3 className="ln-card-title" style={{marginBottom: '1rem'}}>Otros Datos</h3>
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
                          <input type="text" value={lead.otros.citaAgendada || ""} onChange={e => handleFieldChange('otros', 'citaAgendada', e.target.value)} className="ln-input" />
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
                  <button className="ln-btn-ghost" onClick={() => show("Creando nuevo lead...")}>+ Nuevo Lead</button>
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
                      <IcoCheck/> Perfil Completado
                    </div>
                  )}
                  {lead.otros.enriquecimientoCompletado && (
                    <button 
                      className="ln-btn-ghost" 
                      onClick={handleEnviarPropuestaChatbot}
                      style={{ background: 'rgba(183, 210, 185, 0.1)', color: '#b7d2b9', border: '1px solid rgba(183, 210, 185, 0.3)' }}
                    >
                      <IcoEmail/> Enviar Propuesta con Chatbot
                    </button>
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
                    <button className="ln-btn-ghost" onClick={() => show("Generando nueva propuesta...")}>Generar otra propuesta</button>
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

                  <div className="ln-prop-footer">
                    <div className="ln-info-block">
                      <IcoCal/>
                      <div>
                        <strong>Fecha y horario sugerido</strong>
                        <p>{lead.cita}</p>
                        <button className="ln-link-btn" onClick={() => show("Cambiando fecha...")}>Cambiar</button>
                      </div>
                    </div>
                    <div className="ln-info-block">
                      <IcoHome/>
                      <div>
                        <strong>Experiencia en Origen Spa</strong>
                        <p>&#10003; Ambientes tranquilos y privados</p>
                        <p>&#10003; Terapeutas certificadas</p>
                        <p>&#10003; Música relajante</p>
                      </div>
                    </div>
                  </div>

                  <div className="ln-cta-row">
                    <button 
                      className="ln-btn-primary" 
                      onClick={handleAcceptProposal}
                      disabled={lead.propuesta?.aceptada}
                      style={lead.propuesta?.aceptada ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    >
                      <IcoCal/> {lead.propuesta?.aceptada ? '✓ Propuesta Aceptada' : 'Aceptar Propuesta'}
                    </button>
                    <button className="ln-btn-wa" onClick={() => show("Propuesta enviada por WhatsApp")}><IcoWA/> WhatsApp</button>
                  </div>
                  {toast && <div className="ln-toast" role="status">{toast}</div>}
                </article>
              </div>

              {/* Derecha */}
              <div className="ln-propuesta-right">
                <article className="ln-card">
                  <h3 className="ln-card-title" style={{marginBottom:"0.7rem"}}>¿Por qué es ideal para {fn}?</h3>
                  <ul className="ln-porque">
                    {lead.porQue.map((r,i) => (
                      <li key={i}><IcoCheck/><span>{r}</span></li>
                    ))}
                  </ul>
                </article>

                <article className="ln-card" style={{marginTop:"0.7rem"}}>
                  <h3 className="ln-card-title" style={{marginBottom:"0.55rem"}}>&#129302; Agente IA</h3>
                  <p style={{fontSize:"0.72rem",color:"var(--color-ink-muted)",lineHeight:1.55}}>
                    Se recomienda enviar la propuesta por WhatsApp y hacer seguimiento en 24 horas.
                  </p>
                  <button className="ln-btn-primary" style={{marginTop:"0.75rem",width:"100%",fontSize:"0.72rem",justifyContent:"center"}}
                    onClick={() => show("Seguimiento automatizado activado")}>
                    <IcoSend/> Automatizar
                  </button>
                </article>
              </div>
            </div>
          )}

          {/* ── TAB: HISTORIAL ── */}
          {tab === "Historial" && (
            <article className="ln-card">
              <h3 className="ln-card-title">Historial de interacciones</h3>
              <p className="ln-muted" style={{marginTop:"0.75rem"}}>Sin interacciones registradas. Llamadas, mensajes y visitas aparecerán aquí.</p>
            </article>
          )}

          {/* ── TAB: NOTAS ── */}
          {tab === "Notas" && (
            <article className="ln-card">
              <h3 className="ln-card-title">Notas del agente</h3>
              <p className="ln-muted" style={{marginTop:"0.6rem",lineHeight:1.6}}>{lead.notas}</p>
              <textarea className="ln-textarea" placeholder="Agregar nueva nota..."
                value={note} onChange={e => setNote(e.target.value)}/>
              <button className="ln-btn-ghost" style={{marginTop:"0.6rem"}} onClick={() => { show("Nota guardada"); setNote(""); }}>
                Guardar nota
              </button>
            </article>
          )}

          {/* ── TAB: ACTIVIDADES ── */}
          {tab === "Actividades" && (
            <article className="ln-card">
              <h3 className="ln-card-title">Actividades programadas</h3>
              <p className="ln-muted" style={{marginTop:"0.75rem"}}>
                No hay actividades. Usa &ldquo;Automatizar seguimiento&rdquo; para crear una.
              </p>
            </article>
          )}

        </main>
      </div>

      <footer className="ln-footer">
        <span>&#169; 2026 Origen Spa &amp; Bienestar</span>
        <span>Sistema de Gestión · Fase 2: LEADS</span>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .ln-form-grid { display: flex; flex-direction: column; gap: 0.8rem; }
        .ln-form-group { display: grid; grid-template-columns: 140px 1fr; gap: 1rem; align-items: center; }
        .ln-form-group label { font-size: 0.75rem; color: var(--color-ink-muted); text-align: left; }
        .ln-input { width: 100%; background: rgba(15,30,23,0.5); border: 1px solid var(--color-line); color: var(--color-ink); padding: 0.4rem 0.6rem; border-radius: 4px; font-family: var(--font-body); font-size: 0.8rem; outline: none; transition: border-color 0.2s; }
        .ln-input:focus { border-color: var(--color-accent); }
        .ln-input:read-only { color: var(--color-ink-muted); cursor: default; }
      `}} />
    </div>
  );
}