/*
 * Dice dónde está el usuario y qué viene después. El botón de la derecha lleva
 * al paso siguiente, para no tener que buscarlo en el menú.
 */
export function CabeceraSeccion({ paso, titulo, descripcion, siguiente, onIr }) {
  return (
    <header className="seccion-cab">
      <div>
        <p className="seccion-paso">Paso {paso} de 3</p>
        <h2>{titulo}</h2>
        <p className="seccion-desc">{descripcion}</p>
      </div>

      {siguiente ? (
        <button className="btn btn-siguiente" onClick={() => onIr(siguiente.id)}>
          {siguiente.etiqueta}
          <span aria-hidden="true">→</span>
        </button>
      ) : null}
    </header>
  );
}
