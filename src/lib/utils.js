export function leerAlmacen(clave, porDefecto) {
  try {
    const raw = localStorage.getItem(clave);
    return raw === null ? porDefecto : JSON.parse(raw);
  } catch {
    return porDefecto;
  }
}

export function escribirAlmacen(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Modo privado o cuota llena: la app sigue funcionando solo en memoria.
  }
}

export function hoyTexto() {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function hoyArchivo() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/*
 * Las fechas se guardan siempre como d/m/aaaa. Esto las pasa al formato que
 * espera el formulario al generar el script.
 */
export function formatearFecha(texto, formato) {
  const m = String(texto || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return texto || '';
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  let anio = Number(m[3]);
  if (anio < 100) anio += 2000;
  return formato === 'M/d/yyyy' ? `${mes}/${dia}/${anio}` : `${dia}/${mes}/${anio}`;
}

export function formatearId(n) {
  return `SOT-${String(n).padStart(6, '0')}`;
}

export async function copiarAlPortapapeles(texto) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // El navegador bloqueo el portapapeles: probamos el metodo clasico.
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function descargarArchivo(nombre, contenido, tipo = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
