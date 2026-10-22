# AGENTS.md

Clon de Asteroids en canvas HTML5 puro. **Cero dependencias, cero build, cero tests.**
Todo el juego vive en `game.js` (un solo archivo, ~920 líneas).

## Comandos

No hay `package.json`, bundler, linter, formatter ni test runner. **No inventes `npm test` / `npm run build`.**

```bash
npx serve .        # único comando de dev -> http://localhost:3000
```

También funciona abrir `index.html` directamente en el navegador (el script es clásico, no ESM, así que `file://` va bien).
La verificación es **manual**: abrir el juego y jugar (rotar, propulsar, disparar, morir, pasar de nivel).

## Estructura

- `index.html` — canvas + `<style>` inline + `<script src="game.js">` al final del `<body>` (sin `defer`).
- `game.js` — todo el juego: clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`, `ShootingStar` + skins + estado global y loop.
- `favicon.svg` — icono.

`game.js` se carga como **script clásico**: no uses `import`/`export` ni módulos ES. Rompería `file://` y el `<script>` actual. Si necesitas una librería, vendorízala a mano (sin npm).

## Gotchas de implementación

- **El tamaño del canvas está duplicado.** `index.html:23` (`width="800" height="600"`) y `game.js:5-6` (`W = 800`, `H = 600`). Cambia el tamaño en **ambos** sitios o el juego se dibuja fuera/deformado.
- **Estados del juego:** `'playing' | 'dead' | 'gameover'`. `update()` (game.js:679) tiene una rama por estado y hace `return` temprano en `dead`/`gameover`. Cualquier feature nueva debe decidir en qué estado aplica.
- **Input con dos modelos:** `keys[code]` = tecla mantenida (flechas); `pressed(code)` = flanco de pulsación y **consume el flag** (la segunda llamada en el mismo frame devuelve `false`). `Space` y `S` son edge-triggered: `Space` dispara/reinicia y `S` cambia la skin en cualquier estado. `preventDefault()` solo está aplicado a `Space` + flechas (game.js:15) — si añades teclas que scrollean la página, agrégalas a esa lista.
- **Loop:** `requestAnimationFrame` con `dt` acotado a `0.05` s (game.js:914). Todo movimiento/animación es por `dt`, nunca por frame.
- **El drag es time-based a propósito:** `Math.pow(DRAG, dt * 60)`, no `v *= DRAG`. No reintroduzcas el drag por frame: hace que la velocidad terminal dependa del monitor (a 120 Hz la nave iba a la mitad de velocidad) y con eso el "x2" del turbo no se cumplía igual en todos los equipos.
- **Efectos temporales:** `Ship.boostState` ∈ `'off' | 'active' | 'cooling'` con `boostTimer`; `Ship.tripleTimer` y `Ship.shieldTimer`/`shieldFlash` siguen la misma regla. `Ship.reset()` **no** los toca a propósito (pasar de nivel no cancela efectos ni recarga) y solo un `Ship` nuevo en `initGame()` los limpia. Se congelan mientras la nave está muerta porque `Ship.update` hace early return.
- **Espacio toroidal:** usa siempre el helper `wrap(v, max)` para posiciones.
- **Tabla de tamaños de asteroide:** `RADII`/`SPEEDS`/`POINTS` en game.js:71-73 están indexadas por tamaño `1..3` (índice `0` es centinela sin usar) e inclinadas para que `POINTS[1]` = 100 (pequeño), `POINTS[3]` = 20 (grande). Añadir un tamaño exige extender las **tres** tablas + `Asteroid.split()` + `spawnAsteroids()`.
- **Power-ups:** `PowerUp` (game.js:419) tiene `type` (`'boost' | 'shield' | 'triple'`) y un color por tipo (`CYAN`, `SHIELD_COLOR`, `AMBER`). `spawnPowerUp()` (una llamada por asteroide destruido) alterna turbo/triple cada `POWERUP_EVERY` (3) y genera escudo cada `SHIELD_EVERY` (5); si coinciden, prioriza el escudo. El turbo no aparece si está activo/en recarga, el escudo no aparece si ya está activo y el triple siempre puede aparecer y refresca su duración. Se recogen rozándolos. `Particle` acepta un color RGB opcional (`explode(x, y, count, color)`).
- **Escudo:** `isProtected()` centraliza la inmunidad (`invincible` o escudo) para asteroides y estrellas. Con escudo, la colisión se comprueba contra `SHIELD_RADIUS`, `absorbHit()` limita el destello y el objeto no se destruye ni puntúa.
- **Disparo triple:** `Ship.tryShoot()` lanza 3 balas con `±TRIPLE_SPREAD` (±10°) mientras `tripleTimer > 0`. `TRIPLE_DURATION` = 5 s.
- **Skins:** `SHIP_SKINS` (game.js:136) define polígonos, color, grosor y `flameX`. `cycleSkin()` avanza con `S`, guarda en `localStorage` y muestra un aviso temporal. La skin no cambia `Ship.radius` ni la física; también se usa en `drawLifeIcon()`.
- **Estrellas fugaces:** `ShootingStar` (game.js:506) no es toroidal: muere al salir de pantalla. Aparece cada 15-30 s y usa `distToSegment()` para evitar tunneling por su alta velocidad. El escudo también absorbe su impacto.
- **Textos en pantalla en español** (`NIVEL`, `PUNTAJE`, `GAME OVER`) y **comentarios en español**; identificadores y código en inglés. Mantén esa convención.
- Dibujo: cada clase pinta directo sobre el `ctx` global con `ctx.save()/restore()` para transformaciones.

## Docs

`README.md` es la fuente de verdad de las features actuales (turbo, escudo, disparo triple, skins y estrellas fugaces). Si añades o cambias una mecánica, actualiza README y este archivo en el mismo cambio.
