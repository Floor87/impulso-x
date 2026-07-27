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
4. Antes del release web se ejecuta manualmente `Supabase release` sobre
   `staging`. Para produccion, el mismo workflow usa el environment protegido
   `production` y requiere aprobacion de `@Floor87`; primero muestra el plan,
   luego aplica migraciones y despliega la funcion de cuenta.
5. El push resultante a `main` ejecuta `release.yml`, que valida que la fuente sea
   exactamente `main` y repite los controles de dominio y base de datos antes de
   construir un candidato con variables de produccion. Una ejecucion manual desde
   otra rama falla antes de construir.
6. El candidato se despliega con `--skip-domain` y se prueba por E2E en movil y
   escritorio usando su URL real. Si faltan las credenciales de la cuenta tecnica,
   el release falla: los flujos autenticados nunca se omiten silenciosamente.
   La prueba consulta tambien la revision remota para impedir que un fallback
   local oculte una migracion faltante.
7. El job `Promote approved candidate` espera la aprobacion del environment
   protegido `production` y promociona ese mismo despliegue sin reconstruirlo.
8. Se comprueban URL publica, manifest, iconos, flujo critico y `version.json`.
   El commit publicado debe coincidir con el commit probado. El despliegue
   anterior se conserva para rollback.

`vercel.json` desactiva el despliegue Git automatico de `main`; las demas ramas
siguen generando previews. Esto evita una publicacion de produccion paralela al
flujo controlado.

## Variables

- `VITE_SUPABASE_URL`: URL publica del entorno correspondiente.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: publishable key publica del entorno
  correspondiente.
- `VITE_SUPABASE_ANON_KEY`: alternativa heredada temporal si el proyecto todavia
  no dispone de publishable key.
- `SUPABASE_ACCESS_TOKEN`: solo CI administrativo, nunca expuesto a Vite.
- `SUPABASE_DB_PASSWORD`: solo tareas protegidas de migracion.
- `SUPABASE_PROJECT_REF`: referencia del proyecto definida por separado en los
  environments `staging` y `production`.
- `E2E_AUTH_EMAIL`, `E2E_AUTH_PASSWORD`, `E2E_AUTH_SECONDARY_EMAIL` y
  `E2E_AUTH_SECONDARY_PASSWORD`: dos cuentas tecnicas sin privilegios para probar
  acceso y aislamiento. Solo viven como secrets de GitHub.
- `E2E_SUPABASE_URL` y `E2E_SUPABASE_PUBLISHABLE_KEY`: configuracion publica del
  cliente que permite a las cuentas tecnicas limpiar exclusivamente sus propias
  filas mediante RLS antes de las pruebas. Nunca se usa `service_role`.
- `PRODUCTION_URL`: variable de repositorio con la URL publica canonica. Mientras
  no exista dominio propio usa `https://impulso-x.vercel.app`.

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
5. Crear dos cuentas tecnicas confirmadas, sin privilegios ni datos personales, y
   guardar los seis secrets E2E documentados en la seccion anterior.
6. Confirmar que ambas cuentas solo pueden seleccionar y eliminar su propia fila
   mediante RLS. El release limpia esas filas para comenzar desde un estado
   determinista.
7. Crear la variable de repositorio `PRODUCTION_URL`.
8. Confirmar que una PR genera preview y que un push a `main` no se publica por
   Git Integration, sino mediante `release.yml`.

La proteccion del environment es una configuracion externa al repositorio. Se
debe verificar en GitHub antes de cada primera publicacion o cambio de permisos;
la presencia de `environment: production` en el workflow no crea por si sola una
regla de aprobacion.

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
