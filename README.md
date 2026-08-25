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

## Las tres pestañas

### Órdenes

Formulario manual (SOT, cliente y teléfono obligatorios) y tabla con todo lo
cargado. El alta rápida por pegado está en la pestaña **Plantillas**.
Al agregar, se limpian
SOT/cliente/teléfono y se mantienen fecha, franja, gestión y departamento para meter
varias seguidas.

- **IDs**: correlativos `SOT-XXXXXX` desde `SOT-208548`. Es el ID interno de la app
  y se propone como *ID de llamada* en las plantillas.
- **Duplicados**: si dos filas comparten SOT aparece la etiqueta `Repetido`.
- **Color por gestión**: confirmada (CONFIRMO) en verde y ciclo (NO CONTESTA) en
  ámbar, tanto en la tabla como en la lista de la pestaña Plantillas.
- **Exportar / Importar JSON**: respaldo de la lista y forma de pasar órdenes entre
  PCs. Al importar con órdenes ya cargadas: *Aceptar* reemplaza, *Cancelar* agrega
  al final.

### Plantillas

**Pegar desde Oracle Field Service** (el camino rápido): copias el *Detalles de
actividad* de OFS, le pones arriba una cabecera y lo pegas. La app arma la orden
sola, la selecciona y deja la plantilla lista abajo, sin cambiar de pestaña.

```
confi am1 lunes
Oracle Field Service
Detalles de actividad
INST CARLEI TARAPOTO FTTH - 4F TARAP, 24/08/26
...
```

- La cabecera define el **tipo de plantilla**: `confi` / `confirmada` → confirmada ·
  `ciclo` → ciclo de llamadas · `rechazo` → rechazo. La gestión sale de ahí:
  confirmada = CONFIRMO, el resto = NO CONTESTA.
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
- La **contrata** se deduce del título de la actividad (`INST CARLEI ...` → CARLEI)
  y se puede corregir ahí mismo antes de agregar.
- Se pueden pegar **varias actividades de una**, cada una con su cabecera.
- Lo que no encuentre lo dice con un aviso; sin SOT no deja agregar.

A la izquierda se elige la orden y el tipo de plantilla; a la derecha se llenan los
campos propios de cada tipo y se ve la vista previa en vivo. Botones *Copiar
plantilla* y *Descargar .md*.

Las órdenes que entraron por pegado ya vienen con su tipo preseleccionado según la
cabecera que usaste.

| Tipo | Campos que se llenan a mano |
|---|---|
| ✓ Confirma Visita | ID de llamada |
| ☎ Ciclo Llamadas | ID de llamada, ciclo nro (1), cantidad (3), motivo, sub-motivo ("No contesta") |
| ✕ Rechazo | ID de llamada, mesa/campo, persona que contesta, motivo, sub-motivo |

Los datos de la orden (cliente, número, fecha, franja, contrata, departamento) son
**editables ahí mismo**: si algo salió mal del pegado o quedó vacío, se corrige en la
plantilla y se guarda en la orden. `REALIZADO POR` sale del campo **Realizado por**
del perfil.

Solo el SOT es obligatorio al cargar una orden: todo lo demás se puede completar
después, sin que eso impida armar la plantilla.

### Script

Genera el JS que se pega en la consola del formulario.

1. Abrir el formulario HITSS, `F12` → *Console*.
   Si Chrome bloquea el pegado, escribir `allow pasting` y `Enter` primero.
2. *Copiar script* → pegar → `Enter`.

Dos selectores:

- **Modo**
  - *Manual (una por una)* — el script llena la primera orden y se detiene; tú
    revisas y envías. Para la siguiente corres `siguienteOrden()` en la consola.
  - *Automático (todas)* — llena, envía y repite el array completo sin parar, y
    termina imprimiendo el `RESUMEN`.
  - En los dos modos quedan disponibles en la consola `siguienteOrden()`,
    `autollenarTodo()`, `ORDENES` y `RESULTADOS`.
- **Órdenes incluidas** — todas, solo confirmados o solo ciclos.
- **Formato de fecha** — `d/m/yyyy` o `M/d/yyyy`, según lo que espere el
  formulario. Las órdenes siempre se guardan como `d/m/aaaa`; la conversión se
  hace solo al generar el script, y la cabecera del `.js` dice con cuál salió.

## Varios operadores

El botón con el código de usuario (arriba a la derecha) abre **Mi perfil**: *Usuario
E*, *Operador* y *Realizado por*.

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
- **Franjas**: AM0 07:00–09:00 · AM1 09:00–13:00 · PM1 14:00–18:00.
  AM2 y PM2 existen en el formulario pero no tienen banda horaria: solo se eligen a
  mano o si vienen escritas en el pegado. Las horas fuera de toda banda (13:00–14:00,
  noche) caen en la franja de inicio más cercano. Se configuran en
  `BANDAS_FRANJA`, en `src/lib/constantes.js`.
- **SOT gestionada manual**: PROGRAMACIONES D+1 / MIGRACIONES / PM3 / PREDICTIVO.
  Regla de mesa aplicada por la app: al elegir **UCAYALI** o **SAN MARTIN** el campo
  pasa solo a *PROGRAMACIONES D+1*.
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
