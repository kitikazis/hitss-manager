import { useEffect, useRef, useState } from 'react';
import { AMBIENTES } from '../lib/ambiente';
import { archivosDeArrastre } from '../lib/zip';

/* Iconos de transporte: son los del reproductor, no decoracion. */
const Icono = ({ nombre }) => {
  const trazos = {
    play: 'M4 2.5v11l9-5.5z',
    pausa: 'M4.5 2.5h2.6v11H4.5zm4.4 0h2.6v11H8.9z',
    anterior: 'M4 2.5h1.8v11H4zm10 0v11l-7.4-5.5z',
    siguiente: 'M12 2.5h1.8v11H12zM2 2.5l7.4 5.5L2 13.5z',
  };
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
      <path d={trazos[nombre]} fill="currentColor" />
    </svg>
  );
};

/*
 * Reproductor de la barra de estado: siempre alcanzable, sin robarle alto al
 * trabajo. Aparece solo cuando hay algo cargado o sonando.
 */
export function MiniReproductor({ musica, onAbrir }) {
  const { actual, sonando, ambiente, pistas } = musica;
  const hayAlgo = pistas.length > 0 || ambiente;

  if (!hayAlgo) {
    return (
      <button className="mini-musica vacio-musica" onClick={onAbrir} title="Música (Alt+M)">
        Música
      </button>
    );
  }

  const titulo = actual
    ? musica.nombreCorto(actual.nombre)
    : ambiente
      ? AMBIENTES.find((a) => a.id === ambiente)?.etiqueta
      : 'Sin pista';

  return (
    <div className="mini-musica">
      <button
        className="mini-btn"
        onClick={musica.alternar}
        disabled={!pistas.length}
        title={sonando ? 'Pausar' : 'Reproducir'}
        aria-label={sonando ? 'Pausar' : 'Reproducir'}
      >
        <Icono nombre={sonando ? 'pausa' : 'play'} />
      </button>
      <button
        className="mini-btn"
        onClick={() => musica.siguiente()}
        disabled={pistas.length < 2}
        title="Siguiente pista"
        aria-label="Siguiente pista"
      >
        <Icono nombre="siguiente" />
      </button>
      <button className="mini-titulo" onClick={onAbrir} title="Abrir el reproductor (Alt+M)">
        {titulo}
      </button>
    </div>
  );
}

