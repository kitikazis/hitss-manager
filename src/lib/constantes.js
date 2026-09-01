export const USUARIO_DEFAULT = 'E761826';
export const OPERADOR_DEFAULT = 'LUIS YAMIR HUALLCCA CUENCA';
export const REALIZADO_POR_DEFAULT = 'YAMIR HUALLCCA';
export const ID_INICIAL = 208548;
export const FECHA_DEFAULT = '25/8/2026';

export const FRANJAS = ['AM0', 'AM1', 'AM2', 'PM1', 'PM2'];
export const FRANJA_DEFAULT = 'AM1';

/*
 * Horarios de cada franja, para deducirla del "Intervalo de tiempo" o del SLA
 * que trae Oracle Field Service. AM2 y PM2 no tienen banda: solo se usan si
 * vienen escritas tal cual en el pegado.
 */
export const BANDAS_FRANJA = [
  { franja: 'AM0', desde: 7, hasta: 9 },
  { franja: 'AM1', desde: 9, hasta: 13 },
  { franja: 'PM1', desde: 14, hasta: 18 },
];
export const GESTIONES = ['CONFIRMO', 'NO CONTESTA'];
// En el mismo orden en que aparecen en el formulario.
export const DEPARTAMENTOS = [
  'AMAZONAS',
  'AREQUIPA',
  'ANCASH',
  'AYACUCHO',
  'APURIMAC',
  'CAJAMARCA',
  'CUSCO',
  'ICA',
  'HUANUCO',
  'JUNIN',
  'HUANCAVELICA',
  'LAMBAYEQUE',
  'LA LIBERTAD',
  'LIMA',
  'MOQUEGUA',
  'MADRE DE DIOS',
  'PASCO',
  'PIURA',
  'PUNO',
  'SAN MARTIN',
  'TACNA',
  'TUMBES',
  'UCAYALI',
];
export const SI_NO = ['SI', 'NO'];
export const SOT_MANUALES = ['PROGRAMACIONES D+1', 'MIGRACIONES', 'PM3', 'PREDICTIVO'];
export const SOT_MANUAL_DEFAULT = 'PREDICTIVO';

// Regla de mesa por defecto; el operador puede cambiar la lista desde la app.
export const DEPTOS_PROGRAMACION = ['UCAYALI', 'SAN MARTIN'];
export const SOT_MANUAL_PROGRAMACION = 'PROGRAMACIONES D+1';

// Contratas conocidas: el pegado las reconoce por la primera palabra del titulo
// de la actividad y completa el nombre entero.
export const CONTRATAS = [
  'DIMERA SERVICIOS MULTIPLES SAC',
  'CARLEI TELECOMUNICACIONES SAC',
  'INSERTEL',
  'INKA CELL S.A.C.',
  'CICSA S.A.C.',
  'IT WEBSOLUTIONS PERU S.A.C.',
  'FELIPE BEDOYA ZAPANA E.I.R.LTDA (FEBEZA)',
  'LICENCIAS PROYECTOS Y SEGURIDAD Y SALUD SL',
  'TELECOMUNICACIONES MEGATIC SCRL',
  'TELECOM DATA S.A.C.',
  'WITLINK S.A.C',
  'SOLUCIONES Y SERVICIOS MULTIPLES PERU SAC',
  'CONEXIT S.A.C.',
];
export const LISTA_CONTRATAS = 'contratas-conocidas';

// Campos dinamicos de las plantillas.
export const MOTIVOS_CICLO = ['FALTA DE CONTACTO', 'CLIENTE NO DESEA', 'OTRO'];
export const MOTIVOS_RECHAZO = [
  'CLIENTE NO DESEA EL SERVICIO - MESA',
  'CLIENTE NO DESEA EL SERVICIO - CAMPO',
  'OTRO',
];
export const RECHAZO_TIPOS = ['MESA', 'CAMPO'];

// Cada operador guarda sus propias ordenes: las claves llevan su codigo al final.
// Formato con el que el script escribe la fecha en el formulario.
export const FORMATOS_FECHA = ['d/m/yyyy', 'M/d/yyyy'];
export const FORMATO_FECHA_DEFAULT = 'd/m/yyyy';

export const CLAVE_USUARIO = 'hitss.usuarioActivo';
export const CLAVE_FORMATO_FECHA = 'hitss.formatoFecha';
export const CLAVE_INSTRUCCIONES = 'hitss.verInstrucciones';
export const CLAVE_TEMA = 'hitss.tema';
export const clavePerfil = (usuario) => `hitss.perfil.${usuario}`;
export const claveOrdenes = (usuario) => `hitss.ordenes.${usuario}`;
export const claveProximoId = (usuario) => `hitss.proximoId.${usuario}`;
export const claveModo = (usuario) => `hitss.modo.${usuario}`;
export const claveDeptosD1 = (usuario) => `hitss.deptosD1.${usuario}`;
// La orden en la que se quedo y las opciones del pegado: se recuperan al volver.
export const claveSeleccion = (usuario) => `hitss.seleccion.${usuario}`;
export const clavePegado = (usuario) => `hitss.opcionesPegado.${usuario}`;
// Preferencias del reproductor: son del puesto, no del operador.
export const CLAVE_MUSICA = 'hitss.musica';
