# Estado de IMPULSOX

## Git

- Repositorio local: si
- Carpeta: `outputs`
- Rama: `main`
- Commits:
  - `52ed425 Document project deployment status`
  - `eff3054 Initial IMPULSOX app`
- GitHub remoto: pendiente
- Repositorio GitHub creado: `https://github.com/Floor87/impulso-x`
- Bloqueo actual: GitHub devuelve `403 Resource not accessible by integration` al intentar escribir archivos. El repo existe, pero la integracion de Codex/GitHub no tiene acceso de escritura instalado para ese repositorio.
- Remoto local configurado: `https://github.com/Floor87/impulso-x.git`
- Push por terminal: bloqueado porque GitHub solicita credenciales y no hay una sesion local autenticada disponible.

## Supabase

- Proyecto: `IMPULSOX`
- Estado: `ACTIVE_HEALTHY`
- Project ID/ref: `wmdnfjnjbmevqhreybbi`
- Region: `sa-east-1`
- API URL: `https://wmdnfjnjbmevqhreybbi.supabase.co`
- Base de datos: `db.wmdnfjnjbmevqhreybbi.supabase.co`

## Vercel

- Despliegue de IMPULSOX: pendiente
- Motivo: la herramienta conectada no desplego directamente, la CLI `vercel` no esta instalada en esta maquina y la red del entorno bloqueo la instalacion desde `registry.npmjs.org`.

## Proyecto existente detectado

- Vercel: `tarjetas-digitales`
- Supabase: `tarjetas-digitales`

## Siguiente paso necesario fuera del sandbox

1. Crear un repositorio vacio en GitHub llamado `IMPULSOX`.
2. Conectar ese repositorio a Vercel o instalar la CLI de Vercel en una terminal con internet.
3. Volver a Codex con el link del repo o abrir una terminal autenticada para ejecutar el push/despliegue.
