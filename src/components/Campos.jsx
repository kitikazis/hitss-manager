export function Campo({ label, req, pista, children }) {
  return (
    <div className="campo">
      <label>
        {label}
        {req ? <span className="req">*</span> : null}
      </label>
      {children}
      {pista ? <span className="pista">{pista}</span> : null}
    </div>
  );
}

export function Select({ value, onChange, opciones, className }) {
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      {opciones.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Segmentado({ valor, onCambio, opciones }) {
  return (
    <div className="segmentado" role="tablist">
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={valor === o.id}
          className={valor === o.id ? 'activo' : ''}
          onClick={() => onCambio(o.id)}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}
