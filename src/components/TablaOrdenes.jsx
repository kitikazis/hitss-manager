import { useMemo, useRef } from 'react';

export function TablaOrdenes({ ordenes, onEliminar, onVaciar, onExportar, onImportar }) {
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
        <div>
          <h2>Órdenes cargadas</h2>
          <p className="sub">
            {ordenes.length} {ordenes.length === 1 ? 'orden pendiente' : 'órdenes pendientes'}
          </p>
        </div>
        <div className="empuje" />
        <button className="btn btn-chico" onClick={onExportar} disabled={!ordenes.length}>
          Exportar
        </button>
        <button className="btn btn-chico" onClick={() => inputArchivo.current?.click()}>
          Importar
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
          <strong>Sin órdenes</strong>
          Cárgalas con el formulario de arriba, pegando la actividad en Plantillas, o importando un
          JSON.
        </div>
      ) : (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>SOT</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Contrata</th>
                <th>Fecha</th>
                <th>Franja</th>
                <th>Gestión</th>
                <th>Departamento</th>
                <th>Ya gest.</th>
                <th>Tipo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id}>
                  <td className="mono tenue">{o.id}</td>
                  <td className="mono">
                    <b>{o.sot}</b>
                    {repetidos[o.sot] > 1 ? <span className="etiqueta error dup">Repetido</span> : null}
                  </td>
                  <td>{o.cliente || <span className="tenue">Sin dato</span>}</td>
                  <td className="mono">{o.telefono || <span className="tenue">Sin dato</span>}</td>
                  <td>{o.contrata || <span className="tenue">—</span>}</td>
                  <td className="mono">{o.fecha || <span className="tenue">—</span>}</td>
                  <td>
                    <span className="etiqueta">{o.franja}</span>
                  </td>
                  <td>
                    <span className={'etiqueta ' + (o.gestion === 'CONFIRMO' ? 'ok' : 'aviso')}>
                      {o.gestion}
                    </span>
                  </td>
                  <td>{o.departamento}</td>
                  <td>{o.yaGestion}</td>
                  <td className="tenue">{o.sotManual}</td>
                  <td className="acciones-fila">
                    <button
                      className="btn btn-chico btn-plano btn-peligro"
                      onClick={() => onEliminar(o.id)}
                      title={'Eliminar ' + o.sot}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
