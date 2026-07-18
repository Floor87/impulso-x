# IMPULSOX

IMPULSOX es una aplicacion web instalable para registrar habitos, entrenamiento,
alimentacion, agua y progreso diario. La aplicacion conserva el historial por
fecha, funciona sin conexion una vez instalada y mantiene los datos locales
existentes bajo la clave `impulsox-state`.

## Requisitos

- Node.js 22.12 o superior.
- pnpm 11.

## Desarrollo local

```bash
pnpm install --frozen-lockfile
pnpm dev
```

La URL local se muestra en la terminal. El archivo HTML no debe abrirse mediante
`file://`: Vite y la PWA necesitan un servidor HTTP.

## Comandos

```bash
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
pnpm build
pnpm preview
```

## Documentacion

- Politica obligatoria para agentes: [AGENTS.md](AGENTS.md)
- Colaboracion humana: [CONTRIBUTING.md](CONTRIBUTING.md)
- Arquitectura: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Despliegue: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- Recuperacion: [docs/RECOVERY.md](docs/RECOVERY.md)
- Operacion verificable: [docs/OPERATIONS.md](docs/OPERATIONS.md)

El repositorio oficial es esta carpeta `outputs`. La carpeta exterior es solo un
contenedor local y no forma parte del producto.
