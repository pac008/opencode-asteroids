# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups de velocidad, escudo y disparo triple, además de estrellas fugaces que cruzan la pantalla.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción               |
| --------- | -------------------- |
| `←` `→`   | Rotar nave           |
| `↑`       | Propulsar            |
| `Espacio` | Disparar             |
| `S`       | Cambiar skin de nave |

## Skins

La nave tiene 4 apariencias seleccionables en cualquier momento con `S` (también en la pantalla de GAME OVER):

- **Clásica** (blanca)
- **Neón** (cian)
- **Interceptor** (rosa)
- **Ballena** (verde)

La skin elegida se guarda en `localStorage` y se mantiene entre sesiones. Cambiarla **no** afecta al gameplay: el radio de colisión y la física son idénticos en todas.

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Power-ups

| Power-up           | Efecto                                                              |
| ------------------ | ------------------------------------------------------------------- |
| Velocidad x2 (»)  | Empuje al doble + impulso instantáneo, durante 8 s                   |
| Escudo (⬡)        | Bloquea impactos de asteroides y estrellas durante 8 s sin perder vida |
| Disparo triple     | Dispara 3 balas en abanico (±10°) durante 5 s                        |

- El turbo y el disparo triple alternan cada **3 asteroides destruidos**; el escudo aparece cada **5**. Si coinciden, el escudo tiene prioridad.
- El turbo no aparece ni se recoge mientras está activo o en recarga; el escudo no se recoge si ya está activo; el disparo triple siempre se puede recoger y **refresca sus 5 s**.
- Se recogen **volando sobre ellos**; desaparecen solos si pasan 14 s sin recogerlos.
- Tras usar el turbo queda **12 s de recarga** (indicador `RECARGA` en el HUD) antes de volver a estar disponible.
- El escudo dibuja un anillo azul alrededor de la nave; su tiempo restante aparece en el HUD.
- Durante el turbo la llama del propulsor se vuelve cian; el power-up de disparo triple es ámbar y su medidor aparece en el HUD.

## Estrellas fugaces

| Elemento      | Comportamiento                                                      |
| ------------- | ------------------------------------------------------------------- |
| Estrella fugaz | Entra por un borde al azar, cruza la pantalla y **mata a la nave**   |

- Aparece cada **15-30 s** (intervalo aleatorio), entrando por un borde cualquiera y cruzando en diagonal hacia el lado opuesto.
- Es mucho más rápida que los asteroides (~800 px/s frente a 32-100 px/s).
- Su apariencia es una estela luminosa dorada con un núcleo brillante, en lugar del polígono hueco de los asteroides.
- **Mortal**: si la nave toca la estela pierde una vida. No es toroidal (a diferencia del resto de objetos): desaparece al salir de la pantalla.
- El escudo activo también absorbe el impacto de la estrella sin destruirla.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad x2 con recarga
- Power-up de escudo temporal que bloquea impactos
- Power-up de disparo triple
- Estrellas fugaces que cruzan la pantalla de vez en cuando
- 4 skins de nave seleccionables con `S`, con persistencia en `localStorage`
