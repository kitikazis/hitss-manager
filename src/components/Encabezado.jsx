/* El orden de las secciones es el orden del trabajo: cargar, armar, enviar. */
const PESTANAS = [
  { id: 'ordenes', etiqueta: 'Órdenes', paso: 1, conCuenta: true },
  { id: 'plantillas', etiqueta: 'Plantillas', paso: 2 },
  { id: 'script', etiqueta: 'Script', paso: 3 },
];

export function Encabezado({ perfil, onAbrirPerfil, total, tema, onTema, tab, onTab }) {
  return (
    <aside className="lateral">
      <div className="marca">
        <span className="marca-mosaico" aria-hidden="true">
          H
        </span>
        <span className="marca-texto">
          <h1>HITSS Manager</h1>
          <span className="marca-nota">Mesa multiskill</span>
        </span>
      </div>

      <nav className="tabs" aria-label="Secciones">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            className={'tab' + (tab === p.id ? ' activa' : '')}
            aria-current={tab === p.id ? 'page' : undefined}
            onClick={() => onTab(p.id)}
          >
            <span className="tab-paso" aria-hidden="true">
              {p.paso}
            </span>
            {p.etiqueta}
            {p.conCuenta ? (
              <span className="cuenta" title={total + ' órdenes cargadas'}>
                {total}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="lateral-pie">
        <div className="header-acciones">
          <div className="ancla">
            <button
              className="btn btn-chico"
              onClick={onAbrirPerfil}
              title="Cambiar usuario, operador y firma"
            >
              <span className="chip-usuario">{perfil.usuario}</span>
            </button>
          </div>

          <button
            className="btn btn-plano btn-chico"
            onClick={() => onTema(tema === 'dark' ? 'light' : 'dark')}
          >
            {tema === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          </button>
        </div>
      </div>
    </aside>
  );
}
