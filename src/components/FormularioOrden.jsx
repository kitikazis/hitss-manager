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

export function FormularioOrden({
  proximoId,
  modo,
  deptosD1 = DEPTOS_PROGRAMACION,
  abierto,
  onAbierto,
  onPegar,
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
   * UCAYALI y SAN MARTIN van siempre como PROGRAMACIONES D+1.
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

  function enviar(ev) {
    ev.preventDefault();
    if (!form.sot.trim()) {
      setErrores({ sot: true });
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
    <form className="tarjeta" onSubmit={enviar}>
      <div className="tarjeta-cab">
        <div>
          <h2>Cargar órdenes</h2>
          <p className="sub">Lo más rápido es pegar la actividad de Oracle Field Service</p>
        </div>
        <div className="empuje" />
        <button type="button" className="btn btn-primario btn-grande" onClick={onPegar}>
          Pegar actividad
        </button>
        <button type="button" className="btn" onClick={() => onAbierto(!abierto)}>
          {abierto ? 'Ocultar formulario' : 'Cargar a mano'}
        </button>
      </div>

      <div className="tarjeta-cuerpo" hidden={!abierto}>
        <p className="seccion-nota">
          Solo el SOT es obligatorio; el resto se puede completar después. Esta orden será la{' '}
          {formatearId(proximoId)}.
        </p>

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
              />
            </Campo>

            <Campo label="Cliente">
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

            <Campo label="Contrata" pista="Elige una de la lista o escríbela">
              <input
                value={form.contrata}
                onChange={(e) => set('contrata')(e.target.value.toUpperCase())}
                list={LISTA_CONTRATAS}
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
              <Select value={form.franja} onChange={set('franja')} opciones={FRANJAS} />
            </Campo>

            <Campo label="Horario" pista="Opcional; sale en la plantilla si lo llenas">
              <input
                className="mono"
                value={form.horario}
                onChange={(e) => set('horario')(e.target.value)}
                placeholder="09:00 - 13:00"
                autoComplete="off"
              />
            </Campo>

            <Campo label="Departamento">
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
              pista={
                rigeRegla
                  ? `${form.departamento} va como ${SOT_MANUAL_PROGRAMACION}`
                  : modo
                    ? 'Viene del modo elegido en Plantillas'
                    : undefined
              }
            >
              <Select value={form.sotManual} onChange={set('sotManual')} opciones={SOT_MANUALES} />
            </Campo>
          </div>

          <div className="campo campo-largo" style={{ marginTop: 14 }}>
            <label>Observaciones</label>
            <textarea
              rows={2}
              value={form.observaciones}
              onChange={(e) => set('observaciones')(e.target.value)}
              placeholder="Opcional. Si escribes algo, aparece en la plantilla."
            />
          </div>
        </div>

        {errores.sot ? (
          <div className="alerta error" style={{ marginTop: 16 }}>
            Falta el <b>SOT</b>: es lo único que no se puede completar después.
          </div>
        ) : null}

        <div className="acciones">
          <button className="btn btn-primario btn-grande" type="submit">
            Agregar orden
          </button>
          <button
            className="btn btn-plano"
            type="button"
            onClick={() => {
              setForm(FORM_VACIO);
              setErrores({});
            }}
          >
            Limpiar
          </button>
          {faltan.length && form.sot.trim() ? (
            <span className="pista">Sin {faltan.join(', ')}: se puede completar en Plantillas</span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
