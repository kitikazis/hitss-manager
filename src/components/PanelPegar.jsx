import { useMemo, useState } from 'react';
import { Segmentado } from './Campos';
import { parsearPegado } from '../lib/parsearOFS.js';
import { CLASE_TIPO, COLOR_TIPO, TIPOS, etiquetaTipo } from '../lib/plantillas.js';
import {
  DEPARTAMENTOS,
  FRANJAS,
  LISTA_CONTRATAS,
  SOT_MANUALES,
  SOT_MANUAL_DEFAULT,
  SOT_MANUAL_PROGRAMACION,
} from '../lib/constantes.js';

const EJEMPLO = `Oracle Field Service
Detalles de actividad
INST CARLEI TARAPOTO FTTH - 4F TARAP, 24/08/26
Datos de la actividad
ID de actividad
22787020
SOT
90220719
...`;

const AUTO = { id: '', etiqueta: 'Auto' };
const OPCIONES_TIPO = [AUTO, ...TIPOS];
const OPCIONES_FRANJA = [AUTO, ...FRANJAS.map((f) => ({ id: f, etiqueta: f }))];

function Ficha({ bloque, contrata, onContrata }) {
  const { orden, avisos, valido, tipoPlantilla, idActividad, franjaOrigen } = bloque;

  return (
    <div className={'ficha ' + CLASE_TIPO[tipoPlantilla] + (valido ? '' : ' invalida')}>
      <div className="ficha-cab">
        <span className={'etiqueta ' + (valido ? COLOR_TIPO[tipoPlantilla] : 'error')}>
          {etiquetaTipo(tipoPlantilla)}
        </span>
        <b className="mono">{orden.sot || 'Sin SOT'}</b>
        <span className="ficha-cliente">{orden.cliente || 'Sin cliente'}</span>
        <span className="tenue mono">{orden.telefono || 'Sin teléfono'}</span>
        <span className="tenue">
          {orden.fecha || 'Sin fecha'} · {orden.franja} · {orden.departamento}
        </span>
        {idActividad ? <span className="tenue">Actividad {idActividad}</span> : null}
      </div>

      {franjaOrigen && franjaOrigen !== 'cabecera' ? (
        <div className="ficha-origen">
          Franja {orden.franja} según {franjaOrigen}
        </div>
      ) : null}

      <div className="ficha-campos">
        <label>
          Contrata
          <input
            value={contrata}
            onChange={(e) => onContrata(e.target.value.toUpperCase())}
            list={LISTA_CONTRATAS}
            placeholder="Sin contrata"
          />
        </label>
      </div>

      {avisos.map((a, i) => (
        <div className="ficha-aviso" key={i}>
          {a}
        </div>
      ))}
    </div>
  );
}

export function PanelPegar({
  onAgregar,
  onToast,
  modo,
  onModo,
  deptosD1,
  onDeptosD1,
  abierto,
  onAbierto,
}) {
  const [texto, setTexto] = useState('');
  const [contratas, setContratas] = useState({});
  const [tipo, setTipo] = useState('');
  const [franja, setFranja] = useState('');
  const [editandoDeptos, setEditandoDeptos] = useState(false);

  // La lista de departamentos rige en automatico y al trabajar PROGRAMACIONES D+1.
  const usaLista = !modo || modo === SOT_MANUAL_PROGRAMACION;

  const bloques = useMemo(
    () => parsearPegado(texto, { tipo, franja, sotManual: modo, deptosD1 }),
    [texto, tipo, franja, modo, deptosD1]
  );
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
          <p className="sub">Elige el tipo y la franja, pega el detalle y agrega</p>
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
        <button className="btn btn-chico" onClick={() => onAbierto(!abierto)}>
          {abierto ? 'Ocultar' : 'Pegar actividad'}
        </button>
      </div>

      {abierto ? (
        <div className="tarjeta-cuerpo">
          <div className="opciones-pegado">
            <div className="opcion">
              <p className="seccion">Tipo</p>
              <Segmentado valor={tipo} onCambio={setTipo} opciones={OPCIONES_TIPO} />
              <span className="pista">
                {tipo
                  ? `Todas entran como ${etiquetaTipo(tipo)}`
                  : 'Auto: lo toma de la cabecera del pegado (confi, ciclo, rechazo)'}
              </span>
            </div>

            <div className="opcion">
              <p className="seccion">Franja</p>
              <Segmentado valor={franja} onCambio={setFranja} opciones={OPCIONES_FRANJA} />
              <span className="pista">
                {franja
                  ? `Todas entran como ${franja}`
                  : 'Auto: la toma del intervalo u horario del pegado'}
              </span>
            </div>
            <div className="opcion">
              <p className="seccion">Modo</p>
              <select
                value={modo}
                onChange={(e) => onModo(e.target.value)}
                aria-label="SOT gestionada manual"
              >
                <option value="">Automático por departamento</option>
                {SOT_MANUALES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="pista">
                {!usaLista ? (
                  `Todas entran como ${modo}`
                ) : (
                  <>
                    {deptosD1.length === 0
                      ? modo
                        ? `Todas entran como ${modo}`
                        : `Ningún departamento va como ${SOT_MANUAL_PROGRAMACION}`
                      : `${modo ? 'Solo en' : SOT_MANUAL_PROGRAMACION + ' en'} ${
                          deptosD1.length <= 3
                            ? deptosD1.join(', ')
                            : deptosD1.length + ' departamentos'
                        }`}{' '}
                    <button
                      type="button"
                      className="enlace"
                      onClick={() => setEditandoDeptos((v) => !v)}
                    >
                      {editandoDeptos ? 'listo' : 'elegir departamentos'}
                    </button>
                  </>
                )}
              </span>
            </div>
          </div>

          {usaLista && editandoDeptos ? (
            <div className="deptos-d1">
              <p className="seccion">Tus departamentos de {SOT_MANUAL_PROGRAMACION}</p>
              <p className="pista" style={{ marginBottom: 10 }}>
                Los marcados entran como {SOT_MANUAL_PROGRAMACION}; el resto, como{' '}
                {SOT_MANUAL_DEFAULT}.
                {modo ? '' : ' Sin marcar ninguno, todas van como ' + SOT_MANUAL_DEFAULT + '.'}
              </p>
              <div className="deptos-chips">
                {DEPARTAMENTOS.map((d) => {
                  const activo = deptosD1.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={activo}
                      className={'chip-filtro sin-punto' + (activo ? ' activo' : '')}
                      onClick={() =>
                        onDeptosD1(activo ? deptosD1.filter((x) => x !== d) : [...deptosD1, d])
                      }
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

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
