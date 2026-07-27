# ADR 0002: Confianza de datos y ciclo de vida de cuenta

## Estado

Aceptada para la beta comercial.

## Contexto

El documento completo de estado podia ser sobrescrito por el ultimo dispositivo
que guardara. La foto viajaba dentro del mismo JSON y la persona no tenia un
flujo autoservicio para eliminar su cuenta.

## Decision

- `public.user_states` incorpora una revision monotonica.
- El cliente guarda mediante `public.save_user_state`, que compara la revision
  esperada y rechaza escrituras obsoletas.
- El navegador conserva los cambios conflictivos localmente y muestra su estado.
- Las fotos remotas viven en Storage privado, una carpeta por `user.id`.
- El alta registra versiones aceptadas de privacidad y terminos.
- Una Edge Function autenticada elimina Storage y Auth sin exponer credenciales
  administrativas.

## Consecuencias

Una beta requiere aplicar las migraciones antes del candidato web. Los conflictos
no se fusionan automaticamente: se prioriza no perder datos y se informa a la
persona. La eliminacion real debe probarse en staging antes de habilitarla en
produccion.
