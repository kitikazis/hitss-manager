import { useEffect, useMemo, useRef, useState } from 'react';
import { Campo, Segmentado, Select } from './Campos';
import { PanelPegar } from './PanelPegar';
import {
  CLASE_TIPO,
  COLOR_TIPO,
  TIPOS,
  camposPorDefecto,
  construirPlantilla,
  contextoPlantilla,
  etiquetaTipo,
  tipoDeOrden,
} from '../lib/plantillas';
import {
  DEPARTAMENTOS,
  FRANJAS,
  LISTA_CONTRATAS,
  MOTIVOS_CICLO,
  MOTIVOS_RECHAZO,
  RECHAZO_TIPOS,
} from '../lib/constantes';
import { aISO, copiarAlPortapapeles, deISO, descargarArchivo, fechaRelativa, horaCorta } from '../lib/utils';

function ListaOrdenes({
  ordenes,
  seleccionada,
  onSeleccionar,
  busqueda,
  onBusqueda,
  total,
  filtroTipo,
  onFiltroTipo,
  conteos,
}) {
  const caja = useRef(null);

  /* Si la elegida quedo fuera del area visible, la lista se mueve hasta ella. */
  useEffect(() => {
    const caja2 = caja.current;
    const activo = caja2?.querySelector(".lista-item.activo");
    if (!activo) return;
    const item = activo.getBoundingClientRect();
    const lista = caja2.getBoundingClientRect();
    if (item.top < lista.top) {
      caja2.scrollTop -= lista.top - item.top + 8;
    } else if (item.bottom > lista.bottom) {
      caja2.scrollTop += item.bottom - lista.bottom + 8;
    }
  }, [seleccionada?.id, ordenes.length]);

  return (
    <section className="tarjeta">
      <div className="tarjeta-cab">
        <div>
          <h2>Órdenes</h2>
          <p className="sub">
            {busqueda || filtroTipo
              ? `${ordenes.length} de ${total}`
              : `${total} ${total === 1 ? 'orden' : 'órdenes'}`}
          </p>
        </div>
      </div>

      <div className="filtros">
        <button
          type="button"
          className={'chip-filtro' + (filtroTipo === '' ? ' activo' : '')}
          onClick={() => onFiltroTipo('')}
        >
          Todas <b>{total}</b>
        </button>
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={
              'chip-filtro ' + CLASE_TIPO[t.id] + (filtroTipo === t.id ? ' activo' : '')
            }
            onClick={() => onFiltroTipo(filtroTipo === t.id ? '' : t.id)}
          >
            {t.etiqueta} <b>{conteos[t.id] || 0}</b>
          </button>
        ))}
      </div>
      <div className="buscador">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
          placeholder="Buscar SOT o cliente"
          aria-label="Buscar órdenes por SOT o cliente"
        />
      </div>

      {ordenes.length === 0 ? (
        <div className="vacio">Ninguna orden coincide con «{busqueda}».</div>
      ) : null}

      <div className="lista" ref={caja}>
        {ordenes.map((o) => {
          const tipo = tipoDeOrden(o);
          return (
            <button
              key={o.id}
              type="button"
              className={
                'lista-item ' +
                CLASE_TIPO[tipo] +
                (seleccionada?.id === o.id ? ' activo' : '')
              }
              onClick={() => onSeleccionar(o.id)}
            >
              <span className="lista-fila">
                <span className="lista-sot">{o.sot}</span>
                <span className={'etiqueta chica ' + COLOR_TIPO[tipo]}>{etiquetaTipo(tipo)}</span>
              </span>
              <span className="lista-cliente">{o.cliente || 'Sin cliente'}</span>
              <span className="lista-meta">
                <span>
                  {o.fecha || 'Sin fecha'} · {o.franja} · {o.departamento}
                </span>
                {o.creadaEn ? (
                  <span className="lista-hora" title="Hora en que se agregó">
                    {horaCorta(o.creadaEn)}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CamposDinamicos({ tipo, extra, set }) {
  if (tipo === 'CICLO') {
    return (
      <>
        <Campo label="Ciclo Nro">
          <input value={extra.cicloNro} onChange={(e) => set('cicloNro', e.target.value)} inputMode="numeric" />
        </Campo>
        <Campo label="Cantidad">
          <input value={extra.cantidad} onChange={(e) => set('cantidad', e.target.value)} inputMode="numeric" />
        </Campo>
        <Campo label="Motivo">
          <Select value={extra.motivo} onChange={(v) => set('motivo', v)} opciones={MOTIVOS_CICLO} />
        </Campo>
        <Campo label="Sub-motivo">
          <input value={extra.subMotivo} onChange={(e) => set('subMotivo', e.target.value)} />
        </Campo>
      </>
    );
  }

  if (tipo === 'RECHAZO') {
    return (
      <>
        <Campo label="Rechazo en">
          <Select value={extra.rechazoTipo} onChange={(v) => set('rechazoTipo', v)} opciones={RECHAZO_TIPOS} />
        </Campo>
        <Campo label="Persona que contesta">
          <input value={extra.persona} onChange={(e) => set('persona', e.target.value)} />
        </Campo>
        <Campo label="Motivo">
          <Select value={extra.motivo} onChange={(v) => set('motivo', v)} opciones={MOTIVOS_RECHAZO} />
        </Campo>
        <Campo label="Sub-motivo">
          <input value={extra.subMotivo} onChange={(e) => set('subMotivo', e.target.value)} />
        </Campo>
      </>
    );
  }

  return null;
}

export function PanelPlantillas({
  ordenes,
  perfil,
  modo,
  onModo,
  deptosD1,
  onDeptosD1,
  pegadoAbierto,
  onPegadoAbierto,
  onAgregarOrdenes,
  onActualizarOrden,
  onToast,
}) {
  const [idSeleccion, setIdSeleccion] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [tipo, setTipo] = useState('CONFI');
  const [extra, setExtra] = useState(() => camposPorDefecto('CONFI', null));
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef(null);

  const conteos = useMemo(() => {
    const c = {};
    ordenes.forEach((o) => {
      const t = tipoDeOrden(o);
      c[t] = (c[t] || 0) + 1;
    });
    return c;
  }, [ordenes]);

  /* Lo ultimo cargado va arriba: es lo que se acaba de gestionar. */
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return ordenes
      .filter((o) => {
        if (filtroTipo && tipoDeOrden(o) !== filtroTipo) return false;
        if (!q) return true;
        return (
          o.sot.toLowerCase().includes(q) ||
          (o.cliente || '').toLowerCase().includes(q) ||
          (o.telefono || '').includes(q)
        );
      })
      .reverse();
  }, [ordenes, busqueda, filtroTipo]);

  // Si la orden elegida se borro (o no hay ninguna elegida) cae en la primera.
  const seleccionada = ordenes.find((o) => o.id === idSeleccion) || visibles[0] || ordenes[0] || null;

  // Cada orden abre con su propio tipo: el guardado, o el que sugiere su gestion.
  useEffect(() => {
    if (seleccionada) setTipo(tipoDeOrden(seleccionada));
  }, [seleccionada?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cambiar de orden o de tipo, el formulario propio del tipo vuelve a su base.
  useEffect(() => {
    setExtra(camposPorDefecto(tipo, seleccionada));
  }, [tipo, seleccionada?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (campo, valor) => setExtra((prev) => ({ ...prev, [campo]: valor }));

  // Ctrl+Enter copia sin soltar el teclado.
  useEffect(() => {
    function atajo(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && ordenes.length) {
        e.preventDefault();
        copiar();
      }
    }
    document.addEventListener('keydown', atajo);
    return () => document.removeEventListener('keydown', atajo);
  }); // sin deps: usa siempre la plantilla vigente

  /* Cambiar el tipo lo guarda en la orden, para que la lista lo muestre en su color. */
  function cambiarTipo(nuevo) {
    setTipo(nuevo);
    if (seleccionada) onActualizarOrden(seleccionada.id, { tipoPlantilla: nuevo });
  }
  const editar = (campo) => (valor) => onActualizarOrden(seleccionada.id, { [campo]: valor });

  const plantilla = useMemo(
    () => construirPlantilla({ tipo, orden: seleccionada, extra, perfil }),
    [tipo, seleccionada, extra, perfil]
  );

  function agregarDesdePegado(lista) {
    const nuevas = onAgregarOrdenes(lista);
    // Se elige la ultima del lote: es la que queda arriba en la lista.
    if (nuevas && nuevas.length) setIdSeleccion(nuevas[nuevas.length - 1].id);
  }

  async function copiar() {
    const ok = await copiarAlPortapapeles(plantilla);
    if (ok) {
      setCopiado(true);
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setCopiado(false), 1800);
    }
    onToast(ok ? 'Plantilla copiada' : 'No se pudo copiar: selecciona el texto manualmente');
  }

  function descargar() {
    descargarArchivo(`plantilla-${tipo}-${seleccionada.sot}.md`, plantilla, 'text/markdown;charset=utf-8');
    onToast('Plantilla descargada');
  }

  const pegar = (
    <PanelPegar
      onAgregar={agregarDesdePegado}
      onToast={onToast}
      modo={modo}
      onModo={onModo}
      deptosD1={deptosD1}
      onDeptosD1={onDeptosD1}
      abierto={pegadoAbierto}
      onAbierto={onPegadoAbierto}
    />
  );

  if (!ordenes.length) {
    return (
      <>
        {pegar}
        <section className="tarjeta">
        <div className="vacio">
          <strong>Sin órdenes que armar</strong>
          Pega una actividad arriba o cárgala a mano en la pestaña Órdenes.
        </div>
        </section>
      </>
    );
  }

  const faltantes = [
    !seleccionada.cliente && 'cliente',
    !seleccionada.telefono && 'teléfono',
    !seleccionada.fecha && 'fecha',
  ].filter(Boolean);

  return (
    <>
      {pegar}

      <div className="plantillas">
        <aside className="columna-lateral">
          <ListaOrdenes
            ordenes={visibles}
            total={ordenes.length}
            busqueda={busqueda}
            onBusqueda={setBusqueda}
            filtroTipo={filtroTipo}
            onFiltroTipo={setFiltroTipo}
            conteos={conteos}
            seleccionada={seleccionada}
            onSeleccionar={setIdSeleccion}
          />
        </aside>

        <section className="tarjeta campos">
          <div className="tarjeta-cab">
            <Segmentado valor={tipo} onCambio={cambiarTipo} opciones={TIPOS} />
            <div className="empuje" />
            <span className="contador">
              SOT {seleccionada.sot} · {seleccionada.id}
            </span>
          </div>

          <div className="tarjeta-cuerpo">
            {faltantes.length ? (
              <div className="alerta aviso" style={{ marginBottom: 16 }}>
                Esta orden no tiene {faltantes.join(', ')}. Complétalo abajo y la plantilla se
                actualiza sola.
              </div>
            ) : null}

            <div className="grupo">
              <p className="seccion">Datos de la orden</p>
              <div className="rejilla">
                <Campo label="Cliente">
                  <input
                    value={seleccionada.cliente}
                    onChange={(e) => editar('cliente')(e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </Campo>
                <Campo label="Teléfono">
                  <input
                    className="mono"
                    value={seleccionada.telefono}
                    onChange={(e) => editar('telefono')(e.target.value)}
                    placeholder="987654321"
                    inputMode="tel"
                  />
                </Campo>
                <Campo label="Fecha de la visita">
                  <div className="fecha-campo">
                    <input
                      type="date"
                      value={aISO(seleccionada.fecha)}
                      onChange={(e) => editar('fecha')(deISO(e.target.value))}
                      aria-label="Fecha de la visita"
                    />
                    <div className="fecha-atajos">
                      <button
                        type="button"
                        className="enlace"
                        onClick={() => editar('fecha')(fechaRelativa(0))}
                      >
                        hoy
                      </button>
                      <button
                        type="button"
                        className="enlace"
                        onClick={() => editar('fecha')(fechaRelativa(1))}
                      >
                        mañana
                      </button>
                    </div>
                  </div>
                  <span className="pista">Sale en la plantilla: {seleccionada.fecha || '—'}</span>
                </Campo>
                <Campo label="Franja">
                  <Select value={seleccionada.franja} onChange={editar('franja')} opciones={FRANJAS} />
                </Campo>
                <Campo label="Horario" pista="Sale en la plantilla si lo llenas">
                  <input
                    className="mono"
                    value={seleccionada.horario || ''}
                    onChange={(e) => editar('horario')(e.target.value)}
                    placeholder="09:00 - 13:00"
                  />
                </Campo>
                <Campo label="Contrata">
                  <input
                    value={seleccionada.contrata}
                    onChange={(e) => editar('contrata')(e.target.value.toUpperCase())}
                    list={LISTA_CONTRATAS}
                    placeholder="Sin contrata"
                  />
                </Campo>
                <Campo label="Departamento">
                  <Select
                    value={seleccionada.departamento}
                    onChange={editar('departamento')}
                    opciones={DEPARTAMENTOS}
                  />
                </Campo>
              </div>
            </div>

            <div className="grupo">
              <p className="seccion">Datos de la plantilla</p>
              <div className="rejilla">
                <Campo label="ID de llamada" pista="Se propone el ID de la orden">
                  <input
                    className="mono"
                    value={extra.idLlamada}
                    onChange={(e) => set('idLlamada', e.target.value)}
                  />
                </Campo>
                <CamposDinamicos tipo={tipo} extra={extra} set={set} />
              </div>
            </div>
          </div>
        </section>

        <section className="tarjeta vista">
          <div className="tarjeta-cab">
            <div>
              <h2>Vista previa</h2>
              <p className="sub">{contextoPlantilla(seleccionada, perfil)}</p>
            </div>
            <div className="empuje" />
            <button className="btn btn-primario btn-chico" onClick={copiar}>
              {copiado ? 'Copiado' : 'Copiar plantilla'}
            </button>
            <button className="btn btn-chico" onClick={descargar}>
              Descargar .md
            </button>
          </div>
          <pre className="codigo plantilla">{plantilla}</pre>

          {/* Se escribe mirando la plantilla: es su ultima linea. */}
          <div className="obs">
            <label htmlFor="obs-orden">Observaciones</label>
            <textarea
              id="obs-orden"
              rows={2}
              value={seleccionada.observaciones || ''}
              onChange={(e) => editar('observaciones')(e.target.value)}
              placeholder="Opcional. Si escribes algo, se agrega al final de la plantilla."
            />
          </div>
        </section>
      </div>
    </>
  );
}
