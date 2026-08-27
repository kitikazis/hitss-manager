import { useEffect, useMemo, useRef, useState } from 'react';
import { Encabezado } from './components/Encabezado';
import { CabeceraSeccion } from './components/CabeceraSeccion';
import { ModalInstrucciones } from './components/Instrucciones';
import { PerfilModal } from './components/Perfil';
import { FormularioOrden } from './components/FormularioOrden';
import { PanelPegar } from './components/PanelPegar';
import { TablaOrdenes } from './components/TablaOrdenes';
import { PanelPlantillas } from './components/PanelPlantillas';
import { PanelScript } from './components/PanelScript';
import { useAlmacenado } from './hooks/useAlmacenado';
import { generarScript } from './lib/generarScript';
import { separarPorTipo, tipoDeOrden } from './lib/plantillas';
import {
  descargarArchivo,
  escribirAlmacen,
  formatearId,
  hoyArchivo,
  leerAlmacen,
} from './lib/utils';
import {
  CLAVE_FORMATO_FECHA,
  CLAVE_INSTRUCCIONES,
  CLAVE_USUARIO,
  CLAVE_TEMA,
  DEPARTAMENTOS,
  DEPTOS_PROGRAMACION,
  FECHA_DEFAULT,
  FORMATO_FECHA_DEFAULT,
  FRANJA_DEFAULT,
  GESTIONES,
  ID_INICIAL,
  OPERADOR_DEFAULT,
  REALIZADO_POR_DEFAULT,
  SOT_MANUAL_DEFAULT,
  USUARIO_DEFAULT,
  clavePerfil,
  claveOrdenes,
  claveProximoId,
  claveModo,
  claveDeptosD1,
  claveSeleccion,
  clavePegado,
  CONTRATAS,
  LISTA_CONTRATAS,
} from './lib/constantes';

/* El usuario de fabrica arranca con los datos del titular; los demas, vacios. */
function datosPorDefecto(usuario) {
  return usuario === USUARIO_DEFAULT
    ? { operador: OPERADOR_DEFAULT, realizadoPor: REALIZADO_POR_DEFAULT }
    : { operador: '', realizadoPor: '' };
}

