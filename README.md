# HITSS Manager

App en **React 18 + Vite** para gestionar órdenes HITSS, armar las plantillas de
mesa (confirma visita / ciclo de llamadas / rechazo) y generar el script de
autollenado del formulario. Sin backend: cada operador guarda sus datos en su
propio navegador.

## Usarla ya

**https://kitikazis.github.io/hitss-manager/**

Se publica sola en GitHub Pages con cada push a `main`. Los datos viven en el
navegador de cada operador: nada se sube a ningún servidor.

## Arrancar

```bash
npm install
npm run dev
```

- Local: http://localhost:5173/
- Red local (otros operadores): `http://<IP-de-esta-PC>:5173/` — Vite imprime la IP al arrancar.
  Si desde otra PC no abre, hay que permitir `node.exe` en el Firewall de Windows.

## Cómo está pensada

Es un **banco de trabajo de una sola pantalla**, pensado para un puesto de call
center: los tres pasos entran en `100dvh` sin scroll de página a 1366×768 y a
1920×1080, y el desplazamiento vive dentro de cada panel (la lista, la tabla y el
bloque de código), nunca en la ventana.

El menú es un **riel de 64 px** a la izquierda: la marca, los tres pasos numerados y,
al pie, el tema y el código de usuario. Son tres pasos —no necesitan una columna
entera—, y el ancho que se ahorra se va a los datos. Bajo 860 px el riel pasa arriba
como una fila y la página vuelve al scroll normal.

Arriba, una **barra de 44 px** dice en qué paso vas, cómo va el turno (*12 órdenes ·
2 sin completar*) y trae las acciones de ese paso a la derecha. Abajo, una **barra de
estado de 26 px** con el operador, el conteo por tipo, el modo vigente y la versión
del build.

Las secciones están numeradas porque son el orden del trabajo: **1 Órdenes** (cargar)
→ **2 Plantillas** (armar y copiar) → **3 Script** (enviar al formulario). Cada paso
tiene **una sola acción principal** en rojo: *Pegar de OFS*, *Copiar plantilla* y
*Copiar script*, siempre visible sin rodar.

Lo que no se usa todo el rato vive en un **cajón** que se abre sobre el banco y se
cierra solo al terminar: el pegado de Oracle Field Service (disponible en los pasos 1
y 2) y la carga a mano. Antes el pegado era una banda fija que se llevaba 193 px de
pantalla aunque ya no se usara.

**El color dice el estado.** El rojo de Claro queda reservado para la marca, la orden
seleccionada y la acción principal; los tipos tienen su propio color en la lista, las
pestañas, los filtros y la barra inferior: Confirmada verde, Ciclo ámbar, Rechazo
granate. Así el rojo de «Rechazo» ya no compite con el del botón de copiar.

**La tipografía es IBM Plex Sans y Plex Mono** (Google Fonts): leen mejor que la del
sistema en rótulos de 10 px y alinean los dígitos de SOT, teléfono y fecha. Si el
navegador no las alcanza —por ejemplo con el archivo suelto sin internet— cae a la
fuente del sistema y el diseño no se mueve.

Decisiones de uso que conviene conocer:

- **Nada destructivo pide confirmación: todo se puede deshacer.** Eliminar una orden
  o vaciar la lista muestra un aviso con **Deshacer** durante 7 segundos, y la orden
  vuelve a su posición original.
- **Ctrl+Enter** copia: la plantilla en la pestaña Plantillas, el script en Script.
  Los botones muestran *Copiado* durante un segundo y medio.
- **Solo el SOT es obligatorio.** Todo lo demás se completa después, sin que eso
  bloquee armar la plantilla.
- **Contraste AA (4.5:1)** verificado en los dos temas, foco visible en todo lo
  interactivo y áreas táctiles de 44 px en móvil.
- **Colores de Claro**: el acento es el rojo `#DA291C` (4.87:1 sobre blanco, así que
  pasa AA justo); en tema oscuro se aclara a `#FF6B5E`. El rojo de error es más
  oscuro (`#A4161A`) para no confundirse con el de marca.

El favicon (`public/favicon.svg`) es un mosaico rojo Claro con la inicial de HITSS:
**no reproduce el logo de Claro**, porque el sitio es público. Si quieres el logo
oficial, deja el archivo en `public/` y se cambia la línea `rel="icon"` de
`index.html`.

## Las tres secciones

### 1 · Órdenes

