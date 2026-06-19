package com.example.subastas.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.BidRequest;
import com.example.subastas.dto.CatalogoDTO;
import com.example.subastas.dto.ProductoDetalleDTO;
import com.example.subastas.dto.ResultadoItemDTO;
import com.example.subastas.dto.SalaResponse;
import java.time.LocalDateTime;
import com.example.subastas.model.Adjudicaciones;
import com.example.subastas.model.Asistente;
import com.example.subastas.model.Catalogo;
import com.example.subastas.model.FotoProducto;
import com.example.subastas.model.ItemCatalogo;
import com.example.subastas.model.MedioPago;
import com.example.subastas.model.Producto;
import com.example.subastas.model.Pujo;
import com.example.subastas.model.PujoExt;
import com.example.subastas.model.Subasta;
import com.example.subastas.repository.AdjudicacionesRepository;
import com.example.subastas.repository.AsistenteRepository;
import com.example.subastas.repository.CatalogoRepository;
import com.example.subastas.repository.FotoProductoRepository;
import com.example.subastas.repository.ItemCatalogoRepository;
import com.example.subastas.repository.MedioPagoRepository;
import com.example.subastas.repository.ProductoRepository;
import com.example.subastas.repository.PujoExtRepository;
import com.example.subastas.repository.PujoRepository;
import com.example.subastas.repository.SubastaRepository;
import com.example.subastas.repository.UsuarioAuthRepository;

import jakarta.transaction.Transactional;

@Service
public class SubastaService {

    @Autowired private AuctionNotificationService auctionNotificationService;
    @Autowired private SesionSubastaService sesionSubastaService;
    @Autowired private ItemTimerService itemTimerService;
    @Autowired private NotificacionService notificacionService;
    // Auto-inyección lazy para poder llamar métodos @Transactional desde callbacks de timer
    @Lazy @Autowired private SubastaService self;
    @Autowired private SubastaRepository subastaRepository;
    @Autowired private CatalogoRepository catalogoRepository;
    @Autowired private ItemCatalogoRepository itemCatalogoRepository;
    @Autowired private AsistenteRepository asistenteRepository;
    @Autowired private UsuarioAuthRepository usuarioAuthRepository;
    @Autowired private PujoRepository pujoRepository;
    @Autowired private PujoExtRepository pujoExtRepository;
    @Autowired private MedioPagoRepository medioPagoRepository;
    @Autowired private AdjudicacionesRepository adjudicacionesRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private FotoProductoRepository fotoProductoRepository;

    private static final List<String> ORDEN_CATEGORIAS = Arrays.asList(
            "comun", "especial", "plata", "oro", "platino");

    private static final String MONEDA = "ARS";
    /**
     * Zona horaria fija para timestamps que se muestran al usuario (ej: createdAt de
     * Adjudicaciones). Antes se usaba LocalDateTime.now() "a secas", que toma la zona
     * default del JVM del servidor — si ese default no es Argentina (p.ej. un host en
     * UTC), el horario que ve el usuario queda corrido. Fijarlo explícitamente evita
     * que dependa de cómo esté configurado el servidor.
     */
    private static final ZoneId ZONA_AR = ZoneId.of("America/Argentina/Buenos_Aires");

    // ── Listado ────────────────────────────────────────────────────────────────

    // readOnly=true: Hibernate no hace flush al cerrar la sesión,
    // así el setEstado() en memoria no intenta escribir en la DB.
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Subasta> listarTodas() {
        List<Subasta> todas = subastaRepository.findAll();

        // subastas.estado no se actualiza en la DB (fecha_check constraint).
        // Parcheamos el campo en memoria: las subastas en subastas_cierre
        // se devuelven con estado='cerrada' para que el frontend las filtre correctamente.
        // Usamos Number → intValue() para no depender del tipo exacto que devuelva el driver JDBC.
        Set<Integer> cerradas = subastaRepository.findAllCerradasIds()
                .stream()
                .map(obj -> ((Number) obj).intValue())
                .collect(java.util.stream.Collectors.toSet());

        if (!cerradas.isEmpty()) {
            todas.forEach(s -> {
                if (cerradas.contains(s.getIdentificador())) {
                    s.setEstado("cerrada");   // solo en memoria, no se persiste
                }
            });
        }
        return todas;
    }

    /** Verifica si una subasta fue cerrada según subastas_cierre (fuente de verdad). */
    private boolean esCerrada(Integer subastaId) {
        return subastaRepository.existeEnCierre(subastaId);
    }

    public Subasta buscarPorId(Integer id) {
        return subastaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subasta no encontrada"));
    }

    // ── Catálogo ───────────────────────────────────────────────────────────────

