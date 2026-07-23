# Operacion verificable

Este documento no almacena estados temporales. GitHub, Vercel y Supabase son las
fuentes de verdad.

## Git

```bash
git status --short --branch
git remote -v
git log --oneline --decorate -10
git tag --list
```

La comparacion con GitHub se realiza despues de `git fetch --prune`.

## Calidad local

```bash
pnpm install --frozen-lockfile
pnpm verify
```

## Vercel

Consultar el proyecto vinculado y sus despliegues desde el panel o la CLI. La PR
debe contener la URL de preview exacta; este archivo no conserva URLs efimeras.

## Supabase

Consultar estado del proyecto, migraciones y advisors desde el panel o la CLI. Los
identificadores y secretos de entornos no se escriben aqui.

## Incidentes

Los estados de servicio, commits adelantados y resultados de despliegue se
registran en issues o ejecuciones de CI. No se actualizan manualmente en el repo.
