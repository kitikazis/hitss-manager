import { useEffect, useMemo, useRef, useState } from 'react';
import { Campo, Segmentado, Select } from './Campos';
import { PanelPegar } from './PanelPegar';
import {
  CLASE_TIPO,
  COLOR_TIPO,
  TIPOS,
  camposPorDefecto,
  construirPlantilla,
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
import { copiarAlPortapapeles, descargarArchivo } from '../lib/utils';

function ListaOrdenes({ ordenes, seleccionada, onSeleccionar, busqueda, onBusqueda, total }) {
  return (
    <section className="tarjeta">
      <div className="tarjeta-cab">
        <div>
          <h2>Órdenes</h2>
          <p className="sub">
            {busqueda
              ? `${ordenes.length} de ${total}`
              : `${total} ${total === 1 ? 'orden' : 'órdenes'}`}
          </p>
        </div>
        <div className="empuje" />
        <div className="leyenda">
          {TIPOS.map((t) => (
            <span key={t.id} className={CLASE_TIPO[t.id]}>
              {t.etiqueta}
            </span>
          ))}
        </div>
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

      <div className="lista">
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
                {o.fecha || 'Sin fecha'} · {o.franja} · {o.departamento}
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

export function PanelPlantillas({ ordenes, perfil, onAgregarOrdenes, onActualizarOrden, onToast }) {
  const [idSeleccion, setIdSeleccion] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('CONFI');
  const [extra, setExtra] = useState(() => camposPorDefecto('CONFI', null));
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef(null);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return ordenes;
    return ordenes.filter(
      (o) =>
        o.sot.toLowerCase().includes(q) ||
        (o.cliente || '').toLowerCase().includes(q) ||
        (o.telefono || '').includes(q)
    );
  }, [ordenes, busqueda]);

  // Si la orden elegida se borro (o no hay ninguna elegida) cae en la primera.
  const seleccionada = ordenes.find((o) => o.id === idSeleccion) || ordenes[0] || null;

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
    if (nuevas && nuevas.length) setIdSeleccion(nuevas[0].id);
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
      abiertoInicial={!ordenes.length}
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
            seleccionada={seleccionada}
            onSeleccionar={setIdSeleccion}
          />
        </aside>

        <section className="tarjeta">
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
                <Campo label="Fecha">
                  <input
                    className="mono"
                    value={seleccionada.fecha}
                    onChange={(e) => editar('fecha')(e.target.value)}
                    placeholder="24/8/2026"
                  />
                </Campo>
                <Campo label="Franja">
                  <Select value={seleccionada.franja} onChange={editar('franja')} opciones={FRANJAS} />
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
              <p className="sub">Se actualiza mientras escribes</p>
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
        </section>
      </div>
    </>
  );
}
