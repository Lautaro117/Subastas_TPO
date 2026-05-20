# Plan de tareas — TPO Subastas DAI 1C2026
## Segunda entrega

---

## Estado actual (ya hecho)

- ✅ Base de datos migrada a PostgreSQL y subida a Supabase
- ✅ Proyecto Spring Boot configurado y conectado a Supabase
- ✅ Modelos Java: Persona, Cliente, UsuarioAuth, Subasta, Catalogo, ItemCatalogo, Asistente, Pujo, Notificacion
- ✅ Repositorios: todos creados
- ✅ Seguridad JWT configurada (JwtUtil + JwtFilter + SecurityConfig)
- ✅ POST /api/auth/login — probado y funcionando
- ✅ POST /api/auth/register — probado: 201, 409, 422
- ✅ POST /api/auth/register-complete — probado: 201, 401, 422
- ✅ GET /api/auctions — probado
- ✅ GET /api/auctions/{id} — probado
- ✅ GET /api/auctions/{id}/catalog — probado
- ✅ POST /api/auctions/{id}/join — probado
- ✅ POST /api/auctions/{id}/leave — probado
- ✅ POST /api/auctions/{id}/bids — probado
- ✅ GET /api/auctions/{id}/live — probado
- ✅ WebSocket STOMP en /ws — creado (sin probar end-to-end)
- ✅ Proyecto subido a GitHub

---

## Circuito mínimo para aprobar la entrega

**Login → Ver subastas → Entrar a sala → Enviar puja → Confirmación**

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 21 + Spring Boot 4.0.6 + Maven |
| Frontend mobile | React Native (JavaScript, sin TypeScript) |
| Panel admin | Web (React / Vue / HTML puro) |
| Base de datos | PostgreSQL en Supabase |
| Tiempo real | WebSocket con STOMP |

---

## Integrante 1 — Panel de administración web

**Tecnología:** React / Vue / HTML — consume la misma API del backend  
**Puede arrancar hoy** con los endpoints ya existentes.


## Integrante 2 — Backend (endpoints pendientes)

---

**Tecnología:** Java + Spring Boot  
**Independiente del frontend**, puede trabajar en paralelo.

**B1 — POST /api/auth/register** ✅ CREADO Y PROBADO (desbloquea F4)
- Recibe: nombre, apellido, email, domicilio, país, fotos DNI frente/dorso (multipart/form-data)
- Crea persona + cliente + usuario_auth (estado E1, token_registro UUID) + fotos_dni
- Responde 201 con `{ solicitudId, estado: "pendiente" }`
- Códigos verificados: 201 ok, 409 email duplicado, 422 error de procesamiento
- Bugs corregidos en esta sesión:
  - `Persona.java` tenía `foto_frente`/`foto_dorso` mapeados a columnas inexistentes en la DB → eliminados
  - `AuthService`: `cliente.setIdentificador()` conflictuaba con `@MapsId` → eliminado
  - `password_hash` tiene NOT NULL en la DB; se setea placeholder `"PENDIENTE"` en E1

**B1b — POST /api/auth/register-complete** ✅ CREADO Y PROBADO
- Recibe: `{ token, password }`
- Valida token contra `token_registro` en DB
- Actualiza `password_hash` (BCrypt), `estado → E2`, `token_registro → null`
- Códigos verificados: 201 ok, 401 token inválido, 422 password no cumple requisitos

**B2 — POST /api/auctions/{id}/join** ✅ CREADO Y PROBADO
- Valida que la categoría del postor sea suficiente para la subasta
- Valida que el postor no esté en otra sala al mismo tiempo
- Crea un registro en la tabla asistentes
- Códigos: 200 ok, 403 categoría insuficiente, 409 ya está en otra sala

**B2b — POST /api/auctions/{id}/leave** ✅ CREADO Y PROBADO *(extra, no estaba en el plan original)*
- Desconecta al usuario de la sala
- Necesario para poder ingresar a otra subasta

**B3 — POST /api/auctions/{id}/bids** ✅ CREADO Y PROBADO
- Valida que el importe esté dentro del rango min/max permitido
- Bloquea si ya hay una puja del mismo usuario en proceso
- Guarda en la tabla pujos
- Notifica por WebSocket a todos los asistentes de la sala
- Códigos: 201 creado, 400 fuera de rango, 409 puja en proceso

