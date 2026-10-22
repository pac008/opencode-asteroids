# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups de velocidad: cada 3 asteroides destruidos aparece uno que hace volar la nave al doble de rápido.

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

| Tecla     | Acción              |
| --------- | ------------------- |
| `←` `→`   | Rotar nave          |
| `↑`       | Propulsar           |
| `Espacio` | Disparar            |
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

| Power-up           | Efecto                                                        |
| ------------------ | ------------------------------------------------------------- |
| Velocidad x2 (»)  | Empuje al doble + impulso instantáneo, durante 8 s             |

- Aparece uno por cada **3 asteroides destruidos** (no aparece mientras el turbo está activo o en recarga).
- Se recoge **volando sobre él**; desaparece solo si pasan 14 s sin recogerlo.
- Tras usarlo queda **12 s de recarga** (indicador `RECARGA` en el HUD) antes de volver a estar disponible.
- Durante el turbo la llama del propulsor se vuelve cian.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad x2 con recarga
- 4 skins de nave seleccionables con `S`, con persistencia en `localStorage`
