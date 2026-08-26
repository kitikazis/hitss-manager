import {
  BANDAS_FRANJA,
  CONTRATAS,
  DEPARTAMENTOS,
  DEPTOS_PROGRAMACION,
  FRANJAS,
  FRANJA_DEFAULT,
  SOT_MANUAL_DEFAULT,
  SOT_MANUAL_PROGRAMACION,
} from './constantes.js';

/*
 * Lee el "Detalles de actividad" que se copia de Oracle Field Service y arma la
 * orden. El formato de OFS es una linea con la etiqueta y la siguiente con el
 * valor, asi que se busca la etiqueta exacta y se toma la linea util siguiente.
 *
 * Antes del pegado puede ir una cabecera del estilo "confi am1 lunes" que define
 * el tipo de plantilla y, si OFS no trae horario, tambien la franja.
 */

const sinAcentos = (s) =>
  String(s)
    .normalize('NFD')
    .split('')
    .filter((c) => c.charCodeAt(0) < 0x300 || c.charCodeAt(0) > 0x36f)
    .join('');
const norm = (s) => sinAcentos(s).toUpperCase().trim().replace(/\s+/g, ' ');

const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

const TIPOS_CABECERA = [
  { tipo: 'CONFI', prefijo: /^confi/i },
  { tipo: 'CICLO', prefijo: /^ciclo/i },
  { tipo: 'RECHAZO', prefijo: /^rechaz/i },
];

export const GESTION_POR_TIPO = { CONFI: 'CONFIRMO', CICLO: 'NO CONTESTA', RECHAZO: 'NO CONTESTA' };

/*
 * Palabras que puede tener una cabecera. Sirve para no confundirla con una linea
 * del volcado: "Cliente Confirmado Programacion" empieza por una palabra que no
 * esta en esta lista, asi que no abre un bloque nuevo.
 */
const TOKEN_CABECERA = new RegExp(
  '^(confi[a-z]*|ciclo[a-z]*|rechaz[a-z]*|am[-_.]?[0-9]?|pm[-_.]?[0-9]?|manana|tarde|' +
    'lunes|martes|miercoles|jueves|viernes|sabado|domingo|' +
    '[0-9]{1,2}([/.-][0-9]{1,2}){0,2})$',
  'i'
);

const PATRON_DIA = /\b(domingo|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado)\b/i;
const PATRON_FRANJA = new RegExp('\\b(' + FRANJAS.join('|') + ')\\b', 'i');
const PATRON_HORA = /\b(\d{1,2}):(\d{2})\b/;
const PATRON_RANGO = /\b(\d{1,2})\s*(?:a|-|–|hasta)\s*(\d{1,2})\b/i;

function tipoDeCabecera(linea) {
  const palabras = norm(linea).split(' ');
  return TIPOS_CABECERA.find((t) => palabras.some((p) => t.prefijo.test(p))) || null;
}

/*
 * Una cabecera es una linea corta hecha solo de palabras de cabecera
 * ("confi am1 lunes"), nunca una linea del volcado de OFS.
 */
function esCabecera(linea) {
  const l = linea.trim();
  if (!l || l.length > 40) return false;
  const palabras = norm(l).split(' ');
  if (palabras.length > 5) return false;
  if (!tipoDeCabecera(l)) return false;
  return palabras.every((p) => TOKEN_CABECERA.test(p));
}

/* Parte el texto en bloques: cada cabecera abre uno nuevo. */
function separarBloques(texto) {
  const lineas = texto.split(/\r?\n/);
  const bloques = [];
  let actual = null;

  lineas.forEach((linea) => {
    if (esCabecera(linea)) {
      actual = { cabecera: linea.trim(), lineas: [] };
      bloques.push(actual);
      return;
    }
    if (!actual) {
      actual = { cabecera: '', lineas: [] };
      bloques.push(actual);
    }
    actual.lineas.push(linea);
  });

  return bloques.filter((b) => b.lineas.some((l) => l.trim()));
}

/*
 * Busca la etiqueta exacta y devuelve el primer valor util que la sigue.
 * `ventana` mira mas de una linea porque algunos campos traen texto de ayuda
 * antes del valor; `valida` descarta lo que no tiene la forma esperada, asi un
 * campo vacio no se lleva por delante la etiqueta siguiente.
 */
function buscarValor(lineas, etiquetas, { valida, ventana = 1 } = {}) {
  for (const etiqueta of etiquetas) {
    const objetivo = norm(etiqueta);
    for (let i = 0; i < lineas.length; i++) {
      if (norm(lineas[i]) !== objetivo) continue;
      let vistas = 0;
      for (let j = i + 1; j < lineas.length && vistas < ventana; j++) {
        const v = lineas[j].trim();
        if (!v) continue;
        vistas++;
        if (!valida || valida(v)) return v;
      }
    }
  }
  return '';
}