**B4 — GET /api/auctions/{id}/live** ✅ CREADO Y PROBADO
- Devuelve el estado actual de la sala: artículo actual, mejor oferta, lista de pujas recientes
- Funciona como fallback si no hay WebSocket disponible
- Códigos: 200 ok, 404 subasta no encontrada

**B5 — Medios de pago** ✅ CREADOS Y PROBADOS
- ✅ GET /api/payment-methods — listar medios del usuario autenticado
- ✅ POST /api/payment-methods/bank-account — cuenta bancaria
- ✅ POST /api/payment-methods/credit-card — tarjeta de crédito
- ✅ POST /api/payment-methods/certified-check — cheque certificado
- ✅ DELETE /api/payment-methods/{id} — eliminar medio (valida ownership)
- Todos quedan en estado "pendiente" hasta que admin los apruebe
- Códigos: 201 creado, 400 campos faltantes, 422 formato inválido

**B6 — WebSocket con STOMP** ✅ CREADO (desbloquea S1/S2/S3/A6)
- ✅ Endpoint /ws configurado (con y sin SockJS)
- ✅ Canal /topic/auction/{id} → broadcast a todos los asistentes
- ✅ Prefijo /app configurado para mensajes entrantes
- ✅ Eventos implementados: bid.new, bid.confirmed, item.next
- Librería: spring-boot-starter-websocket (ya está en el pom.xml)

**B8 — Endpoints adicionales del spec**

**Módulo 5 — Detalle de artículo** ✅ PROBADO
- GET /api/auctions/{auction_id}/catalog/{item_id}

**Módulo 6 — Historial de pujas de ítem** ✅ PROBADO
- GET /api/auctions/{id}/items/{item_id}/bids

**Módulo 7 — Notificaciones** ✅ PROBADAS
- GET /api/notifications — 200, devuelve array con tipo/mensaje/leida
- PATCH /api/notifications/{id}/read — 200, actualiza leida → true
- POST /api/notifications/read-all — 200, devuelve cantidad marcada

**Módulo 1 — Recuperar contraseña** ❌ SIN CREAR
- POST /api/auth/password/reset-request
- POST /api/auth/password/reset-code
- POST /api/auth/password/reset

**Módulo 7 — Resultado y pago**
- ✅ GET /api/auctions/{id}/items/{item_id}/result — CREADO Y PROBADO
- ❌ POST /api/purchases/{id}/delivery — SIN CREAR
- ❌ GET /api/users/me/penalty — SIN CREAR
- ❌ POST /api/users/me/penalty/pay — SIN CREAR

**Módulo 8 — Ofrecer mis artículos** ❌ SIN CREAR
- GET /api/my-items
- POST /api/my-items
- GET /api/my-items/{id}
- POST /api/my-items/{id}/conditions

**Módulo 9 — Custodia** ❌ SIN CREAR
- GET /api/my-items/{id}/custody

**Módulo 10 — Perfil y estadísticas** ❌ SIN CREAR
- GET /api/users/me
- PUT /api/users/me/payout-account
- GET /api/users/me/auction-history
- GET /api/users/me/stats
- GET /api/users/me/auction-history/{id}/bids

---

## Integrante 3 — Frontend móvil (navegación y auth)

**Tecnología:** React Native, JavaScript puro (sin TypeScript)  
**Puede arrancar en paralelo** usando mocks mientras el backend termina.

**F1 — Splash + navegación inicial** ⚠️ HACER PRIMERO (desbloquea todo el front)
- Crear proyecto React Native
- Instalar React Navigation
- Stack navigator con todas las pantallas
- Al iniciar: verificar si hay token en AsyncStorage
- Si hay token válido → ir a Home, si no → ir a Login

**F2 — Pantalla de login**
- Formulario con email y password
- Llama a POST /api/auth/login
- Guarda el JWT en AsyncStorage
- Manejo de errores:
  - 401 → "Credenciales incorrectas"
  - 403 → "Cuenta bloqueada. Contacte al administrador"

**F3 — Guard de navegación E1–E4**
- Lee el estado del token al navegar
- E1: solo puede ver lista de subastas, sin entrar a sala
- E2: puede ver catálogo pero sin precio base
- E3: puede entrar a sala en modo observador
- E4: puede pujar