export function PanelMusica({ musica, abierto, onCerrar }) {
  const entrada = useRef(null);
  const carpeta = useRef(null);
  const [encima, setEncima] = useState(false);

  /* React no conoce estos atributos: se ponen a mano para elegir una carpeta. */
  useEffect(() => {
    if (!carpeta.current) return;
    carpeta.current.setAttribute('webkitdirectory', '');
    carpeta.current.setAttribute('directory', '');
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    function esc(e) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const { pistas, indice, sonando, ambiente } = musica;

  return (
    <aside
      className={'panel-musica' + (encima ? ' soltando' : '')}
      role="dialog"
      aria-label="Música"
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setEncima(false);
        // Entra en las carpetas soltadas: un album se arrastra entero.
        musica.agregar(await archivosDeArrastre(e.dataTransfer));
      }}
    >
      <div className="panel-musica-cab">
        <h2>Música</h2>
        <span className="empuje" />
        <button className="btn btn-plano btn-chico" onClick={onCerrar}>
          Cerrar (Esc)
        </button>
      </div>

      <div className="panel-musica-cuerpo">
        <div className="grupo">
          <p className="seccion">Sonido de fondo</p>
          <div className="deptos-chips">
            {AMBIENTES.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-pressed={ambiente === a.id}
                className={'chip-filtro sin-punto' + (ambiente === a.id ? ' activo' : '')}
                onClick={() => musica.ponerAmbiente(a.id)}
              >
                {a.etiqueta}
              </button>
            ))}
          </div>
          <label className="fila-volumen">
            Volumen
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={musica.volumenAmbiente}
              onChange={(e) => musica.ponerVolumenAmbiente(Number(e.target.value))}
              aria-label="Volumen del sonido de fondo"
            />
          </label>
          <p className="pista">
            Lo genera el navegador: no descarga nada, así que ningún filtro lo bloquea.
          </p>
        </div>

        <div className="grupo">
          <p className="seccion">Tus archivos</p>

          <div className="acciones-musica">
            <button className="btn btn-chico" onClick={() => entrada.current?.click()}>
              Agregar archivos
            </button>
            <button
              className="btn btn-chico"
              onClick={() => carpeta.current?.click()}
              title="Toma todos los audios de la carpeta, incluidas sus subcarpetas"
            >
              Agregar carpeta
            </button>
            {pistas.length ? (
              <>
                <button
                  className={'chip-filtro sin-punto' + (musica.aleatorio ? ' activo' : '')}
                  aria-pressed={musica.aleatorio}
                  onClick={musica.alternarAleatorio}
                  title="Reproducir en orden aleatorio"
                >
                  Aleatorio
                </button>
                <button
                  className={'chip-filtro sin-punto' + (musica.repetir ? ' activo' : '')}
                  aria-pressed={musica.repetir}
                  onClick={musica.alternarRepetir}
                  title="Al terminar la lista, volver a empezar"
                >
                  Repetir
                </button>
                <span className="empuje" />
                <button className="btn btn-chico btn-plano btn-peligro" onClick={musica.vaciar}>
                  Vaciar
                </button>
              </>
            ) : null}
            <input
              ref={entrada}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac,.opus,.wma,.zip"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                musica.agregar(e.target.files);
                e.target.value = '';
              }}
            />
            <input
              ref={carpeta}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                musica.agregar(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {pistas.length ? (
            <>
              <div className="transporte">
                <button className="btn btn-chico" onClick={musica.anterior} aria-label="Anterior">
                  <Icono nombre="anterior" />
                </button>
                <button
                  className="btn btn-chico btn-transporte"
                  onClick={musica.alternar}
                  aria-label={sonando ? 'Pausar' : 'Reproducir'}
                >
                  <Icono nombre={sonando ? 'pausa' : 'play'} />
                </button>
                <button
                  className="btn btn-chico"
                  onClick={() => musica.siguiente()}
                  aria-label="Siguiente"
                >
                  <Icono nombre="siguiente" />
                </button>
                <label className="fila-volumen">
                  Volumen
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={musica.volumen}
                    onChange={(e) => musica.ponerVolumen(Number(e.target.value))}
                    aria-label="Volumen de la música"
                  />
                </label>
              </div>

              <ul className="lista-pistas">
                {pistas.map((p, i) => (
                  <li key={p.id} className={i === indice ? 'activa' : undefined}>
                    <button
                      type="button"
                      className="pista-nombre"
                      onClick={() => musica.reproducir(i)}
                      title={p.nombre}
                    >
                      <span className="pista-num">{i === indice && sonando ? '▸' : i + 1}</span>
                      {musica.nombreCorto(p.nombre)}
                    </button>
                    <button
                      type="button"
                      className="pista-quitar"
                      onClick={() => musica.quitar(p.id)}
                      title={'Quitar ' + p.nombre}
                      aria-label={'Quitar ' + p.nombre}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="pista">
              Tres formas de cargar varias de una: <b>Agregar carpeta</b> toma todos los audios de
              una carpeta y sus subcarpetas; <b>Agregar archivos</b> acepta selección múltiple
              (Ctrl+A en el cuadro de Windows) y también <b>archivos .zip</b>, que se abren aquí
              mismo; o arrastra la carpeta hasta este panel. Todo suena desde tu PC: no se sube a
              ningún lado ni pasa por internet.
            </p>
          )}

          {pistas.length && !musica.persistible ? (
            <p className="pista" style={{ marginTop: 8 }}>
              Esta lista dura hasta que cierres la pestaña; con la app abierta desde el navegador se
              guarda sola.
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
