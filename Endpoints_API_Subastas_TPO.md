# **Sistema de Subastas**

### Especificación de Endpoints — API REST

Primera entrega | Organizado por módulo y pantalla

_Referencia HTTP: https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml_


Base URL de todos los endpoints:
```
  https://api.subastas.com/v1
```

Autenticación: Bearer Token JWT en el header Authorization para todos los endpoints protegidos. Los
endpoints de registro y login son los únicos públicos.
​


## **1 — Acceso**

Pantallas: Splash screen · Login · Recuperar contraseña
Estos endpoints son públicos (no requieren token). El login devuelve el JWT que se usa en todos los demás
módulos.


**Login**


**POST** **`/auth/login`**
Autentica al postor con email y contraseña. Retorna el JWT y los datos básicos del usuario incluyendo su
estado y categoría.
Body (JSON):

|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`email`|string|Sí|Correo electrónico del postor|
|`password`|string|Sí|Contraseña personal|



Retorno: JSON con token JWT, datos del usuario (id, nombre, categoria, estado, medios_pago_verificados)
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Login exitoso. Retorna token y datos del usuario.|
|**`400`**|Bad Request|Campos faltantes o formato inválido.|
|**`401`**|Unauthorized|Credenciales incorrectas.|
|**`403`**|Forbidden|Usuario judicializado. Acceso denegado.|
|**`422`**|Unprocessable Entity|Email con formato inválido.|



**Recuperar contraseña — solicitar enlace**


**POST** **`/auth/password/reset-request`**
Envía un email al usuario con un enlace para restablecer su contraseña. El enlace expira a los 30 minutos.
Body (JSON):

|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`email`|string|Sí|Correo electrónico registrado|



Retorno: Mensaje de confirmación de envío
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Email enviado (siempre retorna 200 por seguridad, aunque el<br>email no exista).|
|**`400`**|Bad Request|Campos faltantes o formato inválido.|
|**`401`**|Unauthorized|Credenciales incorrectas.|
|**`422`**|Unprocessable Entity|Email con formato inválido.|



**Recuperar contraseña — verificación de código**


**POST** **`/auth/password/reset-code`**
El sistema verifica si el código creado y enviado por mail coincide con el código ingresado por el usuario.


|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`código`|int|Sí|Ingreso del código de<br>verificación|


Retorno: Mensaje de éxito y redirección a la activity para restablecer la contraseña

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|El código de verificación ingresado coincide con el creado por el<br>sistema|
|**`400`**|Bad Request|Campos faltantes|
|**`401`**|Unauthorized|Token inválido o tiempo agotado|
|**`422`**|Unprocessable Entity|La contraseña no cumple los requisitos mínimos.|



**Recuperar contraseña — establecer nueva clave**


**POST** **`/auth/password/reset`**
Establece la nueva contraseña usando el token recibido por email. Válido también para el paso 3 del registro.
Body (JSON):






|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`token`|string|Sí|Token de reset recibido por<br>email|
|`password`|string|Sí|Nueva contraseña (mín. 8<br>chars, 1 mayúscula, 1<br>número)|
|`password_confirm`<br>`ation`|string|Sí|Confirmación de la nueva<br>contraseña|



Retorno: Mensaje de éxito y redirección a login
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Contraseña actualizada correctamente.|
|**`400`**|Bad Request|Campos faltantes o formato inválido.|
|**`401`**|Unauthorized|Token inválido o expirado.|
|**`422`**|Unprocessable Entity|La contraseña no cumple los requisitos mínimos.|



​


## **2 — Registro del usuario**

Pantallas: Paso 1 datos personales · Pantalla de espera · Paso 3 generar clave
El paso 2 (verificación) es interno de la empresa y se gestiona desde el sistema externo.


**Registro — Paso 1: datos personales**


**POST** **`/auth/register`**
Crea la solicitud de registro con los datos personales del postor y las fotos del DNI. La cuenta queda en
estado pendiente de verificación.
Body (JSON):






