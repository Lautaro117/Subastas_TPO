# Plan de tareas — TPO Subastas DAI 1C2026
## Segunda entrega

---

## Estado actual (ya hecho)

- ✅ Base de datos migrada a PostgreSQL y subida a Supabase
- ✅ Proyecto Spring Boot 4.0.6 configurado y conectado a Supabase
- ✅ Modelos Java: Persona, Cliente, UsuarioAuth, Subasta, Catalogo, ItemCatalogo, Asistente, Pujo
- ✅ Repositorios: todos creados
- ✅ Seguridad JWT configurada (JwtUtil + JwtFilter + SecurityConfig)
- ✅ POST /api/auth/login — funcionando con JWT (estado E1–E4 + categoría)
- ✅ GET /api/auctions — funcionando, filtrado por categoría del postor
- ✅ GET /api/auctions/{id} — funcionando
- ✅ GET /api/auctions/{id}/catalog — funcionando, precioBase null para E2
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

### Tareas

**A1 — Login de admin** ⚠️ HACER PRIMERO
- Pantalla de login con email y password
- Llama a POST /api/auth/login
- Guarda el JWT en localStorage
- Redirige al dashboard si el login es exitoso

**A2 — Gestión de usuarios**
- Listar todos los postores registrados
- Ver detalle de cada usuario
- Cambiar estado: E1 → E2 → E3 → E4
- Bloquear/desbloquear cuenta (campo admitido = si/no)
- *Requiere que el integrante de backend termine B7*

**A3 — Gestión de subastas**
- Listar todas las subastas
- Crear nueva subasta (fecha, hora, categoría, ubicación)
- Cambiar estado: abierta / cerrada
- Asignar subastador
- *Requiere que el integrante de backend termine B7*

**A4 — Gestión de catálogo**
- Ver items del catálogo de cada subasta
- Editar precio base y comisión de cada item
- Agregar/quitar productos del catálogo
- *Requiere que el integrante de backend termine B7*

**A5 — Verificación de medios de pago**
- Ver lista de medios pendientes de verificación
- Aprobar o rechazar cuenta bancaria / tarjeta / cheque
- Al aprobar, el usuario pasa automáticamente a E3
- *Requiere que el integrante de backend termine B7*

**A6 — Monitor de sala en vivo** *(opcional para la entrega, suma puntos)*
- Ver pujas en tiempo real de cada subasta activa
- Solo lectura, sin intervenir
- *Requiere que el integrante de backend termine B6 (WebSocket)*

---

## Integrante 2 — Backend (endpoints pendientes)

**Tecnología:** Java + Spring Boot  
**Independiente del frontend**, puede trabajar en paralelo.

**B1 — POST /api/auth/register** ⚠️ HACER PRIMERO (desbloquea F4)
- Recibe: nombre, apellido, email, domicilio, país, fotos DNI frente/dorso, password
- Crea persona + usuario_auth con estado E1
- El usuario queda pendiente de verificación
- Responde con ID de solicitud y estado "pendiente"
- Códigos: 200 ok, 409 email duplicado, 413 imagen muy grande, 422 formato inválido

**B2 — POST /api/auctions/{id}/join**
- Valida que la categoría del postor sea suficiente para la subasta
- Valida que el postor no esté en otra sala al mismo tiempo
- Crea un registro en la tabla asistentes
- Códigos: 200 ok, 403 categoría insuficiente, 409 ya está en otra sala

**B3 — POST /api/auctions/{id}/bids**
- Valida que el importe esté dentro del rango min/max permitido
- Bloquea si ya hay una puja del mismo usuario en proceso
- Guarda en la tabla pujos
- Notifica por WebSocket a todos los asistentes de la sala
- Códigos: 200 ok, 400 fuera de rango, 409 puja en proceso

**B4 — GET /api/auctions/{id}/live**
- Devuelve el estado actual de la sala: artículo actual, mejor oferta, lista de pujas recientes
- Funciona como fallback si no hay WebSocket disponible
- Códigos: 200 ok, 404 subasta no encontrada

**B5 — Medios de pago (3 endpoints)**
- POST /api/payment-methods/bank-account — cuenta bancaria
- POST /api/payment-methods/credit-card — tarjeta de crédito
- POST /api/payment-methods/certified-check — cheque certificado
- Todos quedan en estado "pendiente" hasta que admin los apruebe
- Códigos: 201 creado, 400 campos faltantes, 422 formato inválido

**B6 — WebSocket con STOMP** ⚠️ BLOQUEANTE para sala (desbloquea S1/S2/S3/A6)
- Configurar endpoint /ws para conexión WebSocket
- Canal /topic/auction/{id} → broadcast a todos los asistentes
- Canal /topic/auction/{id}/bid → notificación de nueva puja
- Canal /app/bid → el cliente envía una puja
- Librería: spring-boot-starter-websocket (ya está en el pom.xml)

**B7 — Endpoints de administración** ⚠️ BLOQUEANTE para panel admin (desbloquea A2–A6)
- GET /api/admin/users — listar todos los usuarios
- PUT /api/admin/users/{id}/estado — cambiar estado E1–E4
- PUT /api/admin/users/{id}/admitido — bloquear/desbloquear
- GET /api/admin/payment-methods/pending — listar medios pendientes
- PUT /api/admin/payment-methods/{id}/verify — aprobar medio de pago
- POST /api/admin/auctions — crear subasta
- PUT /api/admin/auctions/{id}/estado — abrir/cerrar subasta
- Estos endpoints deben tener un rol de admin diferente al de postor

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
