/**
 * Servicio de generación de comprobantes PDF
 * Genera boletas/facturas profesionales en formato PDF
 */

import { logger } from './logger'

/**
 * Genera un comprobante PDF para un pago
 * @param {object} datosComprobante - Datos del comprobante
 * @returns {Promise<Blob>} Blob del PDF generado
 */
export async function generarComprobantePDF(datosComprobante) {
  try {
    // Crear contenido HTML del comprobante
    const htmlContent = generarHTMLComprobante(datosComprobante)
    
    // En un entorno real, aquí usaríamos una librería como jsPDF o html2pdf
    // Por ahora, generaremos un PDF simple usando la API del navegador
    
    logger.info('pdfService', 'Generando comprobante PDF', { 
      numero: datosComprobante.numero_comprobante 
    })
    
    // Simulación de generación de PDF
    // En producción, usaríamos: import { jsPDF } from 'jspdf'
    const pdfBlob = await generarPDFDesdeHTML(htmlContent)
    
    return pdfBlob
  } catch (error) {
    logger.error('pdfService', 'Error generando comprobante PDF', { error })
    throw new Error('Error al generar comprobante PDF')
  }
}

/**
 * Genera el HTML del comprobante
 */
function generarHTMLComprobante(datos) {
  const fecha = new Date(datos.fecha_completado).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const montoFormateado = `S/ ${datos.monto_total.toFixed(2)}`
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Comprobante - Origen Spa & Bienestar</title>
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .comprobante {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #C89B5C;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #16231C;
      margin: 0;
      font-size: 24px;
    }
    .header p {
      color: #666;
      margin: 5px 0 0 0;
      font-size: 14px;
    }
    .tipo-comprobante {
      background: #C89B5C;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: bold;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 20px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .info-section h3 {
      color: #16231C;
      margin: 0 0 15px 0;
      font-size: 16px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 14px;
    }
    .info-row label {
      color: #666;
      font-weight: 500;
    }
    .info-row span {
      color: #16231C;
      font-weight: 600;
    }
    .tabla-pago {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .tabla-pago th {
      background: #16231C;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 14px;
    }
    .tabla-pago td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }
    .tabla-pago .total {
      background: #f9f9f9;
      font-weight: bold;
      font-size: 16px;
      color: #C89B5C;
    }
    .metodo-pago {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #888;
    }
    .sello {
      border: 2px solid #C89B5C;
      border-radius: 50%;
      width: 100px;
      height: 100px;
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 10px;
      color: #C89B5C;
      transform: rotate(-15deg);
    }
  </style>
</head>
<body>
  <div class="comprobante">
    <div class="header">
      <h1>ORIGEN SPA & BIENESTAR</h1>
      <p>Belleza · Equilibrio · Tu mejor versión</p>
      <p>Trujillo, La Libertad | +51 987 654 321</p>
    </div>
    
    <div class="tipo-comprobante">
      ${datos.tipo_comprobante.toUpperCase()} ELECTRÓNICA
    </div>
    
    <div class="info-grid">
      <div class="info-section">
        <h3>Información del Comprobante</h3>
        <div class="info-row">
          <label>Número:</label>
          <span>${datos.numero_comprobante}</span>
        </div>
        <div class="info-row">
          <label>Fecha de emisión:</label>
          <span>${fecha}</span>
        </div>
        <div class="info-row">
          <label>Estado:</label>
          <span>PAGADO</span>
        </div>
      </div>
      
      <div class="info-section">
        <h3>Información del Cliente</h3>
        <div class="info-row">
          <label>Nombre:</label>
          <span>${datos.contacto.nombre}</span>
        </div>
        <div class="info-row">
          <label>Email:</label>
          <span>${datos.contacto.email}</span>
        </div>
        <div class="info-row">
          <label>Teléfono:</label>
          <span>${datos.contacto.telefono || 'No registrado'}</span>
        </div>
      </div>
    </div>
    
    <h3>Detalle del Pago</h3>
    <table class="tabla-pago">
      <thead>
        <tr>
          <th>Descripción</th>
          <th style="text-align: right;">Monto</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${datos.servicio_contratado}</td>
          <td style="text-align: right;">${montoFormateado}</td>
        </tr>
        <tr class="total">
          <td>TOTAL PAGADO</td>
          <td style="text-align: right;">${montoFormateado}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="metodo-pago">
      <strong>Método de pago:</strong> ${datos.metodo_pago_elegido.toUpperCase()}
    </div>
    
    <div class="sello">
      PAGADO<br/>
      ${fecha}
    </div>
    
    <div class="footer">
      <p>Este comprobante acredita el pago realizado por el servicio especificado.</p>
      <p>Para cualquier consulta, contáctenos al +51 987 654 321</p>
      <p>© 2026 Origen Spa & Bienestar. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Genera PDF desde HTML (simulación)
 * En producción, usaríamos html2pdf.js o jsPDF
 */
async function generarPDFDesdeHTML(htmlContent) {
  // Simulación: crear un archivo de texto con el HTML
  // En producción, aquí usaríamos una librería real de PDF
  const content = htmlContent
  
  const blob = new Blob([content], { type: 'text/html' })
  return blob
}

/**
 * Descarga el comprobante PDF
 */
export function descargarComprobantePDF(datosComprobante, nombreArchivo = 'comprobante') {
  generarComprobantePDF(datosComprobante)
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${nombreArchivo}.html` // En producción: .pdf
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      logger.info('pdfService', 'Comprobante descargado', { nombreArchivo })
    })
    .catch(error => {
      logger.error('pdfService', 'Error descargando comprobante', { error })
      alert('Error al descargar el comprobante')
    })
}

/**
 * Genera nombre de archivo para el comprobante
 */
export function generarNombreComprobante(datosComprobante) {
  const tipo = datosComprobante.tipo_comprobante || 'boleta'
  const numero = datosComprobante.numero_comprobante || '000000'
  const fecha = new Date(datosComprobante.fecha_completado)
    .toISOString()
    .split('T')[0]
    .replace(/-/g, '')
  
  return `${tipo}_${numero}_${fecha}`
}

export default {
  generarComprobantePDF,
  descargarComprobantePDF,
  generarNombreComprobante
}