|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`nombre`|string|Sí|Nombre del postor|
|`apellido`|string|Sí|Apellido del postor|
|`usuario`|string|Si|Username del usuario|
|`email`|string|Sí|Correo electrónico|
|`domicilio`|string|Sí|Domicilio legal completo|
|`pais_origen`|string|Sí|País de origen (código ISO)|
|`dni_frente`|file|Sí|Foto del DNI frente (jpg/png,<br>max 5MB)|
|`dni_dorso`|file|Sí|Foto del DNI dorso (jpg/png,<br>max 5MB)|
|`password`|string|Sí|Nueva contraseña (mín. 8<br>chars, 1 mayúscula, 1<br>número)|
|`password_confirm`<br>`ation`|string|Sí|Confirmación de la nueva<br>contraseña|



Retorno: ID de solicitud y estado "pendiente"
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Solicitud generada. Usuario en estado pendiente.|
|**`400`**|Bad Request|Campos faltantes o formato inválido.|
|**`409`**|Conflict|El email y/o el username ya está registrado.|
|**`413`**|Content Too Large|Imagen supera el tamaño máximo.|
|**`422`**|Unprocessable Entity|Formato de imagen inválido o email mal formado.|



**Registro — Paso 2: establecer contraseña**


**POST** **`/auth/register/complete`**


|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`token`|String|Si|Token recibido por email al<br>ser aprobado|
|`password`|string|Sí|Nueva contraseña (mín. 8<br>chars, 1 mayúscula, 1<br>número)|


Retorno: ID de solicitud y estado "pendiente"
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`201`**|Created|Usuario creado y registrado en el sistema..|
|**`400`**|Bad Request|Request mal armado (faltan campos / nulls).|
|**`401`**|Unauthorized|Token invalido|
|**`422`**|Unprocessable Entity|Contraseña invalida. No coincide|


## **3 — Medios de pago**


Pantallas: Lista de medios · Agregar cuenta bancaria · Agregar tarjeta · Agregar cheque
Todos los endpoints de este módulo requieren autenticación. La verificación de los medios la realiza la
empresa desde el sistema externo; la app solo consulta el estado.


**Listar medios de pago**


**GET** **`/payment-methods`**
Retorna todos los medios de pago registrados por el usuario autenticado, agrupados por tipo y con su estado
de verificación.
Retorno: Array de medios de pago con tipo, datos enmascarados, estado (verificado | pendiente) y fecha de
registro
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Lista de medios de pago del usuario.|
|**`401`**|Unauthorized|Token inválido o no enviado.|



**Agregar cuenta bancaria**


**POST** **`/payment-methods/bank-account`**
Registra una cuenta bancaria nacional o extranjera. Queda en estado pendiente hasta que la empresa la
verifique.
Body (JSON):








|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`pais_banco`|string|Sí|País del banco (código ISO)|
|`nombre_banco`|string|Sí|Nombre de la entidad<br>bancaria|
|`cbu_iban`|string|Sí|CBU (Argentina) o IBAN<br>(internacional)|
|`titular`|string|Sí|Nombre del titular de la<br>cuenta|
|`fondos_reservado`<br>`s`|number|Sí|Monto declarado en fondos<br>reservados|
|`moneda`|string|Sí|Código de moneda (ARS /<br>USD)|


Retorno: Medio de pago creado con ID y estado "pendiente"
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`201`**|Created|Cuenta bancaria registrada.|
|**`400`**|Bad Request|Campos obligatorios faltantes.|
|**`401`**|Unauthorized|Token inválido.|
|**`422`**|Unprocessable Entity|CBU/IBAN con formato inválido.|



**Agregar tarjeta de crédito**


**POST** **`/payment-methods/credit-card`**
Registra una tarjeta de crédito nacional o internacional. Los datos de la tarjeta se tokenizán antes de
enviarse.
Body (JSON):

|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`tipo`|string|Sí|nacional | internacional|
|`numero`|string|Sí|Número de tarjeta (16 dígitos)|
|`vencimiento`|string|Sí|Fecha de vencimiento<br>(MM/AA)|
|`cvv`|string|Sí|Código de seguridad|
|`titular`|string|Sí|Nombre del titular como figura<br>en la tarjeta|
|`pais_emisor`|string|Sí|País emisor (código ISO)|