La tabla ocupa la pantalla entera. Los dos caminos para llenarla están en la barra de
arriba y ambos abren un **cajón** sobre ella: **Pegar de OFS** (el rápido) o **Cargar
a mano**. Al agregar a mano se limpian SOT/cliente/teléfono y se mantienen fecha,
franja, gestión y departamento para meter varias seguidas; el cajón queda abierto
hasta que lo cierres con *Cerrar* o `Esc`.

- **IDs**: correlativos `SOT-XXXXXX` desde `SOT-208548`. Es el ID interno de la app
  y se propone como *ID de llamada* en las plantillas.
- **Duplicados**: si dos filas comparten SOT aparece la etiqueta `Repetido`.
- **Tabla en cinco columnas** (Orden · Cliente · Programación · Zona · Formulario), cada
  una con el dato principal arriba y el detalle debajo: entra completa sin scroll
  horizontal. Bajo 760 px cada fila pasa a ser una tarjeta con sus etiquetas.
- **Color por tipo**: confirmada en verde, ciclo en ámbar y rechazo en granate, en la
  tabla, en la lista de Plantillas y en las fichas del pegado. El tipo sale del que
  elijas en Plantillas y, si nunca lo tocaste, de la gestión de la orden
  (CONFIRMO = confirmada, el resto = ciclo).
- **Exportar / Importar JSON**: respaldo de la lista y forma de pasar órdenes entre
  PCs. Al importar con órdenes ya cargadas: *Aceptar* reemplaza, *Cancelar* agrega
  al final.

### 2 · Plantillas

**Pegar desde Oracle Field Service** (el camino rápido): **tipo** y **franja** están
siempre a la vista en el cajón —OFS casi nunca trae el *Intervalo de tiempo*, así que
son los dos que hay que fijar— y se **recuerdan** de una tanda a la siguiente. Copias
el *Detalles de actividad* de OFS y lo pegas. La app arma la
orden sola, la selecciona y deja la plantilla lista abajo, sin cambiar de pestaña.

- **Tipo**: Confirmada · Ciclo de llamadas · Rechazo. De ahí sale la gestión
  (confirmada = CONFIRMO, el resto = NO CONTESTA) y el color de la orden.
- **Tipo**: `Auto` respeta la cabecera de cada bloque (útil para pegar varias
  actividades de distinto tipo juntas); Confirmada/Ciclo/Rechazo fuerzan una para
  todo lo pegado.
- **Franja**: `Auto` la deduce del pegado; AM0/AM1/AM2/PM1/PM2 la fijan a mano y
  avisan si OFS decía otra cosa.
- **Fecha**: `Auto` toma la *Fecha de Programacion* del pegado; `Hoy`, `Mañana` u
  `Otra` (con calendario) la fijan para todo el lote, porque una SOT puede
  reprogramarse o adelantarse. Si la elegida no coincide con la de OFS, la ficha lo
  dice antes de agregar.
- **Modo** (la pregunta *SOT gestionada manual* del formulario). Con `Automático por
  departamento` o con `PROGRAMACIONES D+1` aparece **elegir departamentos**: los que
  marques entran como PROGRAMACIONES D+1 y el resto como PREDICTIVO, así acotas el
  trabajo a los departamentos que llevas. Vienen UCAYALI y SAN MARTIN, la lista es
  tuya y se guarda por usuario. **El modo vale para lo que cargues de ahí en
  adelante**: las órdenes que ya estaban conservan el valor con el que entraron, y el
  script lleva cada una con el suyo. Con MIGRACIONES, PM3 o PREDICTIVO no hay lista:
  elegir PROGRAMACIONES D+1, MIGRACIONES, PM3 o PREDICTIVO fija ese valor para todo
  lo que cargues, pegado o a mano. Se guarda por usuario y se ve en el pie.
- Si el texto pegado trae cabecera (`confi am1 lunes`), esa manda para ese bloque:
  sirve para pegar varias actividades de distinto tipo de una sola vez.

```
confi am1 lunes
Oracle Field Service
Detalles de actividad
INST CARLEI TARAPOTO FTTH - 4F TARAP, 24/08/26
...
```

- La cabecera opcional define el **tipo**: `confi` / `confirmada`, `ciclo`,
  `rechazo`.
- La **franja se detecta sola** del pegado, en este orden:
  1. `Intervalo de tiempo` con la franja escrita (`PM1`).
  2. `Intervalo de tiempo` con un rango horario (`09:00 - 13:00`, `9 a 13`).
  3. `SLA inicio` / `SLA fin` (`24/08/2026 15:30`).
  4. La franja suelta en el texto.
  5. Recién ahí, la que pusiste en la cabecera. Se aceptan `am1`, `AM 1`, `am-1`,
     `am0`, `pm2`, y también `am` / `pm` / `mañana` / `tarde` sueltos (van a la
     franja base de ese turno).
  Si OFS y la cabecera no coinciden, **gana OFS** y te avisa. La ficha muestra de
  dónde la sacó.
