# Contribuir a IMPULSOX

Gracias por mejorar IMPULSOX. Este documento explica el recorrido humano. Las
reglas obligatorias y su precedencia estan en [AGENTS.md](AGENTS.md).

## Flujo de trabajo

1. Crear un issue con el resultado esperado, criterios de aceptacion, modulos
   afectados, riesgos y pruebas necesarias.
2. Asignar un agente integrador cuando el trabajo toque archivos globales.
3. Crear un worktree y una rama exclusiva desde `origin/main`.
4. Implementar solo el alcance acordado y mantener actualizada la documentacion
   estable.
5. Ejecutar todos los checks aplicables antes de publicar la rama.
6. Abrir una PR pequena, enlazar el issue y revisar el preview de Vercel.
7. Solicitar aprobacion a `@Floor87` y resolver todas las conversaciones.
8. Integrar mediante squash merge cuando CI y la revision esten verdes.

## Contrato minimo del issue

- **Objetivo:** cambio observable que se busca.
- **Aceptacion:** condiciones comprobables de finalizacion.
- **Alcance:** modulos y archivos autorizados.
- **Fuera de alcance:** cambios expresamente excluidos.
- **Dependencias:** contratos o PR que deben entrar antes.
- **Riesgo y rollback:** impacto posible y forma de volver atras.
- **Pruebas:** unitarias, integracion, E2E, PWA o Supabase requeridas.

## Revision

La revision prioriza comportamiento, seguridad, privacidad, migraciones de datos,
accesibilidad, experiencia movil y recuperacion. Una preferencia de estilo no
bloquea una PR si el formateador y las reglas del repositorio se cumplen.

Los cambios de produccion, workflows, dependencias, PWA, esquema de estado y
Supabase requieren revision explicita de sus propietarios en `CODEOWNERS`.
