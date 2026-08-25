import { useEffect, useRef, useState } from 'react';
import { escribirAlmacen, leerAlmacen } from '../lib/utils.js';

/*
 * Estado persistido en localStorage.
 * Si la clave cambia (el operador cambia su codigo de usuario) recarga el valor
 * de la nueva clave en vez de pisarla con los datos del usuario anterior.
 */
export function useAlmacenado(clave, valorInicial) {
  const [valor, setValor] = useState(() => leerAlmacen(clave, valorInicial));
  const claveAnterior = useRef(clave);
  const inicialRef = useRef(valorInicial);
  inicialRef.current = valorInicial; // el default acompana a la clave vigente

  useEffect(() => {
    if (claveAnterior.current !== clave) {
      claveAnterior.current = clave;
      setValor(leerAlmacen(clave, inicialRef.current));
      return;
    }
    escribirAlmacen(clave, valor);
  }, [clave, valor]);

  return [valor, setValor];
}
