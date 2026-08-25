import { formatearFecha, hoyTexto } from './utils.js';

/*
 * Devuelve el script que el operador pega en la consola del formulario HITSS.
 *
 * modo 'manual': llena la primera orden y espera; el operador revisa, envia y
 *                corre siguienteOrden() para la siguiente.
 * modo 'auto':   llena + envia + repite todo el array sin intervencion.
 *
 * formatoFecha: 'd/m/yyyy' o 'M/d/yyyy', segun lo que espere el formulario.
 *
 * Ojo al editar: el cuerpo va dentro de un template literal, asi que el codigo
 * generado no puede usar backticks ni ${...}; por eso concatena con +.
 */
export function generarScript(ordenes, perfil, opciones = {}) {
  const { modo = 'manual', formatoFecha = 'd/m/yyyy' } = opciones;

  const filas = ordenes
    .map(
      (o) =>
        '    { sot: ' + JSON.stringify(o.sot) +
        ', fecha: ' + JSON.stringify(formatearFecha(o.fecha, formatoFecha)) +
        ', franja: ' + JSON.stringify(o.franja) +
        ', gestion: ' + JSON.stringify(o.gestion) +
        ', departamento: ' + JSON.stringify(o.departamento) +
        ', yaGestion: ' + JSON.stringify(o.yaGestion) +
        ', sotManual: ' + JSON.stringify(o.sotManual) + ' },'
    )
    .join('\n');

  const cabecera = [
    '// ============================================',
    '// AUTOLLENADO MICROSOFT FORMS - HITSS',
    '// Pega esto en la consola (F12) estando en el form abierto',
    '// Usuario: ' + perfil.usuario + ' | Operador: ' + perfil.operador,
    '// Generado: ' + hoyTexto() + ' | Ordenes: ' + ordenes.length,
    '// ============================================',
    '',
    '// FECHA en formato ' + formatoFecha + ' (sin ceros adelante)',
    '// sotManual: PROGRAMACIONES D+1 / MIGRACIONES / PM3 / PREDICTIVO',
    '// Regla: UCAYALI y SAN MARTIN = PROGRAMACIONES D+1',
    '',
    '(function () {',
    "  'use strict';",
    '',
    '  const USUARIO = ' + JSON.stringify(perfil.usuario) + ';',
    '',
    '  const ORDENES = [',
    filas || '    /* sin ordenes: agrega al menos una en la app */',
    '  ];',
  ].join('\n');

  const cuerpo = `
  let idx = 0;
  const RESULTADOS = []; // { sot, estado: 'enviado' | 'fallo', motivo }

  // Busca un input/radio/dropdown de Forms por el texto de la pregunta
  function getQuestionContainer(texto) {
    const labels = Array.from(document.querySelectorAll('[role="heading"], .office-form-question-title, div[data-automation-id="questionTitle"]'));
    const match = labels.find(el => el.innerText && el.innerText.toLowerCase().includes(texto.toLowerCase()));
    if (!match) return null;
    // sube al contenedor de la pregunta completa
    return match.closest('[data-automation-id="questionItem"]') || match.closest('.office-form-question');
  }

  function fillText(container, value) {
    if (!container) return false;
    const input = container.querySelector('input:not([type="radio"]):not([type="checkbox"]), textarea');
    if (!input) {
      console.warn('No se encontro input de texto en el contenedor:', container.innerText.slice(0, 40));
      return false;
    }
    input.focus();

    const proto = input.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(input, value);

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function selectChoice(container, valorEsperado) {
    if (!container || !valorEsperado) return false;
    const inputs = Array.from(container.querySelectorAll('input[type="radio"]'));
    const target = inputs.find(i => (i.value || '').trim().toUpperCase() === valorEsperado.trim().toUpperCase());
    if (target) {
      target.click();
      return true;
    }
    console.warn('No se encontro opcion:', valorEsperado, 'Opciones disponibles:', inputs.map(i => i.value));
    return false;
  }

  function clickSubmit() {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => /submit|enviar/i.test((b.innerText || b.textContent || '').trim()));
    if (btn) {
      btn.click();
      return true;
    }
    console.warn('No se encontro boton de Enviar/Submit');
    return false;
  }

  function clickSubmitAnotherResponse(intentos = 20) {
    const links = Array.from(document.querySelectorAll('a, button, [role="link"], [role="button"]'));
    const link = links.find(l => /submit another response|enviar otra respuesta/i.test((l.innerText || l.textContent || '').trim()));
    if (link) {
      link.click();
      return true;
    }
    if (intentos <= 0) {
      console.warn('No aparecio el enlace "Submit another response" a tiempo.');
      return false;
    }
    setTimeout(() => clickSubmitAnotherResponse(intentos - 1), 400);
    return null; // aun reintentando
  }

  function formEstaListoParaLlenar() {
    // Chequea que el campo "Usuario E" este vacio (senal de que cargo un form limpio)
    const cont = getQuestionContainer("Usuario E");
    if (!cont) return false;
    const input = cont.querySelector('input[type="text"], textarea');
    return input && input.value.trim() === '';
  }

  function esperarFormLimpio(callback, intentos = 20) {
    if (formEstaListoParaLlenar()) {
      callback();
      return;
    }
    if (intentos <= 0) {
      console.warn('Timeout esperando que el form se reinicie. Revisa manualmente.');
      return;
    }
    setTimeout(() => esperarFormLimpio(callback, intentos - 1), 500);
  }

  function fillOrden(orden) {
    console.log('Llenando SOT ' + orden.sot + '...');

    fillText(getQuestionContainer("Usuario E"), USUARIO);
    fillText(getQuestionContainer("SOT"), orden.sot);
    fillText(getQuestionContainer("FECHA"), orden.fecha);
    selectChoice(getQuestionContainer("FRANJA"), orden.franja);
    selectChoice(getQuestionContainer("GESTION"), orden.gestion);
    selectChoice(getQuestionContainer("DEPARTAMENTO"), orden.departamento);
    selectChoice(getQuestionContainer("YA TIENE GESTION"), orden.yaGestion);
    selectChoice(getQuestionContainer("SOT GESTIONADA MANUAL"), orden.sotManual);

    console.log('SOT ' + orden.sot + ' completado.');
  }

  function siguienteOrden() {
    if (idx >= ORDENES.length) {
      console.log("Todas las ordenes fueron procesadas.");
      return;
    }
    fillOrden(ORDENES[idx]);
    idx++;
  }

  // ============================================
  // MODO AUTOMATICO COMPLETO
  // Llena + envia + espera + repite, sin intervencion manual.
  // USAR CON CUIDADO: no hay pausa para revisar antes de enviar.
  // Cada vez que la llamas, arranca desde el principio del array ORDENES.
  // ============================================
  function autollenarTodo() {
    idx = 0;
    RESULTADOS.length = 0;
    console.log('Iniciando envio automatico de ' + ORDENES.length + ' ordenes...');
    _procesarSiguiente();
  }

  function _procesarSiguiente() {
    if (idx >= ORDENES.length) {
      mostrarResumen();
      return;
    }
    const orden = ORDENES[idx];
    fillOrden(orden);
    idx++;

    setTimeout(() => {
      const enviado = clickSubmit();
      if (!enviado) {
        console.warn('No se pudo enviar SOT ' + orden.sot + '. Deteniendo modo automatico.');
        RESULTADOS.push({ sot: orden.sot, estado: 'fallo', motivo: 'no se encontro boton Enviar' });
        mostrarResumen();
        return;
      }
      RESULTADOS.push({ sot: orden.sot, estado: 'enviado' });
      setTimeout(() => {
        clickSubmitAnotherResponse();
        esperarFormLimpio(() => {
          _procesarSiguiente();
        });
      }, 600);
    }, 800); // pausa antes de enviar, para que los campos terminen de registrarse
  }

  function mostrarResumen() {
    console.log('===== RESUMEN =====');
    console.table(RESULTADOS);
    console.log('Total procesadas: ' + RESULTADOS.length + ' / ' + ORDENES.length);
    const fallidas = RESULTADOS.filter(r => r.estado === 'fallo');
    if (fallidas.length) {
      console.warn('Fallidas:', fallidas.map(f => f.sot).join(', '));
    } else if (RESULTADOS.length === ORDENES.length) {
      console.log('Todas las ordenes se enviaron correctamente.');
    }
  }

  // Quedan disponibles en la consola para llamarlas cuando quieras.
  window.ORDENES = ORDENES;
  window.RESULTADOS = RESULTADOS;
  window.siguienteOrden = siguienteOrden;
  window.autollenarTodo = autollenarTodo;
`;

  const cierreManual = [
    '',
    '  // Ejecuta la primera orden SOLO (manual, revisas y envias tu):',
    '  siguienteOrden();',
    '',
    '  // Para la siguiente, despues de enviar el form y que cargue uno nuevo, corre:',
    '  // siguienteOrden()',
    '',
    '  // -------- O bien, modo 100% automatico (llena + envia + repite todo el array) --------',
    '  // autollenarTodo()',
    '})();',
    '',
  ].join('\n');

  const cierreAuto = [
    '',
    '  // Modo 100% automatico: llena + envia + repite todo el array.',
    '  autollenarTodo();',
    '',
    '  // Para volver a lanzarlo desde el principio: autollenarTodo()',
    '  // Para ir orden por orden: siguienteOrden()',
    '})();',
    '',
  ].join('\n');

  return cabecera + cuerpo + (modo === 'auto' ? cierreAuto : cierreManual);
}