Retorno: Tarjeta registrada con últimos 4 dígitos, estado "pendiente" e ID
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`201`**|Created|Tarjeta registrada correctamente.|
|**`400`**|Bad Request|Campos faltantes.|
|**`401`**|Unauthorized|Token inválido.|
|**`422`**|Unprocessable Entity|Número de tarjeta o vencimiento inválido.|



**Agregar cheque certificado**


**POST** **`/payment-methods/certified-check`**
Registra un cheque certificado como garantía. El usuario debe entregar el cheque físicamente antes del
inicio de la subasta. El monto limita el total de compras acumuladas.
Body (JSON):






|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`banco_emisor`|string|Sí|Nombre del banco emisor|
|`monto`|number|Sí|Monto certificado del cheque|
|`moneda`|string|Sí|ARS | USD|
|`fecha_emision`|string|Sí|Fecha de emisión<br>(YYYY-MM-DD)|
|`confirmacion_ent`<br>`rega`|boolean|Sí|Debe ser true para poder<br>registrar|


Retorno: Cheque registrado con ID, monto, moneda y estado "pendiente de entrega física"
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`201`**|Created|Cheque registrado. Pendiente de entrega física.|
|**`400`**|Bad Request|Campos faltantes o confirmacion_entrega es false.|
|**`401`**|Unauthorized|Token inválido.|
|**`422`**|Unprocessable Entity|Monto inválido o fecha mal formada.|



**Eliminar medio de pago**


**DELETE** **`/payment-methods/{id}`**
Elimina un medio de pago registrado. No se puede eliminar si está asociado a una subasta activa.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID del medio de pago a eliminar|



Retorno: Mensaje de confirmación
Códigos de respuesta:


|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Medio de pago eliminado.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Medio de pago no encontrado.|
|**`409`**|Conflict|No se puede eliminar: asociado a una subasta activa.|


## **4 — Explorar subastas**

Pantallas: Listado de subastas · Detalle de subasta · Catálogo
El listado filtra automáticamente por la categoría del usuario. El precio base solo se retorna si el usuario esta
habilitado por completo.


**Listar subastas**


**GET** **`/auctions`**
Retorna las subastas disponibles filtradas por la categoría del postor autenticado. Las subastas de categoría
superior se incluyen en el listado pero marcadas como inaccesibles. Soporta filtro por estado.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`status`|string|Opcional. Valores: activas | próximas |<br>finalizado. Por defecto retorna todas.|
|`page`|integer|Opcional. Número de página para<br>paginación.|
|`limit`|integer|Opcional. Resultados por página (default<br>20).|



Retorno: Array paginado de subastas con id, nombre, estado, categoria_requerida, moneda, fecha_inicio,
lugar, rematador, cantidad_items y accesible (boolean)
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Lista de subastas paginada.|
|**`401`**|Unauthorized|Token inválido.|



**Detalle de subasta**


**GET** **`/auctions/{id}`**
Retorna el detalle completo de una subasta específica incluyendo datos del subastador y preview del
catálogo.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID de la subasta|



Retorno: Objeto subasta con todos los campos + array de items del catálogo (preview, sin precio base si falta
validacion)
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Detalle de la subasta.|
|**`401`**|Unauthorized|Token inválido.|
|**`403`**|Forbidden|Categoría del usuario insuficiente para acceder.|
|**`404`**|Not Found|Subasta no encontrada.|



**Catálogo de una subasta**


**GET** **`/auctions/{id}/catalog`**


Retorna el catálogo completo de artículos de una subasta. El campo precio_base solo se incluye en la
respuesta si el usuario está habilitado. Para invitado/pendiente el campo retorna null.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID de la subasta|
|`page`|integer|Opcional. Página de resultados.|
|`limit`|integer|Opcional. Items por página (default 20).|



Retorno: Array paginado de artículos con numero_item, descripcion, imagenes (URLs), dueno_actual,
cantidad_piezas, precio_base, es_obra_de_arte (boolean)
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Catálogo de la subasta.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Subasta no encontrada.|



