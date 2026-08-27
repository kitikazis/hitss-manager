import { useEffect, useMemo, useState } from 'react';
import { Segmentado } from './Campos';
import { parsearPegado } from '../lib/parsearOFS.js';
import { aISO, deISO, fechaRelativa } from '../lib/utils.js';
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
const OPCIONES_FECHA = [AUTO, { id: 'hoy', etiqueta: 'Hoy' }, { id: 'manana', etiqueta: 'Mañana' }, { id: 'otra', etiqueta: 'Otra' }];
const OPCIONES_TIPO = [AUTO, ...TIPOS.map((t) => ({ id: t.id, etiqueta: t.id === 'CICLO' ? 'Ciclo' : t.etiqueta }))];
const OPCIONES_FRANJA = [AUTO, ...FRANJAS.map((f) => ({ id: f, etiqueta: f }))];

/*
 * Ficha de una actividad reconocida. Lo que falte se completa aqui mismo: si el
 * operador lo deja para despues, la orden entra incompleta y hay que buscarla.
 */
function Ficha({ bloque, valores, onCampo, duplicada, forzada, onForzar }) {
  const { orden, avisos, valido, tipoPlantilla, idActividad, franjaOrigen, fechaOFS } = bloque;
  const falta = (campo) => !String(valores[campo] || '').trim();

  return (
    <div
      className={
        'ficha ' + CLASE_TIPO[tipoPlantilla] + (valido ? '' : ' invalida') + (duplicada && !forzada ? ' repetida' : '')
      }
    >
      <div className="ficha-cab">
        <span className={'etiqueta ' + (valido ? COLOR_TIPO[tipoPlantilla] : 'error')}>
          {etiquetaTipo(tipoPlantilla)}
        </span>
        <b className="mono">{orden.sot || 'Sin SOT'}</b>
        <span className="tenue">
          {valores.fecha || 'Sin fecha'} · {orden.franja} · {orden.departamento}
        </span>
        {idActividad ? <span className="tenue">Actividad {idActividad}</span> : null}
        <span className="empuje" />
        {duplicada ? (
          <span className="ficha-repetida">
            Ya está cargada
            <button type="button" className="enlace" onClick={() => onForzar(!forzada)}>
              {forzada ? 'no agregar' : 'agregar igual'}
            </button>
          </span>
        ) : null}
      </div>

      {fechaOFS && fechaOFS !== valores.fecha ? (
        <div className="ficha-aviso">
          Entra con {valores.fecha}; en OFS estaba programada para {fechaOFS}.
        </div>
      ) : null}

      {franjaOrigen && franjaOrigen !== 'cabecera' ? (
        <div className="ficha-origen">
          Franja {orden.franja} según {franjaOrigen}
        </div>
      ) : null}

      {/* Los cuatro campos que necesita la plantilla, editables antes de entrar. */}
      <div className="ficha-campos">
        <label className={falta('cliente') ? 'falta' : undefined}>
          Cliente
          <input
            value={valores.cliente}
            onChange={(e) => onCampo('cliente', e.target.value)}
            placeholder="Sin cliente"
          />
        </label>
        <label className={falta('telefono') ? 'falta' : undefined}>
          Teléfono
          <input
            className="mono"
            value={valores.telefono}
            onChange={(e) => onCampo('telefono', e.target.value)}
            placeholder="Sin teléfono"
            inputMode="tel"
          />
        </label>
        <label className={falta('fecha') ? 'falta' : undefined}>
          Fecha
          <input
            type="date"
            value={aISO(valores.fecha)}
            onChange={(e) => onCampo('fecha', deISO(e.target.value))}
          />
        </label>
        <label>
          Contrata
          <input
            value={valores.contrata}
            onChange={(e) => onCampo('contrata', e.target.value.toUpperCase())}
            list={LISTA_CONTRATAS}
            placeholder="Sin contrata"
          />
        </label>
      </div>

      {avisos
        .filter((a) => !/nombre del cliente|el teléfono|fecha de programación/i.test(a))
        .map((a, i) => (
          <div className="ficha-aviso" key={i}>
            {a}
          </div>
        ))}
    </div>
  );
}

