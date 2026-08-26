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
  { id: 'CONFI', etiqueta: 'Confirmada', descripcion: 'Confirmación de visita' },
  { id: 'CICLO', etiqueta: 'Ciclo de llamadas', descripcion: 'Ciclo de llamadas' },
  { id: 'RECHAZO', etiqueta: 'Rechazo', descripcion: 'Rechazo en mesa' },
];

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

const CERCA = '```';
const AREA = 'ADP MULTISKILL HITSS';
const bloque = (lineas) => [CERCA, ...lineas, CERCA].join('\n');

export function construirPlantilla({ tipo, orden, extra, perfil }) {
  if (!orden) return '';

  const realizadoPor = perfil.realizadoPor || REALIZADO_POR_DEFAULT;
  const campos = extra || {};

  if (tipo === 'CICLO') {
    return [
      `**USUARIO:** ${perfil.usuario} | **SOT:** ${orden.sot} | **DEPARTAMENTO:** ${orden.departamento}`,
      '',
      bloque([
        'MESA MULTISKILL HITSS - CICLO DE LLAMADAS',
        `CICLO DE LLAMADA NRO: ${campos.cicloNro ?? ''}`,
        `CANTIDAD DE LLAMADAS: ${campos.cantidad ?? ''}`,
        `NUMERO: ${orden.telefono}`,
        `MOTIVO: ${campos.motivo ?? ''}`,
        `SUB-MOTIVO: ${campos.subMotivo ?? ''}`,
        `ID DE LLAMADA: ${campos.idLlamada ?? ''}`,
        `REALIZADO POR: ${realizadoPor} - ${AREA}`,
      ]),
    ].join('\n');
  }

  if (tipo === 'RECHAZO') {
    return [
      `**USUARIO:** ${perfil.usuario} | **DEPARTAMENTO:** ${orden.departamento}`,
      '',
      bloque([
        'MESA MULTISKILL HITSS - RECHAZO EN MESA',
        `SOT: ${orden.sot}`,
        `RECHAZO EN MESA/CAMPO: ${campos.rechazoTipo ?? ''}`,
        `PERSONA QUE CONTESTA: ${campos.persona ?? ''}`,
        `NUMERO DE CONTACTO: ${orden.telefono}`,
        `MOTIVO: ${campos.motivo ?? ''}`,
        `SUBMOTIVO: ${campos.subMotivo ?? ''}`,
        `ID DE LLAMADA: ${campos.idLlamada ?? ''}`,
        `REALIZADO POR: ${realizadoPor}`,
      ]),
    ].join('\n');
  }

  return [
    `**USUARIO:** ${perfil.usuario} | **DEPARTAMENTO:** ${orden.departamento}`,
    '',
    bloque([
      'MESA MULTISKILL HITSS - CONFIRMA VISITA',
      `SOT: ${orden.sot}`,
      `DÍA Y FRANJA: ${orden.fecha} - ${orden.franja}`,
      `CLIENTE: ${orden.cliente}`,
      `NUMERO: ${orden.telefono}`,
      `CONTRATA: ${orden.contrata}`,
      `ID DE LLAMADA: ${campos.idLlamada ?? ''}`,
      `REALIZADO POR: ${realizadoPor}`,
    ]),
  ].join('\n');
}
