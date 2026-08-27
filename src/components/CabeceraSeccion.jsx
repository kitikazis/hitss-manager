/*
 * Barra superior del banco de trabajo: dónde estás, cómo va el turno y las
 * acciones del paso. Ocupa una sola fila de 44 px para no robarle alto al
 * trabajo.
 */
export function CabeceraSeccion({ paso, titulo, dato, children }) {
  return (
    <header className="cima">
      <span className="eyebrow">Paso {paso} de 3</span>
      <h1>{titulo}</h1>
      {dato ? (
        <>
          <span className="sep" />
          <span className="dato">{dato}</span>
        </>
      ) : null}
      <span className="empuje" />
      {children}
    </header>
  );
}