​


## **5 — Artículo**

Pantallas: Artículo estándar · Obra de arte / diseñador


**Detalle de artículo**


**GET** **`/auctions/{auction_id}/catalog/{item_id}`**
Retorna el detalle completo de un artículo específico. Si el artículo es obra de arte, incluye los campos
artista, fecha_creacion e historia. El precio_base solo se incluye para usuarios validos.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`auction_id`|integer|ID de la subasta|
|`item_id`|integer|ID del artículo (número de ítem)|



Retorno: Objeto artículo con numero_item, descripcion, imagenes[] (hasta 6 URLs), dueno_actual,
cantidad_piezas, precio_base (null si E2), es_obra_de_arte, artista?, fecha_creacion?, historia?, tecnica?
Códigos de respuesta:


|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Detalle del artículo.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Artículo o subasta no encontrados.|


## **6 — Sala de subasta en vivo**

Pantallas: Sala observador · Sala activa · Confirmación de puja · Esperando confirmación
La sala usa WebSocket para actualizaciones en tiempo real (mejor oferta, nuevas pujas). Los endpoints
REST se usan para ingresar, validar y registrar pujas.


**Ingresar a una subasta**


**POST** **`/auctions/{id}/join`**
Registra al postor como conectado a la sala. Valida que el usuario no esté en otra subasta simultáneamente
y que su categoría sea suficiente. Retorna el estado actual del artículo en curso.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID de la subasta|



Retorno: Estado actual de la sala: articulo_actual, mejor_oferta, historial_pujas recientes, websocket_url para
conectar
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Ingreso exitoso. Retorna estado de la sala.|
|**`401`**|Unauthorized|Token inválido.|
|**`403`**|Forbidden|Categoría insuficiente o ya conectado a otra subasta.|
|**`404`**|Not Found|Subasta no encontrada.|
|**`409`**|Conflict|La subasta no está activa o ya finalizó.|



**Salir de una subasta**


**POST** **`/auctions/{id}/leave`**
Desconecta al usuario de la sala. Necesario para poder ingresar a otra subasta.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID de la subasta|



Retorno: Mensaje de confirmación de desconexión
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Desconectado correctamente.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Subasta no encontrada.|



**Obtener estado actual de la sala**


**GET** **`/auctions/{id}/live`**
Retorna el estado en tiempo real de la sala: artículo en curso, mejor oferta y últimas pujas. Se usa como
fallback si el WebSocket se desconecta.
Parámetros de ruta / query:


**Parámetro** **Tipo** **Descripción**


`id` integer ID de la subasta


Retorno: Artículo en curso con datos completos, mejor_oferta {monto, moneda, hace_segundos},
historial_pujas[] ordenado cronológico
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Estado actual de la sala.|
|**`401`**|Unauthorized|Token inválido.|
|**`403`**|Forbidden|Usuario no conectado a esta subasta.|
|**`404`**|Not Found|Subasta no encontrada.|



**Enviar puja**


**POST** **`/auctions/{id}/bids`**
Registra una nueva puja del usuario. La app valida el rango (mín. última_oferta + 1% del precio_base, máx.
última_oferta + 20% del precio_base) antes de enviar. El sistema bloquea nuevas pujas hasta confirmar la
actual. Los límites no aplican para categorías Oro y Platino.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID de la subasta|



Body (JSON):






|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`item_id`|integer|Sí|ID del artículo que se está<br>pujando|
|`monto`|number|Sí|Monto ofertado|
|`moneda`|string|Sí|ARS | USD (debe coincidir<br>con la moneda de la subasta)|
|`payment_method_i`<br>`d`|integer|Sí|ID del medio de pago<br>verificado a usar|