const valorDe = (lineas, ...etiquetas) => buscarValor(lineas, etiquetas);

/* Hora con la que abre un texto tipo "09:00 - 13:00" o "9 a 13". */
function horaDeInicio(texto) {
  const conMinutos = texto.match(PATRON_HORA);
  if (conMinutos) return Number(conMinutos[1]) + Number(conMinutos[2]) / 60;
  if (!texto.includes('/')) {
    const rango = texto.match(PATRON_RANGO);
    if (rango) return Number(rango[1]);
  }
  return null;
}

export function franjaPorHora(hora) {
  const dentro = BANDAS_FRANJA.find((b) => hora >= b.desde && hora < b.hasta);
  if (dentro) return dentro.franja;
  // Fuera de toda banda (hueco del mediodia, madrugada, noche): la mas cercana.
  return [...BANDAS_FRANJA].sort(
    (a, b) => Math.abs(hora - a.desde) - Math.abs(hora - b.desde)
  )[0].franja;
}

const tieneHorario = (v) => PATRON_HORA.test(v) || (!v.includes('/') && PATRON_RANGO.test(v));

/*
 * Franja escrita en la cabecera. Acepta "am1", "AM 1", "am-1", "a.m.1" y tambien
 * "am"/"pm"/"manana"/"tarde" sueltos, que caen en la franja base de ese turno.
 */
export function franjaDeCabecera(cabecera) {
  if (!cabecera) return '';
  const limpia = norm(cabecera).replace(/\b(AM|PM)\s*[-_.]?\s*([0-9])\b/g, '$1$2');
  const exacta = limpia.match(PATRON_FRANJA);
  if (exacta) return exacta[1].toUpperCase();
  if (/\bMANANA\b/.test(limpia) || /\bAM\b/.test(limpia)) return 'AM1';
  if (/\bTARDE\b/.test(limpia) || /\bPM\b/.test(limpia)) return 'PM1';
  return '';
}

/*
 * Franja: primero lo que diga OFS (intervalo de tiempo, SLA o la franja escrita)
 * y recien al final la cabecera que puso el operador.
 */
function detectarFranja(lineas, cabecera) {
  // Ventana de 1: el valor va pegado a la etiqueta. Si el campo viene vacio, la
  // linea siguiente es otra etiqueta y la validacion la descarta.
  const intervalo = buscarValor(lineas, ['Intervalo de tiempo', 'Intervalo', 'Franja'], {
    valida: (v) => PATRON_FRANJA.test(v) || tieneHorario(v),
  });
  if (intervalo) {
    const token = intervalo.match(PATRON_FRANJA);
    if (token) {
      return { franja: token[1].toUpperCase(), origen: `intervalo de tiempo: ${intervalo}` };
    }
    const hora = horaDeInicio(intervalo);
    if (hora !== null) {
      return { franja: franjaPorHora(hora), origen: `intervalo de tiempo: ${intervalo}` };
    }
  }

  const sla = buscarValor(lineas, ['SLA inicio', 'SLA fin'], {
    ventana: 3,
    valida: (v) => PATRON_HORA.test(v),
  });
  if (sla) {
    const hora = horaDeInicio(sla);
    if (hora !== null) return { franja: franjaPorHora(hora), origen: `SLA: ${sla}` };
  }

  // La franja sola en una linea, o precedida de "Franja"/"Horario".
  const suelta = lineas.find(
    (l) =>
      FRANJAS.includes(norm(l)) ||
      (/^(franja|horario)\b/i.test(l.trim()) && PATRON_FRANJA.test(l))
  );
  if (suelta) {
    return { franja: suelta.match(PATRON_FRANJA)[1].toUpperCase(), origen: `texto: ${suelta.trim()}` };
  }

  const deCabecera = franjaDeCabecera(cabecera);
  if (deCabecera) return { franja: deCabecera, origen: 'cabecera' };

  return { franja: FRANJA_DEFAULT, origen: '' };
}

function convertirFecha(crudo) {
  const m = String(crudo).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  let anio = Number(m[3]);
  if (anio < 100) anio += 2000;
  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getDate() !== dia || fecha.getMonth() !== mes - 1) return null;
  return { texto: `${dia}/${mes}/${anio}`, fecha };
}

/* El titulo de la actividad trae la contrata: "INST CARLEI TARAPOTO FTTH - ..." */
function contrataDelTitulo(lineas) {
  const titulo = lineas.find((l) => /^\s*(INST|AVERIA|AVER[ÍI]A|MANT|MIGRA|MIGRACION|REPAR)\b/i.test(l));
  if (!titulo) return '';
  const partes = titulo.trim().split(/\s+/);
  if (partes.length < 2) return '';
  const abreviada = norm(partes[1]);
  // Completa el nombre oficial a partir de la abreviatura del titulo.
  const conocida = CONTRATAS.find((c) => {
    const n = norm(c);
    return n === abreviada || n.startsWith(abreviada + ' ') || n.includes('(' + abreviada + ')');
  });
  return conocida || abreviada;
}

