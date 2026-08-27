import { useEffect, useMemo, useRef, useState } from 'react';
import { Campo, Select } from './Campos';
import {
  CLASE_TIPO,
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
    const activo = caja2?.querySelector('.lista-item.activo');
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
    <section className="tarjeta columna-lateral">
      <div className="tarjeta-cab">
        <h2>Órdenes</h2>
        <span className="empuje" />
        <span className="contador">
          {busqueda || filtroTipo ? `${ordenes.length} de ${total}` : total}
        </span>
      </div>

      <div className="filtros">
        <button
          type="button"
          className={'chip-filtro sin-punto' + (filtroTipo === '' ? ' activo' : '')}
          onClick={() => onFiltroTipo('')}
        >
          Todas <b>{total}</b>
        </button>
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={'chip-filtro ' + CLASE_TIPO[t.id] + (filtroTipo === t.id ? ' activo' : '')}
            onClick={() => onFiltroTipo(filtroTipo === t.id ? '' : t.id)}
          >
            {t.corto} <b>{conteos[t.id] || 0}</b>
          </button>
        ))}
      </div>

      <div className="buscador">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
          placeholder="Buscar SOT, cliente o teléfono"
          aria-label="Buscar órdenes por SOT o cliente"
        />
      </div>

      {ordenes.length === 0 ? (
        <div className="vacio">Ninguna orden coincide.</div>
      ) : null}

      <div className="lista" ref={caja} role="listbox" aria-label="Órdenes cargadas">
        {ordenes.map((o) => {
          const tipo = tipoDeOrden(o);
          return (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={seleccionada?.id === o.id}
              className={
                'lista-item ' + CLASE_TIPO[tipo] + (seleccionada?.id === o.id ? ' activo' : '')
              }
              onClick={() => onSeleccionar(o.id)}
            >
              <span className="lista-fila">
                <span className="lista-sot">{o.sot}</span>
                <span
                  className={'punto-tipo p-' + CLASE_TIPO[tipo].replace('es-', '')}
                  title={etiquetaTipo(tipo)}
                />
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
        <Campo label="Motivo" ancho2>
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
        <Campo label="Motivo" ancho2>
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
  onAbrirPegado,
  onActualizarOrden,
  onToast,
  seleccion,
  onSeleccion,
}) {
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
  const seleccionada = ordenes.find((o) => o.id === seleccion) || visibles[0] || ordenes[0] || null;

  // Cada orden abre con su propio tipo: el guardado, o el que sugiere su gestion.
  useEffect(() => {
    if (seleccionada) setTipo(tipoDeOrden(seleccionada));
  }, [seleccionada?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cambiar de orden o de tipo, el formulario propio del tipo vuelve a su base.
  useEffect(() => {
    setExtra(camposPorDefecto(tipo, seleccionada));
  }, [tipo, seleccionada?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (campo, valor) => setExtra((prev) => ({ ...prev, [campo]: valor }));

  const plantilla = useMemo(
    () => construirPlantilla({ tipo, orden: seleccionada, extra, perfil }),
    [tipo, seleccionada, extra, perfil]
  );

  /* Posicion de la elegida dentro de lo que se ve, para moverse con el teclado. */
  const posicion = visibles.findIndex((o) => o.id === seleccionada?.id);
  const irA = (i) => {
    const destino = visibles[i];
    if (destino) onSeleccion(destino.id);
  };

  async function copiar() {
    const ok = await copiarAlPortapapeles(plantilla);
    if (ok) {
      setCopiado(true);
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setCopiado(false), 1800);
    }
    onToast(ok ? 'Plantilla copiada' : 'No se pudo copiar: selecciona el texto manualmente');
  }

  /* Ctrl+Enter copia; las flechas saltan de orden sin soltar el teclado. */
  useEffect(() => {
    function atajo(e) {
      if (!ordenes.length) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        copiar();
        return;
      }
      const enCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
      if (enCampo || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        irA(posicion + 1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        irA(posicion - 1);
      }
    }
    document.addEventListener('keydown', atajo);
    return () => document.removeEventListener('keydown', atajo);
  }); // sin deps: usa siempre la plantilla y la posicion vigentes

  if (!ordenes.length) {
    return (
      <section className="tarjeta">
        <div className="vacio">
          <strong>Sin órdenes que armar</strong>
          Pega una actividad de Oracle Field Service o cárgala a mano en el paso 1.
          <div className="acciones-vacio">
            <button className="btn btn-primario" onClick={onAbrirPegado}>
              Pegar de OFS
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* Cambiar el tipo lo guarda en la orden, para que la lista lo muestre en su color. */
  function cambiarTipo(nuevo) {
    setTipo(nuevo);
    onActualizarOrden(seleccionada.id, { tipoPlantilla: nuevo });
  }
  const editar = (campo) => (valor) => onActualizarOrden(seleccionada.id, { [campo]: valor });

  function descargar() {
    descargarArchivo(`plantilla-${tipo}-${seleccionada.sot}.md`, plantilla, 'text/markdown;charset=utf-8');
    onToast('Plantilla descargada');
  }

  /* "cliente, telefono y fecha" lee mejor que tres "y" seguidas. */
  const enLista = (xs) =>
    xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];

  const faltantes = [
    !seleccionada.cliente && 'cliente',
    !seleccionada.telefono && 'teléfono',
    !seleccionada.fecha && 'fecha',
  ].filter(Boolean);

  return (
    <>
      <ListaOrdenes
        ordenes={visibles}
        total={ordenes.length}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        filtroTipo={filtroTipo}
        onFiltroTipo={setFiltroTipo}
        conteos={conteos}
        seleccionada={seleccionada}
        onSeleccionar={onSeleccion}
      />

      <section className="tarjeta campos">
        <div className="tarjeta-cab">
          <div className="pestanas" role="tablist" aria-label="Tipo de plantilla">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tipo === t.id}
                className={'pest ' + CLASE_TIPO[t.id] + (tipo === t.id ? ' activo' : '')}
                onClick={() => cambiarTipo(t.id)}
              >
                <span className="punto" />
                {t.etiqueta}
              </button>
            ))}
          </div>
          <span className="contador">
            SOT {seleccionada.sot} · {seleccionada.id}
          </span>
        </div>

        <div className="tarjeta-cuerpo">
          {faltantes.length ? (
            <div className="alerta aviso" style={{ marginBottom: 10 }}>
              Falta <b>{enLista(faltantes)}</b>. Complétalo en los campos marcados y la plantilla
              se arma sola.
            </div>
          ) : null}

          <div className="grupo">
            <p className="seccion">Datos de la orden</p>
            <div className="rejilla">
              <Campo label="Cliente" ancho2 falta={!seleccionada.cliente}>
                <input
                  value={seleccionada.cliente}
                  onChange={(e) => editar('cliente')(e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </Campo>
              <Campo label="Teléfono" falta={!seleccionada.telefono}>
                <input
                  className="mono"
                  value={seleccionada.telefono}
                  onChange={(e) => editar('telefono')(e.target.value)}
                  placeholder="987654321"
                  inputMode="tel"
                />
              </Campo>

              <Campo label="Fecha de la visita" falta={!seleccionada.fecha}>
                <input
                  type="date"
                  value={aISO(seleccionada.fecha)}
                  onChange={(e) => editar('fecha')(deISO(e.target.value))}
                  aria-label="Fecha de la visita"
                />
                <span className="atajos-fecha">
                  <span>poner:</span>
                  <button type="button" onClick={() => editar('fecha')(fechaRelativa(0))}>
                    hoy
                  </button>
                  <button type="button" onClick={() => editar('fecha')(fechaRelativa(1))}>
                    mañana
                  </button>
                </span>
              </Campo>

              <Campo label="Franja">
                <div className="franjas" role="group" aria-label="Franja">
                  {FRANJAS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={seleccionada.franja === f}
                      className={seleccionada.franja === f ? 'activo' : ''}
                      onClick={() => editar('franja')(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </Campo>

              <Campo label="Horario" pista="Sale en la plantilla si lo llenas">
                <input
                  className="mono"
                  value={seleccionada.horario || ''}
                  onChange={(e) => editar('horario')(e.target.value)}
                  placeholder="09:00 - 13:00"
                />
              </Campo>

              <Campo label="Contrata" ancho2>
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
            <p className="seccion">
              {tipo === 'CICLO'
                ? 'Datos del ciclo'
                : tipo === 'RECHAZO'
                  ? 'Datos del rechazo'
                  : 'Datos de la plantilla'}
            </p>
            <div className="rejilla">
              <Campo label="ID de llamada">
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

        <div className="paso-orden">
          <span className="contador">
            {posicion + 1} de {visibles.length}
          </span>
          <button
            type="button"
            className="btn btn-chico"
            onClick={() => irA(posicion - 1)}
            disabled={posicion <= 0}
            title="También con la flecha ↑"
          >
            ↑ Anterior
          </button>
          <button
            type="button"
            className="btn btn-chico"
            onClick={() => irA(posicion + 1)}
            disabled={posicion >= visibles.length - 1}
            title="También con la flecha ↓"
          >
            Siguiente ↓
          </button>
        </div>
      </section>

      <section className="tarjeta vista">
        <div className="tarjeta-cab">
          <h2>Vista previa</h2>
          <span className="empuje" />
          <span className="contador">{contextoPlantilla(seleccionada, perfil)}</span>
          <button
            className="btn btn-plano btn-chico"
            onClick={descargar}
            title="Guardar como archivo .md"
          >
            ↓
          </button>
        </div>

        <pre className="codigo plantilla">{plantilla}</pre>

        {/* Se escribe mirando la plantilla: es su ultima linea. */}
        <div className="obs">
          <label htmlFor="obs-orden">
            Observaciones <span>última línea de la plantilla</span>
          </label>
          <textarea
            id="obs-orden"
            rows={2}
            value={seleccionada.observaciones || ''}
            onChange={(e) => editar('observaciones')(e.target.value)}
            placeholder="Opcional. Si escribes algo, se agrega al final."
          />
        </div>

        <div className="pie-vista">
          <button
            className={'btn btn-primario btn-grande btn-copiar' + (copiado ? ' ok' : '')}
            onClick={copiar}
          >
            {copiado ? 'Copiado ✓' : 'Copiar plantilla'}
          </button>
          <span className="atajo">
            <kbd>Ctrl</kbd> + <kbd>↵</kbd>
          </span>
        </div>
      </section>
    </>
  );
}
