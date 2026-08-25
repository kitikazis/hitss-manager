import { useMemo, useState } from 'react';
import { parsearPegado } from '../lib/parsearOFS.js';
import { TIPOS } from '../lib/plantillas.js';

const EJEMPLO = `confi am1 lunes
Oracle Field Service
Detalles de actividad
INST CARLEI TARAPOTO FTTH - 4F TARAP, 24/08/26
...
SOT
90220719
...`;

function Ficha({ bloque, contrata, onContrata }) {
  const { orden, avisos, valido, tipoPlantilla, idActividad, franjaOrigen } = bloque;
  const tipo = TIPOS.find((t) => t.id === tipoPlantilla);

  return (
    <div className={'ficha' + (valido ? '' : ' invalida')}>
      <div className="ficha-cab">
        <span className={'etiqueta ' + (valido ? 'ok' : 'error')}>
          {tipo ? tipo.etiqueta : tipoPlantilla}
        </span>
        <b className="mono">{orden.sot || 'Sin SOT'}</b>
        <span className="ficha-cliente">{orden.cliente || 'Sin cliente'}</span>
        <span className="tenue mono">{orden.telefono || 'Sin teléfono'}</span>
        <span className="tenue">
          {orden.fecha || 'Sin fecha'} · {orden.franja} · {orden.departamento} · {orden.gestion}
        </span>
        {idActividad ? <span className="tenue">Actividad {idActividad}</span> : null}
      </div>

      {franjaOrigen && franjaOrigen !== 'cabecera' ? (
        <div className="ficha-origen">
          Franja {orden.franja} detectada del {franjaOrigen}
        </div>
      ) : null}

      <div className="ficha-campos">
        <label>
          Contrata
          <input
            className="mono"
            value={contrata}
            onChange={(e) => onContrata(e.target.value.toUpperCase())}
            placeholder="CARLEI"
          />
        </label>
        <span className="pista">Sale del título de la actividad</span>
      </div>

      {avisos.map((a, i) => (
        <div className="ficha-aviso" key={i}>
          {a}
        </div>
      ))}
    </div>
  );
}

export function PanelPegar({ onAgregar, onToast, abiertoInicial = true }) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const [texto, setTexto] = useState('');
  const [contratas, setContratas] = useState({});

  const bloques = useMemo(() => parsearPegado(texto), [texto]);
  const validos = bloques.filter((b) => b.valido);

  const contrataDe = (b) => (b.orden.sot in contratas ? contratas[b.orden.sot] : b.orden.contrata);

  function limpiar() {
    setTexto('');
    setContratas({});
  }

  function agregarTodo() {
    onAgregar(validos.map((b) => ({ ...b.orden, contrata: contrataDe(b) })));
    onToast(
      validos.length === 1
        ? `Orden ${validos[0].orden.sot} lista`
        : `${validos.length} órdenes agregadas`
    );
    limpiar();
  }

  return (
    <section className="tarjeta">
      <div className="tarjeta-cab">
        <div>
          <h2>Pegar actividad de Oracle Field Service</h2>
          <p className="sub">
            Escribe <code>confi</code> o <code>ciclo</code> arriba del detalle y pégalo; la franja
            sale del propio pegado
          </p>
        </div>
        <div className="empuje" />
        {abierto && texto ? (
          <button className="btn btn-plano btn-chico" onClick={limpiar}>
            Limpiar
          </button>
        ) : null}
        {abierto ? (
          <button
            className="btn btn-primario btn-chico"
            onClick={agregarTodo}
            disabled={!validos.length}
          >
            Agregar {validos.length || ''} {validos.length === 1 ? 'orden' : 'órdenes'}
          </button>
        ) : null}
        <button className="btn btn-chico" onClick={() => setAbierto((v) => !v)}>
          {abierto ? 'Ocultar' : 'Pegar actividad'}
        </button>
      </div>

      {abierto ? (
        <div className="tarjeta-cuerpo">
          <textarea
            className="pegado"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={EJEMPLO}
            spellCheck={false}
          />

          {texto.trim() && !bloques.length ? (
            <div className="alerta error" style={{ marginTop: 12 }}>
              No se reconoció ninguna actividad en el texto pegado.
            </div>
          ) : null}

          {bloques.length ? (
            <div className="fichas">
              {bloques.map((b, i) => (
                <Ficha
                  key={b.orden.sot || i}
                  bloque={b}
                  contrata={contrataDe(b)}
                  onContrata={(v) => setContratas((prev) => ({ ...prev, [b.orden.sot]: v }))}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