/*
 * `elegidos` son los botones de la app: { tipo, franja }. La cabecera escrita en
 * el propio pegado tiene prioridad sobre el boton, porque va por bloque.
 * La franja elegida a mano si manda sobre lo que diga OFS, pero avisa si difieren.
 */
function parsearBloque({ cabecera, lineas }, elegidos = {}) {
  const avisos = [];

  const cab = tipoDeCabecera(cabecera);
  const tipoPlantilla = cab ? cab.tipo : elegidos.tipo || 'CONFI';
  const gestion = GESTION_POR_TIPO[tipoPlantilla] || 'CONFIRMO';

  const deteccion = detectarFranja(lineas, cabecera);
  let franja = deteccion.franja;
  let franjaOrigen = deteccion.origen;

  if (elegidos.franja) {
    franja = elegidos.franja;
    franjaOrigen = 'la franja elegida';
    if (deteccion.origen && deteccion.origen !== 'cabecera' && deteccion.franja !== franja) {
      avisos.push(
        `Elegiste ${franja} pero OFS marca ${deteccion.franja} (${deteccion.origen}). Se usa ${franja}.`
      );
    }
  } else if (!franjaOrigen) {
    avisos.push(`No se pudo deducir la franja: se usa ${FRANJA_DEFAULT}. Elígela con los botones.`);
  } else if (franjaOrigen !== 'cabecera') {
    const enCabecera = franjaDeCabecera(cabecera);
    if (enCabecera && enCabecera !== franja) {
      avisos.push(
        `La cabecera dice ${enCabecera} pero OFS marca ${franja} (${franjaOrigen}). Se usa ${franja}.`
      );
    }
  }

  const sotCrudo = valorDe(lineas, 'SOT');
  const sot = (sotCrudo.match(/\d{5,}/) || [''])[0];
  if (!sot) avisos.push('No se encontró el SOT.');

  const cliente = valorDe(lineas, 'Nombre');
  if (!cliente) avisos.push('No se encontró el nombre del cliente.');

  const telefonoCrudo = valorDe(lineas, 'Telefono', 'Teléfono');
  const telefono = (telefonoCrudo.match(/\d{6,}/) || [''])[0];
  if (!telefono) avisos.push('No se encontró el teléfono.');

  // OFS escribe la etiqueta como "Departmento".
  const departamentoCrudo = valorDe(lineas, 'Departmento', 'Departamento');
  const departamento = norm(departamentoCrudo);
  const departamentoValido = DEPARTAMENTOS.includes(departamento);
  if (!departamentoValido) {
    avisos.push(
      departamento
        ? `Departamento "${departamentoCrudo}" no está en la lista: se usa ${DEPARTAMENTOS[0]}.`
        : `No se encontró el departamento: se usa ${DEPARTAMENTOS[0]}.`
    );
  }
  const deptoFinal = departamentoValido ? departamento : DEPARTAMENTOS[0];

  const fechaCruda = valorDe(lineas, 'Fecha de Programacion', 'Fecha de Programación');
  const fecha = convertirFecha(fechaCruda);
  if (!fecha) avisos.push('No se encontró la fecha de programación.');

  // La cabecera puede nombrar el dia: sirve para detectar un pegado equivocado.
  const diaTexto = cabecera.match(PATRON_DIA);
  if (diaTexto && fecha) {
    const esperado = DIAS.indexOf(norm(diaTexto[1]));
    const real = fecha.fecha.getDay();
    if (esperado !== real) {
      avisos.push(
        `La cabecera dice ${diaTexto[1].toLowerCase()} pero ${fecha.texto} cae ${DIAS[real].toLowerCase()}.`
      );
    }
  }

  return {
    valido: Boolean(sot),
    tipoPlantilla,
    idActividad: valorDe(lineas, 'ID de actividad'),
    franjaOrigen,
    avisos,
    orden: {
      sot,
      cliente,
      telefono,
      contrata: contrataDelTitulo(lineas),
      fecha: fecha ? fecha.texto : '',
      franja,
      gestion,
      departamento: deptoFinal,
      yaGestion: 'NO',
      sotManual: DEPTOS_PROGRAMACION.includes(deptoFinal)
        ? SOT_MANUAL_PROGRAMACION
        : SOT_MANUAL_DEFAULT,
      tipoPlantilla,
    },
  };
}

export function parsearPegado(texto, elegidos = {}) {
  if (!texto || !texto.trim()) return [];
  return separarBloques(texto).map((b) => parsearBloque(b, elegidos));
}
