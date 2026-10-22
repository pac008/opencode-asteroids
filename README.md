# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups de velocidad y de disparo triple: cada 3 asteroides destruidos aparece uno, alternando entre ambos tipos.

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

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Power-ups

| Power-up           | Efecto                                                        |
| ------------------ | ------------------------------------------------------------- |
| Velocidad x2 (»)  | Empuje al doble + impulso instantáneo, durante 8 s             |
| Disparo triple     | Dispara 3 balas en abanico (±10°) durante 5 s                  |

- Aparece uno por cada **3 asteroides destruidos**, alternando entre turbo y disparo triple.
- El turbo no aparece mientras está activo o en recarga; el disparo triple sí puede aparecer y **refresca sus 5 s** al recogerlo de nuevo.
- Se recoge **volando sobre él**; desaparece solo si pasan 14 s sin recogerlo.
- Tras usar el turbo queda **12 s de recarga** (indicador `RECARGA` en el HUD) antes de volver a estar disponible.
- Durante el turbo la llama del propulsor se vuelve cian; el power-up de disparo triple es ámbar.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad x2 con recarga
