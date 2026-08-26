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

Es un dashboard: el menú vive en una **barra lateral fija a la izquierda**, con la
marca arriba, las tres secciones al medio y el perfil y el tema al pie. Bajo 900 px la
barra pasa arriba como una fila.

Las secciones están numeradas porque son el orden del trabajo: **1 Órdenes** (cargar)
→ **2 Plantillas** (armar y copiar) → **3 Script** (enviar al formulario). Cada una
abre con su título, en qué paso va y un botón que lleva al siguiente, así no hay que
buscarlo en el menú. La sección activa se marca visualmente y con `aria-current`.

Cada sección tiene **una sola acción principal**, en botón grande: *Pegar actividad*,
*Copiar plantilla* y *Copiar script*. Lo secundario arranca plegado — el formulario
manual y los pasos de uso del script — para que la primera pantalla no abrume.

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

Dos caminos: **Pegar actividad** (lleva al pegado de OFS, es el rápido) o **Cargar a
mano**, que despliega el formulario. Debajo, la tabla con todo lo cargado.
Al agregar, se limpian
SOT/cliente/teléfono y se mantienen fecha, franja, gestión y departamento para meter
varias seguidas.

- **IDs**: correlativos `SOT-XXXXXX` desde `SOT-208548`. Es el ID interno de la app
  y se propone como *ID de llamada* en las plantillas.
- **Duplicados**: si dos filas comparten SOT aparece la etiqueta `Repetido`.
- **Tabla en cinco columnas** (Orden · Cliente · Programación · Zona · Formulario), cada
  una con el dato principal arriba y el detalle debajo: entra completa sin scroll
  horizontal. Bajo 760 px cada fila pasa a ser una tarjeta con sus etiquetas.
- **Color por tipo**: confirmada en verde, ciclo en ámbar y rechazo en rojo, en la
  tabla, en la lista de Plantillas y en las fichas del pegado. El tipo sale del que
  elijas en Plantillas y, si nunca lo tocaste, de la gestión de la orden
  (CONFIRMO = confirmada, el resto = ciclo).
- **Exportar / Importar JSON**: respaldo de la lista y forma de pasar órdenes entre
  PCs. Al importar con órdenes ya cargadas: *Aceptar* reemplaza, *Cancelar* agrega
  al final.

### 2 · Plantillas

**Pegar desde Oracle Field Service** (el camino rápido): eliges **tipo** y **franja**
con botones, copias el *Detalles de actividad* de OFS y lo pegas. La app arma la
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
- Lo que no encuentre lo dice con un aviso; sin SOT no deja agregar.

Tres columnas: la **lista de órdenes**, los **campos** en el centro y la **vista
previa** a la derecha, para editar y ver el resultado a la vez.

**Entra en una pantalla sin scroll**: la sección ocupa exactamente el alto de la
ventana y el desplazamiento vive dentro de cada columna, así los botones *Copiar
plantilla* y *Descargar* quedan siempre visibles. El panel de pegado es compacto
(tres líneas) y sus opciones —tipo, franja, fecha y modo— se pliegan tras un resumen
de una línea: *Entran como lo que diga el pegado · franja del pegado · fecha del
pegado · modo automático · cambiar*. En pantallas angostas las columnas se apilan y
vuelve el scroll normal.

La lista muestra **la última cargada arriba**, con la **hora en que se agregó** a la
derecha, y se acota de dos formas combinables:

- **Buscador**: por SOT, cliente o teléfono mientras escribes.
- **Chips de tipo**: Todas · Confirmada · Ciclo · Rechazo, cada uno con su conteo y
  su color, en una sola fila que se desplaza de costado si no entran. Pulsar el chip
  activo lo desactiva.

La orden elegida se marca con fondo neutro, el SOT en rojo y una barra a la derecha;
la barra de la izquierda siempre indica el tipo. El nombre del cliente y la línea de
fecha se recortan con puntos suspensivos y el detalle completo queda en el tooltip. Botones *Copiar
plantilla* y *Descargar .md*.

Las órdenes que entraron por pegado ya vienen con su tipo preseleccionado según la
cabecera que usaste.

| Tipo | Campos que se llenan a mano |
|---|---|
| Confirmada | ID de llamada |
| Ciclo de llamadas | ID de llamada, ciclo nro (1), cantidad (4), motivo, sub-motivo ("No contesta") |
| Rechazo | ID de llamada, mesa/campo, persona que contesta, motivo, sub-motivo |

**Horario** y **Observaciones** son opcionales y viven en la orden: si los llenas
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

Un selector:
- **Órdenes incluidas** — todas, solo confirmados o solo ciclos.
- **Formato de fecha** — `d/m/yyyy` o `M/d/yyyy`, según lo que espere el
  formulario. Las órdenes siempre se guardan como `d/m/aaaa`; la conversión se
  hace solo al generar el script, y la cabecera del `.js` dice con cuál salió.

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
