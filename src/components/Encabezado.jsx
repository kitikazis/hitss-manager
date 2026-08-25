import { useEffect, useRef, useState } from 'react';

const PESTANAS = [
  { id: 'ordenes', etiqueta: 'Órdenes', conCuenta: true },
  { id: 'plantillas', etiqueta: 'Plantillas' },
  { id: 'script', etiqueta: 'Script' },
];

function Perfil({ perfil, onGuardar, onCerrar }) {
  const [usuario, setUsuario] = useState(perfil.usuario);
  const [operador, setOperador] = useState(perfil.operador);
  const [realizadoPor, setRealizadoPor] = useState(perfil.realizadoPor || '');
  const [error, setError] = useState('');
  const caja = useRef(null);

  useEffect(() => {
    function fuera(e) {
      if (caja.current && !caja.current.contains(e.target)) onCerrar();
    }
    function esc(e) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, [onCerrar]);

  function guardar(e) {
    e.preventDefault();
    const u = usuario.trim().toUpperCase();
    if (!u) {
      setError('El código de usuario es obligatorio.');
      return;
    }
    onGuardar({
      usuario: u,
      operador: operador.trim().toUpperCase(),
      realizadoPor: realizadoPor.trim().toUpperCase(),
    });
    onCerrar();
  }

  const cambiaUsuario = usuario.trim().toUpperCase() !== perfil.usuario;

  return (
    <form className="emergente" ref={caja} onSubmit={guardar}>
      <h3>Mi perfil</h3>
      <p className="sub">Cada código trabaja con sus propias órdenes.</p>

      <div className="campo">
        <label>
          Usuario E<span className="req">*</span>
        </label>
        <input
          className="mono"
          value={usuario}
          onChange={(e) => {
            setUsuario(e.target.value.toUpperCase());
            setError('');
          }}
          placeholder="E761826"
          autoFocus
        />
      </div>

      <div className="campo">
        <label>Operador</label>
        <input
          value={operador}
          onChange={(e) => setOperador(e.target.value.toUpperCase())}
          placeholder="NOMBRE Y APELLIDOS"
        />
      </div>

      <div className="campo">
        <label>Realizado por</label>
        <input
          value={realizadoPor}
          onChange={(e) => setRealizadoPor(e.target.value.toUpperCase())}
          placeholder="YAMIR HUALLCCA"
        />
        <span className="pista">Firma al pie de las plantillas</span>
      </div>

      {error ? (
        <div className="alerta error" style={{ marginTop: 12 }}>
          {error}
        </div>
      ) : null}

      {cambiaUsuario ? (
        <div className="alerta info" style={{ marginTop: 12 }}>
          Vas a ver las órdenes y el operador guardados para ese código.
        </div>
      ) : null}

      <div className="emergente-acciones">
        <button className="btn btn-primario btn-chico" type="submit">
          Guardar
        </button>
        <button className="btn btn-chico" type="button" onClick={onCerrar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function Encabezado({ perfil, onGuardarPerfil, total, tema, onTema, tab, onTab }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="header">
      <div className="wrap">
        <div className="header-in">
          <div className="marca">
            <h1>HITSS Manager</h1>
            <span>Mesa multiskill</span>
          </div>

          <div className="header-acciones">
            <div className="ancla">
              <button className="btn btn-chico" onClick={() => setAbierto((v) => !v)}>
                <span className="chip-usuario">{perfil.usuario}</span>
              </button>
              {abierto ? (
                <Perfil
                  perfil={perfil}
                  onGuardar={onGuardarPerfil}
                  onCerrar={() => setAbierto(false)}
                />
              ) : null}
            </div>

            <button
              className="btn btn-plano btn-chico"
              onClick={() => onTema(tema === 'dark' ? 'light' : 'dark')}
            >
              {tema === 'dark' ? 'Tema claro' : 'Tema oscuro'}
            </button>
          </div>
        </div>

        <nav className="tabs">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              className={'tab' + (tab === p.id ? ' activa' : '')}
              onClick={() => onTab(p.id)}
            >
              {p.etiqueta}
              {p.conCuenta ? <span className="cuenta">{total}</span> : null}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
