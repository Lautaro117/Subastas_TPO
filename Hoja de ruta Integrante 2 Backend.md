# Hoja de ruta — Integrante 2 (Backend)

## Objetivo (2da entrega)
Implementar los endpoints pendientes del **backend** para habilitar el circuito mínimo:
**Login → Ver subastas → Entrar a sala → Enviar puja → Confirmación**, incorporando WebSocket STOMP (bloqueante).

## Contrato funcional (fuentes)
- **Plan grupo**: plan_tareas_grupo.md (B1–B7 y dependencias)
- **API Rest + WebSocket**: Endpoints_API_Subastas_TPO.md (parámetros, payloads y códigos)
- **Dominio**: TPO_DAI_1C2026.md (subastas dinámicas ascendentes, reglas de puja, categorías, medios de pago)
- **Modelo/estructura**: EstructuraActual.md (entidades/relaciones esperadas)

## Estado actual del repo (alineado con plan)
Según el plan de tareas:
- Base de datos PostgreSQL en Supabase migrada
- Spring Boot con JWT y endpoints ya funcionando para login y listado/detalle/catálogo de subastas
- Modelos: Persona, Cliente, UsuarioAuth, Subasta, Catalogo, ItemCatalogo, Asistente, Pujo

> En esta hoja de ruta propongo implementación **escalonada por etapas**, primero una parte funcional bloqueante, validarla con pruebas mínimas, y recién después avanzar al siguiente bloque.

---

## Estrategia de implementación “por etapas”

### Etapa 0 — Preparación y alineación técnica (corto)
**Meta:** que el diseño de seguridad y el mapeo del dominio soporte B1–B7 sin retrabajo.
- Revisar/confirmar:
  - Cómo se extrae el **usuario autenticado** del JWT (id de usuario, categoría/estado, vínculo con Cliente/Persona).
  - Convenciones de rutas actuales del proyecto: prefijo `/api/...` vs paths en documentación.
  - Si existe estructura de roles (admin vs postor) en JWT y en `SecurityConfig`.
- Definir un “criterio de aceptación” por endpoint: payload válido → estado correcto → persistencia + respuesta consistente.

**Entregable de esta etapa:** checklist de compatibilidad con Endpoints_API_Subastas_TPO.md.

---

### Etapa 1 — B1 Registro (⚠️ Bloqueante)
**Meta:** implementar `POST /api/auth/register` (y si aplica `/auth/register/complete` según tu rama/documentación) para crear solicitud y dejar al usuario en estado **E1 / pendiente**.

**Alcance mínimo de código:**
- Endpoint `POST /api/auth/register`:
  - Validaciones:
    - campos obligatorios (incluyendo `dni_frente` y `dni_dorso`)
    - tamaño de imagen (413 si excede)
    - formato válido (422)
    - email/username duplicado (409)
    - password con requisitos (si el proyecto ya lo hace, reutilizar)
  - Persistencia:
    - Crear `Persona`
    - Crear `UsuarioAuth` / `Cliente` (según modelo actual)
    - Guardar imágenes DNI (o link/bytes según cómo esté implementado)
    - Marcar estado pendiente (E1)
  - Respuesta:
    - OK/pendiente (200)
    - códigos 409/413/422.

**Cómo avanzar al siguiente bloque:**
- Prueba manual con datos de ejemplo.
- Validar que el JWT no se emite en B1 (solo al completar/aprobar y luego login).

**Punto de decisión:**
- Si el proyecto ya implementa parte de registro (AuthService/AuthController), adaptar para cumplir exactamente los códigos de respuesta del contrato.

---

### Etapa 2 — B2 Join a sala
**Meta:** `POST /api/auctions/{id}/join`
- Validar:
  - existencia de subasta (404)
  - categoría del postor vs categoría requerida (403)
  - subasta activa / no finalizada (409)
  - que el usuario no esté conectado a otra sala (403 o 409 según contrato)
- Persistir `Asistente` (registro en tabla de asistentes).
- Retornar estado de sala para inicializar UI:
  - artículo actual
  - mejor oferta
  - historial reciente
  - (opcional) websocket_url si tu front lo requiere.

**Con qué se integra:**
- Con los modelos existentes: `Asistente`, `Subasta`, `ItemCatalogo`, `Catalogo`.

---

### Etapa 3 — B5 Medios de pago (3 endpoints)
**Meta:** `POST /api/payment-methods/bank-account`, `/credit-card`, `/certified-check`
- Todos deben dejar **pendiente** hasta aprobación.
- Validaciones:
  - campos faltantes (400)
  - formato inválido (422)
- Responder con 201 y estructura esperada por front.

**Nota:**
- El contrato también incluye `GET /payment-methods` (pero tu B5 listó 3 endpoints). Igual conviene verificar compatibilidad con el endpoint ya existente o pendiente.

---