- El día (`lunes`) es opcional y sirve de control: si no coincide con la *Fecha de
  Programacion* del pegado, avisa.
- Del volcado saca SOT, Nombre, Telefono (limpia el `[966...](tel:966...)`),
  Departmento y Fecha de Programacion (`24/08/26` → `24/8/2026`).
- La **contrata** se deduce del título de la actividad y se completa con el nombre
  oficial (`INST CARLEI ...` → `CARLEI TELECOMUNICACIONES SAC`). Los campos de
  contrata sugieren las 13 conocidas y aceptan cualquier otra escrita a mano.
- Se pueden pegar **varias actividades de una**, cada una con su cabecera.
- Cada ficha trae **cliente, teléfono, fecha y contrata editables** antes de que la
  orden entre: lo que el volcado no traiga se completa ahí, en ámbar, y no llega
  incompleta al paso 2.
- Un **SOT ya cargado** se marca como repetido y no se agrega, salvo que pulses
  *agregar igual*.
- Lo que no encuentre lo dice con un aviso; sin SOT no deja agregar.

Tres columnas: la **lista de órdenes**, los **campos** al centro y la **vista previa**
a la derecha, para editar y ver el resultado a la vez.

Los campos van agrupados por filas en vez de apilados: **Cliente** (ocupa dos huecos,
los nombres son largos) con **Teléfono**; **Fecha**, **Franja** y **Horario** en una
fila; **Contrata** y **Departamento** en otra. La franja se elige **con un clic** en
cinco botones —AM0 · AM1 · AM2 · PM1 · PM2— porque es el campo que más se toca. A
1366×768 la columna de datos pasa de 288 px a 614 px y ya no esconde campos bajo el
borde.

La **vista previa manda**: se lleva todo el alto sobrante, y debajo van las
**observaciones** (que son su última línea) y el botón rojo de **Copiar y seguir**,
fijo al pie.

**La cola se gestiona sola.** Copiar hace tres cosas de una: copia, marca la orden
como copiada (queda tachada y con un ✓ en la lista) y salta a la **siguiente
pendiente**, avisando cuál sigue. Los filtros de arriba son *Todas · Pendientes ·
Copiadas*, y la cabecera dice cuántas quedan *por copiar*. La orden en la que te
quedaste se guarda: si te interrumpen o recargas, vuelves al mismo sitio.

**Atajos**: `Ctrl+↵` copia y avanza · `↑` `↓` recorren la cola · `/` salta al buscador
· `Alt+1/2/3` cambian de tipo · `Esc` suelta el campo. Al pie de los campos siguen
*Anterior / Siguiente* con la posición (*3 de 12*).

Cuando a una orden le falta cliente, teléfono o fecha: la lista la marca con **!**, el
campo se pinta en ámbar, el aviso trae un botón **Completar** que lleva el cursor
directo al primero que falta, y al lado del botón de copiar dice qué falta.

Los cortes son: **tres columnas** desde 1080 px; entre 860 y 1080 la vista previa baja
debajo de los campos y la lista conserva su columna a la izquierda; por debajo de
860 px se apila con scroll normal de página, que es más usable que comprimir cuatro
paneles. En pantallas de menos de 800 px de alto se recorta lo prescindible. Con
1750 px o más el formulario pasa a **cuatro campos por fila** —densidad en vez de
campos estirados— y la plantilla sube de cuerpo.

La lista muestra **la última cargada arriba**, seleccionada y desplazada a la vista
(al pegar un lote queda elegida la última del lote, que es la que encabeza), con la
**hora en que se agregó** a la derecha, y se acota de dos formas combinables:

- **Buscador**: por SOT, cliente o teléfono mientras escribes.
- **Chips de tipo**: Todas · Confirmada · Ciclo · Rechazo, cada uno con su conteo y
  su color. Pulsar el chip activo lo desactiva. Botones *Copiar
plantilla* y *Descargar .md*.

Las órdenes que entraron por pegado ya vienen con su tipo preseleccionado según la
cabecera que usaste.

| Tipo | Campos que se llenan a mano |
|---|---|
| Confirmada | ID de llamada |
| Ciclo de llamadas | ID de llamada, ciclo nro (1), cantidad (4), motivo, sub-motivo ("No contesta") |
| Rechazo | ID de llamada, mesa/campo, persona que contesta, motivo, sub-motivo |

