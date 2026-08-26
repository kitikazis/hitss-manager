import { useEffect, useMemo, useRef, useState } from 'react';
import { Encabezado } from './components/Encabezado';
import { PerfilModal } from './components/Perfil';
import { FormularioOrden } from './components/FormularioOrden';
import { TablaOrdenes } from './components/TablaOrdenes';
import { PanelPlantillas } from './components/PanelPlantillas';
import { PanelScript } from './components/PanelScript';
import { useAlmacenado } from './hooks/useAlmacenado';
import { generarScript } from './lib/generarScript';
import { separarPorTipo } from './lib/plantillas';
import {
  descargarArchivo,
  escribirAlmacen,
  formatearId,
  hoyArchivo,
  hoyTexto,
  leerAlmacen,
} from './lib/utils';
import {
  CLAVE_FORMATO_FECHA,
  CLAVE_USUARIO,
  CLAVE_TEMA,
  DEPARTAMENTOS,
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
  const [bienvenida, setBienvenida] = useState(primeraVez);

  const [tab, setTab] = useState('ordenes');
  const [filtroScript, setFiltroScript] = useState('todas');
  const [modoScript, setModoScript] = useState('manual');
  const [formatoFecha, setFormatoFecha] = useAlmacenado(CLAVE_FORMATO_FECHA, FORMATO_FECHA_DEFAULT);
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

  /* `accion` agrega un boton al aviso (deshacer): lo destructivo es reversible. */
  function mostrarToast(texto, accion) {
    setToast({ texto, accion });
    clearTimeout(timerToast.current);
    timerToast.current = setTimeout(() => setToast(null), accion ? 7000 : 2600);
  }

  /* Devuelve las ordenes creadas: quien las agrega puede seleccionarlas despues. */
  function agregarOrdenes(lista) {
    const nuevas = lista.map((datos, i) => ({ id: formatearId(proximoId + i), ...datos }));
    setOrdenes((prev) => [...prev, ...nuevas]);
    setProximoId((n) => n + lista.length);
    return nuevas;
  }

  function agregarOrden(datos) {
    const [nueva] = agregarOrdenes([datos]);
    mostrarToast(`Orden ${datos.sot} agregada (${nueva.id})`);
    return nueva;
  }

  function actualizarOrden(id, cambios) {
    setOrdenes((prev) => prev.map((o) => (o.id === id ? { ...o, ...cambios } : o)));
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
            gestion: String(o.gestion || GESTIONES[0]),
            departamento: String(o.departamento || DEPARTAMENTOS[0]),
            yaGestion: String(o.yaGestion || 'NO'),
            sotManual: String(o.sotManual || SOT_MANUAL_DEFAULT),
            tipoPlantilla: o.tipoPlantilla || '',
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

  const ordenesScript =
    filtroScript === 'confirmados' ? confirmados : filtroScript === 'ciclos' ? ciclos : ordenes;

  const script = useMemo(
    () => generarScript(ordenesScript, perfil, { modo: modoScript, formatoFecha }),
    [ordenesScript, perfil, modoScript, formatoFecha]
  );

  return (
    <>
      <Encabezado
        perfil={perfil}
        onAbrirPerfil={() => setPerfilAbierto(true)}
        total={ordenes.length}
        tema={tema}
        onTema={setTema}
        tab={tab}
        onTab={setTab}
      />

      <main>
        <div className="wrap">
          {tab === 'ordenes' ? (
            <>
              <FormularioOrden proximoId={proximoId} onAgregar={agregarOrden} />
              <TablaOrdenes
                ordenes={ordenes}
                onEliminar={eliminarOrden}
                onVaciar={vaciarTodo}
                onExportar={exportar}
                onImportar={importar}
                onIrAPegar={() => setTab('plantillas')}
              />
            </>
          ) : tab === 'plantillas' ? (
            <PanelPlantillas
              ordenes={ordenes}
              perfil={perfil}
              onAgregarOrdenes={agregarOrdenes}
              onActualizarOrden={actualizarOrden}
              onToast={mostrarToast}
            />
          ) : (
            <PanelScript
              ordenes={ordenesScript}
              perfil={perfil}
              script={script}
              filtro={filtroScript}
              onFiltro={setFiltroScript}
              modo={modoScript}
              onModo={setModoScript}
              formatoFecha={formatoFecha}
              onFormatoFecha={setFormatoFecha}
              conteos={{
                todas: ordenes.length,
                confirmados: confirmados.length,
                ciclos: ciclos.length,
              }}
              onToast={mostrarToast}
            />
          )}
        </div>
      </main>

      <footer>
        <div className="wrap">
          <div className="pie">
            <span>
              Usuario: <b className="mono">{perfil.usuario}</b>
            </span>
            <span>
              Operador: <b>{perfil.operador || '—'}</b>
            </span>
            <span>
              Fecha: <b>{hoyTexto()}</b>
            </span>
            <span>
              Órdenes pendientes: <b>{ordenes.length}</b>
            </span>
            <span>
              Confirmados: <b>{confirmados.length}</b> · Ciclos: <b>{ciclos.length}</b>
            </span>
          </div>
        </div>
      </footer>

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
    </>
  );
}