Retorno: Puja registrada con id, monto, timestamp, estado (confirmada | en_proceso) y nueva mejor_oferta
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`201`**|Created|Puja registrada y confirmada por el sistema.|
|**`400`**|Bad Request|Campos faltantes o moneda incorrecta.|
|**`401`**|Unauthorized|Token inválido.|
|**`403`**|Forbidden|Sin medio de pago verificado, o ya hay una puja en proceso, o<br>categoría insuficiente.|
|**`409`**|Conflict|El monto está fuera del rango permitido (min/max).|
|**`422`**|Unprocessable Entity|El artículo ya fue adjudicado o la subasta no está activa.|



**Obtener historial de pujas de un artículo**


**GET** **`/auctions/{id}/items/{item_id}/bids`**
Retorna el historial completo de pujas de un artículo específico en orden cronológico, con usuario
anonimizados para otros usuarios.


Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID de la subasta|
|`item_id`|integer|ID del artículo|



Retorno: Array de pujas ordenado cronológico con monto, moneda, timestamp y postor (nombre propio si es
el usuario autenticado, anonimizado si es otro)
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Historial de pujas.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Subasta o artículo no encontrados.|



**WebSocket — Sala en vivo**

Conexión: wss://api.subastas.com/v1/auctions/{id}/ws?token={jwt}
La app se suscribe a este WebSocket al ingresar a la sala. El servidor emite los siguientes eventos en tiempo
real:














|Evento|Payload|Descripción|
|---|---|---|
|`bid.new`|{ monto, moneda, hace_segundos,<br>es_propio }|Nueva puja registrada. es_propio=true si<br>la realizó el usuario autenticado.|
|`bid.confirmed`|{ bid_id, estado: "confirmada" }|Confirmación de que la puja del usuario<br>fue registrada. Desbloquea el campo de<br>puja.|
|`item.next`|{ item_id, nombre, precio_base,<br>imagenes[] }|La sala avanzó al siguiente artículo del<br>catálogo.|
|`item.sold`|{ item_id, monto_final, ganador_propio }|El artículo fue adjudicado.<br>ganador_propio=true si lo ganó el<br>usuario.|
|`auction.closed`|{ mensaje }|La subasta finalizó completamente.|


## **7 — Resultado y pago**

Pantallas: Adjudicación ganada · Lote no adjudicado · Mensaje privado / factura · Multa pendiente


**Obtener resultado de adjudicación**


**GET** **`/auctions/{id}/items/{item_id}/result`**
Retorna el resultado de un artículo subastado para el usuario autenticado: si ganó, el desglose económico
completo; si no ganó, la puja ganadora y el siguiente artículo.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID de la subasta|
|`item_id`|integer|ID del artículo|



Retorno: gano (boolean), monto_pujado, monto_comision, costo_envio, total, medio_pago_usado,
direccion_envio, siguiente_item? (si no ganó)
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Resultado del artículo.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Artículo o subasta no encontrados.|



**Confirmar modalidad de entrega**


**POST** **`/purchases/{purchase_id}/delivery`**
El usuario elige entre envío a domicilio o retiro personal. El retiro personal cancela la cobertura del seguro
del bien.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`purchase_id`|integer|ID de la compra generada al ganar el<br>artículo|



Body (JSON):

|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`tipo`|string|Sí|envio | retiro_personal|
|`direccion_envio`|string|Condicional|Requerida si tipo = envio|



Retorno: Compra actualizada con tipo de entrega, costo y aviso de seguro si aplica
Códigos de respuesta:


|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Modalidad de entrega confirmada.|
|**`400`**|Bad Request|tipo inválido o dirección faltante.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Compra no encontrada.|
|**`409`**|Conflict|La compra ya tiene una modalidad de entrega confirmada.|


**Listar notificaciones / mensajes privados**


**GET** **`/notifications`**
Retorna todas las notificaciones del usuarios en orden cronológico descendente, incluyendo facturas de
compra, alertas de puja y comunicados de la empresa.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`leidas`|boolean|Opcional. true | false para filtrar por<br>estado de lectura.|
|`page`|integer|Opcional. Página de resultados.|



Retorno: Array paginado de notificaciones con id, tipo, titulo, descripcion, leida (boolean), fecha y payload
(datos específicos según tipo)
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Lista de notificaciones.|
|**`401`**|Unauthorized|Token inválido.|