**Observaciones** vive al pie de la vista previa, porque se escribe mirando el
resultado y es la última línea de la plantilla. Junto con **Horario** son opcionales: si los llenas
aparecen en la plantilla (`HORARIO:` bajo el día y franja, `OBSERVACIONES:` como
última línea) y si los dejas vacíos, esas líneas no salen. El horario se completa
solo cuando OFS trae el intervalo o el SLA con horas.

La de ciclo firma con `REALIZADO POR: <nombre> - ADP MULTISKILL HITSS`.

La vista previa contiene **solo el texto de la plantilla**: lo que se copia se pega
tal cual. El usuario, el SOT y el departamento se muestran encima, fuera del bloque.

Los datos de la orden (cliente, número, fecha, franja, contrata, departamento) son
**editables ahí mismo**; la fecha usa el calendario del navegador y tiene atajos
*hoy* y *mañana*: si algo salió mal del pegado o quedó vacío, se corrige en la
plantilla y se guarda en la orden. `REALIZADO POR` sale del campo **Realizado por**
del perfil.

Solo el SOT es obligatorio al cargar una orden: todo lo demás se puede completar
después, sin que eso impida armar la plantilla.

### 3 · Script

Genera el JS que se pega en la consola del formulario. **Al entrar a esta sección
salen las instrucciones en un modal**; se cierran con *Entendido* o `Esc`, tienen la
casilla *No volver a mostrar* y el botón **Ver instrucciones** las trae de vuelta
cuando haga falta.

1. Abrir el formulario HITSS, `F12` → *Console*.
   Si Chrome bloquea el pegado, escribir `allow pasting` y `Enter` primero.
2. *Copiar script* → pegar → `Enter`.

El script corre siempre en **automático**: llena, envía y repite hasta terminar, y
cierra con el `RESUMEN`. En la consola quedan disponibles `autollenarTodo()`,
`siguienteOrden()` (por si hace falta ir de a una), `ORDENES` y `RESULTADOS`.

El modal de instrucciones incluye **ocho problemas frecuentes con su solución**
—F12 que no abre, el aviso de pegado de Chrome, pegar en la consola equivocada,
«No se encontro boton de Enviar», valores que no existen en el formulario, quedarse
a la mitad, cambiar de pestaña y pegar el script dos veces— escritos para quien no
programa.

A la izquierda quedan las **opciones**, un **resumen de lo que va a enviar** (cuántas
órdenes, de qué tipo, con qué fechas y franjas, y si alguna va sin cliente o sin
teléfono) y los tres pasos de uso, con *Copiar script* fijo al pie; a la derecha, el
script generado con su propio scroll. El resumen existe para no tener que leer 200
líneas de código para saber si el lote es el correcto.

- **Órdenes incluidas** — todas, solo confirmados o solo ciclos.
- **Formato de fecha** — `d/m/yyyy` o `M/d/yyyy`, según lo que espere el
  formulario. Las órdenes siempre se guardan como `d/m/aaaa`; la conversión se
  hace solo al generar el script, y la cabecera del `.js` dice con cuál salió.

## Música

Un reproductor local, para turnos largos en puestos donde el filtro de páginas
bloquea YouTube, Spotify y similares. Se abre con **Alt+M** o desde el acceso de la
barra de estado, y vive en un panel flotante: no le quita alto al trabajo.

Dos fuentes, las dos **sin red**, que es la única forma de que un bloqueador de
páginas no las alcance:

- **Sonido de fondo generado por el navegador**: lluvia, ventilador, ruido rosa y
  ruido marrón. No se descarga nada — el ruido se calcula con la Web Audio API y se
  repite en bucle, así que no existe como dirección web que bloquear. Sirve para tapar
  la sala sin la letra de una canción, que compite con la llamada.
- **Tus propios archivos**: suenan desde tu PC, no se suben a ningún lado ni pasan por
  internet. Hay tres formas de cargar varias de una — **Agregar carpeta** toma todos
  los audios de una carpeta y sus subcarpetas; **Agregar archivos** acepta selección
  múltiple (`Ctrl+A` en el cuadro de Windows) y también **archivos `.zip`**, que se
  abren en el propio navegador sin descomprimirlos a mano; o **arrastras la carpeta**
  hasta el panel. La lista se guarda en el navegador (IndexedDB), así que sobrevive a
  una recarga: se eligen los archivos una vez por turno, no una vez por refresco.

