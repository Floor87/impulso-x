# Recuperacion

## Aplicacion

1. Identificar el ultimo despliegue sano en Vercel.
2. Promover ese despliegue sin reconstruirlo.
3. Verificar pagina inicial, navegacion, lectura de estado y funcionamiento offline.
4. Abrir un issue de incidente con linea de tiempo, impacto y causa probable.

## Datos locales

- No limpiar almacenamiento del navegador como medida de reparacion.
- Solicitar primero un respaldo exportado desde la aplicacion.
- Validar version y estructura antes de importar.
- Conservar `impulsox-state` y la clave historica hasta confirmar la migracion.

## Supabase

1. Detener escrituras de la version afectada.
2. No editar una migracion ya aplicada.
3. Crear una migracion compensatoria que preserve datos.
4. Probarla desde cero y contra una copia de staging.
5. Ejecutar pruebas RLS y advisors antes de aplicar.

## Repositorio

La etiqueta `baseline/pre-governance-2026-07-18` identifica la aplicacion previa a
la reorganizacion. Las reversiones posteriores deben usar `git revert` o la
promocion de un despliegue sano; nunca `reset --hard` sobre historia compartida.

## Simulacro

El rollback se ensaya al menos antes de la primera publicacion y luego cuando
cambie la estrategia de build, datos o despliegue. El resultado se registra en el
issue de lanzamiento, no en documentacion permanente.