**Marcar notificación como leída**


**PATCH** **`/notifications/{id}/read`**
Marca una notificación específica como leída.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID de la notificación|



Retorno: Notificación actualizada
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Notificación marcada como leída.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Notificación no encontrada.|



**Marcar todas las notificaciones como leídas**


**POST** **`/notifications/read-all`**
Marca todas las notificaciones del usuario como leídas.
Retorno: Mensaje de confirmación con cantidad de notificaciones actualizadas
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Todas las notificaciones marcadas como leídas.|
|**`401`**|Unauthorized|Token inválido.|



**Obtener multa pendiente**


**GET** **`/users/me/penalty`**
Retorna la multa activa del usuario si existe. La multa bloquea el acceso a pujar en nuevas subastas.


Retorno: penalty (null si no hay multa) o { monto_puja_incumplida, monto_multa, moneda, vencimiento_72hs,
estado }
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Estado de multa (puede ser null si no hay multa activa).|
|**`401`**|Unauthorized|Token inválido.|



**Pagar multa**


**POST** **`/users/me/penalty/pay`**
Registra el pago de la multa usando un medio de pago verificado del usuario.
Body (JSON):






|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`payment_method_i`<br>`d`|integer|Sí|ID del medio de pago<br>verificado para abonar la<br>multa|



Retorno: Confirmación de pago y estado de cuenta desbloqueada
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Multa pagada.|
|**`400`**|Bad Request|Medio de pago no especificado.|
|**`401`**|Unauthorized|Token inválido.|
|**`402`**|Payment Required|El medio de pago no tiene fondos suficientes.|
|**`404`**|Not Found|No hay multa activa.|



​


## **8 — Ofrecer mis artículos para subasta**

Pantallas: Mis artículos · Formulario de solicitud · Confirmar condiciones · Motivo de rechazo


**Listar mis artículos**


**GET** **`/my-items`**
Retorna todos los artículos que el usuario ofreció a la empresa para subasta, con su estado actual.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`status`|string|Opcional. en_revision | aceptado |<br>en_subasta | rechazado|



Retorno: Array de artículos con id, nombre, estado, fecha_envio y datos de subasta asignada si aplica
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Lista de artículos del usuario.|
|**`401`**|Unauthorized|Token inválido.|



**Enviar solicitud de artículo**


**POST** **`/my-items`**
Crea una solicitud para incluir un artículo en una subasta futura. Requiere mínimo 6 fotos y ambas
declaraciones juradas.
Body (JSON):






|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`nombre`|string|Sí|Nombre del artículo|
|`descripcion`|string|Sí|Descripción detallada<br>(materiales, estado,<br>dimensiones, historia)|
|`fotos`|file[]|Sí|Mínimo 6 imágenes (jpg/png,<br>max 5MB c/u)|
|`declara_titulari`<br>`dad`|boolean|Sí|Debe ser true: declara<br>propiedad y sin impedimento<br>legal|
|`declara_origen_l`<br>`icito`|boolean|Sí|Debe ser true: declara que<br>puede acreditar origen lícito|



Retorno: Artículo registrado con ID y estado "en_revision"
Códigos de respuesta:


|Código|Estado HTTP|Descripción|
|---|---|---|
|**`201`**|Created|Solicitud enviada. Estado: en revisión.|
|**`400`**|Bad Request|Campos faltantes o declaraciones no aceptadas.|
|**`401`**|Unauthorized|Token inválido.|
|**`413`**|Content Too Large|Una o más imágenes superan el tamaño máximo.|
|**`422`**|Unprocessable Entity|Menos de 6 fotos enviadas.|


**Obtener detalle de mi artículo**


**GET** **`/my-items/{id}`**
Retorna el detalle completo de un artículo propio incluyendo estado, motivo de rechazo si aplica y
condiciones propuestas si fue aceptado.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID del artículo|



Retorno: Artículo con todos los campos + motivo_rechazo? (si rechazado) + condiciones_propuestas? {
precio_base, comision, subasta_asignada } (si aceptado)
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Detalle del artículo.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Artículo no encontrado o no pertenece al usuario.|



