/**
 * Sistema de pruebas básico
 * Proporciona funciones para testear validadores y utilidades
 */

import { 
  validateEmail, 
  validatePhone, 
  validateName, 
  validateAmount, 
  validateLeadScore,
  validateSatisfaction,
  validateDate 
} from './validators'
import { 
  validateContacto, 
  validateLeadDetalle, 
  validatePagoDetalle 
} from './types'

/**
 * Resultado de una prueba
 */
class TestResult {
  constructor(nombre, exito, mensaje = '', detalles = null) {
    this.nombre = nombre
    this.exito = exito
    this.mensaje = mensaje
    this.detalles = detalles
    this.timestamp = new Date().toISOString()
  }
}

/**
 * Suite de pruebas
 */
class TestSuite {
  constructor(nombre) {
    this.nombre = nombre
    this.pruebas = []
  }
  
  agregarPrueba(result) {
    this.pruebas.push(result)
  }
  
  obtenerResultados() {
    const exitosas = this.pruebas.filter(p => p.exito).length
    const fallidas = this.pruebas.filter(p => !p.exito).length
    
    return {
      suite: this.nombre,
      total: this.pruebas.length,
      exitosas,
      fallidas,
      tasaExito: this.pruebas.length > 0 ? (exitosas / this.pruebas.length) * 100 : 0,
      pruebas: this.pruebas
    }
  }
}

/**
 * Ejecuta una prueba individual
 */
function ejecutarPrueba(nombre, funcionPrueba) {
  try {
    funcionPrueba()
    return new TestResult(nombre, true, 'Prueba exitosa')
  } catch (error) {
    return new TestResult(nombre, false, error.message, error)
  }
}

/**
 * Verifica que una condición sea verdadera
 */
function assert(condicion, mensaje = 'Assert falló') {
  if (!condicion) {
    throw new Error(mensaje)
  }
}

/**
 * Verifica que dos valores sean iguales
 */
function assertEquals(actual, esperado, mensaje) {
  if (actual !== esperado) {
    throw new Error(mensaje || `Se esperaba ${esperado}, pero se obtuvo ${actual}`)
  }
}

/**
 * Verifica que una función lance un error
 */
function assertThrows(funcion, mensajeEsperado = null) {
  try {
    funcion()
    throw new Error('Se esperaba que la función lanzara un error')
  } catch (error) {
    if (mensajeEsperado && !error.message.includes(mensajeEsperado)) {
      throw new Error(`Se esperaba error con "${mensajeEsperado}", pero se obtuvo "${error.message}"`)
    }
  }
}

/**
 * Suite de pruebas para validadores
 */
export function probarValidadores() {
  const suite = new TestSuite('Validadores')
  
  // Pruebas de email
  suite.agregarPrueba(ejecutarPrueba('Email válido', () => {
    const result = validateEmail('test@example.com')
    assert(result.valid, 'Email válido debería pasar validación')
  }))
  
  suite.agregarPrueba(ejecutarPrueba('Email inválido', () => {
    const result = validateEmail('invalid-email')
    assert(!result.valid, 'Email inválido debería fallar validación')
  }))
  
  // Pruebas de teléfono
  suite.agregarPrueba(ejecutarPrueba('Teléfono válido Perú', () => {
    const result = validatePhone('+51 987 654 321')
    assert(result.valid, 'Teléfono válido debería pasar validación')
  }))
  
  suite.agregarPrueba(ejecutarPrueba('Teléfono inválido', () => {
    const result = validatePhone('123')
    assert(!result.valid, 'Teléfono inválido debería fallar validación')
  }))
  
  // Pruebas de nombre
  suite.agregarPrueba(ejecutarPrueba('Nombre válido', () => {
    const result = validateName('Juan Pérez')
    assert(result.valid, 'Nombre válido debería pasar validación')
  }))
  
  suite.agregarPrueba(ejecutarPrueba('Nombre con números', () => {
    const result = validateName('Juan123')
    assert(!result.valid, 'Nombre con números debería fallar validación')
  }))
  
  // Pruebas de monto
  suite.agregarPrueba(ejecutarPrueba('Monto válido', () => {
    const result = validateAmount(100)
    assert(result.valid, 'Monto válido debería pasar validación')
  }))
  
  suite.agregarPrueba(ejecutarPrueba('Monto negativo', () => {
    const result = validateAmount(-50)
    assert(!result.valid, 'Monto negativo debería fallar validación')
  }))
  
  // Pruebas de lead score
  suite.agregarPrueba(ejecutarPrueba('Lead score válido', () => {
    const result = validateLeadScore(75)
    assert(result.valid, 'Lead score válido debería pasar validación')
  }))
  
  suite.agregarPrueba(ejecutarPrueba('Lead score fuera de rango', () => {
    const result = validateLeadScore(150)
    assert(!result.valid, 'Lead score > 100 debería fallar validación')
  }))
  
  // Pruebas de satisfacción
  suite.agregarPrueba(ejecutarPrueba('Satisfacción válida', () => {
    const result = validateSatisfaction(4)
    assert(result.valid, 'Satisfacción válida debería pasar validación')
  }))
  
  suite.agregarPrueba(ejecutarPrueba('Satisfacción fuera de rango', () => {
    const result = validateSatisfaction(6)
    assert(!result.valid, 'Satisfacción > 5 debería fallar validación')
  }))
  
  return suite.obtenerResultados()
}

/**
 * Suite de pruebas para tipos
 */
