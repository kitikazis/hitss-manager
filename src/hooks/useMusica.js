import { useCallback, useEffect, useRef, useState } from 'react';
import { useAlmacenado } from './useAlmacenado';
import { CLAVE_MUSICA } from '../lib/constantes';
import { MotorAmbiente } from '../lib/ambiente';
import { borrarPista, guardarPista, leerPistas, vaciarPistas } from '../lib/almacenAudio';

const PREFERENCIAS = {
  volumen: 0.7,
  volumenAmbiente: 0.3,
  aleatorio: false,
  repetir: true,
  ambiente: '',
};

const sinExtension = (nombre) => nombre.replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');

/*
 * Reproductor local. La musica sale de los archivos del propio equipo y el
 * ambiente lo genera el navegador: ninguna de las dos cosas pide red, asi que
 * el filtro de paginas no interviene.
 */
export function useMusica(onToast) {
  const audio = useRef(null);
  const motor = useRef(null);
  const siguienteRef = useRef(null);

  const [pistas, setPistas] = useState([]);
  const [indice, setIndice] = useState(-1);
  const [sonando, setSonando] = useState(false);
  const [persistible, setPersistible] = useState(true);
  const [prefs, setPrefs] = useAlmacenado(CLAVE_MUSICA, PREFERENCIAS);
  const [ambiente, setAmbiente] = useState('');

  const pref = (campo) => (prefs && campo in prefs ? prefs[campo] : PREFERENCIAS[campo]);
  const cambiarPref = (cambios) => setPrefs((p) => ({ ...PREFERENCIAS, ...p, ...cambios }));

  /* Un solo elemento de audio para toda la app. */
  useEffect(() => {
    const a = new Audio();
    a.preload = 'auto';
    a.volume = pref('volumen');
    audio.current = a;

    const alTerminar = () => siguienteRef.current?.(true);
    const alSonar = () => setSonando(true);
    const alPausar = () => setSonando(false);
    a.addEventListener('ended', alTerminar);
    a.addEventListener('play', alSonar);
    a.addEventListener('pause', alPausar);

    return () => {
      a.pause();
      a.removeEventListener('ended', alTerminar);
      a.removeEventListener('play', alSonar);
      a.removeEventListener('pause', alPausar);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* La lista guardada vuelve sola: se eligen los archivos una vez por turno. */
  useEffect(() => {
    let vivo = true;
    leerPistas()
      .then((guardadas) => {
        if (!vivo || !guardadas.length) return;
        setPistas(
          guardadas.map((p) => ({ id: p.id, nombre: p.nombre, url: URL.createObjectURL(p.blob) }))
        );
      })
      .catch(() => {
        if (vivo) setPersistible(false);
      });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (audio.current) audio.current.volume = pref('volumen');
  }, [prefs]); // eslint-disable-line react-hooks/exhaustive-deps

  const reproducir = useCallback(
    (i) => {
      const pista = pistas[i];
      const a = audio.current;
      if (!pista || !a) return;
      if (a.src !== pista.url) a.src = pista.url;
      setIndice(i);
      a.play().catch(() => onToast?.('El navegador no dejó arrancar el audio. Vuelve a pulsar.'));

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: sinExtension(pista.nombre),
          artist: 'HITSS Manager',
        });
      }
    },
    [pistas, onToast]
  );

  const alternar = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    if (!a.src && pistas.length) {
      reproducir(0);
      return;
    }
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, [pistas.length, reproducir]);

  /* `automatico` distingue el fin de una pista del clic en Siguiente. */
  const siguiente = useCallback(
    (automatico = false) => {
      if (!pistas.length) return;
      if (pref('aleatorio') && pistas.length > 1) {
        let n = indice;
        while (n === indice) n = Math.floor(Math.random() * pistas.length);
        reproducir(n);
        return;
      }
      const n = indice + 1;
      if (n < pistas.length) {
        reproducir(n);
      } else if (pref('repetir')) {
        reproducir(0);
      } else if (automatico) {
        setSonando(false);
      }
    },
    [indice, pistas.length, prefs, reproducir] // eslint-disable-line react-hooks/exhaustive-deps
  );

  siguienteRef.current = siguiente;

  const anterior = useCallback(() => {
    if (!pistas.length) return;
    const a = audio.current;
    // Como en cualquier reproductor: pasados 3 s, vuelve al principio de la pista.
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    reproducir(indice > 0 ? indice - 1 : pistas.length - 1);
  }, [indice, pistas.length, reproducir]);

  /* Los controles de multimedia del teclado manejan el reproductor. */
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const acciones = [
      ['play', () => audio.current?.play()],
      ['pause', () => audio.current?.pause()],
      ['nexttrack', () => siguiente()],
      ['previoustrack', () => anterior()],
    ];
    acciones.forEach(([nombre, hacer]) => {
      try {
        navigator.mediaSession.setActionHandler(nombre, hacer);
      } catch {
        /* el navegador no soporta esa accion */
      }
    });
  }, [siguiente, anterior]);

  async function agregar(archivos) {
    const lista = [...archivos].filter((f) => f.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|flac|aac|opus)$/i.test(f.name));
    if (!lista.length) {
      onToast?.('Esos archivos no son de audio');
      return;
    }

    const base = Date.now();
    const nuevas = lista.map((archivo, i) => ({
      id: base + '-' + i,
      nombre: archivo.name,
      orden: pistas.length + i,
      blob: archivo,
      url: URL.createObjectURL(archivo),
    }));

    setPistas((prev) => [...prev, ...nuevas.map(({ blob, ...resto }) => resto)]); // eslint-disable-line no-unused-vars

    try {
      for (const pista of nuevas) await guardarPista(pista);
    } catch {
      setPersistible(false);
    }

    onToast?.(
      lista.length === 1 ? `${sinExtension(lista[0].name)} agregada` : `${lista.length} pistas agregadas`
    );
  }

  function quitar(id) {
    const posicion = pistas.findIndex((p) => p.id === id);
    if (posicion < 0) return;
    const pista = pistas[posicion];

    if (posicion === indice) {
      audio.current?.pause();
      if (audio.current) audio.current.removeAttribute('src');
      setIndice(-1);
    } else if (posicion < indice) {
      setIndice((n) => n - 1);
    }

    URL.revokeObjectURL(pista.url);
    setPistas((prev) => prev.filter((p) => p.id !== id));
    borrarPista(id).catch(() => {});
  }

  function vaciar() {
    audio.current?.pause();
    if (audio.current) audio.current.removeAttribute('src');
    pistas.forEach((p) => URL.revokeObjectURL(p.url));
    setPistas([]);
    setIndice(-1);
    vaciarPistas().catch(() => {});
  }

  function ponerVolumen(v) {
    if (audio.current) audio.current.volume = v;
    cambiarPref({ volumen: v });
  }

  function ponerAmbiente(tipo) {
    if (!motor.current) motor.current = new MotorAmbiente();
    motor.current.ponerVolumen(pref('volumenAmbiente'));

    if (!tipo || tipo === ambiente) {
      motor.current.detener();
      setAmbiente('');
      cambiarPref({ ambiente: '' });
      return;
    }

    const listo = motor.current.iniciar(tipo);
    if (!listo) {
      onToast?.('Este navegador no puede generar el sonido de fondo');
      return;
    }
    setAmbiente(tipo);
    cambiarPref({ ambiente: tipo });
  }

  function ponerVolumenAmbiente(v) {
    motor.current?.ponerVolumen(v);
    cambiarPref({ volumenAmbiente: v });
  }

  useEffect(() => () => motor.current?.detener(), []);

  return {
    pistas,
    indice,
    actual: indice >= 0 ? pistas[indice] : null,
    sonando,
    persistible,
    volumen: pref('volumen'),
    aleatorio: pref('aleatorio'),
    repetir: pref('repetir'),
    ambiente,
    volumenAmbiente: pref('volumenAmbiente'),
    agregar,
    quitar,
    vaciar,
    reproducir,
    alternar,
    siguiente,
    anterior,
    ponerVolumen,
    ponerAmbiente,
    ponerVolumenAmbiente,
    alternarAleatorio: () => cambiarPref({ aleatorio: !pref('aleatorio') }),
    alternarRepetir: () => cambiarPref({ repetir: !pref('repetir') }),
    nombreCorto: (nombre) => sinExtension(nombre),
  };
}
