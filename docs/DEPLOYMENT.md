# Despliegue

## Entornos

| Entorno    | Fuente              | Datos               | Publicacion          |
| ---------- | ------------------- | ------------------- | -------------------- |
| Local      | worktree del agente | navegador local     | nunca publica        |
| Preview    | pull request        | Supabase staging    | automatico en Vercel |
| Candidato  | `main` aprobada     | Supabase produccion | URL sin dominio      |
| Produccion | candidato probado   | Supabase produccion | promocion controlada |

## Flujo

1. CI instala con lockfile y ejecuta lint, formato, unitarias, build y E2E.
2. Vercel Git Integration crea un preview por PR con variables de staging.
3. `@Floor87` valida el preview y autoriza el merge por squash.
4. El push resultante a `main` ejecuta `release.yml`, que repite los controles de
   dominio y base de datos antes de construir un candidato con variables de
   produccion.
5. El candidato se despliega con `--skip-domain` y se prueba por E2E en movil y
   escritorio usando su URL real.
6. El job `Promote approved candidate` espera la aprobacion del environment
   protegido `production` y promociona ese mismo despliegue sin reconstruirlo.
7. Se comprueban URL, manifest, iconos, carga offline y flujo critico. El
   despliegue anterior se conserva para rollback.

`vercel.json` desactiva el despliegue Git automatico de `main`; las demas ramas
siguen generando previews. Esto evita una publicacion de produccion paralela al
flujo controlado.

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

## Preparacion unica de Vercel y GitHub

Antes del primer merge a `main`:

1. Crear el proyecto Vercel `IMPULSOX` e importar `Floor87/impulso-x` mediante
   Git Integration.
2. Configurar el directorio raiz del proyecto en `/` porque `outputs` ya es la
   raiz del repositorio publicado.
3. Crear los secrets de GitHub `VERCEL_TOKEN`, `VERCEL_ORG_ID` y
   `VERCEL_PROJECT_ID`.
4. Crear el environment de GitHub `production`, limitarlo a `main` y agregar a
   `@Floor87` como revisora requerida. No activar `prevent self-review` mientras
   exista una sola cuenta humana responsable.
5. Confirmar que una PR genera preview y que un push a `main` no se publica por
   Git Integration, sino mediante `release.yml`.

La autora de una PR no puede aprobar su propia PR en GitHub. Mientras el proyecto
tenga una sola cuenta humana, la aceptacion se registra en el issue y la barrera
tecnica final es la aprobacion manual del environment `production`. Al incorporar
una segunda revisora humana, la proteccion de rama debe exigir tambien una review.

## Estado del aislamiento de staging

La infraestructura exige un proyecto o una rama de Supabase separados. En el plan
gratuito, Database Branching requiere Pro y la organizacion ya usa sus dos cupos
de proyectos activos. Hasta ampliar el plan o liberar un cupo, los previews no
reciben variables de Supabase y funcionan solo con `LocalDataRepository`.

No se debe usar el proyecto de produccion como sustituto temporal de staging.
