import { useEffect, useMemo, useState } from 'react';
import { Campo, Segmentado, Select } from './Campos';
import { PanelPegar } from './PanelPegar';
import { TIPOS, camposPorDefecto, construirPlantilla } from '../lib/plantillas';
import {
  DEPARTAMENTOS,
  FRANJAS,
  MOTIVOS_CICLO,
  MOTIVOS_RECHAZO,
  RECHAZO_TIPOS,
} from '../lib/constantes';
import { copiarAlPortapapeles, descargarArchivo } from '../lib/utils';

function ListaOrdenes({ ordenes, seleccionada, onSeleccionar }) {
  return (
    <section className="tarjeta">
      <div className="tarjeta-cab">
        <div>
          <h2>Órdenes</h2>
          <p className="sub">{ordenes.length} en la lista</p>
        </div>
      </div>
      <div className="lista">
        {ordenes.map((o) => (
          <button
            key={o.id}
            type="button"
            className={'lista-item' + (seleccionada?.id === o.id ? ' activo' : '')}
            onClick={() => onSeleccionar(o.id)}
          >
            <span className="lista-sot">{o.sot}</span>
            <span className="lista-cliente">{o.cliente || 'Sin cliente'}</span>
            <span className="lista-meta">
              {o.fecha || 'Sin fecha'} · {o.franja} · {o.departamento}
            </span>
          </button>
        ))}
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
  const [tipo, setTipo] = useState('CONFI');
  const [extra, setExtra] = useState(() => camposPorDefecto('CONFI', null));

  // Si la orden elegida se borro (o no hay ninguna elegida) cae en la primera.
  const seleccionada = ordenes.find((o) => o.id === idSeleccion) || ordenes[0] || null;

  // Las ordenes pegadas traen sugerido su tipo de plantilla.
  useEffect(() => {
    const sugerido = seleccionada?.tipoPlantilla;
    if (sugerido && TIPOS.some((t) => t.id === sugerido)) setTipo(sugerido);
  }, [seleccionada?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cambiar de orden o de tipo, el formulario propio del tipo vuelve a su base.
  useEffect(() => {
    setExtra(camposPorDefecto(tipo, seleccionada));
  }, [tipo, seleccionada?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (campo, valor) => setExtra((prev) => ({ ...prev, [campo]: valor }));
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
          <ListaOrdenes ordenes={ordenes} seleccionada={seleccionada} onSeleccionar={setIdSeleccion} />
        </aside>

        <div>
          <section className="tarjeta">
            <div className="tarjeta-cab">
              <Segmentado valor={tipo} onCambio={setTipo} opciones={TIPOS} />
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
                      className="mono"
                      value={seleccionada.contrata}
                      onChange={(e) => editar('contrata')(e.target.value.toUpperCase())}
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

          <section className="tarjeta">
            <div className="tarjeta-cab">
              <div>
                <h2>Vista previa</h2>
                <p className="sub">Se actualiza mientras escribes</p>
              </div>
              <div className="empuje" />
              <button className="btn btn-primario btn-chico" onClick={copiar}>
                Copiar plantilla
              </button>
              <button className="btn btn-chico" onClick={descargar}>
                Descargar .md
              </button>
            </div>
            <pre className="codigo plantilla">{plantilla}</pre>
          </section>
        </div>
      </div>
    </>
  );
}
