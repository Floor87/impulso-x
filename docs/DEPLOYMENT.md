# Despliegue

## Entornos

| Entorno | Fuente | Datos | Publicacion |
| --- | --- | --- | --- |
| Local | worktree del agente | navegador local | nunca publica |
| Preview | pull request | Supabase staging | automatico en Vercel |
| Produccion | `main` aprobada | Supabase produccion | promocion controlada |

## Flujo

1. CI instala con lockfile y ejecuta lint, formato, unitarias, build y E2E.
2. Vercel crea un preview por PR con variables de staging.
3. `@Floor87` valida el preview y aprueba la PR.
4. El merge por squash deja una unica revision auditable en `main`.
5. Se promociona el artefacto previamente construido y probado.
6. Se comprueban URL, version, manifest, iconos, carga offline y flujo critico.
7. El despliegue anterior se conserva durante la ventana de verificacion.

## Variables

- `VITE_SUPABASE_URL`: URL publica del entorno correspondiente.
- `VITE_SUPABASE_ANON_KEY`: clave publica anon del entorno correspondiente.
- `SUPABASE_ACCESS_TOKEN`: solo CI administrativo, nunca expuesto a Vite.
- `SUPABASE_DB_PASSWORD`: solo tareas protegidas de migracion.

Los previews deben apuntar exclusivamente a staging. `service_role` no es una
variable valida para esta aplicacion cliente.

## Aprobacion de produccion

No se despliega produccion si falta cualquiera de estos elementos: respaldo,
rollback documentado, checks verdes, preview aprobado o migraciones verificadas.
La propietaria autoriza la promocion final.

## Estado del aislamiento de staging

La infraestructura exige un proyecto o una rama de Supabase separados. En el plan
gratuito, Database Branching requiere Pro y la organizacion ya usa sus dos cupos
de proyectos activos. Hasta ampliar el plan o liberar un cupo, los previews no
reciben variables de Supabase y funcionan solo con `LocalDataRepository`.

No se debe usar el proyecto de produccion como sustituto temporal de staging.
