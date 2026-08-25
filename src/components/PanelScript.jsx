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
  modo,
  onModo,
  formatoFecha,
  onFormatoFecha,
  conteos,
  onToast,
}) {
  const esManual = modo === 'manual';

  async function copiar() {
    const ok = await copiarAlPortapapeles(script);
    onToast(ok ? 'Script copiado' : 'No se pudo copiar: selecciona el código manualmente');
  }

  function descargar() {
    const sufijo = filtro === 'todas' ? '' : `-${filtro}`;
    descargarArchivo(
      `hitss-${perfil.usuario}${sufijo}-${modo}-${hoyArchivo()}.js`,
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
            <p className="sub">Definen qué órdenes entran y cómo se ejecuta</p>
          </div>
        </div>

        <div className="tarjeta-cuerpo">
          <div className="rejilla">
            <Campo label="Modo de ejecución">
              <select value={modo} onChange={(e) => onModo(e.target.value)}>
                <option value="manual">Manual, una por una</option>
                <option value="auto">Automático, todas seguidas</option>
              </select>
              <span className="pista">
                {esManual ? 'Llena una y espera a que la envíes' : 'Llena y envía todas seguidas'}
              </span>
            </Campo>

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
            <h2>Cómo ejecutarlo</h2>
          </div>
        </div>
        <div className="tarjeta-cuerpo">
          <ol className="pasos">
            <li>Abre el formulario HITSS en una pestaña del navegador.</li>
            <li>
              Presiona <code>F12</code> y entra a la pestaña <strong>Console</strong>.
            </li>
            <li>
              Si Chrome lo pide, escribe <code>allow pasting</code> y presiona Enter.
            </li>
            <li>
              Pulsa <strong>Copiar script</strong>, pégalo en la consola y presiona{' '}
              <code>Enter</code>.
            </li>
            {esManual ? (
              <>
                <li>
                  Se llena la primera orden y se detiene. Revisa los campos y envía tú el
                  formulario.
                </li>
                <li>
                  Cuando cargue el formulario nuevo, corre <code>siguienteOrden()</code> para la
                  siguiente, hasta terminar las {ordenes.length}.
                </li>
              </>
            ) : (
              <>
                <li>
                  No toques el mouse: llena, envía y pasa a la siguiente hasta terminar las{' '}
                  {ordenes.length}, y al final imprime el resumen.
                </li>
                <li>
                  Para relanzarlo desde el principio corre <code>autollenarTodo()</code>.
                </li>
              </>
            )}
          </ol>

          <div className="alerta info" style={{ marginTop: 16 }}>
            El script llena Usuario E, SOT, FECHA, FRANJA, GESTION, DEPARTAMENTO, YA TIENE GESTION y
            SOT GESTIONADA MANUAL. Cliente, teléfono y contrata solo se usan en las plantillas.
          </div>
        </div>
      </section>

      <section className="tarjeta">
        <div className="tarjeta-cab">
          <div>
            <h2>Script generado</h2>
            <p className="sub">
              {ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'} · usuario{' '}
              {perfil.usuario} · fechas en {formatoFecha} · {script.split('\n').length} líneas
            </p>
          </div>
          <div className="empuje" />
          <button className="btn btn-primario btn-chico" onClick={copiar}>
            Copiar script
          </button>
          <button className="btn btn-chico" onClick={descargar}>
            Descargar .js
          </button>
        </div>
        <pre className="codigo">{script}</pre>
      </section>
    </>
  );
}