    public List<CatalogoDTO> obtenerCatalogo(Integer subastaId, String estado) {
        Catalogo catalogo = catalogoRepository.findBySubastaId(subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catálogo no encontrado"));

        return itemCatalogoRepository.findByCatalogoId(catalogo.getIdentificador()).stream().map(item -> {
            String descripcion = productoRepository.findById(item.getProductoId())
                    .map(Producto::getDescripcionCatalogo).orElse(null);
            String foto = fotoProductoRepository.findByProducto(item.getProductoId())
                    .stream().findFirst()
                    .map(f -> Base64.getEncoder().encodeToString(f.getFoto()))
                    .orElse(null);
            return new CatalogoDTO(
                    item.getIdentificador(), item.getProductoId(),
                    "E2".equals(estado) ? null : item.getPrecioBase(),
                    item.getComision(), item.getSubastado(), item.getEnVivo(),
                    descripcion, foto, esSinPostor(item));
        }).toList();
    }

    public CatalogoDTO obtenerItem(Integer subastaId, Integer itemId, String estado) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item no encontrado"));
        return new CatalogoDTO(item.getIdentificador(), item.getProductoId(),
                "E2".equals(estado) ? null : item.getPrecioBase(),
                item.getComision(), item.getSubastado(), item.getEnVivo(), null, null, esSinPostor(item));
    }

    /**
     * true si el ítem está cerrado (subastado='si') pero no tiene ninguna Adjudicaciones real:
     * nadie pujó y venció el timer, la empresa lo "compró" simulando la subasta.
     * No usamos un tercer valor de `subastado` porque la columna tiene un CHECK constraint
     * que solo permite 'si'/'no' (ver EstructuraActual.md) — 'no' ya significa "pendiente".
     */
    private boolean esSinPostor(ItemCatalogo item) {
        return "si".equalsIgnoreCase(item.getSubastado())
                && adjudicacionesRepository.findByItemId(item.getIdentificador()).isEmpty();
    }

