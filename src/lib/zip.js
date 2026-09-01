/*
 * Lector de ZIP minimo, para poder soltar un album entero sin descomprimirlo a
 * mano. Solo necesita lo que traen los ZIP de musica: entradas guardadas tal
 * cual (metodo 0) o comprimidas con deflate (metodo 8), que el propio navegador
 * descomprime con DecompressionStream.
 */
const FIRMA_FIN = 0x06054b50; // fin del directorio central
const FIRMA_CENTRAL = 0x02014b50; // entrada del directorio central
const GUARDADO = 0;
const DEFLATE = 8;

export const esZip = (archivo) =>
  /\.zip$/i.test(archivo.name) || archivo.type === 'application/zip' || archivo.type === 'application/x-zip-compressed';

const AUDIO = /\.(mp3|m4a|wav|ogg|flac|aac|opus|wma)$/i;

function buscarFin(vista, largo) {
  // El comentario final puede medir hasta 64 KB: se busca hacia atras.
  const desde = Math.max(0, largo - 22 - 65535);
  for (let i = largo - 22; i >= desde; i--) {
    if (vista.getUint32(i, true) === FIRMA_FIN) return i;
  }
  return -1;
}

async function inflar(datos) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Este navegador no puede descomprimir el ZIP');
  }
  const flujo = new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(flujo).arrayBuffer();
}

/*
 * Devuelve los archivos de audio que hay dentro del ZIP, ya como File, listos
 * para tratarlos igual que si los hubiera elegido del disco.
 */
export async function audiosDeZip(archivo) {
  const buf = await archivo.arrayBuffer();
  const vista = new DataView(buf);
  const fin = buscarFin(vista, buf.byteLength);
  if (fin < 0) throw new Error('El archivo no parece un ZIP');

  const total = vista.getUint16(fin + 10, true);
  let p = vista.getUint32(fin + 16, true);
  const entradas = [];

  for (let i = 0; i < total && p + 46 <= buf.byteLength; i++) {
    if (vista.getUint32(p, true) !== FIRMA_CENTRAL) break;
    const metodo = vista.getUint16(p + 10, true);
    const comprimido = vista.getUint32(p + 20, true);
    const largoNombre = vista.getUint16(p + 28, true);
    const largoExtra = vista.getUint16(p + 30, true);
    const largoComentario = vista.getUint16(p + 32, true);
    const local = vista.getUint32(p + 42, true);
    const nombre = new TextDecoder('utf-8').decode(new Uint8Array(buf, p + 46, largoNombre));

    if (!nombre.endsWith('/') && AUDIO.test(nombre)) {
      entradas.push({ nombre, metodo, comprimido, local });
    }
    p += 46 + largoNombre + largoExtra + largoComentario;
  }

  const salida = [];
  for (const entrada of entradas) {
    // El encabezado local repite los largos: los suyos son los que valen.
    const nombreLocal = vista.getUint16(entrada.local + 26, true);
    const extraLocal = vista.getUint16(entrada.local + 28, true);
    const inicio = entrada.local + 30 + nombreLocal + extraLocal;
    const crudo = buf.slice(inicio, inicio + entrada.comprimido);

    let datos;
    if (entrada.metodo === GUARDADO) datos = crudo;
    else if (entrada.metodo === DEFLATE) datos = await inflar(crudo);
    else continue; // metodo raro: se salta, no se rompe todo el lote

    // Se queda con el nombre del archivo, sin las carpetas de adentro.
    const corto = entrada.nombre.split('/').pop();
    salida.push(new File([datos], corto, { type: 'audio/mpeg' }));
  }

  return salida;
}

/*
 * Archivos de un arrastre, entrando en las carpetas que vengan: soltar la
 * carpeta del album tiene que valer igual que soltar sus canciones.
 */
export async function archivosDeArrastre(transferencia) {
  const entradas = [...(transferencia.items || [])]
    .map((i) => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null))
    .filter(Boolean);

  if (!entradas.length) return [...transferencia.files];

  const archivos = [];

  const leerCarpeta = (carpeta) =>
    new Promise((resolver) => {
      const lector = carpeta.createReader();
      const acumulado = [];
      const siguiente = () =>
        lector.readEntries((tanda) => {
          if (!tanda.length) {
            resolver(acumulado);
            return;
          }
          acumulado.push(...tanda);
          siguiente();
        }, () => resolver(acumulado));
      siguiente();
    });

  const recorrer = async (entrada) => {
    if (entrada.isFile) {
      const archivo = await new Promise((r) => entrada.file(r, () => r(null)));
      if (archivo) archivos.push(archivo);
      return;
    }
    if (entrada.isDirectory) {
      const hijos = await leerCarpeta(entrada);
      for (const hijo of hijos) await recorrer(hijo);
    }
  };

  for (const entrada of entradas) await recorrer(entrada);
  return archivos;
}
