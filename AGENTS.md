# Politica de agentes de IMPULSOX

Este archivo es la unica politica normativa del repositorio para agentes humanos
y automatizados. Su alcance es todo el arbol del proyecto.

## 1. Precedencia

Ante reglas incompatibles se aplica este orden:

1. Seguridad, privacidad y proteccion de datos.
2. Este `AGENTS.md`.
3. Contrato escrito de la tarea o issue.
4. Contratos de arquitectura documentados.
5. Documentacion informativa.

Si dos instrucciones del mismo nivel se contradicen, el agente debe detener la
parte afectada, conservar el trabajo ya seguro y reportar la contradiccion. No
debe elegir silenciosamente una interpretacion.

## 2. Raiz y preparacion

- La unica raiz oficial es la carpeta que contiene este archivo y `.git`.
- No se edita ni ejecuta la copia exterior del proyecto.
- Antes de trabajar se leen `AGENTS.md`, el issue y los documentos de arquitectura
  relacionados.
- Se ejecutan `git status --short --branch`, `git fetch --prune` y los checks de
  base aplicables. Un arbol sucio ajeno no se revierte.
- Cada tarea debe tener un issue con objetivo, criterios de aceptacion, modulos
  autorizados, riesgos, dependencias y plan de prueba.

## 3. Ramas y worktrees

- `main` se trata siempre como protegida. Ningun agente crea commits, hace push
  ni despliega desde `main` directamente, incluso durante el bootstrap previo a
  activar la proteccion en GitHub.
- Cada agente trabaja desde `origin/main` en un worktree exclusivo.
- El nombre de rama es `agent/<issue>-<descripcion>`; correcciones urgentes usan
  `hotfix/<issue>-<descripcion>`.
- Una rama pertenece a un solo agente. No se comparte una carpeta de trabajo.
- No se permite force-push. Una rama desactualizada se integra con `main` antes de
  aprobarla, resolviendo conflictos en su propio worktree.
- La rama `chore/governance-foundation` es la unica excepcion inicial y deja de
  ser utilizable al integrarse esta fundacion.

Ejemplo de preparacion:

```bash
git fetch origin --prune
git worktree add ../impulsox-123 -b agent/123-habit-history origin/main
```

## 4. Limites de cambio

- El agente modifica solo los modulos autorizados por el issue.
- Dependencias, lockfile, esquema de estado, PWA, workflows, configuracion de
  produccion y migraciones son archivos globales. Solo los modifica el agente
  integrador asignado en el issue.
- Ningun modulo de funcionalidad accede directamente a `localStorage`, Supabase o
  otra persistencia. Toda lectura y escritura usa `DataRepository`.
- Los contratos compartidos se integran primero en una PR pequena. Las ramas que
  dependan de ellos se actualizan despues de esa integracion.
- Refactors no relacionados, cambios de formato masivos y renombres oportunistas
  quedan fuera de la tarea.

## 5. Datos y seguridad

- La clave local estable es `impulsox-state`. Todo cambio de esquema incrementa
  la version y agrega una migracion automatica, reversible o respaldable.
- Nunca se eliminan ni reinterpretan datos existentes sin prueba de migracion.
- Secretos solo viven en GitHub, Vercel o Supabase. `.env.example` contiene
  nombres y valores ficticios.
- `service_role`, contrasenas, tokens y credenciales privadas estan prohibidos en
  navegador, codigo, fixtures, logs, commits y artefactos.
- Toda tabla expuesta por Supabase habilita RLS y limita filas con `auth.uid()`.
- Las migraciones son inmutables una vez aplicadas. Se usa expandir, migrar,
  verificar y retirar; una operacion destructiva se entrega por separado.
- Entradas importadas, formularios y parametros externos deben validarse antes de
  persistirse o mostrarse.

## 6. Calidad obligatoria

Antes de entregar se ejecutan, segun el alcance:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm test:e2e
```

- Un cambio de dominio agrega pruebas unitarias.
- Un flujo visible agrega o actualiza pruebas E2E en movil y escritorio.
- Persistencia agrega pruebas de migracion, recarga y respaldo.
- Base de datos agrega pruebas RLS, migracion desde cero y advisors de Supabase.
- Un fallo no se oculta ni se convierte en warning para aprobar una PR.
- Excepciones de prueba deben estar justificadas en la PR y aprobadas por
  `@Floor87`.

## 7. Commits y pull requests

- Se usan commits convencionales: `feat:`, `fix:`, `test:`, `docs:`, `chore:` o
  `refactor:`.
- Cada commit es coherente, revisable y no mezcla tareas distintas.
- La PR enlaza el issue, explica riesgo y rollback, enumera pruebas y adjunta el
  preview de Vercel.
- Solo se permite squash merge.
- Para integrar: rama actualizada, checks requeridos verdes, conversaciones
  resueltas y aprobacion de `@Floor87`.
- No se borra una rama con trabajo no integrado ni se reescribe historia
  compartida.

## 8. Despliegue y produccion

- Cada PR genera un preview aislado. Los previews nunca escriben en Supabase de
  produccion.
- Solo un merge aprobado a `main` puede iniciar produccion.
- Despues del merge, CI crea un candidato con variables de produccion, prueba esa
  URL sin dominio y promociona exactamente ese artefacto; la promocion no
  recompila.
- Se verifica salud, manifest, iconos, flujo critico y version desplegada.
- El despliegue anterior se conserva hasta completar la verificacion y debe poder
  promoverse para rollback inmediato.
- Ningun agente promueve produccion, cambia dominios o aplica migraciones
  destructivas sin aprobacion expresa de `@Floor87`.

## 9. Conflictos y entrega

- El agente que encuentra un conflicto identifica el contrato afectado y evita
  resolverlo eligiendo una implementacion arbitraria.
- El integrador decide el orden: contrato compartido, consumidores y finalmente
  limpieza.
- La entrega informa archivos cambiados, checks ejecutados, pendientes, riesgos y
  pasos de rollback. No declara completado aquello que no pudo verificar.
- Al terminar, el worktree se elimina solo despues del merge y de confirmar que
  no contiene cambios sin publicar.
