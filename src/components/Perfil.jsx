import { useEffect, useRef, useState } from 'react';

/*
 * Ficha del operador. Se abre sola la primera vez (para que nadie trabaje con el
 * usuario de otro) y desde el boton del encabezado cuando haya que cambiarla.
 */
export function PerfilModal({ perfil, onGuardar, onCerrar, bienvenida }) {
  const [usuario, setUsuario] = useState(perfil.usuario);
  const [operador, setOperador] = useState(perfil.operador);
  const [realizadoPor, setRealizadoPor] = useState(perfil.realizadoPor || '');
  const [error, setError] = useState('');
  const caja = useRef(null);

  useEffect(() => {
    function esc(e) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
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
    <div
      className="modal-fondo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !bienvenida) onCerrar();
      }}
    >
      <form
        className="modal"
        ref={caja}
        onSubmit={guardar}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-perfil"
      >
        <h3 id="titulo-perfil">{bienvenida ? 'Antes de empezar' : 'Mi perfil'}</h3>
        <p className="sub">
          {bienvenida
            ? 'Confirma con qué usuario vas a trabajar. Cada código guarda sus propias órdenes en esta computadora.'
            : 'Cada código trabaja con sus propias órdenes.'}
        </p>

        <div className="campo">
          <label htmlFor="perfil-usuario">
            Usuario E<span className="req">*</span>
          </label>
          <input
            id="perfil-usuario"
            className={'mono' + (error ? ' error' : '')}
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
          <label htmlFor="perfil-operador">Operador</label>
          <input
            id="perfil-operador"
            value={operador}
            onChange={(e) => setOperador(e.target.value.toUpperCase())}
            placeholder="NOMBRE Y APELLIDOS"
          />
        </div>

        <div className="campo">
          <label htmlFor="perfil-firma">Realizado por</label>
          <input
            id="perfil-firma"
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

        {cambiaUsuario && !bienvenida ? (
          <div className="alerta info" style={{ marginTop: 12 }}>
            Vas a ver las órdenes y el operador guardados para ese código.
          </div>
        ) : null}

        <div className="modal-acciones">
          <button className="btn btn-primario" type="submit">
            {bienvenida ? 'Empezar' : 'Guardar'}
          </button>
          <button className="btn modal-cerrar" type="button" onClick={onCerrar}>
            {bienvenida ? 'Ahora no' : 'Cancelar'}
          </button>
        </div>
      </form>
    </div>
  );
}
