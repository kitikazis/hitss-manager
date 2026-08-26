import { MOTIVOS_CICLO, MOTIVOS_RECHAZO, REALIZADO_POR_DEFAULT, RECHAZO_TIPOS } from './constantes.js';

/*
 * Las ordenes se parten en dos grupos con el mismo criterio que usa el script
 * al reportar en consola: CONFIRMO -> confirmados, cualquier otra gestion -> ciclos.
 */
export const esConfirmado = (o) => o.gestion === 'CONFIRMO';

export function separarPorTipo(ordenes) {
  return {
    confirmados: ordenes.filter(esConfirmado),
    ciclos: ordenes.filter((o) => !esConfirmado(o)),
  };
}

/* Clase CSS y color de etiqueta de cada tipo, para pintarlos igual en toda la app. */
export const CLASE_TIPO = { CONFI: 'es-confi', CICLO: 'es-ciclo', RECHAZO: 'es-rechazo' };
export const COLOR_TIPO = { CONFI: 'ok', CICLO: 'aviso', RECHAZO: 'error' };

export const TIPOS = [
  { id: 'CONFI', etiqueta: 'Confirmada', corto: 'Confirmada', descripcion: 'Confirmación de visita' },
  { id: 'CICLO', etiqueta: 'Ciclo de llamadas', corto: 'Ciclo', descripcion: 'Ciclo de llamadas' },
  { id: 'RECHAZO', etiqueta: 'Rechazo', corto: 'Rechazo', descripcion: 'Rechazo en mesa' },
];

/* Version corta para la lista y los filtros, donde el ancho es poco. */
export const etiquetaCorta = (id) => (TIPOS.find((t) => t.id === id) || {}).corto || id;

/*
 * Tipo de una orden: el que se eligio en Plantillas y, si no hay, el que se
 * deduce de la gestion (CONFIRMO -> confirmada, cualquier otra -> ciclo).
 */
export function tipoDeOrden(orden) {
  if (!orden) return 'CONFI';
  if (orden.tipoPlantilla && TIPOS.some((t) => t.id === orden.tipoPlantilla)) {
    return orden.tipoPlantilla;
  }
  return esConfirmado(orden) ? 'CONFI' : 'CICLO';
}

export const etiquetaTipo = (id) => (TIPOS.find((t) => t.id === id) || {}).etiqueta || id;

/* Valores con los que arranca el formulario dinamico de cada tipo. */
export function camposPorDefecto(tipo, orden) {
  const idLlamada = orden?.id || '';
  if (tipo === 'CICLO') {
    return {
      idLlamada,
      cicloNro: '1',
      cantidad: '4',
      motivo: MOTIVOS_CICLO[0],
      subMotivo: 'No contesta',
    };
  }
  if (tipo === 'RECHAZO') {
    return {
      idLlamada,
      rechazoTipo: RECHAZO_TIPOS[0],
      persona: '',
      motivo: MOTIVOS_RECHAZO[0],
      subMotivo: '',
    };
  }
  return { idLlamada };
}

const AREA = 'ADP MULTISKILL HITSS';

/*
 * Lo que se copia es solo el texto de la plantilla. El usuario, el SOT y el
 * departamento se muestran aparte, fuera del bloque que se pega.
 */
export function contextoPlantilla(orden, perfil) {
  if (!orden) return '';
  return `Usuario ${perfil.usuario} · SOT ${orden.sot} · ${orden.departamento}`;
}

export function construirPlantilla({ tipo, orden, extra, perfil }) {
  if (!orden) return '';

  const realizadoPor = perfil.realizadoPor || REALIZADO_POR_DEFAULT;
  const campos = extra || {};

  // Horario y observaciones son opcionales: solo aparecen si tienen contenido.
  const horario = (orden.horario || '').trim();
  const observaciones = (orden.observaciones || '').trim();
  const linea = (etiqueta, valor) => (valor ? [`${etiqueta}: ${valor}`] : []);

  if (tipo === 'CICLO') {
    return [
      'MESA MULTISKILL HITSS - CICLO DE LLAMADAS',
      `CICLO DE LLAMADA NRO: ${campos.cicloNro ?? ''}`,
      `CANTIDAD DE LLAMADAS: ${campos.cantidad ?? ''}`,
      `NUMERO: ${orden.telefono}`,
      ...linea('HORARIO', horario),
      `MOTIVO: ${campos.motivo ?? ''}`,
      `SUB-MOTIVO: ${campos.subMotivo ?? ''}`,
      `ID DE LLAMADA: ${campos.idLlamada ?? ''}`,
      `REALIZADO POR: ${realizadoPor} - ${AREA}`,
      ...linea('OBSERVACIONES', observaciones),
    ].join('\n');
  }

  if (tipo === 'RECHAZO') {
    return [
      'MESA MULTISKILL HITSS - RECHAZO EN MESA',
      `SOT: ${orden.sot}`,
      `RECHAZO EN MESA/CAMPO: ${campos.rechazoTipo ?? ''}`,
      `PERSONA QUE CONTESTA: ${campos.persona ?? ''}`,
      `NUMERO DE CONTACTO: ${orden.telefono}`,
      ...linea('HORARIO', horario),
      `MOTIVO: ${campos.motivo ?? ''}`,
      `SUBMOTIVO: ${campos.subMotivo ?? ''}`,
      `ID DE LLAMADA: ${campos.idLlamada ?? ''}`,
      `REALIZADO POR: ${realizadoPor}`,
      ...linea('OBSERVACIONES', observaciones),
    ].join('\n');
  }

  return [
    'MESA MULTISKILL HITSS - CONFIRMA VISITA',
    `SOT: ${orden.sot}`,
    `DÍA Y FRANJA: ${orden.fecha} - ${orden.franja}`,
    ...linea('HORARIO', horario),
    `CLIENTE: ${orden.cliente}`,
    `NUMERO: ${orden.telefono}`,
    `CONTRATA: ${orden.contrata}`,
    `ID DE LLAMADA: ${campos.idLlamada ?? ''}`,
    `REALIZADO POR: ${realizadoPor}`,
    ...linea('OBSERVACIONES', observaciones),
  ].join('\n');
}
