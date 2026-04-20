# Space Invaders Neon

Juego en vivo: https://juegospaceinvaders-948774944187.europe-west1.run.app/

## Descripcion

Space Invaders Neon adapta el clasico shooter arcade con estilo neon, controles hibridos y ranking global.

## Estandar aplicado

El proyecto fue alineado con la guia de JuegoSerpiente para arquitectura y UX.

- Identidad visual comun y tipografias unificadas.
- Mismo layout general de la franquicia.
- Politica de interaccion responsiva para desktop y movil.

## Arquitectura comun

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + motion/react
- Gameplay en canvas con bucle de render y colisiones
- Ranking remoto con fallback localStorage
- Dockerfile multistage + cloudbuild.yaml

## Controles

- Escritorio: flechas izquierda/derecha o A/D para mover, espacio para disparar.
- Movil: botones tactiles de movimiento y disparo.

## Desarrollo local

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar entorno local:

```bash
npm run dev
```

3. Validar tipado:

```bash
npm run lint
```

## Build y despliegue

- Build: npm run build
- Runtime: puerto 8080
- Entrega en Cloud Run con Dockerfile y cloudbuild.yaml

## Creditos

Desarrollado por Galindez & IA.
