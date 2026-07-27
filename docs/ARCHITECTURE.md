# Arquitectura

## Objetivos

IMPULSOX usa Vite con JavaScript vanilla. La arquitectura separa reglas de
dominio, persistencia, navegacion y presentacion para que varios agentes puedan
trabajar con limites claros.

## Capas

- `src/domain`: funciones puras de fechas, programacion, progreso y validacion.
- `src/auth`: contrato de acceso, adaptador de Supabase Auth e interfaz de
  ingreso, alta y recuperacion.
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
repository.load();
repository.save(state);
repository.export();
repository.import(serializedState);
repository.storeProfileAvatar(dataUrl);
repository.loadProfileAvatar(path);
repository.removeProfileAvatar(path);
repository.clearUserData();
```

`LocalDataRepository` mantiene compatibilidad con `impulsox-state`, migra la
clave historica `ritmo-diario-state` y luego guarda cada estado bajo una clave
derivada del `user.id` autenticado. Solo la primera cuenta que ingresa puede
reclamar los datos locales previos; otra cuenta no puede leerlos. Ninguna funcion
accede directamente a `localStorage`.

`SupabaseDataRepository` usa el mismo contrato para sincronizar dispositivos.
Mantiene una copia local por usuario para apertura inmediata y trabajo ante una
falla de red; al iniciar sesion carga la copia remota y cada cambio se agrupa
antes de actualizar `public.user_states`. Cada escritura usa una revision
monotonica y una funcion atomica: una copia obsoleta se conserva como conflicto
local en lugar de sobrescribir a otro dispositivo. Si una sincronizacion falla,
conserva el cambio local, lo marca como pendiente y lo envia antes de aceptar una
copia remota cuando recupera conexion.

Las fotos de perfil remotas viven en el bucket privado `profile-avatars`, bajo
una carpeta derivada de `user.id`. El estado guarda solo la ruta. Fotos heredadas
como Data URL se migran al iniciar sesion; el adaptador local conserva la Data URL
cuando no existe Supabase.

## Autenticacion

- El navegador usa solo `VITE_SUPABASE_URL` y una publishable key publica.
- La clave de la persona nunca se guarda en el estado de IMPULSOX.
- Supabase gestiona la sesion persistente, la confirmacion de correo y la
  recuperacion de clave mediante PKCE.
- `display_name` es metadato de presentacion. Las reglas de autorizacion usan
  exclusivamente `user.id`.
- Las versiones legales aceptadas se envian como evidencia de alta y un trigger
  guarda un registro inmutable con hora del servidor. No se usan para autorizar.
- La eliminacion de cuenta se ejecuta en una Edge Function autenticada. El
  navegador nunca recibe `service_role`; la funcion elimina Storage antes de
  eliminar Auth y deja que las claves foraneas limpien las tablas de usuario.
- `MockAuthService` existe solo en builds E2E aislados y queda excluido del build
  normal. No es un mecanismo de acceso local o de produccion.

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
