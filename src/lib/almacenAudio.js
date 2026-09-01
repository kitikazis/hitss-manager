/*
 * Guarda las pistas en IndexedDB para que la lista sobreviva a una recarga: el
 * operador elige sus archivos una vez por turno, no una vez por refresco.
 *
 * Nada de esto sale de la PC. Si el navegador no deja abrir la base (pasa con
 * el archivo suelto en file://), todo sigue funcionando en memoria y la lista
 * dura lo que dure la pestaña.
 */
const BASE = 'hitss.musica';
const ALMACEN = 'pistas';

let promesa = null;

function abrir() {
  if (promesa) return promesa;

  promesa = new Promise((resolver, rechazar) => {
    if (typeof indexedDB === 'undefined') {
      rechazar(new Error('sin IndexedDB'));
      return;
    }
    const peticion = indexedDB.open(BASE, 1);
    peticion.onupgradeneeded = () => {
      const db = peticion.result;
      if (!db.objectStoreNames.contains(ALMACEN)) {
        db.createObjectStore(ALMACEN, { keyPath: 'id' });
      }
    };
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => rechazar(peticion.error || new Error('no se pudo abrir'));
    peticion.onblocked = () => rechazar(new Error('base bloqueada'));
  }).catch((e) => {
    promesa = null;
    throw e;
  });

  return promesa;
}

function conAlmacen(modo, hacer) {
  return abrir().then(
    (db) =>
      new Promise((resolver, rechazar) => {
        const tx = db.transaction(ALMACEN, modo);
        const peticion = hacer(tx.objectStore(ALMACEN));
        tx.oncomplete = () => resolver(peticion ? peticion.result : undefined);
        tx.onerror = () => rechazar(tx.error);
        tx.onabort = () => rechazar(tx.error);
      })
  );
}

export function leerPistas() {
  return conAlmacen('readonly', (almacen) => almacen.getAll()).then((lista) =>
    (lista || []).sort((a, b) => a.orden - b.orden)
  );
}

export function guardarPista(pista) {
  return conAlmacen('readwrite', (almacen) =>
    almacen.put({ id: pista.id, nombre: pista.nombre, orden: pista.orden, blob: pista.blob })
  );
}

export function borrarPista(id) {
  return conAlmacen('readwrite', (almacen) => almacen.delete(id));
}

export function vaciarPistas() {
  return conAlmacen('readwrite', (almacen) => almacen.clear());
}