En la barra de estado queda un **mini reproductor** siempre a mano —pausa, siguiente y
el nombre de la pista—, para cortar el audio de un clic cuando entra una llamada. Los
**controles multimedia del teclado** (play/pausa, anterior, siguiente) también lo
manejan, vía `MediaSession`.

Lo que **no** hace, a propósito: no incorpora emisoras ni radios por internet ni nada
que intente rodear el filtro de la empresa. Si el bloqueador tapa un dominio, el
reproductor tampoco lo va a alcanzar; lo que sí funciona es lo que nunca sale del
equipo.

## Varios operadores

La primera vez que se abre la app aparece el modal **Antes de empezar** para
confirmar *Usuario E*, *Operador* y *Realizado por*; después no vuelve a salir. El
botón con el código de usuario (arriba a la derecha) lo reabre cuando haga falta.

Cada código de usuario tiene su **propia lista de órdenes, su correlativo de ID y su
propio operador/firma**, guardados en `localStorage` (`hitss.ordenes.<usuario>`,
`hitss.perfil.<usuario>`). Si dos personas comparten la misma PC y el mismo
navegador, cambiar el código cambia todo el contexto; nadie pisa lo del otro.
Escribir un código nuevo estrena perfil con el nombre que pongas en ese momento.

> Las listas son locales a cada navegador: no se comparten entre PCs. Para eso haría
> falta un backend.

## Repartir a varios usuarios

| Cómo | Comando | Para qué sirve |
|---|---|---|
| GitHub Pages | push a `main` | La versión pública, siempre al día |
| Servidor de desarrollo | `npm run dev` | Probar y editar con recarga en caliente |
| Servidor de producción | `npm run build` + `npm run preview` | Dejar la app corriendo en una PC de la oficina |
| Archivo único | `npm run build` → `dist/hitss-standalone.html` | Mandarlo por correo o USB: se abre con doble clic, sin servidor y sin internet |

## Detalles del script

- **Campos que llena**: Usuario E, SOT, FECHA, FRANJA, GESTION, DEPARTAMENTO,
  YA TIENE GESTION, SOT GESTIONADA MANUAL (búsqueda por texto de la pregunta).
  Cliente, teléfono y contrata no se envían al formulario: sus títulos chocarían con
  otras preguntas al buscarlas por texto (p. ej. "CLIENTE" engancharía "FECHA QUE
  DESEA CLIENTE"). Sí se usan en las plantillas.
- **Tiempos**: espera 800 ms antes de enviar y 600 ms antes de pedir un formulario
  nuevo. Con internet lento, subir esos números en el `.js` descargado.
- **Departamentos**: los 23 del formulario, en su mismo orden.
- **Franjas**: AM0 07:00–09:00 · AM1 09:00–13:00 · PM1 14:00–18:00.
  AM2 y PM2 existen en el formulario pero no tienen banda horaria: solo se eligen a
  mano o si vienen escritas en el pegado. Las horas fuera de toda banda (13:00–14:00,
  noche) caen en la franja de inicio más cercano. Se configuran en
  `BANDAS_FRANJA`, en `src/lib/constantes.js`.
- **SOT gestionada manual**: PROGRAMACIONES D+1 / MIGRACIONES / PM3 / PREDICTIVO.
  Se elige con el selector **Modo** de la pestaña Plantillas. En automático, los
  departamentos que marques ahí pasan solos a *PROGRAMACIONES D+1* (por defecto
  UCAYALI y SAN MARTIN).
- **Diagnóstico**: si una pregunta u opción no aparece en el formulario, el script
  avisa por consola con `console.warn` y lista las opciones que sí encontró.

## Datos incluidos

`datos/ordenes-pendientes.json` trae las 14 órdenes pendientes del 23-24/8 listas
para cargar con *Importar JSON*. Cliente y teléfono van vacíos: complétalos si vas a
generar plantillas con ellas.

## Estructura

```
index.html              entrada de Vite
src/
  main.jsx              monta React
  App.jsx               estado, import/export, toasts
  styles.css            tema claro/oscuro con variables CSS
  components/           Encabezado (+ perfil), PanelPegar, FormularioOrden,
                        TablaOrdenes, PanelPlantillas, PanelScript, Campos
  hooks/useAlmacenado.js  estado persistido; recarga al cambiar de usuario
  lib/                  constantes, utilidades, parser de OFS, plantillas y
                        generador del script
scripts/empaquetar.mjs  arma dist/hitss-standalone.html tras el build
.github/workflows/      publica en GitHub Pages con cada push a main
```