    public ProductoDetalleDTO obtenerDetalleProducto(Integer subastaId, Integer itemId, String estado) {
        catalogoRepository.findBySubastaId(subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catálogo no encontrado"));
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item no encontrado"));
        Producto producto = productoRepository.findById(item.getProductoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        List<String> fotosBase64 = fotoProductoRepository.findByProducto(producto.getIdentificador())
                .stream().map(f -> Base64.getEncoder().encodeToString(f.getFoto())).toList();

        ProductoDetalleDTO dto = new ProductoDetalleDTO();
        dto.setItemId(item.getIdentificador());
        dto.setProductoId(item.getProductoId());
        dto.setPrecioBase("E2".equals(estado) ? null : item.getPrecioBase());
        dto.setComision(item.getComision());
        dto.setSubastado(item.getSubastado());
        dto.setDescripcionCatalogo(producto.getDescripcionCatalogo());
        dto.setDescripcionCompleta(producto.getDescripcionCompleta());
        dto.setFecha(producto.getFecha());
        dto.setDisponible(producto.getDisponible());
        dto.setFotos(fotosBase64);
        return dto;
    }

    // ── Join / Leave ───────────────────────────────────────────────────────────

    @Transactional
    public SalaResponse unirseASala(Integer subastaId, String email, String categoriaUsuario) {
        Subasta subasta = buscarPorId(subastaId);
        if (!"abierta".equalsIgnoreCase(subasta.getEstado()) || esCerrada(subastaId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La subasta no está activa o ya finalizó");
        }
        int nivelUsuario = ORDEN_CATEGORIAS.indexOf(categoriaUsuario);
        int nivelSubasta = ORDEN_CATEGORIAS.indexOf(subasta.getCategoria());
        if (nivelUsuario < 0 || nivelUsuario < nivelSubasta) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tu categoría no permite participar en esta subasta");
        }
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Integer clienteId = usuario.getClienteId();

        // Ya está activo en esta subasta (sesión en memoria) → devolver estado actual
        if (sesionSubastaService.estaEnSala(clienteId, subastaId)) {
            return construirSalaResponse(subastaId);
        }

        // Verificar si está activo en OTRA subasta abierta (sesión en memoria)
        Optional<Integer> otraActiva = sesionSubastaService.getSalaActiva(clienteId);
        if (otraActiva.isPresent() && !otraActiva.get().equals(subastaId)) {
            Subasta otraSubasta = subastaRepository.findById(otraActiva.get()).orElse(null);
            boolean otraAbierta = otraSubasta != null
                    && "abierta".equalsIgnoreCase(otraSubasta.getEstado())
                    && !esCerrada(otraActiva.get());
            if (otraAbierta) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ya estás conectado a otra subasta activa");
            }
            // La otra subasta ya cerró → limpiar sesión fantasma y continuar
            sesionSubastaService.registrarSalida(clienteId);
        }

        // Reutilizar el Asistente histórico si ya existe (puede haber quedado en DB por FK con pujas),
        // o crear uno nuevo si es la primera vez que el usuario entra a esta subasta.
        Asistente asistente = asistenteRepository.findByClienteIdAndSubastaId(clienteId, subastaId)
                .orElseGet(() -> {
                    Asistente nuevo = new Asistente();
                    nuevo.setClienteId(clienteId);
                    nuevo.setSubastaId(subastaId);
                    nuevo.setNumeroPostor((int) (Math.random() * 9000) + 1000);
                    return asistenteRepository.save(nuevo);
                });

        sesionSubastaService.registrarEntrada(clienteId, subastaId);
        SalaResponse sala = construirSalaResponse(subastaId);
        // Informar al usuario su número de postor (solo en la respuesta del JOIN,
        // no en los broadcasts generales) para que pueda detectar si ganó un ítem.
        sala.setMiNumeroPostor(asistente.getNumeroPostor());
        return sala;
    }

    @Transactional
    public void salirDeSala(Integer subastaId, String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Integer clienteId = usuario.getClienteId();

        // Quitar de la sesión en memoria (fuente de verdad para "está en sala")
        sesionSubastaService.registrarSalida(clienteId);

        // Intentar borrar el Asistente de la DB solo si no tiene pujas.
        // Si tiene pujas el registro queda como historial — está bien, ya no bloquea al usuario
        // porque la presencia se maneja en memoria.
        asistenteRepository.findByClienteIdAndSubastaId(clienteId, subastaId).ifPresent(asistente -> {
            boolean tienePujas = !pujoRepository.findByAsistenteId(asistente.getIdentificador()).isEmpty();
            if (!tienePujas) asistenteRepository.delete(asistente);
        });
    }

    public SalaResponse obtenerEstadoVivo(Integer subastaId, String email) {
        buscarPorId(subastaId);
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        // Verificar presencia activa en memoria (no en la tabla, que puede tener registros históricos)
        if (!sesionSubastaService.estaEnSala(usuario.getClienteId(), subastaId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No estás conectado a esta subasta");
        }
        return construirSalaResponse(subastaId);
    }

    // ── Pujas ──────────────────────────────────────────────────────────────────

    @Transactional
    public Pujo enviarPuja(Integer subastaId, String email, BidRequest request) {
        Subasta subasta = buscarPorId(subastaId);
        if (!"abierta".equalsIgnoreCase(subasta.getEstado()) || esCerrada(subastaId)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "La subasta no está activa");
        }

        ItemCatalogo item = itemCatalogoRepository.findById(request.getItem_id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Artículo no encontrado"));
        if ("si".equalsIgnoreCase(item.getSubastado())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "El artículo ya fue adjudicado");
        }

        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Asistente asistente = asistenteRepository.findByClienteIdAndSubastaId(usuario.getClienteId(), subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No estás unido a esta sala"));

        // Medio de pago: opcional para el demo
        Integer medioPagoId = null;
        if (request.getPayment_method_id() != null) {
            MedioPago medio = medioPagoRepository.findById(request.getPayment_method_id())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Medio de pago no encontrado"));
            if (!medio.getClienteId().equals(usuario.getClienteId()) || !Boolean.TRUE.equals(medio.getVerificado())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El medio de pago no está verificado");
            }
            medioPagoId = medio.getId();
        }

        // Validar min/max
        BigDecimal base = item.getPrecioBase();
        if (base != null) {
            Optional<Pujo> mejorActual = pujoRepository.findTopByItemIdOrderByImporteDesc(item.getIdentificador());
            BigDecimal ultima = mejorActual.map(Pujo::getImporte).orElse(base);
            BigDecimal incremento1pct  = base.multiply(new BigDecimal("0.01"));
            BigDecimal incremento20pct = base.multiply(new BigDecimal("0.20"));
            BigDecimal minPuja = ultima.add(incremento1pct);
            BigDecimal maxPuja = ultima.add(incremento20pct);

            // Si no hay pujas previas, mínimo es el precio base
            if (mejorActual.isEmpty()) {
                minPuja = base;
                maxPuja = base.add(incremento20pct);
            }

            if (request.getMonto().compareTo(minPuja) < 0) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "La puja mínima es " + minPuja.toPlainString());
            }
            if (request.getMonto().compareTo(maxPuja) > 0) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "La puja máxima es " + maxPuja.toPlainString());
            }
        }

        Pujo pujo = new Pujo();
        pujo.setAsistenteId(asistente.getIdentificador());
        pujo.setItemId(item.getIdentificador());
        pujo.setImporte(request.getMonto());
        pujo.setCreatedAt(Instant.now());
        Pujo savedPujo = pujoRepository.save(pujo);

        PujoExt pujoExt = new PujoExt();
        pujoExt.setPujoId(savedPujo.getIdentificador());
        pujoExt.setMoneda(request.getMoneda() != null ? request.getMoneda() : MONEDA);
        pujoExt.setEstado("confirmada");
        pujoExt.setMedioPagoId(medioPagoId);
        pujoExtRepository.save(pujoExt);

        // Puja recibida → resetear cuenta regresiva a 1 minuto
        // (se hace ANTES de construirSalaResponse para que el deadline quede en el broadcast)
        final Integer itemIdFinal = item.getIdentificador();
        itemTimerService.iniciarTimer(subastaId, 60,
                () -> self.onTimerExpired(subastaId, itemIdFinal));

        // Construir sala actualizada y notificar a todos los dispositivos con el estado completo
        SalaResponse salaActualizada = construirSalaResponse(subastaId);
        auctionNotificationService.notificarNuevaPuja(subastaId, salaActualizada);

        return savedPujo;
    }

    public List<Pujo> obtenerPujaPorItem(Integer subastaId, Integer itemId) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item no encontrado"));
        return pujoRepository.findByItemId(item.getIdentificador());
    }

    // ── Adjudicación ───────────────────────────────────────────────────────────

    @Transactional
    public SalaResponse adjudicarItem(Integer subastaId, Integer itemId) {
        // El admin adjudicó manualmente → cancelar timer automático y cooldown activos
        itemTimerService.cancelarTimer(subastaId);
        itemTimerService.cancelarCooldown(subastaId);

        Subasta subasta = buscarPorId(subastaId);
        if (!"abierta".equalsIgnoreCase(subasta.getEstado()) || esCerrada(subastaId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La subasta no está activa");
        }

        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item no encontrado"));
        if ("si".equalsIgnoreCase(item.getSubastado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El ítem ya fue adjudicado");
        }

        // Marcar puja ganadora y crear adjudicación
        final ItemCatalogo itemFinal = item;
        pujoRepository.findTopByItemIdOrderByImporteDesc(itemId).ifPresent(p -> {
            p.setGanador("si");
            pujoRepository.save(p);

            Adjudicaciones adj = new Adjudicaciones();
            adj.setItemId(itemId);
            adj.setAsistenteId(p.getAsistenteId());
            adj.setImporte(p.getImporte());
            adj.setComision(itemFinal.getComision() != null ? itemFinal.getComision() : BigDecimal.ZERO);
            adj.setCostoEnvio(BigDecimal.ZERO);
            adj.setCreatedAt(LocalDateTime.now(ZONA_AR));
            adjudicacionesRepository.save(adj);

            // Notificar al ganador en su bandeja de notificaciones
            asistenteRepository.findById(p.getAsistenteId()).ifPresent(a -> {
                String desc = productoRepository.findById(itemFinal.getProductoId())
                        .map(Producto::getDescripcionCatalogo).orElse("el producto");
                notificacionService.crearNotificacion(
                        a.getClienteId(),
                        "ganador_item",
                        "🏆 ¡Ganaste la subasta de \"" + desc + "\" por $"
                                + p.getImporte().toPlainString() + "!"
                );
            });
        });

        // Marcar ítem como vendido y quitar en_vivo
        item.setSubastado("si");
        item.setEnVivo("no");
        itemCatalogoRepository.save(item);

        // Determinar si hay más ítems
        Catalogo catalogo = catalogoRepository.findBySubastaId(subastaId).orElse(null);
        boolean hayMas = false;
        if (catalogo != null) {
            List<ItemCatalogo> todos = itemCatalogoRepository.findByCatalogoId(catalogo.getIdentificador());
            hayMas = todos.stream().anyMatch(i ->
                    !"si".equalsIgnoreCase(i.getSubastado()) && !i.getIdentificador().equals(itemId));
        }

        if (hayMas) {
            SalaResponse nextState = construirSalaResponse(subastaId);
            auctionNotificationService.notificarSiguienteItem(subastaId, nextState);
            return nextState;
        } else {
            subastaRepository.cerrarSubasta(subastaId);
            auctionNotificationService.notificarCierre(subastaId);
            return construirSalaResponse(subastaId);
        }
    }

    // ── Resultado ──────────────────────────────────────────────────────────────

    public ResultadoItemDTO obtenerResultadoItem(Integer subastaId, Integer itemId, String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Asistente asistente = asistenteRepository.findByClienteIdAndSubastaId(usuario.getClienteId(), subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No participaste en esta subasta"));

        ResultadoItemDTO resultado = new ResultadoItemDTO();
        Optional<Pujo> ganadora = pujoRepository.findByAsistenteIdAndItemIdAndGanador(
                asistente.getIdentificador(), itemId, "si");

        if (ganadora.isPresent()) {
            resultado.setGano(true);
            resultado.setMontoPujado(ganadora.get().getImporte());
        } else {
            resultado.setGano(false);
            pujoRepository.findTopByAsistenteIdAndItemIdOrderByImporteDesc(
                    asistente.getIdentificador(), itemId)
                    .ifPresent(p -> resultado.setMontoPujado(p.getImporte()));
        }
        return resultado;
    }

    @Transactional
    public SalaResponse activarItem(Integer subastaId, Integer itemId) {
        buscarPorId(subastaId);
        // Cancelar cooldown activo: el admin activa manualmente, tiene prioridad
        itemTimerService.cancelarCooldown(subastaId);
        Catalogo catalogo = catalogoRepository.findBySubastaId(subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catálogo no encontrado"));

        // Quitar en_vivo de todos los ítems del catálogo
        List<ItemCatalogo> todos = itemCatalogoRepository.findByCatalogoId(catalogo.getIdentificador());
        todos.forEach(i -> { i.setEnVivo("no"); itemCatalogoRepository.save(i); });

        // Activar el ítem elegido
        ItemCatalogo target = todos.stream()
                .filter(i -> i.getIdentificador().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ítem no encontrado en este catálogo"));
        if ("si".equalsIgnoreCase(target.getSubastado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El ítem ya fue adjudicado");
        }
        target.setEnVivo("si");
        itemCatalogoRepository.save(target);

        // Arrancar cuenta regresiva de 5 minutos para este ítem
        final Integer activatedItemId = target.getIdentificador();
        itemTimerService.iniciarTimer(subastaId, 300,
                () -> self.onTimerExpired(subastaId, activatedItemId));

        SalaResponse estado = construirSalaResponse(subastaId);
        auctionNotificationService.notificarSiguienteItem(subastaId, estado);
        return estado;
    }

    public SalaResponse obtenerEstadoAdmin(Integer subastaId) {
        buscarPorId(subastaId);
        return construirSalaResponse(subastaId);
    }

    public void notificarCierre(Integer subastaId) {
        auctionNotificationService.notificarCierre(subastaId);
    }

    @Transactional
    public void salirDeTodas(String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Integer clienteId = usuario.getClienteId();

        // Quitar sesión activa en memoria
        sesionSubastaService.registrarSalida(clienteId);

        // Borrar de la DB solo los Asistentes sin pujas; los que tienen pujas quedan como historial
        List<Asistente> asistentes = asistenteRepository.findAllByClienteId(clienteId);
        for (Asistente a : asistentes) {
            boolean tienePujas = !pujoRepository.findByAsistenteId(a.getIdentificador()).isEmpty();
            if (!tienePujas) asistenteRepository.delete(a);
        }
    }

    // ── Timer automático ───────────────────────────────────────────────────────

    /**
     * Llamado por ItemTimerService cuando un timer vence.
     * Debe ser público y @Transactional para que Spring gestione la transacción
     * al invocarse a través del proxy (self.onTimerExpired).
     *
     * Envuelto en try/catch SOLO para loguear con contexto claro antes de relanzar:
     * si esto falla silenciosamente (como pasaba antes, atrapado únicamente por el
     * catch genérico de ItemTimerService), el ítem se queda "vivo" para siempre y la
     * subasta parece congelarse en 00:00 sin avanzar.
     */
    @Transactional
    public void onTimerExpired(Integer subastaId, Integer itemId) {
        try {
            onTimerExpiredInterno(subastaId, itemId);
        } catch (RuntimeException e) {
            System.err.println("[onTimerExpired] ERROR procesando expiración subastaId=" + subastaId
                    + " itemId=" + itemId + ": " + e);
            e.printStackTrace();
            throw e;
        }
    }

    private void onTimerExpiredInterno(Integer subastaId, Integer itemId) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId).orElse(null);
        if (item == null) return;
        // Guard: si el ítem ya fue procesado (adjudicado), ignorar
        if ("si".equalsIgnoreCase(item.getSubastado())) return;

        List<Pujo> pujas = pujoRepository.findByItemId(itemId);

        if (pujas.isEmpty()) {
            // Sin postores → cerrar el ítem (lo "compra" la empresa) y avanzar al siguiente.
            // items_catalogo.subastado tiene un CHECK constraint que SOLO permite 'si'/'no'
            // (EstructuraActual.md), y 'no' ya es el valor por default para "pendiente"
            // (lo pone así el panel admin al cargar el ítem al catálogo). No hay un tercer
            // valor disponible, así que usamos 'si' igual que una venta real, y la diferencia
            // ("nadie pujó" vs "se vendió a un postor") se calcula por la AUSENCIA de una fila
            // en Adjudicaciones — ver esSinPostor() y MiProductoService.resolverResultadoVenta().
            item.setSubastado("si");
            item.setEnVivo("no");
            itemCatalogoRepository.save(item);
        } else {
            // Hay pujas → adjudicar al mejor postor.
            // Guard adicional: si ya existe una adjudicación para este ítem (por concurrencia
            // entre timer y adjudicación manual), solo marcar la puja ganadora y el estado.
            boolean yaAdjudicado = adjudicacionesRepository.findByItemId(itemId).isPresent();

            Pujo ganadora = pujas.stream()
                    .max(Comparator.comparing(Pujo::getImporte))
                    .get();
            ganadora.setGanador("si");
            pujoRepository.save(ganadora);

            if (!yaAdjudicado) {
                Adjudicaciones adj = new Adjudicaciones();
                adj.setItemId(itemId);
                adj.setAsistenteId(ganadora.getAsistenteId());
                adj.setImporte(ganadora.getImporte());
                adj.setComision(item.getComision() != null ? item.getComision() : BigDecimal.ZERO);
                adj.setCostoEnvio(BigDecimal.ZERO);
                adj.setCreatedAt(LocalDateTime.now(ZONA_AR));
                adjudicacionesRepository.save(adj);
            }

            // Notificar al ganador en su bandeja de notificaciones
            final Pujo ganadoraFinal = ganadora;
            final ItemCatalogo itemTimer = item;
            asistenteRepository.findById(ganadora.getAsistenteId()).ifPresent(a -> {
                String desc = productoRepository.findById(itemTimer.getProductoId())
                        .map(Producto::getDescripcionCatalogo).orElse("el producto");
                notificacionService.crearNotificacion(
                        a.getClienteId(),
                        "ganador_item",
                        "🏆 ¡Ganaste la subasta de \"" + desc + "\" por $"
                                + ganadoraFinal.getImporte().toPlainString() + "!"
                );
            });

            item.setSubastado("si");
            item.setEnVivo("no");
            itemCatalogoRepository.save(item);
        }

        // Avanzar al siguiente ítem disponible (o cerrar la subasta)
        autoAvanzarDesdeItem(subastaId, item);
    }

    /**
     * Activa el ítem indicado tras el cooldown de 30 s entre ítems.
     * Se llama desde el callback del cooldown timer.
     * Debe ser público y @Transactional para el proxy de Spring.
     */
    @org.springframework.transaction.annotation.Transactional
    public void activarItemTrasEspera(Integer subastaId, Integer itemId) {
        try {
            activarItemTrasEsperaInterno(subastaId, itemId);
        } catch (RuntimeException e) {
            System.err.println("[activarItemTrasEspera] ERROR activando siguiente ítem subastaId=" + subastaId
                    + " itemId=" + itemId + ": " + e);
            e.printStackTrace();
            throw e;
        }
    }

    private void activarItemTrasEsperaInterno(Integer subastaId, Integer itemId) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId).orElse(null);
        if (item == null) return;
        // Guard: si el admin intervino (adjudicó o activó otro ítem) durante el cooldown, ignorar
        if ("si".equalsIgnoreCase(item.getSubastado())) return;

        // Quitar en_vivo de todos y activar este
        Catalogo catalogo = catalogoRepository.findBySubastaId(subastaId).orElse(null);
        if (catalogo != null) {
            itemCatalogoRepository.findByCatalogoId(catalogo.getIdentificador()).forEach(i -> {
                if (!"no".equalsIgnoreCase(i.getEnVivo())) {
                    i.setEnVivo("no");
                    itemCatalogoRepository.save(i);
                }
            });
        }
        item.setEnVivo("si");
        itemCatalogoRepository.save(item);

        // Arrancar timer de 5 minutos para el ítem recién activado
        itemTimerService.iniciarTimer(subastaId, 300,
                () -> self.onTimerExpired(subastaId, itemId));

        SalaResponse estado = construirSalaResponse(subastaId);
        auctionNotificationService.notificarSiguienteItem(subastaId, estado);
    }

    /**
     * Busca el próximo ítem disponible en el catálogo y lo activa,
     * arrancando su timer de 5 minutos y notificando a todos los postores.
     * Si no hay más ítems, cierra la subasta.
     */
    private void autoAvanzarDesdeItem(Integer subastaId, ItemCatalogo itemPrevio) {
        Catalogo catalogo = catalogoRepository.findBySubastaId(subastaId).orElse(null);
        if (catalogo == null) {
            auctionNotificationService.notificarCierre(subastaId);
            return;
        }

        List<ItemCatalogo> todos = itemCatalogoRepository.findByCatalogoId(catalogo.getIdentificador());
        Optional<ItemCatalogo> siguienteOpt = todos.stream()
                .filter(i -> !"si".equalsIgnoreCase(i.getSubastado())
                          && !i.getIdentificador().equals(itemPrevio.getIdentificador()))
                .findFirst();

        if (siguienteOpt.isPresent()) {
            ItemCatalogo siguiente = siguienteOpt.get();

            // Quitar en_vivo de todos (el siguiente se activará tras el cooldown)
            todos.forEach(i -> {
                if (!"no".equalsIgnoreCase(i.getEnVivo())) {
                    i.setEnVivo("no");
                    itemCatalogoRepository.save(i);
                }
            });

            // Cooldown de 30 segundos entre ítems antes de activar el siguiente
            final Integer nextId = siguiente.getIdentificador();
            itemTimerService.iniciarCooldown(subastaId, 30, nextId,
                    () -> self.activarItemTrasEspera(subastaId, nextId));

            // Avisar AHORA MISMO (no recién cuando arranque) a todos los que marcaron la
            // campanita de este ítem: "va a subastarse en breve". No depende de que la app
            // de cada usuario esté abierta/polleando en este momento, porque queda guardado
            // como una notificación real en su bandeja (ver NotificacionService).
            String descSiguiente = productoRepository.findById(siguiente.getProductoId())
                    .map(Producto::getDescripcionCatalogo).orElse(null);
            notificacionService.notificarCampanitaItem(nextId, descSiguiente);

            // Notificar estado de cooldown (sin ítem activo, con cooldownHasta y proximoItem)
            SalaResponse estado = construirSalaResponse(subastaId);
            auctionNotificationService.notificarSiguienteItem(subastaId, estado);
        } else {
            // No quedan ítems disponibles → registrar cierre y notificar
            // No se toca subastas.estado directamente (fecha_check constraint);
            // cerrarSubasta() hace INSERT en subastas_cierre ON CONFLICT DO NOTHING.
            subastaRepository.cerrarSubasta(subastaId);
            auctionNotificationService.notificarCierre(subastaId);
        }
    }

    // ── Construcción de sala ───────────────────────────────────────────────────

    private SalaResponse construirSalaResponse(Integer subastaId) {
        SalaResponse response = new SalaResponse();
        response.setMoneda(MONEDA);
        response.setPujas(new ArrayList<>());

        Catalogo catalogo = catalogoRepository.findBySubastaId(subastaId).orElse(null);
        if (catalogo == null) return response;

        List<ItemCatalogo> items = itemCatalogoRepository.findByCatalogoId(catalogo.getIdentificador());
        // Solo mostrar ítem activo si fue explícitamente marcado en_vivo='si' por el admin
        Optional<ItemCatalogo> actualOpt = items.stream()
                .filter(i -> "si".equalsIgnoreCase(i.getEnVivo()) && !"si".equalsIgnoreCase(i.getSubastado()))
                .findFirst();

        // Cooldown entre ítems: popularlo ANTES del early-return para que llegue al cliente
        // aunque no haya ítem activo (es precisamente el estado durante el cooldown).
        Long cooldownDeadline = itemTimerService.getCooldownDeadline(subastaId);
        response.setCooldownHasta(cooldownDeadline);
        if (cooldownDeadline != null) {
            Integer nextItemId = itemTimerService.getCooldownNextItemId(subastaId);
            if (nextItemId != null) {
                itemCatalogoRepository.findById(nextItemId).ifPresent(nextItem -> {
                    String nextDesc = productoRepository.findById(nextItem.getProductoId())
                            .map(Producto::getDescripcionCatalogo).orElse(null);
                    String nextFoto = fotoProductoRepository.findByProducto(nextItem.getProductoId())
                            .stream().findFirst()
                            .map(f -> Base64.getEncoder().encodeToString(f.getFoto()))
                            .orElse(null);
                    response.setProximoItem(new CatalogoDTO(
                            nextItem.getIdentificador(), nextItem.getProductoId(),
                            nextItem.getPrecioBase(), nextItem.getComision(),
                            nextItem.getSubastado(), nextItem.getEnVivo(), nextDesc, nextFoto,
                            esSinPostor(nextItem)));
                });
            }
        }

        if (actualOpt.isEmpty()) return response;

        ItemCatalogo item = actualOpt.get();

        String descripcion = productoRepository.findById(item.getProductoId())
                .map(Producto::getDescripcionCatalogo).orElse(null);
        String foto = fotoProductoRepository.findByProducto(item.getProductoId())
                .stream().findFirst()
                .map(f -> Base64.getEncoder().encodeToString(f.getFoto()))
                .orElse(null);

        response.setItemActual(new CatalogoDTO(
                item.getIdentificador(), item.getProductoId(),
                item.getPrecioBase(), item.getComision(),
                item.getSubastado(), item.getEnVivo(), descripcion, foto, esSinPostor(item)));

        // Pujas del ítem ordenadas desc por importe
        List<Pujo> pujas = pujoRepository.findByItemId(item.getIdentificador());
        pujas.sort(Comparator.comparing(Pujo::getImporte).reversed());

        // Pre-cargar asistentes para evitar N+1
        List<Integer> asistenteIds = pujas.stream()
                .map(Pujo::getAsistenteId).distinct().collect(Collectors.toList());
        var asistenteMap = asistenteRepository.findAllById(asistenteIds).stream()
                .collect(Collectors.toMap(Asistente::getIdentificador, a -> a));

        List<SalaResponse.PujoDisplay> pujaDisplay = pujas.stream().map(p -> {
            String postor = asistenteMap.containsKey(p.getAsistenteId())
                    ? "Postor #" + asistenteMap.get(p.getAsistenteId()).getNumeroPostor()
                    : "Postor";
            return new SalaResponse.PujoDisplay(p.getImporte(), postor, calcularHace(p.getCreatedAt()), MONEDA);
        }).collect(Collectors.toList());

        response.setPujas(pujaDisplay);

        if (!pujaDisplay.isEmpty()) {
            SalaResponse.PujoDisplay top = pujaDisplay.get(0);
            SalaResponse.MejorOferta mo = new SalaResponse.MejorOferta();
            mo.setImporte(top.getImporte());
            mo.setPostor(top.getPostor());
            mo.setHace(top.getHace());
            mo.setMoneda(MONEDA);
            response.setMejorOferta(mo);
        }

        // Calcular min/max puja
        BigDecimal base = item.getPrecioBase();
        if (base != null) {
            BigDecimal ultima = response.getMejorOferta() != null
                    ? response.getMejorOferta().getImporte()
                    : base;
            BigDecimal inc1  = base.multiply(new BigDecimal("0.01"));
            BigDecimal inc20 = base.multiply(new BigDecimal("0.20"));
            if (response.getMejorOferta() == null) {
                response.setMinPuja(base);
                response.setMaxPuja(base.add(inc20));
            } else {
                response.setMinPuja(ultima.add(inc1));
                response.setMaxPuja(ultima.add(inc20));
            }
        }

        // Timer: cuándo vence y duración total de la fase actual.
        // Safety net: si el ítem está vivo pero el timer no existe en memoria (reinicio
        // del servidor, bug de concurrencia, etc.), NO le regalamos otros 5 minutos:
        // tratamos el tiempo como ya vencido y procesamos la expiración ahora mismo
        // (adjudica si hay pujas, o lo deshabilita y avanza al siguiente ítem).
        // Así el timer nunca "se reinicia" silenciosamente para el mismo ítem.
        Long deadline = itemTimerService.getDeadline(subastaId);
        if (deadline == null) {
            // Si onTimerExpired falla acá, NO dejamos que la excepción rompa el polling
            // (eso convertiría cada request siguiente en un 500 invisible para el usuario,
            // que ve la app "congelada" sin ningún error). Logueamos y devolvemos la
            // respuesta tal cual para no romper la sala; el log queda para diagnosticar.
            try {
                self.onTimerExpired(subastaId, item.getIdentificador());
                return construirSalaResponse(subastaId);
            } catch (RuntimeException e) {
                System.err.println("[construirSalaResponse] safety-net falló al procesar expiración "
                        + "subastaId=" + subastaId + " itemId=" + item.getIdentificador() + ": " + e);
                e.printStackTrace();
                return response;
            }
        }
        response.setTiempoLimite(deadline);
        response.setTimerTotalSegundos(itemTimerService.getTotalSegundos(subastaId));

        return response;
    }

    private String calcularHace(Instant createdAt) {
        if (createdAt == null) return "hace un momento";
        long seg = Instant.now().getEpochSecond() - createdAt.getEpochSecond();
        if (seg < 5)    return "ahora";
        if (seg < 60)   return "hace " + seg + "s";
        if (seg < 3600) return "hace " + (seg / 60) + " min";
        return "hace " + (seg / 3600) + "h";
    }
}
