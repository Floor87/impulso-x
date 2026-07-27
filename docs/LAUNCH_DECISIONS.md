# Decisiones de lanzamiento

Este registro contiene decisiones de negocio que no deben adivinarse en codigo.
Cada fila se cierra con una respuesta de la propietaria y evidencia enlazada en
el issue de lanzamiento.

| Decision                    | Estado    | Definicion necesaria                                       |
| --------------------------- | --------- | ---------------------------------------------------------- |
| Responsable legal           | Pendiente | Nombre o razon social, identificacion, domicilio y pais    |
| Mercados                    | Pendiente | Paises donde se vendera y si se admiten menores            |
| Contacto                    | Pendiente | Dominio, correo de soporte y correo legal                  |
| Planes                      | Pendiente | Funciones gratis y pagas, limites y nombre de cada plan    |
| Precio                      | Pendiente | Importe, moneda, impuestos, periodicidad y actualizaciones |
| Prueba                      | Pendiente | Duracion, requisitos y conversion a pago                   |
| Pagos                       | Pendiente | Proveedor, cuenta comercial y responsable de conciliacion  |
| Cancelacion y reembolso     | Pendiente | Fecha efectiva, acceso remanente y excepciones             |
| Facturacion                 | Pendiente | Comprobantes, datos fiscales y proveedor                   |
| Soporte                     | Pendiente | Canal, horario, tiempo objetivo y escalamiento             |
| Retencion                   | Pendiente | Plazos para cuenta activa, borrado, backup y logs          |
| Recuperacion                | Pendiente | RPO, RTO, frecuencia de backup y responsable del simulacro |
| Analitica                   | Pendiente | Eventos permitidos, finalidad, proveedor y consentimiento  |
| Comunicaciones              | Pendiente | Correos transaccionales y promocionales                    |
| Posicionamiento de producto | Pendiente | Publico, promesa verificable y limites de bienestar        |

## Orden recomendado

1. Identidad legal, mercados y canal de contacto.
2. Planes, precio, impuestos, cancelacion y reembolso.
3. Proveedor de pagos y facturacion.
4. Dominio, SMTP, staging y soporte.
5. Revision juridica de privacidad y terminos.
6. Integracion de pagos en modo prueba y conciliacion.
7. Beta cerrada, simulacro de recuperacion y lanzamiento publico.

No se habilita checkout ni se anuncian precios hasta cerrar las primeras cinco
etapas. Esta restriccion evita cobrar con condiciones incompletas o implementar
un proveedor que luego no encaje con la operacion real.
