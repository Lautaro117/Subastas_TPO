package com.example.subastas.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
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

    // ── Listado ────────────────────────────────────────────────────────────────

    public List<Subasta> listarTodas() {
        return subastaRepository.findAll();
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
                    item.getComision(), item.getSubastado(), descripcion, foto);
        }).toList();
    }

    public CatalogoDTO obtenerItem(Integer subastaId, Integer itemId, String estado) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item no encontrado"));
        return new CatalogoDTO(item.getIdentificador(), item.getProductoId(),
                "E2".equals(estado) ? null : item.getPrecioBase(),
                item.getComision(), item.getSubastado(), null, null);
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
        if (!"abierta".equalsIgnoreCase(subasta.getEstado())) {
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

        // Ya está en esta subasta → devolver estado actual
        if (asistenteRepository.findByClienteIdAndSubastaId(clienteId, subastaId).isPresent()) {
            return construirSalaResponse(subastaId);
        }

        // Limpiar registros de subastas cerradas; bloquear si hay una subasta abierta diferente
        List<Asistente> otros = asistenteRepository.findAllByClienteId(clienteId);
        for (Asistente a : otros) {
            Subasta otraSubasta = subastaRepository.findById(a.getSubastaId()).orElse(null);
            if (otraSubasta != null && "abierta".equalsIgnoreCase(otraSubasta.getEstado())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ya estás conectado a otra subasta activa");
            }
            asistenteRepository.delete(a);
        }

        Asistente asistente = new Asistente();
        asistente.setClienteId(clienteId);
        asistente.setSubastaId(subastaId);
        asistente.setNumeroPostor((int) (Math.random() * 9000) + 1000);
        asistenteRepository.save(asistente);
        return construirSalaResponse(subastaId);
    }

    @Transactional
    public void salirDeSala(Integer subastaId, String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Asistente asistente = asistenteRepository
                .findByClienteIdAndSubastaId(usuario.getClienteId(), subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No estás en esta subasta"));
        boolean tienePujas = !pujoRepository.findByAsistenteId(asistente.getIdentificador()).isEmpty();
        if (!tienePujas) asistenteRepository.delete(asistente);
    }

    public SalaResponse obtenerEstadoVivo(Integer subastaId, String email) {
        buscarPorId(subastaId);
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        asistenteRepository.findByClienteIdAndSubastaId(usuario.getClienteId(), subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No estás conectado a esta subasta"));
        return construirSalaResponse(subastaId);
    }

    // ── Pujas ──────────────────────────────────────────────────────────────────

    @Transactional
    public Pujo enviarPuja(Integer subastaId, String email, BidRequest request) {
        Subasta subasta = buscarPorId(subastaId);
        if (!"abierta".equalsIgnoreCase(subasta.getEstado())) {
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
        Subasta subasta = buscarPorId(subastaId);
        if (!"abierta".equalsIgnoreCase(subasta.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La subasta no está activa");
        }

        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item no encontrado"));
        if ("si".equalsIgnoreCase(item.getSubastado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El ítem ya fue adjudicado");
        }

        // Marcar puja ganadora y crear adjudicación
        pujoRepository.findTopByItemIdOrderByImporteDesc(itemId).ifPresent(p -> {
            p.setGanador("si");
            pujoRepository.save(p);

            Adjudicaciones adj = new Adjudicaciones();
            adj.setItemId(itemId);
            adj.setAsistenteId(p.getAsistenteId());
            adj.setImporte(p.getImporte());
            adj.setComision(item.getComision() != null ? item.getComision() : BigDecimal.ZERO);
            adj.setCostoEnvio(BigDecimal.ZERO);
            adj.setCreatedAt(LocalDateTime.now());
            adjudicacionesRepository.save(adj);
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
        List<Asistente> asistentes = asistenteRepository.findAllByClienteId(usuario.getClienteId());
        asistenteRepository.deleteAll(asistentes);
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
                item.getSubastado(), descripcion, foto));

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