export default function App() {
  const [usuario, setUsuario] = useAlmacenado(CLAVE_USUARIO, USUARIO_DEFAULT);
  const [datosPerfil, setDatosPerfil] = useAlmacenado(clavePerfil(usuario), datosPorDefecto(usuario));
  const perfil = useMemo(() => ({ usuario, ...datosPerfil }), [usuario, datosPerfil]);
  const [ordenes, setOrdenes] = useAlmacenado(claveOrdenes(usuario), []);
  const [proximoId, setProximoId] = useAlmacenado(claveProximoId(usuario), ID_INICIAL);
  const [tema, setTema] = useAlmacenado(
    CLAVE_TEMA,
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  /* La primera vez que se abre la app no hay usuario guardado: se pregunta. */
  const [primeraVez] = useState(() => leerAlmacen(CLAVE_USUARIO, null) === null);
  const [perfilAbierto, setPerfilAbierto] = useState(primeraVez);
  const [pegadoAbierto, setPegadoAbierto] = useState(false);
  const [formAbierto, setFormAbierto] = useState(false);
  const [instruccionesAbiertas, setInstruccionesAbiertas] = useState(false);
  const [recordarInstrucciones, setRecordarInstrucciones] = useAlmacenado(CLAVE_INSTRUCCIONES, true);
  const [bienvenida, setBienvenida] = useState(primeraVez);

  const [tab, setTab] = useState('ordenes');
  // La orden en la que se quedo se guarda: una interrupcion no le hace perder el sitio.
  const [seleccion, setSeleccion] = useAlmacenado(claveSeleccion(usuario), null);
  // Tipo, franja y fecha del pegado sobreviven al cierre del cajon y a la sesion.
  const [opcionesPegado, setOpcionesPegado] = useAlmacenado(clavePegado(usuario), {
    tipo: '',
    franja: '',
    cuando: '',
    otraFecha: '',
  });
  const [filtroScript, setFiltroScript] = useState('todas');
  const [formatoFecha, setFormatoFecha] = useAlmacenado(CLAVE_FORMATO_FECHA, FORMATO_FECHA_DEFAULT);
  const [modo, setModo] = useAlmacenado(claveModo(usuario), '');
  const [deptosD1, setDeptosD1] = useAlmacenado(claveDeptosD1(usuario), DEPTOS_PROGRAMACION);
  const [toast, setToast] = useState(null);
  const timerToast = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
  }, [tema]);

  useEffect(() => () => clearTimeout(timerToast.current), []);

  /*
   * Cada codigo de usuario guarda su propio operador y firma.
   * - Mismo usuario: guarda lo editado.
   * - Otro usuario ya conocido: se cambia a el y recupera SUS datos.
   * - Otro usuario nuevo: estrena perfil con lo que se acaba de escribir.
   */
  function guardarPerfil({ usuario: nuevo, operador, realizadoPor }) {
    const datos = { operador, realizadoPor };

    if (nuevo === usuario) {
      escribirAlmacen(clavePerfil(nuevo), datos);
      setDatosPerfil(datos);
      mostrarToast('Perfil actualizado');
      return;
    }

    const conocido = leerAlmacen(clavePerfil(nuevo), null);
    if (!conocido) escribirAlmacen(clavePerfil(nuevo), datos);
    setUsuario(nuevo);
    mostrarToast(`Perfil activo: ${nuevo}`);
  }

  /* Al entrar a Script se recuerdan los pasos, salvo que pidan no verlos mas. */
  function cambiarTab(id) {
    setTab(id);
    setPegadoAbierto(false);
    setFormAbierto(false);
    if (id === 'script' && recordarInstrucciones) setInstruccionesAbiertas(true);
  }

  /* Nunca dos modales encima: abrir el perfil cierra las instrucciones. */
  function abrirPerfil() {
    setInstruccionesAbiertas(false);
    setPerfilAbierto(true);
  }

  /* `accion` agrega un boton al aviso (deshacer): lo destructivo es reversible. */
  function mostrarToast(texto, accion) {
    setToast({ texto, accion });
    clearTimeout(timerToast.current);
    timerToast.current = setTimeout(() => setToast(null), accion ? 7000 : 2600);
  }

  /* Devuelve las ordenes creadas: quien las agrega puede seleccionarlas despues. */
  function agregarOrdenes(lista) {
    const creadaEn = Date.now();
    const nuevas = lista.map((datos, i) => ({ id: formatearId(proximoId + i), creadaEn, ...datos }));
    setOrdenes((prev) => [...prev, ...nuevas]);
    setProximoId((n) => n + lista.length);
    return nuevas;
  }

  function agregarOrden(datos) {
    const [nueva] = agregarOrdenes([datos]);
    setSeleccion(nueva.id);
    mostrarToast(`Orden ${datos.sot} agregada (${nueva.id})`);
    return nueva;
  }

  /* Se elige la ultima del lote: es la que queda arriba en la lista. */
  function agregarDesdePegado(lista) {
    const nuevas = agregarOrdenes(lista);
    if (nuevas.length) setSeleccion(nuevas[nuevas.length - 1].id);
  }

  /*
   * El modo vale para lo que se cargue de ahora en adelante: las ordenes que
   * ya estaban conservan el valor con el que entraron.
   */

  function actualizarOrden(id, cambios) {
    setOrdenes((prev) => prev.map((o) => (o.id === id ? { ...o, ...cambios } : o)));
  }

  /* Queda marcada como copiada: es como sabe cuales de la cola ya salieron. */
  function marcarCopiada(id) {
    actualizarOrden(id, { copiadaEn: Date.now() });
  }

  function eliminarOrden(id) {
    const posicion = ordenes.findIndex((o) => o.id === id);
    if (posicion < 0) return;
    const borrada = ordenes[posicion];
    setOrdenes((prev) => prev.filter((o) => o.id !== id));
    mostrarToast(`Orden ${borrada.sot} eliminada`, {
      etiqueta: 'Deshacer',
      hacer: () => {
        setOrdenes((prev) => {
          const copia = [...prev];
          copia.splice(posicion, 0, borrada);
          return copia;
        });
        setToast(null);
      },
    });
  }

  function vaciarTodo() {
    if (!ordenes.length) return;
    const previas = ordenes;
    setOrdenes([]);
    mostrarToast(`${previas.length} órdenes eliminadas`, {
      etiqueta: 'Deshacer',
      hacer: () => {
        setOrdenes(previas);
        setToast(null);
      },
    });
  }

  function exportar() {
    const data = {
      app: 'HITSS Autollenado',
      generado: new Date().toISOString(),
      usuario: perfil.usuario,
      operador: perfil.operador,
      total: ordenes.length,
      ordenes,
    };
    descargarArchivo(
      `hitss-ordenes-${perfil.usuario}-${hoyArchivo()}.json`,
      JSON.stringify(data, null, 2),
      'application/json;charset=utf-8'
    );
    mostrarToast(`Exportadas ${ordenes.length} órdenes`);
  }

  function importar(file) {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const lista = Array.isArray(data) ? data : data.ordenes;
        if (!Array.isArray(lista)) throw new Error('formato');

        const limpias = lista
          .filter((o) => o && typeof o === 'object' && o.sot)
          .map((o) => ({
            id: o.id || '',
            sot: String(o.sot),
            cliente: String(o.cliente || ''),
            telefono: String(o.telefono || ''),
            contrata: String(o.contrata || ''),
            fecha: String(o.fecha || FECHA_DEFAULT),
            franja: String(o.franja || FRANJA_DEFAULT),
            horario: String(o.horario || ''),
            observaciones: String(o.observaciones || ''),
            gestion: String(o.gestion || GESTIONES[0]),
            departamento: String(o.departamento || DEPARTAMENTOS[0]),
            yaGestion: String(o.yaGestion || 'NO'),
            sotManual: String(o.sotManual || SOT_MANUAL_DEFAULT),
            tipoPlantilla: o.tipoPlantilla || '',
            creadaEn: o.creadaEn || null,
          }));

        if (!limpias.length) {
          mostrarToast('El archivo no tiene órdenes válidas');
          return;
        }

        const reemplazar =
          ordenes.length === 0 ||
          window.confirm(
            `Ya hay ${ordenes.length} órdenes.\n\n` +
              `Aceptar = reemplazar por las ${limpias.length} del archivo.\n` +
              'Cancelar = agregarlas al final.'
          );

        let contador = reemplazar ? ID_INICIAL : proximoId;
        const vistos = {};
        const finales = limpias.map((o) => {
          const id = o.id && !vistos[o.id] ? o.id : formatearId(contador++);
          vistos[id] = true;
          return { ...o, id };
        });

        setOrdenes(reemplazar ? finales : [...ordenes, ...finales]);
        setProximoId(Math.max(contador, proximoId));
        mostrarToast(`Importadas ${finales.length} órdenes`);
      } catch {
        mostrarToast('Archivo inválido: no se pudo leer el JSON');
      }
    };

    reader.onerror = () => mostrarToast('No se pudo leer el archivo');
    reader.readAsText(file);
  }

  const { confirmados, ciclos } = useMemo(() => separarPorTipo(ordenes), [ordenes]);

  /* Conteo por tipo de plantilla: es lo que se ve en la lista y en el pie. */
  const porTipo = useMemo(() => {
    const c = { CONFI: 0, CICLO: 0, RECHAZO: 0 };
    ordenes.forEach((o) => {
      c[tipoDeOrden(o)] += 1;
    });
    return c;
  }, [ordenes]);

  const incompletas = useMemo(
    () => ordenes.filter((o) => !o.cliente || !o.telefono || !o.fecha).length,
    [ordenes]
  );

  const pendientes = useMemo(() => ordenes.filter((o) => !o.copiadaEn).length, [ordenes]);
  const sotsCargados = useMemo(() => ordenes.map((o) => o.sot), [ordenes]);

  const ordenesScript =
    filtroScript === 'confirmados' ? confirmados : filtroScript === 'ciclos' ? ciclos : ordenes;

  const script = useMemo(
    () => generarScript(ordenesScript, perfil, { formatoFecha }),
    [ordenesScript, perfil, formatoFecha]
  );

  function abrirPegado() {
    setFormAbierto(false);
    setPegadoAbierto(true);
  }

  const cuenta = (
    <>
      <b>{ordenes.length}</b> {ordenes.length === 1 ? 'orden' : 'órdenes'}
      {incompletas ? (
        <>
          {' · '}
          <b>{incompletas}</b> sin completar
        </>
      ) : null}
    </>
  );

  /* Cada paso trae su cabecera: el dato del turno a la izquierda, las acciones a la derecha. */
  const cabecera =
    tab === 'ordenes' ? (
      <CabeceraSeccion paso={1} titulo="Carga tus órdenes" dato={cuenta}>
        <button className="btn btn-primario" onClick={abrirPegado}>
          Pegar de OFS
        </button>
        <button
          className="btn"
          onClick={() => {
            setPegadoAbierto(false);
            setFormAbierto(true);
          }}
        >
          Cargar a mano
        </button>
        <button className="btn" onClick={() => cambiarTab('plantillas')} disabled={!ordenes.length}>
          Armar plantillas →
        </button>
      </CabeceraSeccion>
    ) : tab === 'plantillas' ? (
      <CabeceraSeccion
        paso={2}
        titulo="Arma la plantilla"
        dato={
          <>
            <b>{pendientes}</b> por copiar de <b>{ordenes.length}</b>
            {incompletas ? (
              <>
                {' · '}
                <b>{incompletas}</b> sin completar
              </>
            ) : null}
          </>
        }
      >
        <button className="btn" onClick={abrirPegado}>
          Pegar de OFS
        </button>
        <button className="btn" onClick={() => cambiarTab('script')} disabled={!ordenes.length}>
          Generar el script →
        </button>
      </CabeceraSeccion>
    ) : (
      <CabeceraSeccion
        paso={3}
        titulo="Envía al formulario"
        dato={
          <>
            <b>{ordenesScript.length}</b> de <b>{ordenes.length}</b> entran en el script
          </>
        }
      >
        <button className="btn" onClick={() => setInstruccionesAbiertas(true)}>
          Ver instrucciones
        </button>
        <button className="btn" onClick={() => cambiarTab('ordenes')}>
          Volver a órdenes
        </button>
      </CabeceraSeccion>
    );

  const pegar = (
    <PanelPegar
      onAgregar={agregarDesdePegado}
      onToast={mostrarToast}
      modo={modo}
      onModo={setModo}
      deptosD1={deptosD1}
      onDeptosD1={setDeptosD1}
      abierto={pegadoAbierto}
      onAbierto={setPegadoAbierto}
      opciones={opcionesPegado}
      onOpciones={setOpcionesPegado}
      sotsCargados={sotsCargados}
    />
  );

  return (
    <div className="app">
      <Encabezado
        perfil={perfil}
        onAbrirPerfil={abrirPerfil}
        total={ordenes.length}
        tema={tema}
        onTema={setTema}
        tab={tab}
        onTab={cambiarTab}
      />

      <div className="banco">
        {cabecera}

        {tab === 'ordenes' ? (
          <div className="cuerpo una">
            <TablaOrdenes
              ordenes={ordenes}
              onEliminar={eliminarOrden}
              onVaciar={vaciarTodo}
              onExportar={exportar}
              onImportar={importar}
              onIrAPegar={abrirPegado}
              onCargarAMano={() => setFormAbierto(true)}
            />
            {pegar}
            <FormularioOrden
              proximoId={proximoId}
              modo={modo}
              deptosD1={deptosD1}
              abierto={formAbierto}
              onAbierto={setFormAbierto}
              onAgregar={agregarOrden}
            />
          </div>
        ) : tab === 'plantillas' ? (
          <div className="cuerpo tres">
            <PanelPlantillas
              ordenes={ordenes}
              perfil={perfil}
              seleccion={seleccion}
              onSeleccion={setSeleccion}
              onAbrirPegado={abrirPegado}
              onActualizarOrden={actualizarOrden}
              onCopiada={marcarCopiada}
              onToast={mostrarToast}
            />
            {pegar}
          </div>
        ) : (
          <div className="cuerpo dos">
            <PanelScript
              ordenes={ordenesScript}
              perfil={perfil}
              script={script}
              filtro={filtroScript}
              onFiltro={setFiltroScript}
              formatoFecha={formatoFecha}
              onFormatoFecha={setFormatoFecha}
              conteos={{
                todas: ordenes.length,
                confirmados: confirmados.length,
                ciclos: ciclos.length,
              }}
              onVerInstrucciones={() => setInstruccionesAbiertas(true)}
              onToast={mostrarToast}
            />
          </div>
        )}

        <footer className="estado">
          <span>
            <b className="mono">{perfil.usuario}</b>
            {perfil.operador ? ' · ' + perfil.operador : ''}
          </span>
          <span className="marcador">
            <i className="p-confi" /> Confirmadas <b>{porTipo.CONFI}</b>
          </span>
          <span className="marcador">
            <i className="p-ciclo" /> Ciclos <b>{porTipo.CICLO}</b>
          </span>
          <span className="marcador">
            <i className="p-rechazo" /> Rechazos <b>{porTipo.RECHAZO}</b>
          </span>
          {ordenes.length ? (
            <span>
              Copiadas <b>{ordenes.length - pendientes}</b> de <b>{ordenes.length}</b>
            </span>
          ) : null}
          <span className="empuje" />
          <span>
            Modo de las nuevas: <b>{modo || 'automático por departamento'}</b>
          </span>
          <span className="mono" title="Sirve para saber si el navegador tiene la última versión">
            v{__VERSION__}
          </span>
        </footer>
      </div>

      {instruccionesAbiertas ? (
        <ModalInstrucciones
          cantidad={ordenesScript.length}
          recordar={recordarInstrucciones}
          onRecordar={setRecordarInstrucciones}
          onCerrar={() => setInstruccionesAbiertas(false)}
        />
      ) : null}

      {perfilAbierto ? (
        <PerfilModal
          perfil={perfil}
          bienvenida={bienvenida}
          onGuardar={guardarPerfil}
          onCerrar={() => {
            setPerfilAbierto(false);
            setBienvenida(false);
          }}
        />
      ) : null}

      {/* Lista compartida por todos los campos de contrata. */}
      <datalist id={LISTA_CONTRATAS}>
        {CONTRATAS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {toast ? (
        <div className="mensaje" role="status" aria-live="polite">
          <span>{toast.texto}</span>
          {toast.accion ? (
            <button className="mensaje-accion" onClick={toast.accion.hacer}>
              {toast.accion.etiqueta}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