**Aceptar o rechazar condiciones propuestas**


**POST** **`/my-items/{id}/conditions`**
El usuario acepta o rechaza el precio base y comisión propuestos por la empresa. Si rechaza, el artículo se
devuelve con cargo. Si acepta, debe declarar la cuenta bancaria de cobros.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID del artículo|



Body (JSON):

|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`decision`|string|Sí|aceptar | rechazar|
|`cuenta_cobros_id`|integer|Condicional|Requerida si decision =<br>aceptar. ID de la cuenta<br>bancaria donde recibirá el<br>pago.|



Retorno: Artículo actualizado con nuevo estado y datos de subasta asignada (si acepta)
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Decisión registrada.|
|**`400`**|Bad Request|Decisión inválida o cuenta de cobros faltante.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Artículo no encontrado.|
|**`409`**|Conflict|El artículo no está en estado "aceptado" o ya fue decidido.|



​


## **9 — Seguro y ubicación del bien**

Pantalla: Ubicación y póliza del bien entregado


**Obtener ubicación y póliza del artículo**


**GET** **`/my-items/{id}/custody`**
Retorna la ubicación física actual del bien en depósito y los datos de la póliza de seguro contratada por la
empresa.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`id`|integer|ID del artículo propio|



Retorno: deposito { nombre, direccion, fecha_ingreso, estado }, poliza { aseguradora, numero_poliza,
valor_asegurado, moneda, vigencia_hasta }
Códigos de respuesta:


|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Datos de custodia y póliza.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Artículo no encontrado o no está en custodia.|


## **10 — Perfil y estadísticas**

Pantallas: Mi perfil · Historial de subastas · Estadísticas · Historial de pujas de una subasta


**Obtener datos del perfil**


**GET** **`/users/me`**
Retorna los datos personales del usuario autenticado, su categoría actual, estado de cuenta y cuenta
bancaria de cobros declarada.
Retorno: id, nombre, apellido, email, domicilio, pais, categoria, estado_cuenta, cuenta_cobros { banco,
cbu_iban, titular }
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Datos del perfil.|
|**`401`**|Unauthorized|Token inválido.|



**Actualizar cuenta de cobros**


**PUT** **`/users/me/payout-account`**
Actualiza o registra la cuenta bancaria donde el usuario recibirá los pagos por artículos vendidos. Puede ser
una cuenta del exterior.
Body (JSON):

|Campo|Tipo|Requerido|Descripción|
|---|---|---|---|
|`pais_banco`|string|Sí|País del banco (código ISO)|
|`nombre_banco`|string|Sí|Nombre de la entidad<br>bancaria|
|`cbu_iban`|string|Sí|CBU o IBAN|
|`titular`|string|Sí|Nombre del titular|



Retorno: Cuenta de cobros actualizada
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Cuenta de cobros actualizada.|
|**`400`**|Bad Request|Campos faltantes.|
|**`401`**|Unauthorized|Token inválido.|
|**`422`**|Unprocessable Entity|CBU/IBAN con formato inválido.|



**Historial de subastas participadas**


**GET** **`/users/me/auction-history`**
Retorna el historial de subastas en las que participó el usuario con resumen de actividad.
Parámetros de ruta / query:


|Parámetro|Tipo|Descripción|
|---|---|---|
|`page`|integer|Opcional. Página de resultados.|
|`limit`|integer|Opcional. Resultados por página (default<br>20).|


Retorno: Array paginado de subastas con nombre, fecha, cantidad_pujas, monto_total_pujado, resultado
(ganada | sin_ganar)
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Historial de participación.|
|**`401`**|Unauthorized|Token inválido.|



**Estadísticas del postor**


**GET** **`/users/me/stats`**
Retorna métricas agregadas sobre la actividad del usuario: participación por categoría, importes pagados y
ofertados, efectividad y moneda más usada.
Retorno: total_subastas, lotes_ganados, lotes_perdidos, total_pujas, tasa_exito (%), total_pagado { ARS,
USD }, total_ofertado { ARS, USD }, por_categoria [{ categoria, cantidad }], por_moneda [{ moneda, cantidad
}]
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Estadísticas del usuario.|
|**`401`**|Unauthorized|Token inválido.|



