import { useEffect } from 'react';

/*
 * Los pasos viven en un solo sitio: el modal que sale al entrar a Script y el
 * botón "Ver instrucciones" muestran exactamente lo mismo.
 */
export function PasosScript({ modo, cantidad }) {
  const esManual = modo === 'manual';

  return (
    <ol className="pasos">
      <li>Abre el formulario HITSS en una pestaña del navegador.</li>
      <li>
        Presiona <code>F12</code> y entra a la pestaña <strong>Console</strong>.
      </li>
      <li>
        Si Chrome lo pide, escribe <code>allow pasting</code> y presiona Enter.
      </li>
      <li>
        Pulsa <strong>Copiar script</strong> (o <code>Ctrl+Enter</code>), pégalo en la consola y
        presiona <code>Enter</code>.
      </li>
      {esManual ? (
        <>
          <li>
            Se llena la primera orden y se detiene. Revisa los campos y envía tú el formulario.
          </li>
          <li>
            Cuando cargue el formulario nuevo, corre <code>siguienteOrden()</code> para la
            siguiente, hasta terminar las {cantidad}.
          </li>
        </>
      ) : (
        <>
          <li>
            No toques el mouse: llena, envía y pasa a la siguiente hasta terminar las {cantidad}, y
            al final imprime el resumen.
          </li>
          <li>
            Para relanzarlo desde el principio corre <code>autollenarTodo()</code>.
          </li>
        </>
      )}
    </ol>
  );
}

export function ModalInstrucciones({ modo, cantidad, recordar, onRecordar, onCerrar }) {
  useEffect(() => {
    function esc(e) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCerrar]);

  return (
    <div
      className="modal-fondo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="modal modal-ancho" role="dialog" aria-modal="true" aria-labelledby="titulo-instrucciones">
        <h3 id="titulo-instrucciones">Cómo usar el script</h3>
        <p className="sub">
          {modo === 'manual'
            ? 'Modo manual: llena una orden y espera a que tú la envíes.'
            : 'Modo automático: llena y envía todas seguidas.'}
        </p>

        <PasosScript modo={modo} cantidad={cantidad} />

        <div className="modal-acciones">
          <button className="btn btn-primario btn-grande" onClick={onCerrar} autoFocus>
            Entendido
          </button>
          <label className="casilla">
            <input
              type="checkbox"
              checked={!recordar}
              onChange={(e) => onRecordar(!e.target.checked)}
            />
            No volver a mostrar
          </label>
        </div>
      </div>
    </div>
  );
}
