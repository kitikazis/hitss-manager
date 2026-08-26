import { useEffect, useRef, useState } from 'react';
import { Campo, Select } from './Campos';
import { FORMATOS_FECHA } from '../lib/constantes';
import { copiarAlPortapapeles, descargarArchivo, hoyArchivo } from '../lib/utils';

const ETIQUETAS = {
  todas: 'todas las órdenes',
  confirmados: 'solo confirmados',
  ciclos: 'solo ciclos',
};

export function PanelScript({
  ordenes,
  perfil,
  script,
  filtro,
  onFiltro,
  formatoFecha,
  onFormatoFecha,
  conteos,
  onVerInstrucciones,
  onToast,
}) {
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef(null);

  async function copiar() {
    const ok = await copiarAlPortapapeles(script);
    if (ok) {
      setCopiado(true);
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setCopiado(false), 1800);
    }
    onToast(ok ? 'Script copiado' : 'No se pudo copiar: selecciona el código manualmente');
  }

  // Ctrl+Enter copia el script.
  useEffect(() => {
    function atajo(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && ordenes.length) {
        e.preventDefault();
        copiar();
      }
    }
    document.addEventListener('keydown', atajo);
    return () => document.removeEventListener('keydown', atajo);
  });

  function descargar() {
    const sufijo = filtro === 'todas' ? '' : `-${filtro}`;
    descargarArchivo(
      `hitss-${perfil.usuario}${sufijo}-${hoyArchivo()}.js`,
      script,
      'text/javascript;charset=utf-8'
    );
    onToast('Archivo .js descargado');
  }

  return (
    <>
      <section className="tarjeta">
        <div className="tarjeta-cab">
          <div>
            <h2>Opciones del script</h2>
            <p className="sub">El script llena y envía todas las órdenes seguidas</p>
          </div>
        </div>

        <div className="tarjeta-cuerpo">
          <div className="rejilla">
            <Campo label="Órdenes incluidas">
              <select value={filtro} onChange={(e) => onFiltro(e.target.value)}>
                <option value="todas">Todas ({conteos.todas})</option>
                <option value="confirmados">Solo confirmados ({conteos.confirmados})</option>
                <option value="ciclos">Solo ciclos ({conteos.ciclos})</option>
              </select>
            </Campo>

            <Campo label="Formato de fecha" pista="El que espera el formulario">
              <Select value={formatoFecha} onChange={onFormatoFecha} opciones={FORMATOS_FECHA} />
            </Campo>
          </div>

          {!ordenes.length ? (
            <div className="alerta error" style={{ marginTop: 16 }}>
              {conteos.todas === 0 ? (
                <>
                  No hay órdenes cargadas. Ve a <b>Órdenes</b> antes de generar el script.
                </>
              ) : (
                <>
                  Ninguna orden entra en el filtro <b>{ETIQUETAS[filtro]}</b>. Cambia el filtro para
                  incluir las {conteos.todas} cargadas.
                </>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <section className="tarjeta">
        <div className="tarjeta-cab">
          <div>
            <h2>Script generado</h2>
            <p className="sub">
              {ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'} · usuario{' '}
              {perfil.usuario} · fechas en {formatoFecha} ·{' '}
              {script.split(String.fromCharCode(10)).length} líneas
            </p>
          </div>
          <div className="empuje" />
          <button className="btn btn-chico" onClick={onVerInstrucciones}>
            Ver instrucciones
          </button>
          <button className="btn btn-primario btn-grande" onClick={copiar}>
            {copiado ? 'Copiado' : 'Copiar script'}
          </button>
          <button className="btn btn-chico" onClick={descargar} title="Guardar como archivo .js">
            Descargar
          </button>
        </div>
        <pre className="codigo">{script}</pre>
      </section>
    </>
  );
}
