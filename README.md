# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups de velocidad y de escudo: el turbo aparece cada 3 asteroides destruidos y el escudo cada 5, protegiendo a la nave de los impactos durante 8 s.

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
| Escudo (⬡)        | Bloquea impactos de asteroides durante 8 s sin perder vida     |

- El turbo aparece cada **3 asteroides destruidos** y el escudo cada **5**.
- No se genera un power-up si su efecto ya está activo.
- Se recogen **volando sobre ellos**; desaparecen solos si pasan 14 s sin recogerlos.
- Tras usar el turbo queda **12 s de recarga** (indicador `RECARGA` en el HUD) antes de volver a estar disponible.
- El escudo dibuja un anillo azul alrededor de la nave y su tiempo restante aparece en el HUD.
- Durante el turbo la llama del propulsor se vuelve cian.

## Estrellas fugaces

| Elemento      | Comportamiento                                                      |
| ------------- | ------------------------------------------------------------------- |
| Estrella fugaz | Entra por un borde al azar, cruza la pantalla y **mata a la nave**   |

- Aparece cada **15-30 s** (intervalo aleatorio), entrando por un borde cualquiera y cruzando en diagonal hacia el lado opuesto.
- Es mucho más rápida que los asteroides (~800 px/s frente a 32-100 px/s).
- Su apariencia es una estela luminosa dorada con un núcleo brillante, en lugar del polígono hueco de los asteroides.
- **Mortal**: si la nave toca la estela pierde una vida. No es toroidal (a diferencia del resto de objetos): desaparece al salir de la pantalla.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad x2 con recarga
- Estrellas fugaces que cruzan la pantalla de vez en cuando
- 4 skins de nave seleccionables con `S`, con persistencia en `localStorage`
- Power-up de escudo temporal que bloquea impactos