**F4 — Pantalla de registro paso 1**
- Formulario: nombre, apellido, email, domicilio, país, password, confirmar password
- Captura de fotos del DNI (frente y dorso) con la cámara
- Validación en tiempo real:
  - Campos vacíos → borde rojo
  - Password: mínimo 8 caracteres, 1 mayúscula, 1 número
  - Confirmar password debe coincidir
- *Requiere que el integrante de backend termine B1*

**F5 — Listado de subastas**
- FlatList que consume GET /api/auctions con el token
- Cada item muestra: fecha, hora, categoría, ubicación, estado
- Badge "Sin acceso" si la categoría de la subasta supera la del usuario
- Pull to refresh

**F6 — Pantalla de catálogo**
- Consume GET /api/auctions/{id}/catalog con el token
- Si el usuario es E2: muestra "—" en lugar del precio base
- Si el usuario es E3/E4: muestra el precio base real

---

## Integrante 4 — Frontend móvil (sala de subasta)

**Tecnología:** React Native, JavaScript puro (sin TypeScript)  
**Puede mockear el WebSocket** hasta que el integrante de backend termine B6.

**S1 — Sala de subasta** *(requiere B6 — WebSocket)*
- Conectar al WebSocket con la librería @stomp/stompjs
- Mostrar en tiempo real: artículo actual, mejor oferta, historial de pujas
- Campo para ingresar el monto de la puja
- Botón para enviar la puja

**S2 — Modo observador**
- Si el usuario es E3 o no tiene medio de pago verificado:
  - Ve la sala normalmente (artículo, mejor oferta, historial)
  - El campo de puja y el botón están ocultos o deshabilitados
  - Muestra el mensaje "Modo observador — verificá tu medio de pago para pujar"

**S3 — Bloqueo de botón de puja**
- Al enviar una puja: deshabilitar el botón inmediatamente
- Mostrar indicador de carga
- Recibir confirmación del backend vía WebSocket
- Al confirmar: rehabilitar el botón
- Si hay error: mostrar mensaje y rehabilitar el botón

**S4 — Error de puja fuera de rango**
- Si el backend responde 400:
  - Mostrar alerta con el monto mínimo y máximo permitido
  - El botón se rehabilita para que el usuario corrija el monto

**S5 — Banner sin internet**
- Detectar pérdida de conexión con NetInfo
- Mostrar banner persistente en la parte superior: "Sin conexión — reconectando..."
- Deshabilitar el botón de puja mientras no hay internet
- Al recuperar conexión: ocultar el banner y rehabilitar el botón

**S6 — Tabla de campos para el informe** *(coordinar con todo el grupo)*
- Armar la tabla de campos obligatorios vs opcionales por cada pantalla
- Va en el documento de entrega, no en el código
- Incluir: Login, Registro, Sala, Puja

---

## Dependencias entre tareas (orden crítico)

```
B6 (WebSocket)     → desbloquea S1, S2, S3, A6
B7 (admin API)     → desbloquea A2, A3, A4, A5
B1 (register)      → desbloquea F4
F1 (navegación)    → desbloquea F2, F3, F4, F5, F6, S1–S6
A1 (login admin)   → desbloquea A2, A3, A4, A5, A6
```

## Tareas que pueden hacerse HOY en paralelo sin depender de nadie

| Integrante | Tarea | 
|---|---|
| 1 (admin web) | A1 — login del panel (ya tiene el endpoint) |
| 2 (backend) | B1 — registro, B2 — join, B3 — bids, B4 — live, B5 — medios de pago |
| 3 (front base) | F1 — navegación, F2 — login, F3 — guard (puede mockear el token) |
| 4 (front sala) | S2 — modo observador, S4 — error rango, S5 — sin internet, S6 — informe |

---

## Datos de prueba en Supabase (para desarrollo)

- **Email:** juan@prueba.com  
- **Password:** 123456  
- **Estado:** E4  
- **Categoría:** oro  
- **Subastas de prueba:** IDs 1 (oro), 2 (comun), 3 (platino)  
- **Catálogo:** subasta 1 tiene item con precio_base = 50000

---

## Conexión al backend durante desarrollo

Cada integrante corre el backend local con:
```
./mvnw spring-boot:run
```

URL base local: `http://localhost:8080`

Para que el front mobile pueda conectarse al backend local desde el celular físico, reemplazar `localhost` por la IP local de la máquina donde corre el backend (ej: `http://192.168.1.100:8080`).