### Etapa 4 — B3 Enviar puja (y bloqueo de puja en proceso)
**Meta:** `POST /api/auctions/{id}/bids`
- Validaciones de negocio:
  - subasta activa + artículo vigente (422 según contrato)
  - categoría del postor suficiente (403 si aplica)
  - medio de pago verificado (403 si no)
  - rango de monto:
    - `min = ultima_oferta + 1% * precio_base`
    - `max = ultima_oferta + 20% * precio_base`
    - excepción: categorías **oro** y **platino** (sin límites de ese rango)
  - bloqueo: si el usuario ya tiene puja “en proceso”, bloquear (409 según tu plan/contrato)
- Persistencia:
  - Guardar `Pujo` con estado `en_proceso`/`confirmada` según el diseño.
- WebSocket triggers (a coordinar con Etapa 6):
  - notificar a asistentes de la sala con evento `bid.new`.

**Cómo validar:**
- Flujo mínimo con al menos 2 usuarios asistiendo a la sala.

---

### Etapa 5 — B4 GET live (fallback REST)
**Meta:** `GET /api/auctions/{id}/live`
- Recuperar:
  - artículo actual
  - mejor oferta
  - historial reciente de pujas
- Códigos:
  - 200 ok
  - 403 si el usuario no está conectado (según contrato)
  - 404 si no existe subasta.

---

### Etapa 6 — B6 WebSocket con STOMP (⚠️ Bloqueante)
**Meta:** implementar el canal para tiempo real que desbloquea S1/S2/S3/A6.

**Requerimientos del contrato:**
- Endpoint WebSocket: `/ws`
- Canales:
  - `/topic/auction/{id}` → broadcast a asistentes
  - `/topic/auction/{id}/bid` → notificación de nueva puja
  - (si tu arquitectura lo usa) `/app/bid` → mensajes entrantes desde cliente
- Eventos esperados:
  - `bid.new`
  - `bid.confirmed`
  - `item.next`
  - `item.sold`
  - `auction.closed`

**Integración con REST (Etapas 2/4):**
- `join` establece el contexto de sala y/o grupo.
- `bids` produce `bid.new`.
- Cuando el sistema “confirma” la puja (por lógica interna), emitir `bid.confirmed`.

**Validación mínima:**
- Abrir un cliente/staging para verificar que al enviar puja se recibe el evento `bid.new` y luego `bid.confirmed`.

---

### Etapa 7 — B7 Admin API (⚠️ Bloqueante para panel)
**Meta:** endpoints admin con rol distinto al postor.

**Alcance (según plan):**
- Usuarios:
  - `GET /api/admin/users`
  - `PUT /api/admin/users/{id}/estado` (E1→E4)
  - `PUT /api/admin/users/{id}/admitido` (bloquear/desbloquear)
- Medios pendientes:
  - `GET /api/admin/payment-methods/pending`
  - `PUT /api/admin/payment-methods/{id}/verify`
- Subastas:
  - `POST /api/admin/auctions`
  - `PUT /api/admin/auctions/{id}/estado`
  - Asignar subastador / ajustar catálogo si aplica

**Control de autorización:**
- Agregar/validar un claim/rol en JWT (admin).
- Probar que un postor no puede llamar endpoints admin (403).

---

## Plan de trabajo semanal / commits sugeridos
- Commit 1: Etapa 0 (alineación de rutas, seguridad, utilidad para obtener usuario)
- Commit 2: Etapa 1 (B1 registro con validaciones + persistencia)
- Commit 3: Etapa 2 (B2 join)
- Commit 4: Etapa 3 (B5 medios de pago)
- Commit 5: Etapa 4 (B3 bids)
- Commit 6: Etapa 5 (B4 live)
- Commit 7: Etapa 6 (WebSocket STOMP + integración eventos)
- Commit 8: Etapa 7 (Admin API + roles)

---

## Qué voy a necesitar revisar en el código existente antes de escribir B1
1. `AuthController` / `AuthService`:
   - si ya hay endpoints de register o solo login.
2. `SecurityConfig` + `JwtFilter`:
   - extracción de usuario y roles.
3. Modelos + Repositorios:
   - `Cliente`, `UsuarioAuth`, `Asistente`, `Pujo`, `Subasta`, `ItemCatalogo`.
4. Conversión de estados E1–E4 (enum/strings) y cómo se refleja en queries.

---

## Criterio final de “hecho” para 2da entrega
- Existe al menos un circuito completo:
  1) Login con token
  2) Ver subastas
  3) Join sala
  4) Enviar puja
  5) Confirmación (vía WebSocket o fallback live + confirmación REST interna)
- B6 (WebSocket) funciona con eventos mínimos (`bid.new` y `bid.confirmed`).
- B7 (admin) permite aprobar medios/usuarios y habilitar puja (solo si ya lo pidió el circuito del front).

---

## Nota sobre el enfoque escalonado
Voy a implementar primero el bloque que desbloquea a otros (B1 → B2/B5 → B3 → B4 → B6 → B7). Si durante Etapa 2/4 aparece una incompatibilidad con el contrato, ajustaré la implementación de etapas anteriores, pero conservando las mismas rutas y códigos HTTP exigidos por Endpoints_API_Subastas_TPO.md.
