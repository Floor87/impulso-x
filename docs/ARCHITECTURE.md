# Arquitectura

## Objetivos

IMPULSOX usa Vite con JavaScript vanilla. La arquitectura separa reglas de
dominio, persistencia, navegacion y presentacion para que varios agentes puedan
trabajar con limites claros.

## Capas

- `src/domain`: funciones puras de fechas, programacion, progreso y validacion.
- `src/data`: contrato `DataRepository`, migraciones y adaptadores de
  persistencia.
- `src/features`: comportamiento de habitos, entrenamiento, alimentacion, agua y
  progreso.
- `src/ui`: navegacion, renderizado y utilidades de interfaz.
- `src/main.js`: composicion de dependencias y arranque; no contiene reglas de
  negocio nuevas.
- `public`: imagenes e iconos copiados sin transformacion por Vite.
- `supabase/migrations`: esquema remoto versionado y politicas RLS.

## Persistencia

La interfaz estable es `DataRepository`:

```js
repository.load()
repository.save(state)
repository.export()
repository.import(serializedState)
```

`LocalDataRepository` mantiene compatibilidad con `impulsox-state` y migra la
clave historica `ritmo-diario-state`. Ninguna funcion accede directamente a
`localStorage`.

Una futura implementacion `SupabaseDataRepository` podra usar el mismo contrato
una vez que exista autenticacion. Hasta entonces, la nube no debe sustituir el
almacenamiento local ni provocar perdida de datos.

## Estado

- El estado tiene un numero de version explicito.
- Las migraciones son secuenciales e idempotentes.
- Cada dia conserva un `plan` historico para que cambios futuros de habitos,
  rutinas u objetivo de agua no reescriban el progreso anterior.
- Fechas diarias usan `YYYY-MM-DD` en la zona local del dispositivo.

## PWA

`vite-plugin-pwa` genera el service worker y el manifest durante el build. No se
mantienen nombres de cache manuales. Las actualizaciones invalidan automaticamente
los assets con hash y conservan una ruta de navegacion sin conexion.

## Decisiones

Las decisiones irreversibles o transversales se documentan en `docs/decisions`
como ADR. Una ADR aceptada no se reescribe: se crea otra que la sustituya.
