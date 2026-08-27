import { useMemo, useRef } from 'react';
import { CLASE_TIPO, COLOR_TIPO, etiquetaTipo, tipoDeOrden } from '../lib/plantillas';

/*
 * Cada columna agrupa datos que se leen juntos (dato principal arriba, detalle
 * abajo). Asi entran las once columnas de antes sin scroll horizontal, y en
 * pantallas angostas cada fila se convierte en una tarjeta.
 */
function Celda({ etiqueta, principal, detalle, className = '' }) {
  return (
    <td data-label={etiqueta} className={className}>
      <span className="celda">
        <span className="celda-principal">{principal}</span>
        {detalle ? <span className="celda-detalle">{detalle}</span> : null}
      </span>
    </td>
  );
}

const sinDato = (texto, alternativa = 'Sin dato') =>
  texto ? texto : <span className="tenue">{alternativa}</span>;

export function TablaOrdenes({
  ordenes,
  onEliminar,
  onVaciar,
  onExportar,
  onImportar,
  onIrAPegar,
  onCargarAMano,
}) {
  const inputArchivo = useRef(null);

  const repetidos = useMemo(() => {
    const conteo = {};
    ordenes.forEach((o) => {
      conteo[o.sot] = (conteo[o.sot] || 0) + 1;
    });
    return conteo;
  }, [ordenes]);

  return (
    <section className="tarjeta">
      <div className="tarjeta-cab">
        <h2>Órdenes cargadas</h2>
        <span className="contador">
          {ordenes.length} {ordenes.length === 1 ? 'pendiente' : 'pendientes'}
        </span>
        <span className="empuje" />
        <button className="btn btn-chico" onClick={onExportar} disabled={!ordenes.length}>
          Exportar JSON
        </button>
        <button className="btn btn-chico" onClick={() => inputArchivo.current?.click()}>
          Importar JSON
        </button>
        <button className="btn btn-chico btn-peligro" onClick={onVaciar} disabled={!ordenes.length}>
          Vaciar
        </button>
        <input
          ref={inputArchivo}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportar(file);
            e.target.value = '';
          }}
        />
      </div>

      {ordenes.length === 0 ? (
        <div className="vacio">
          <strong>Todavía no hay órdenes</strong>
          Lo más rápido es pegar la actividad de Oracle Field Service. También puedes cargarla a mano
          o importar un JSON que hayas exportado antes.
          <div className="acciones-vacio">
            <button className="btn btn-primario" onClick={onIrAPegar}>
              Pegar de OFS
            </button>
            <button className="btn" onClick={onCargarAMano}>
              Cargar a mano
            </button>
            <button className="btn" onClick={() => inputArchivo.current?.click()}>
              Importar JSON
            </button>
          </div>
        </div>
      ) : (
        <div className="tabla-scroll">
          <table className="tabla-ordenes">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Cliente</th>
                <th>Programación</th>
                <th>Zona</th>
                <th>Formulario</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => {
                const tipo = tipoDeOrden(o);
                return (
                  <tr key={o.id} className={CLASE_TIPO[tipo]}>
                    <Celda
                      etiqueta="Orden"
                      principal={
                        <>
                          <b className="mono">{o.sot}</b>
                          {repetidos[o.sot] > 1 ? (
                            <span className="etiqueta error dup">Repetido</span>
                          ) : null}
                        </>
                      }
                      detalle={
                        <>
                          <span className={'etiqueta chica ' + COLOR_TIPO[tipo]}>
                            {etiquetaTipo(tipo)}
                          </span>
                          <span className="mono">{o.id}</span>
                        </>
                      }
                    />

                    <Celda
                      etiqueta="Cliente"
                      className="celda-ancha"
                      principal={sinDato(o.cliente, 'Sin cliente')}
                      detalle={<span className="mono">{o.telefono || 'Sin teléfono'}</span>}
                    />

                    <Celda
                      etiqueta="Programación"
                      principal={<span className="mono">{o.fecha || '—'}</span>}
                      detalle={
                        <>
                          <span className="etiqueta chica">{o.franja}</span>
                          {o.horario ? <span className="mono">{o.horario}</span> : null}
                        </>
                      }
                    />

                    <Celda
                      etiqueta="Zona"
                      principal={o.departamento}
                      detalle={sinDato(o.contrata, 'Sin contrata')}
                    />

                    <Celda
                      etiqueta="Formulario"
                      principal={o.gestion}
                      detalle={`${o.sotManual} · Ya gest. ${o.yaGestion}`}
                    />

                    <td className="acciones-fila">
                      <button
                        className="btn btn-chico btn-plano btn-peligro"
                        onClick={() => onEliminar(o.id)}
                        title={'Eliminar la orden ' + o.sot}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