/*
 * Cajón: se abre sobre el banco de trabajo y se cierra solo al agregar. Antes
 * era una banda fija arriba que se llevaba 193 px de pantalla aunque ya no se
 * usara. El tipo y la franja quedan a la vista porque OFS casi nunca trae el
 * intervalo, y se recuerdan de una tanda a la siguiente.
 */
export function PanelPegar({
  onAgregar,
  onToast,
  modo,
  onModo,
  deptosD1,
  onDeptosD1,
  abierto,
  onAbierto,
  opciones,
  onOpciones,
  sotsCargados = [],
}) {
  const [texto, setTexto] = useState('');
  const [ediciones, setEdiciones] = useState({});
  const [forzados, setForzados] = useState({});
  const [editandoDeptos, setEditandoDeptos] = useState(false);
  const [masAbiertas, setMasAbiertas] = useState(false);

  const { tipo = '', franja = '', cuando = '', otraFecha = '' } = opciones || {};
  const set = (cambios) => onOpciones({ ...opciones, ...cambios });

  // Fecha con la que entran las ordenes nuevas; vacia = la que traiga el pegado.
  const fechaElegida =
    cuando === 'hoy'
      ? fechaRelativa(0)
      : cuando === 'manana'
        ? fechaRelativa(1)
        : cuando === 'otra'
          ? deISO(otraFecha)
          : '';

  // La lista de departamentos rige en automatico y al trabajar PROGRAMACIONES D+1.
  const usaLista = !modo || modo === SOT_MANUAL_PROGRAMACION;

  const bloques = useMemo(
    () => parsearPegado(texto, { tipo, franja, sotManual: modo, deptosD1, fecha: fechaElegida }),
    [texto, tipo, franja, modo, deptosD1, fechaElegida]
  );

  const valoresDe = (b) => ({ ...b.orden, ...(ediciones[b.orden.sot] || {}) });
  const esDuplicada = (b) => Boolean(b.orden.sot) && sotsCargados.includes(b.orden.sot);
  const entra = (b) => b.valido && (!esDuplicada(b) || forzados[b.orden.sot]);

  const validos = bloques.filter(entra);
  const repetidas = bloques.filter((b) => esDuplicada(b) && !forzados[b.orden.sot]).length;
  const incompletos = validos.filter((b) => {
    const v = valoresDe(b);
    return !v.cliente || !v.telefono || !v.fecha;
  }).length;

  useEffect(() => {
    if (!abierto) return;
    function esc(e) {
      if (e.key === 'Escape') onAbierto(false);
    }
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [abierto, onAbierto]);

  if (!abierto) return null;

  function limpiar() {
    setTexto('');
    setEdiciones({});
    setForzados({});
  }

  function agregarTodo() {
    onAgregar(validos.map(valoresDe));
    onToast(
      validos.length === 1
        ? `Orden ${validos[0].orden.sot} lista`
        : `${validos.length} órdenes agregadas`
    );
    limpiar();
    onAbierto(false);
  }

  const editarCampo = (sot) => (campo, valor) =>
    setEdiciones((prev) => ({ ...prev, [sot]: { ...(prev[sot] || {}), [campo]: valor } }));

  return (
    <>
      <div className="velo" onClick={() => onAbierto(false)} />

      <section className="cajon" role="dialog" aria-label="Pegar actividad de Oracle Field Service">
        <div className="cajon-cab">
          <h2>Pegar actividad de Oracle Field Service</h2>
          <span className="empuje" />
          {bloques.length ? (
            <span className="contador">
              {validos.length} {validos.length === 1 ? 'entra' : 'entran'}
              {repetidas ? ` · ${repetidas} ya cargada${repetidas > 1 ? 's' : ''}` : ''}
              {incompletos ? ` · ${incompletos} sin completar` : ''}
            </span>
          ) : null}
          {texto ? (
            <button className="btn btn-plano btn-chico" onClick={limpiar}>
              Limpiar
            </button>
          ) : null}
          <button className="btn btn-primario" onClick={agregarTodo} disabled={!validos.length}>
            Agregar {validos.length || ''} {validos.length === 1 ? 'orden' : 'órdenes'}
          </button>
          <button className="btn btn-plano btn-chico" onClick={() => onAbierto(false)}>
            Cerrar (Esc)
          </button>
        </div>

        <div className="cajon-cuerpo">
          {/* Tipo y franja siempre a la vista: OFS casi nunca trae el intervalo. */}
          <div className="opciones-fila">
            <span className="opcion-rotulo">Entran como</span>
            <Segmentado valor={tipo} onCambio={(v) => set({ tipo: v })} opciones={OPCIONES_TIPO} />
            <Segmentado valor={franja} onCambio={(v) => set({ franja: v })} opciones={OPCIONES_FRANJA} />
            <span className="tenue">{fechaElegida || 'fecha del pegado'}</span>
            <span className="tenue">·</span>
            <span className="tenue">{modo || 'modo automático'}</span>
            <button
              type="button"
              className="enlace"
              onClick={() => setMasAbiertas((v) => !v)}
              aria-expanded={masAbiertas}
            >
              {masAbiertas ? 'listo' : 'fecha y modo'}
            </button>
          </div>

          <div className="opciones-pegado" hidden={!masAbiertas}>
            <div className="opcion">
              <p className="seccion">Fecha de las nuevas</p>
              <Segmentado valor={cuando} onCambio={(v) => set({ cuando: v })} opciones={OPCIONES_FECHA} />
              {cuando === 'otra' ? (
                <input
                  type="date"
                  className="fecha-otra"
                  value={otraFecha}
                  onChange={(e) => set({ otraFecha: e.target.value })}
                  aria-label="Fecha para las órdenes nuevas"
                />
              ) : null}
              <span className="pista">
                {fechaElegida
                  ? `Las que agregues ahora quedan con ${fechaElegida}`
                  : 'Auto: la fecha de programación que trae el pegado'}
              </span>
            </div>

            <div className="opcion">
              <p className="seccion">Modo de las nuevas</p>
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
                  `Las que agregues ahora entran como ${modo}. Las ya cargadas no cambian.`
                ) : (
                  <>
                    {deptosD1.length === 0
                      ? modo
                        ? `Las que agregues ahora entran como ${modo}`
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

          {masAbiertas && usaLista && editandoDeptos ? (
            <div className="deptos-d1">
              <p className="seccion">Tus departamentos de {SOT_MANUAL_PROGRAMACION}</p>
              <p className="pista" style={{ marginBottom: 8 }}>
                Rige para las órdenes que agregues de ahora en adelante: las marcadas entran como{' '}
                {SOT_MANUAL_PROGRAMACION} y el resto como {SOT_MANUAL_DEFAULT}.
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
            autoFocus
          />

          {texto.trim() && !bloques.length ? (
            <div className="alerta error" style={{ marginTop: 10 }}>
              No se reconoció ninguna actividad en el texto pegado.
            </div>
          ) : null}

          {bloques.length ? (
            <div className="fichas">
              {bloques.map((b, i) => (
                <Ficha
                  key={b.orden.sot || i}
                  bloque={b}
                  valores={valoresDe(b)}
                  onCampo={editarCampo(b.orden.sot)}
                  duplicada={esDuplicada(b)}
                  forzada={Boolean(forzados[b.orden.sot])}
                  onForzar={(v) => setForzados((prev) => ({ ...prev, [b.orden.sot]: v }))}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