**Historial de pujas de una subasta específica**


**GET** **`/users/me/auction-history/{auction_id}/bids`**
Retorna las pujas propias del usuario en una subasta específica junto con el historial completo de esa
sesión.
Parámetros de ruta / query:

|Parámetro|Tipo|Descripción|
|---|---|---|
|`auction_id`|integer|ID de la subasta|



Retorno: resultado { gano, monto_ganador }, mis_pujas [{ numero, hora, monto, estado }], historial_completo

[{ hora, monto, es_propio }]
Códigos de respuesta:

|Código|Estado HTTP|Descripción|
|---|---|---|
|**`200`**|OK|Historial de pujas de la subasta.|
|**`401`**|Unauthorized|Token inválido.|
|**`404`**|Not Found|Subasta no encontrada en el historial del usuario.|



​


## **Resumen de endpoints**

Total: 31 endpoints REST + 1 conexión WebSocket






















































|Módulo|Método|Endpoint|
|---|---|---|
|`1 Login`|POST|/auth/login|
|`1 Recuperar`<br>`clave`|POST|/auth/password/reset-request|
|`1 verificar`<br>`código`|POST|/auth/password/reset-code|
|`1 Nueva clave`|POST|/auth/password/reset|
|`2 Registro paso`<br>`1`|POST|/auth/register|
|`2 Registro paso`<br>`2 `|POST|/auth/register/complete|
|`3 Listar medios`|GET|/payment-methods|
|`3 + Cuenta`<br>`bancaria`|POST|/payment-methods/bank-account|
|`3 + Tarjeta`|POST|/payment-methods/credit-card|
|`3 + Cheque`|POST|/payment-methods/certified-check|
|`3 Eliminar medio`|DELETE|/payment-methods/{id}|
|`4 Listar`<br>`subastas`|GET|/auctions|
|`4 Detalle`<br>`subasta`|GET|/auctions/{id}|
|`4 Catálogo`|GET|/auctions/{id}/catalog|
|`5 Detalle`<br>`artículo`|GET|/auctions/{auction_id}/catalog/{item_id}|
|`6 Ingresar sala`|POST|/auctions/{id}/join|
|`6 Salir sala`|POST|/auctions/{id}/leave|
|`6 Estado sala`|GET|/auctions/{id}/live|
|`6 Enviar puja`|POST|/auctions/{id}/bids|
|`6 Historial`<br>`pujas`|GET|/auctions/{id}/items/{item_id}/bids|
|`6 WebSocket`|WSS|/auctions/{id}/ws|
|`7 Resultado`<br>`artículo`|GET|/auctions/{id}/items/{item_id}/result|
|`7 Confirmar`<br>`entrega`|POST|/purchases/{id}/delivery|
|`7 Notificaciones`|GET|/notifications|
|`7 Marcar leída`|PATCH|/notifications/{id}/read|
|`7 Marcar todas`<br>`leídas`|POST|/notifications/read-all|
|`7 Multa`|GET|/users/me/penalty|
|`7 Pagar multa`|POST|/users/me/penalty/pay|
|`8 Listar`<br>`artículos`|GET|/my-items|
|`8 Enviar`<br>`solicitud`|POST|/my-items|


|8 Detalle<br>artículo propio|GET|/my-items/{id}|
|---|---|---|
|`8 Decidir`<br>`condiciones`|POST|/my-items/{id}/conditions|
|`9 Custodia y`<br>`póliza`|GET|/my-items/{id}/custody|
|`10 Perfil`|GET|/users/me|
|`10 Cuenta cobros`|PUT|/users/me/payout-account|
|`10 Historial`<br>`subastas`|GET|/users/me/auction-history|
|`10 Estadísticas`|GET|/users/me/stats|
|`10 Pujas de`<br>`subasta`|GET|/users/me/auction-history/{id}/bids|


