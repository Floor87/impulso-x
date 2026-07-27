# Preparacion comercial

Este documento es la puerta de salida comercial de IMPULSOX. Un item marcado
como pendiente no se interpreta como opcional. La aplicacion no se ofrece a
clientes pagos hasta cerrar todos los bloqueos de lanzamiento y conservar
evidencia verificable.

## Estado actual

**No aprobada para venta.** La base tecnica permite desarrollo y previews, pero
faltan decisiones legales, aislamiento de staging, operacion de correo y
controles de datos necesarios para atender clientes reales.

## Bloqueos de lanzamiento

| Area           | Estado      | Requisito de cierre                                               | Evidencia                            |
| -------------- | ----------- | ----------------------------------------------------------------- | ------------------------------------ |
| Release        | En progreso | PR de lanzamiento aprobada, checks verdes y environment protegido | Ejecucion de GitHub Actions          |
| Staging        | Bloqueado   | Proyecto o branch de Supabase separado de produccion              | Referencia del proyecto y prueba RLS |
| Privacidad     | En progreso | Completar responsable y obtener revision juridica                 | Version beta enlazada desde la app   |
| Terminos       | En progreso | Completar condiciones comerciales y obtener revision juridica     | Version beta enlazada desde la app   |
| Cuenta         | En progreso | Desplegar y verificar la funcion de eliminacion en staging        | Implementacion y E2E local           |
| Sincronizacion | En progreso | Aplicar migracion en staging y probar dos dispositivos            | Funcion atomica y pruebas unitarias  |
| Correo         | Pendiente   | SMTP propio con SPF, DKIM y DMARC                                 | Prueba de entrega                    |
| Abuso          | Pendiente   | CAPTCHA y limites de intentos en alta, acceso y recuperacion      | Prueba automatizada                  |
| Recuperacion   | Pendiente   | Backup y restauracion probados con tiempo objetivo definido       | Acta de simulacro                    |
| Dominio        | Pendiente   | Dominio, correo de soporte y URLs de Auth verificados             | DNS y redireccion probados           |
| Soporte        | Pendiente   | Canal, horario y procedimiento de incidentes                      | Documento operativo                  |

## Privacidad y datos

Antes de aceptar personas reales se debe:

1. Identificar a la responsable del tratamiento y un canal de contacto.
2. Explicar finalidad, base de tratamiento, categorias de datos, proveedores,
   transferencias, conservacion y derechos de la persona.
3. Definir si la app admite menores y aplicar el flujo legal correspondiente.
4. Pedir solo los datos necesarios. Foto, alimentacion, entrenamiento, notas y
   estado de animo requieren una justificacion y retencion explicitas.
5. Permitir descargar y eliminar la cuenta sin asistencia manual.
6. Eliminar tambien Storage, Auth, tablas, backups operativos y datos derivados
   segun la politica de retencion.
7. Registrar versiones de terminos y consentimiento sin guardar secretos ni
   contenido sensible en logs.

La redaccion legal final debe ser revisada por una profesional competente. Este
documento organiza el trabajo tecnico y no reemplaza asesoramiento legal.

## Seguridad y operacion

- RLS debe permanecer activa en toda tabla expuesta y probarse con dos usuarios.
- `service_role` nunca se entrega al navegador.
- Los secrets viven solamente en GitHub, Vercel o Supabase.
- Auth usa correo transaccional propio; el SMTP predeterminado de Supabase no es
  una configuracion comercial.
- Se habilitan proteccion de contrasenas filtradas y CAPTCHA cuando el plan y el
  proveedor hayan sido aprobados.
- Los errores se monitorean sin registrar claves, tokens, fotos, comidas o notas.
- Cada incidente tiene responsable, severidad, comunicacion y procedimiento de
  revocacion de sesiones.

## Calidad de producto

- Los flujos criticos se prueban en telefono real, escritorio y PWA instalada.
- No hay desplazamiento horizontal ni controles inaccesibles por teclado.
- La app informa si un cambio esta local, sincronizando, sincronizado o en
  conflicto.
- El cambio de dia respeta la zona horaria elegida por la persona.
- El comportamiento offline explica que funciones requieren conexion.
- Accesibilidad, contraste, texto ampliado y reduccion de movimiento tienen
  criterios de aceptacion.
- La analitica, si se incorpora, requiere minimizacion de datos y consentimiento
  cuando corresponda.

## Negocio y atencion

Antes de cobrar se definen propietario comercial, precio, moneda, impuestos,
facturacion, prueba, renovacion, cancelacion, reembolso y soporte. Pagos y
suscripciones se implementan despues de esas decisiones, con webhooks
idempotentes y sin almacenar datos de tarjeta.

Comprar un dominio, ampliar Supabase o activar proveedores pagos requiere
aprobacion explicita de `@Floor87`; no forma parte de una correccion tecnica.

## Lista de publicacion

1. Todos los bloqueos anteriores estan cerrados.
2. PR aprobada, checks verdes y preview revisado.
3. Migraciones aplicadas primero en staging y verificadas.
4. Respaldo reciente y rollback ensayado.
5. Candidato E2E aprobado con cuenta tecnica.
6. `@Floor87` aprueba el environment `production`.
7. URL, version, manifest, iconos, acceso, sincronizacion y borrado se verifican.
8. Se registra responsable, hora, commit y resultado del lanzamiento.
