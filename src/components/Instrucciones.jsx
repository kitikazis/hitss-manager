import { useEffect } from 'react';

/*
 * Los pasos y los problemas frecuentes viven en un solo sitio: el modal que sale
 * al entrar a Script y el botón "Ver instrucciones" muestran lo mismo.
 * Escrito para gente que no programa: nada de jerga, todo con qué hacer.
 */
export function PasosScript({ cantidad }) {
  return (
    <ol className="pasos">
      <li>
        Abre el <strong>formulario HITSS</strong> y espera a que se vean las preguntas.
      </li>
      <li>
        Con el formulario adelante, presiona <code>F12</code>. Se abre un panel al costado o
        abajo.
      </li>
      <li>
        En ese panel, entra a la pestaña <strong>Console</strong>.
      </li>
      <li>
        Vuelve aquí, pulsa <strong>Copiar script</strong> y pégalo en la consola con{' '}
        <code>Ctrl+V</code>.
      </li>
      <li>
        Presiona <code>Enter</code>. Empieza a llenar y enviar las {cantidad} órdenes solo.
      </li>
      <li>
        <strong>No toques el mouse ni cambies de pestaña</strong> hasta que termine. Al final
        muestra un <strong>RESUMEN</strong> con lo enviado.
      </li>
    </ol>
  );
}

const PROBLEMAS = [
  {
    problema: 'Presiono F12 y no pasa nada',
    solucion: (
      <>
        Prueba con <code>Ctrl+Shift+J</code>. Si tampoco, haz clic derecho sobre la página →{' '}
        <strong>Inspeccionar</strong>, y arriba elige <strong>Console</strong>. En algunas laptops
        hay que presionar <code>Fn+F12</code>.
      </>
    ),
  },
  {
    problema: 'Sale un aviso y no me deja pegar',
    solucion: (
      <>
        Chrome avisa cuando pegas algo en la consola por primera vez. Escribe{' '}
        <code>allow pasting</code>, presiona <code>Enter</code> y vuelve a pegar el script.
      </>
    ),
  },
  {
    problema: 'Pegué, di Enter y no hizo nada',
    solucion: (
      <>
        Casi siempre es que la consola no es la del formulario. Cierra ese panel, ve a la ventana
        donde está el <strong>formulario HITSS</strong> y abre la consola ahí.
      </>
    ),
  },
  {
    problema: 'Dice «No se encontro boton de Enviar/Submit»',
    solucion: (
      <>
        El formulario no está abierto o ya quedó en la pantalla de agradecimiento. Recárgalo con{' '}
        <code>F5</code>, espera a que se vean las preguntas y pega el script de nuevo.
      </>
    ),
  },
  {
    problema: 'Dice «No se encontro opcion: …»',
    solucion: (
      <>
        Ese valor no existe en el formulario: suele ser un departamento o una franja que no
        coincide. La consola lista las opciones válidas. Corrige la orden en{' '}
        <strong>Órdenes</strong> y copia el script otra vez.
      </>
    ),
  },
  {
    problema: 'Se detuvo a la mitad',
    solucion: (
      <>
        Mira el resumen: dice <strong>Total procesadas: 3 / 14</strong>. Las que faltan no se
        enviaron. Recarga el formulario, borra en la app las que ya salieron y vuelve a correr el
        script.
      </>
    ),
  },
  {
    problema: 'Cambié de pestaña y se puso lentísimo',
    solucion: (
      <>
        El navegador frena las pestañas que no estás mirando. Deja la del formulario adelante
        hasta que termine.
      </>
    ),
  },
  {
    problema: 'Lo pegué dos veces',
    solucion: (
      <>
        Se envía todo de nuevo y quedan órdenes duplicadas. Antes de volver a pegarlo, recarga el
        formulario.
      </>
    ),
  },
];

export function ModalInstrucciones({ cantidad, recordar, onRecordar, onCerrar }) {
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
      <div
        className="modal modal-ancho"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-instrucciones"
      >
        <h3 id="titulo-instrucciones">Cómo usar el script</h3>
        <p className="sub">Llena y envía las {cantidad} órdenes seguidas, sin que hagas nada.</p>

        <div className="modal-scroll">
          <PasosScript cantidad={cantidad} />

          <h4 className="modal-subtitulo">Si algo sale mal</h4>
          <dl className="problemas">
            {PROBLEMAS.map((p) => (
              <div className="problema" key={p.problema}>
                <dt>{p.problema}</dt>
                <dd>{p.solucion}</dd>
              </div>
            ))}
          </dl>
        </div>

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