export function probarTipos() {
  const suite = new TestSuite('Validación de Tipos')
  
  // Pruebas de contacto
  suite.agregarPrueba(ejecutarPrueba('Contacto válido', () => {
    const contacto = {
      id_contacto: 1,
      nombre: 'Test User',
      telefono: '+51 987 654 321',
      email: 'test@example.com',
      fecha_registro: new Date().toISOString(),
      id_fuente: 1,
      id_estado: 1
    }
    const result = validateContacto(contacto)
    assert(result.valid, 'Contacto válido debería pasar validación')
  }))
  
  suite.agregarPrueba(ejecutarPrueba('Contacto inválido', () => {
    const contacto = {
      id_contacto: 'invalid', // Debería ser número
      nombre: 'Test User'
    }
    const result = validateContacto(contacto)
    assert(!result.valid, 'Contacto inválido debería fallar validación')
  }))
  
  // Pruebas de lead_detalle
  suite.agregarPrueba(ejecutarPrueba('Lead detalle válido', () => {
    const leadDetalle = {
      id_contacto: 1,
      lead_score: 75,
      fecha_calificacion: new Date().toISOString(),
      propuesta_aceptada: true
    }
    const result = validateLeadDetalle(leadDetalle)
    assert(result.valid, 'Lead detalle válido debería pasar validación')
  }))
  
  suite.agregarPrueba(ejecutarPrueba('Lead score inválido', () => {
    const leadDetalle = {
      id_contacto: 1,
      lead_score: 150 // Fuera de rango
    }
    const result = validateLeadDetalle(leadDetalle)
    assert(!result.valid, 'Lead score inválido debería fallar validación')
  }))
  
  return suite.obtenerResultados()
}

/**
 * Suite de pruebas de integración básicas
 */
export function probarIntegracion() {
  const suite = new TestSuite('Integración Básica')
  
  suite.agregarPrueba(ejecutarPrueba('Validación de contacto completo', () => {
    const contacto = {
      nombre: 'María González',
      email: 'maria@example.com',
      telefono: '+51 976 543 210'
    }
    
    const nombreResult = validateName(contacto.nombre)
    const emailResult = validateEmail(contacto.email)
    const phoneResult = validatePhone(contacto.telefono)
    
    assert(nombreResult.valid && emailResult.valid && phoneResult.valid, 
           'Todos los campos del contacto deberían ser válidos')
  }))
  
  suite.agregarPrueba(ejecutarPrueba('Flujo de validación con errores', () => {
    const contacto = {
      nombre: 'Juan123', // Inválido
      email: 'invalid-email', // Inválido
      telefono: '123' // Inválido
    }
    
    const nombreResult = validateName(contacto.nombre)
    const emailResult = validateEmail(contacto.email)
    const phoneResult = validatePhone(contacto.telefono)
    
    assert(!nombreResult.valid && !emailResult.valid && !phoneResult.valid, 
           'Todos los campos deberían ser inválidos')
  }))
  
  return suite.obtenerResultados()
}

/**
 * Ejecuta todas las pruebas
 */
export function ejecutarTodasLasPruebas() {
  console.log('🧪 Iniciando suite de pruebas...\n')
  
  const resultados = [
    probarValidadores(),
    probarTipos(),
    probarIntegracion()
  ]
  
  let totalPruebas = 0
  let totalExitosas = 0
  let totalFallidas = 0
  
  resultados.forEach(resultado => {
    console.log(`\n📋 ${resultado.suite}:`)
    console.log(`   Total: ${resultado.total}`)
    console.log(`   ✅ Exitosas: ${resultado.exitosas}`)
    console.log(`   ❌ Fallidas: ${resultado.fallidas}`)
    console.log(`   📊 Tasa de éxito: ${resultado.tasaExito.toFixed(1)}%`)
    
    totalPruebas += resultado.total
    totalExitosas += resultado.exitosas
    totalFallidas += resultado.fallidas
    
    // Mostrar detalles de pruebas fallidas
    resultado.pruebas.filter(p => !p.exito).forEach(prueba => {
      console.log(`   ❌ ${prueba.nombre}: ${prueba.mensaje}`)
    })
  })
  
  const tasaGlobal = totalPruebas > 0 ? (totalExitosas / totalPruebas) * 100 : 0
  
  console.log(`\n🎯 RESUMEN GLOBAL:`)
  console.log(`   Total de pruebas: ${totalPruebas}`)
  console.log(`   Exitosas: ${totalExitosas}`)
  console.log(`   Fallidas: ${totalFallidas}`)
  console.log(`   Tasa de éxito: ${tasaGlobal.toFixed(1)}%`)
  
  return {
    totalPruebas,
    totalExitosas,
    totalFallidas,
    tasaGlobal,
    suites: resultados
  }
}

/**
 * Prueba específica para desarrollo
 */
export function pruebaRapida() {
  console.log('⚡ Ejecutando prueba rápida...')
  
  const pruebas = [
    ejecutarPrueba('Email básico', () => {
      const result = validateEmail('test@test.com')
      assert(result.valid)
    }),
    ejecutarPrueba('Teléfono básico', () => {
      const result = validatePhone('987654321')
      assert(result.valid)
    }),
    ejecutarPrueba('Nombre básico', () => {
      const result = validateName('Test User')
      assert(result.valid)
    })
  ]
  
  const exitosas = pruebas.filter(p => p.exito).length
  console.log(`✅ ${exitosas}/${pruebas.length} pruebas rápidas exitosas`)
  
  return pruebas
}

export default {
  ejecutarTodasLasPruebas,
  probarValidadores,
  probarTipos,
  probarIntegracion,
  pruebaRapida,
  TestResult,
  TestSuite
}