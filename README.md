# IMPULSOX

IMPULSOX es una aplicacion web instalable para registrar habitos, entrenamiento,
alimentacion, agua y progreso diario. La aplicacion conserva el historial por
fecha, funciona sin conexion una vez instalada y requiere una cuenta para abrir
los datos de cada persona.

## Requisitos

- Node.js 22.12 o superior.
- pnpm 11.

## Desarrollo local

Crear `.env.local` a partir de `.env.example` y completar las variables publicas
del proyecto Supabase de staging:

```bash
cp .env.example .env.local
```

Nunca se debe colocar una clave `service_role` en un archivo usado por Vite.
Sin estas variables, la pantalla de acceso se mantiene bloqueada y explica que
falta conectar el entorno seguro.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

La URL local se muestra en la terminal. El archivo HTML no debe abrirse mediante
`file://`: Vite y la PWA necesitan un servidor HTTP.

El nombre elegido se usa solo para presentar la cuenta. El ingreso se realiza
con correo y clave mediante Supabase Auth. Los datos funcionales siguen en el
dispositivo, separados por el identificador de la cuenta; la sincronizacion entre
dispositivos se incorporara con `SupabaseDataRepository`.

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
