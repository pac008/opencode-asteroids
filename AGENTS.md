# AGENTS.md

Clon de Asteroids en canvas HTML5 puro. **Cero dependencias, cero build, cero tests.**
Todo el juego vive en `game.js` (un solo archivo, ~420 líneas).

## Comandos

No hay `package.json`, bundler, linter, formatter ni test runner. **No inventes `npm test` / `npm run build`.**

```bash
npx serve .        # único comando de dev -> http://localhost:3000
```

También funciona abrir `index.html` directamente en el navegador (el script es clásico, no ESM, así que `file://` va bien).
La verificación es **manual**: abrir el juego y jugar (rotar, propulsar, disparar, morir, pasar de nivel).

## Estructura

- `index.html` — canvas + `<style>` inline + `<script src="game.js">` al final del `<body>` (sin `defer`).
- `game.js` — todo el juego: clases `Bullet`, `Asteroid`, `Ship`, `Particle` + estado global y loop.
- `favicon.svg` — icono.

`game.js` se carga como **script clásico**: no uses `import`/`export` ni módulos ES. Rompería `file://` y el `<script>` actual. Si necesitas una librería, vendorízala a mano (sin npm).

## Gotchas de implementación

- **El tamaño del canvas está duplicado.** `index.html:23` (`width="800" height="600"`) y `game.js:5-6` (`W = 800`, `H = 600`). Cambia el tamaño en **ambos** sitios o el juego se dibuja fuera/deformado.
- **Estados del juego:** `'playing' | 'dead' | 'gameover'`. `update()` (game.js:407) tiene una rama por estado y hace `return` temprano en `dead`/`gameover`. Cualquier feature nueva debe decidir en qué estado aplica.
- **Input con dos modelos:** `keys[code]` = tecla mantenida (flechas); `pressed(code)` = flanco de pulsación y **consume el flag** (la segunda llamada en el mismo frame devuelve `false`). `Space` es el único edge-triggered: dispara y reinicia en gameover. `preventDefault()` solo está aplicado a `Space` + flechas (game.js:16) — si añades teclas que scrollean la página, agrégalas a esa lista.
- **Loop:** `requestAnimationFrame` con `dt` acotado a `0.05` s (game.js:568). Todo movimiento/animación es por `dt`, nunca por frame.
- **El drag es time-based a propósito:** `Math.pow(DRAG, dt * 60)`, no `v *= DRAG`. No reintroduzcas el drag por frame: hace que la velocidad terminal dependa del monitor (a 120 Hz la nave iba a la mitad de velocidad) y con eso el "x2" del turbo no se cumplía igual en todos los equipos.
- **Estados del turbo:** `Ship.boostState` ∈ `'off' | 'active' | 'cooling'` con `boostTimer`. `Ship.reset()` **no** los toca a propósito (pasar de nivel no puede saltarse la recarga) y solo `initGame()` los limpia. El `boostTimer` se congela mientras la nave está muerta (`Ship.update` hace early return); `Ship.tripleTimer` sigue la misma regla y `reset()` tampoco lo limpia.
- **Espacio toroidal:** usa siempre el helper `wrap(v, max)` para posiciones.
- **Tabla de tamaños de asteroide:** `RADII`/`SPEEDS`/`POINTS` en game.js:61-63 están indexadas por tamaño `1..3` (índice `0` es centinela sin usar) e inclinadas para que `POINTS[1]` = 100 (pequeño), `POINTS[3]` = 20 (grande). Añadir un tamaño exige extender las **tres** tablas + `Asteroid.split()` + `spawnAsteroids()`.
- **Power-ups:** `PowerUp` tiene `type` `'boost' | 'triple'`, generado por `spawnPowerUp()` y alternando en cada `POWERUP_EVERY` asteroides destruidos. El turbo usa `Ship.boostState` y no se recoge si no está `'off'`; el triple usa `Ship.tripleTimer` (`TRIPLE_DURATION`, 5 s) y recoger otro refresca el tiempo. Se recogen rozándolos. `Particle` acepta un color RGB opcional (`explode(x, y, count, color)`) para los bursts de color.
- **Textos en pantalla en español** (`NIVEL`, `PUNTAJE`, `GAME OVER`) y **comentarios en español**; identificadores y código en inglés. Mantén esa convención.
- Dibujo: cada clase pinta directo sobre el `ctx` global con `ctx.save()/restore()` para transformaciones.

## Docs

El `README.md` anunciaba una "estrella fugaz" que **nunca existió** en el código; los power-ups reales son **velocidad x2** y **disparo triple**. Trata el código como fuente de verdad: si implementas features que el README promete pero el código no tiene, es trabajo nuevo, no una regresión.
