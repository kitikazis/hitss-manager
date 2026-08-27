/* El orden de las secciones es el orden del trabajo: cargar, armar, enviar. */
const PESTANAS = [
  { id: 'ordenes', etiqueta: 'Órdenes', corto: 'Órdenes', paso: 1 },
  { id: 'plantillas', etiqueta: 'Plantillas', corto: 'Plantilla', paso: 2 },
  { id: 'script', etiqueta: 'Script', corto: 'Script', paso: 3 },
];

/*
 * Riel de 64 px: son tres pasos numerados, no necesitan una columna entera.
 * El ancho que se ahorra se va a los datos, que es donde hace falta.
 */
export function Encabezado({ perfil, onAbrirPerfil, total, tema, onTema, tab, onTab }) {
  const actual = PESTANAS.find((p) => p.id === tab)?.paso || 1;

  return (
    <aside className="riel">
      <div className="marca" title="HITSS Manager · Mesa multiskill" aria-hidden="true">
        H
      </div>

      <nav className="tabs" aria-label="Secciones" style={{ display: 'contents' }}>
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={
              'paso' + (tab === p.id ? ' activo' : p.paso < actual ? ' hecho' : '')
            }
            aria-current={tab === p.id ? 'step' : undefined}
            title={`Paso ${p.paso}: ${p.etiqueta}` + (p.paso === 1 ? ` (${total})` : '')}
            onClick={() => onTab(p.id)}
          >
            <span className="num">{p.paso}</span>
            <span className="rot">{p.corto}</span>
          </button>
        ))}
      </nav>

      <div className="riel-pie">
        <button
          className="icono-btn"
          type="button"
          onClick={() => onTema(tema === 'dark' ? 'light' : 'dark')}
          title={tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          aria-label="Cambiar tema"
        >
          ◐
        </button>
        <button
          className="cod"
          type="button"
          onClick={onAbrirPerfil}
          title="Cambiar usuario, operador y firma"
          style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, width: 'auto' }}
        >
          {perfil.usuario}
        </button>
      </div>
    </aside>
  );
}
