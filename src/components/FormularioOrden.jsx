import { useEffect, useRef, useState } from 'react';
import { Campo, Select } from './Campos';
import {
  DEPARTAMENTOS,
  DEPTOS_PROGRAMACION,
  FECHA_DEFAULT,
  FRANJAS,
  FRANJA_DEFAULT,
  LISTA_CONTRATAS,
  GESTIONES,
  SI_NO,
  SOT_MANUALES,
  SOT_MANUAL_DEFAULT,
  SOT_MANUAL_PROGRAMACION,
} from '../lib/constantes';
import { formatearId } from '../lib/utils';

const FORM_VACIO = {
  sot: '',
  cliente: '',
  telefono: '',
  contrata: '',
  fecha: FECHA_DEFAULT,
  franja: FRANJA_DEFAULT,
  horario: '',
  observaciones: '',
  gestion: GESTIONES[0],
  departamento: DEPARTAMENTOS[0],
  yaGestion: 'NO',
  sotManual: SOT_MANUAL_DEFAULT,
};

/*
 * Carga a mano: es el camino raro (casi siempre se pega de OFS), asi que vive
 * en un cajon y no le quita pantalla a la tabla.
 */
export function FormularioOrden({
  proximoId,
  modo,
  deptosD1 = DEPTOS_PROGRAMACION,
  abierto,
  onAbierto,
  onAgregar,
}) {
  const [form, setForm] = useState(() => ({ ...FORM_VACIO, sotManual: modo || SOT_MANUAL_DEFAULT }));
  const [errores, setErrores] = useState({});
  const refSot = useRef(null);

  const set = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => (e[campo] ? { ...e, [campo]: false } : e));
  };

  /*
   * Con un modo elegido, ese manda. En automatico rige la regla de mesa:
   * los departamentos marcados van como PROGRAMACIONES D+1.
   */
  const usaLista = !modo || modo === SOT_MANUAL_PROGRAMACION;

  const setDepartamento = (valor) =>
    setForm((f) => ({
      ...f,
      departamento: valor,
      sotManual: usaLista
        ? deptosD1.includes(valor)
          ? SOT_MANUAL_PROGRAMACION
          : SOT_MANUAL_DEFAULT
        : f.sotManual,
    }));

  const rigeRegla = usaLista && deptosD1.includes(form.departamento);

  // Si cambia el modo de trabajo, el formulario lo adopta.
  useEffect(() => {
    if (modo && modo !== SOT_MANUAL_PROGRAMACION) setForm((f) => ({ ...f, sotManual: modo }));
  }, [modo]);

  useEffect(() => {
    if (!abierto) return;
    function esc(e) {
      if (e.key === 'Escape') onAbierto(false);
    }
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [abierto, onAbierto]);

  if (!abierto) return null;

  function enviar(ev) {
    ev.preventDefault();
    if (!form.sot.trim()) {
      setErrores({ sot: true });
      refSot.current?.focus();
      return;
    }
    setErrores({});

    onAgregar({
      sot: form.sot.trim(),
      cliente: form.cliente.trim(),
      telefono: form.telefono.trim(),
      contrata: form.contrata.trim(),
      fecha: form.fecha.trim(),
      franja: form.franja,
      horario: form.horario.trim(),
      observaciones: form.observaciones.trim(),
      gestion: form.gestion,
      departamento: form.departamento,
      yaGestion: form.yaGestion,
      sotManual: form.sotManual,
    });

    // Mantiene fecha/franja/gestion/departamento para cargar en lote.
    setForm((f) => ({ ...f, sot: '', cliente: '', telefono: '' }));
    refSot.current?.focus();
  }

  const faltan = [
    !form.cliente.trim() && 'cliente',
    !form.telefono.trim() && 'teléfono',
    !form.fecha.trim() && 'fecha',
  ].filter(Boolean);

  return (
    <>
      <div className="velo" onClick={() => onAbierto(false)} />

      <form className="cajon" onSubmit={enviar} role="dialog" aria-label="Cargar una orden a mano">
        <div className="cajon-cab">
          <h2>Cargar una orden a mano</h2>
          <span className="empuje" />
          <span className="contador">Será la {formatearId(proximoId)}</span>
          <button className="btn btn-primario" type="submit">
            Agregar orden
          </button>
          <button
            className="btn btn-plano btn-chico"
            type="button"
            onClick={() => {
              setForm(FORM_VACIO);
              setErrores({});
            }}
          >
            Limpiar
          </button>
          <button className="btn btn-plano btn-chico" type="button" onClick={() => onAbierto(false)}>
            Cerrar (Esc)
          </button>
        </div>

        <div className="cajon-cuerpo">
          {errores.sot ? (
            <div className="alerta error" style={{ marginBottom: 10 }}>
              Falta el <b>SOT</b>: es lo único que no se puede completar después.
            </div>
          ) : null}

          <div className="grupo">
            <p className="seccion">Cliente</p>
            <div className="rejilla">
              <Campo label="SOT" req>
                <input
                  ref={refSot}
                  className={'mono' + (errores.sot ? ' error' : '')}
                  value={form.sot}
                  onChange={(e) => set('sot')(e.target.value)}
                  placeholder="90256466"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                />
              </Campo>

              <Campo label="Cliente" ancho2>
                <input
                  value={form.cliente}
                  onChange={(e) => set('cliente')(e.target.value)}
                  placeholder="Nombre del cliente"
                  autoComplete="off"
                />
              </Campo>

              <Campo label="Teléfono">
                <input
                  className="mono"
                  value={form.telefono}
                  onChange={(e) => set('telefono')(e.target.value)}
                  placeholder="987654321"
                  inputMode="tel"
                  autoComplete="off"
                />
              </Campo>

              <Campo label="Contrata" ancho2>
                <input
                  value={form.contrata}
                  onChange={(e) => set('contrata')(e.target.value.toUpperCase())}
                  list={LISTA_CONTRATAS}
                  placeholder="Sin contrata"
                  autoComplete="off"
                />
              </Campo>
            </div>
          </div>

          <div className="grupo">
            <p className="seccion">Programación</p>
            <div className="rejilla">
              <Campo label="Fecha" pista="Formato d/m/aaaa">
                <input
                  className="mono"
                  value={form.fecha}
                  onChange={(e) => set('fecha')(e.target.value)}
                  placeholder={FECHA_DEFAULT}
                  autoComplete="off"
                />
              </Campo>

              <Campo label="Franja">
                <div className="franjas" role="group" aria-label="Franja">
                  {FRANJAS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={form.franja === f}
                      className={form.franja === f ? 'activo' : ''}
                      onClick={() => set('franja')(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </Campo>

              <Campo label="Horario" pista="Sale en la plantilla si lo llenas">
                <input
                  className="mono"
                  value={form.horario}
                  onChange={(e) => set('horario')(e.target.value)}
                  placeholder="09:00 - 13:00"
                  autoComplete="off"
                />
              </Campo>

              <Campo label="Departamento" ancho2>
                <Select value={form.departamento} onChange={setDepartamento} opciones={DEPARTAMENTOS} />
              </Campo>

              <Campo label="Gestión">
                <Select value={form.gestion} onChange={set('gestion')} opciones={GESTIONES} />
              </Campo>
            </div>
          </div>

          <div className="grupo">
            <p className="seccion">Formulario</p>
            <div className="rejilla">
              <Campo label="¿Ya tiene gestión?">
                <Select value={form.yaGestion} onChange={set('yaGestion')} opciones={SI_NO} />
              </Campo>

              <Campo
                label="SOT gestionada manual"
                ancho2
                pista={
                  rigeRegla
                    ? `${form.departamento} va como ${SOT_MANUAL_PROGRAMACION}`
                    : modo
                      ? 'Viene del modo elegido al pegar'
                      : undefined
                }
              >
                <Select value={form.sotManual} onChange={set('sotManual')} opciones={SOT_MANUALES} />
              </Campo>

              <Campo label="Observaciones" largo>
                <textarea
                  rows={2}
                  value={form.observaciones}
                  onChange={(e) => set('observaciones')(e.target.value)}
                  placeholder="Opcional. Si escribes algo, aparece al final de la plantilla."
                />
              </Campo>
            </div>
          </div>

          {faltan.length && form.sot.trim() ? (
            <p className="pista" style={{ marginTop: 10 }}>
              Sin {faltan.join(', ')}: se puede completar en el paso 2.
            </p>
          ) : null}
        </div>
      </form>
    </>
  );
}
