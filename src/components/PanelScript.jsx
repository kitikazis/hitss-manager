import { useEffect, useMemo, useRef, useState } from 'react';
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

  const lineas = script.split(String.fromCharCode(10)).length;

  /*
   * Resumen legible de lo que va a salir. Sin esto hay que leer 200 lineas de
   * codigo para saber si el lote es el correcto.
   */
  const resumen = useMemo(() => {
    const cuenta = (clave) => {
      const mapa = {};
      ordenes.forEach((o) => {
        const v = o[clave] || '—';
        mapa[v] = (mapa[v] || 0) + 1;
      });
      return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
    };
    return {
      fechas: cuenta('fecha'),
      franjas: cuenta('franja'),
      sinTelefono: ordenes.filter((o) => !o.telefono).map((o) => o.sot),
      sinCliente: ordenes.filter((o) => !o.cliente).map((o) => o.sot),
    };
  }, [ordenes]);

  return (
    <>
      <section className="tarjeta">
        <div className="tarjeta-cab">
          <h2>Opciones</h2>
        </div>

        <div className="tarjeta-cuerpo">
          <div className="grupo">
            <p className="seccion">Qué se envía</p>
            <div className="rejilla" style={{ gridTemplateColumns: '1fr' }}>
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
          </div>

          {ordenes.length ? (
            <div className="grupo">
              <p className="seccion">Lo que va a enviar</p>
              <dl className="resumen-envio">
                <dt>Órdenes</dt>
                <dd>
                  <span className="dato-cuenta">
                    <b>{ordenes.length}</b> en total
                  </span>
                  <span className="dato-cuenta">{conteos.confirmados} confirmados</span>
                  <span className="dato-cuenta">{conteos.ciclos} ciclos</span>
                </dd>
                <dt>Fechas</dt>
                <dd>
                  {resumen.fechas.map(([f, n]) => (
                    <span key={f} className="dato-cuenta">
                      <span className="mono">{f}</span> <b>×{n}</b>
                    </span>
                  ))}
                </dd>
                <dt>Franjas</dt>
                <dd>
                  {resumen.franjas.map(([f, n]) => (
                    <span key={f} className="dato-cuenta">
                      <span className="mono">{f}</span> <b>×{n}</b>
                    </span>
                  ))}
                </dd>
              </dl>

              {resumen.sinTelefono.length || resumen.sinCliente.length ? (
                <div className="alerta aviso" style={{ marginTop: 10 }}>
                  Entran con datos vacíos:
                  {resumen.sinCliente.length ? (
                    <>
                      {' '}
                      sin cliente <b className="mono">{resumen.sinCliente.join(', ')}</b>.
                    </>
                  ) : null}
                  {resumen.sinTelefono.length ? (
                    <>
                      {' '}
                      sin teléfono <b className="mono">{resumen.sinTelefono.join(', ')}</b>.
                    </>
                  ) : null}{' '}
                  El formulario los acepta igual.
                </div>
              ) : (
                <p className="pista" style={{ marginTop: 8 }}>
                  Todas llevan cliente, teléfono y fecha.
                </p>
              )}
            </div>
          ) : null}

          {!ordenes.length ? (
            <div className="alerta error" style={{ marginTop: 12 }}>
              {conteos.todas === 0 ? (
                <>
                  No hay órdenes cargadas. Vuelve al <b>paso 1</b> antes de generar el script.
                </>
              ) : (
                <>
                  Ninguna orden entra en el filtro <b>{ETIQUETAS[filtro]}</b>. Cámbialo para incluir
                  las {conteos.todas} cargadas.
                </>
              )}
            </div>
          ) : (
            <div className="grupo">
              <p className="seccion">Cómo se usa</p>
              <ol className="pasos">
                <li>
                  Abre el formulario HITSS y pulsa <strong>F12</strong>.
                </li>
                <li>
                  Entra a <strong>Console</strong> y pega el script.
                </li>
                <li>
                  Pulsa <strong>Enter</strong>: llena y envía las {ordenes.length} seguidas.
                </li>
              </ol>
              <button
                className="btn btn-chico"
                onClick={onVerInstrucciones}
                style={{ marginTop: 10 }}
              >
                Ver instrucciones completas
              </button>
            </div>
          )}
        </div>

        <div className="pie-vista">
          <button
            className={'btn btn-primario btn-grande btn-copiar' + (copiado ? ' ok' : '')}
            onClick={copiar}
            disabled={!ordenes.length}
          >
            {copiado ? 'Copiado ✓' : 'Copiar script'}
          </button>
          <span className="atajo">
            <kbd>Ctrl</kbd> + <kbd>↵</kbd>
          </span>
        </div>
      </section>

      <section className="tarjeta">
        <div className="tarjeta-cab">
          <h2>Script generado</h2>
          <span className="empuje" />
          <span className="contador">
            {ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'} · {perfil.usuario} ·{' '}
            {formatoFecha} · {lineas} líneas
          </span>
          <button className="btn btn-plano btn-chico" onClick={descargar} title="Guardar como .js">
            ↓
          </button>
        </div>
        <pre className="codigo">{script}</pre>
      </section>
    </>
  );
}
