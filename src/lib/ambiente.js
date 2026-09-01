/*
 * Sonido de fondo generado por el navegador. No descarga nada: el ruido se
 * calcula aqui y se repite en bucle, asi que ningun filtro de red lo alcanza.
 *
 * Sirve para tapar el ruido de la sala en un turno largo sin la letra de una
 * cancion, que compite con la llamada.
 */
export const AMBIENTES = [
  { id: 'lluvia', etiqueta: 'Lluvia' },
  { id: 'ventilador', etiqueta: 'Ventilador' },
  { id: 'rosa', etiqueta: 'Ruido rosa' },
  { id: 'marron', etiqueta: 'Ruido marrón' },
];

const SEGUNDOS = 6;

/* Ruido rosa por el metodo de Paul Kellet: suena mas parejo que el blanco. */
function llenarRosa(datos) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < datos.length; i++) {
    const blanco = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + blanco * 0.0555179;
    b1 = 0.99332 * b1 + blanco * 0.0750759;
    b2 = 0.969 * b2 + blanco * 0.153852;
    b3 = 0.8665 * b3 + blanco * 0.3104856;
    b4 = 0.55 * b4 + blanco * 0.5329522;
    b5 = -0.7616 * b5 - blanco * 0.016898;
    datos[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + blanco * 0.5362) * 0.11;
    b6 = blanco * 0.115926;
  }
}

/* Ruido marron: el blanco integrado. Mas grave, menos siseo. */
function llenarMarron(datos) {
  let anterior = 0;
  for (let i = 0; i < datos.length; i++) {
    const blanco = Math.random() * 2 - 1;
    anterior = (anterior + 0.02 * blanco) / 1.02;
    datos[i] = anterior * 3.5;
  }
}

export class MotorAmbiente {
  constructor() {
    this.ctx = null;
    this.fuente = null;
    this.salida = null;
    this.lfo = null;
    this.tipo = '';
    this.volumen = 0.3;
  }

  /* El contexto se crea al primer clic: los navegadores no dejan antes. */
  asegurarContexto() {
    if (!this.ctx) {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (!Contexto) return null;
      this.ctx = new Contexto();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  buffer(tipo) {
    const largo = Math.floor(this.ctx.sampleRate * SEGUNDOS);
    const buffer = this.ctx.createBuffer(1, largo, this.ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    if (tipo === 'marron' || tipo === 'ventilador') llenarMarron(datos);
    else llenarRosa(datos);

    // Une el final con el principio para que el bucle no haga clic.
    const cruce = Math.floor(this.ctx.sampleRate * 0.05);
    for (let i = 0; i < cruce; i++) {
      const k = i / cruce;
      datos[i] = datos[i] * k + datos[largo - cruce + i] * (1 - k);
    }
    return buffer;
  }

  iniciar(tipo) {
    const ctx = this.asegurarContexto();
    if (!ctx) return false;
    this.detener();

    const fuente = ctx.createBufferSource();
    fuente.buffer = this.buffer(tipo);
    fuente.loop = true;

    const filtro = ctx.createBiquadFilter();
    const salida = ctx.createGain();
    salida.gain.value = this.volumen;

    if (tipo === 'lluvia') {
      filtro.type = 'bandpass';
      filtro.frequency.value = 1100;
      filtro.Q.value = 0.55;
      // Vaiven lento de intensidad: la lluvia pareja cansa mas que la que respira.
      const lfo = ctx.createOscillator();
      const prof = ctx.createGain();
      lfo.frequency.value = 0.08;
      prof.gain.value = this.volumen * 0.28;
      lfo.connect(prof).connect(salida.gain);
      lfo.start();
      this.lfo = lfo;
    } else if (tipo === 'ventilador') {
      filtro.type = 'lowpass';
      filtro.frequency.value = 420;
      filtro.Q.value = 1.4;
    } else if (tipo === 'rosa') {
      filtro.type = 'highshelf';
      filtro.frequency.value = 3200;
      filtro.gain.value = -6;
    } else {
      filtro.type = 'lowpass';
      filtro.frequency.value = 900;
    }

    fuente.connect(filtro).connect(salida).connect(ctx.destination);
    fuente.start();

    this.fuente = fuente;
    this.salida = salida;
    this.tipo = tipo;
    return true;
  }

  detener() {
    if (this.lfo) {
      try {
        this.lfo.stop();
      } catch {
        /* ya estaba detenido */
      }
      this.lfo = null;
    }
    if (this.fuente) {
      try {
        this.fuente.stop();
      } catch {
        /* ya estaba detenido */
      }
      this.fuente.disconnect();
      this.fuente = null;
    }
    this.salida = null;
    this.tipo = '';
  }

  ponerVolumen(v) {
    this.volumen = v;
    if (this.salida) this.salida.gain.value = v;
  }
}
