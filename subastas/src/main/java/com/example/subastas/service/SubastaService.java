package com.example.subastas.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.BidRequest;
import com.example.subastas.dto.CatalogoDTO;
import com.example.subastas.dto.ProductoDetalleDTO;
import com.example.subastas.dto.ResultadoItemDTO;
import com.example.subastas.dto.SalaResponse;
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

    @Autowired
    private AuctionNotificationService auctionNotificationService;

    @Autowired
    private SubastaRepository subastaRepository;

    @Autowired
    private CatalogoRepository catalogoRepository;

    @Autowired
    private ItemCatalogoRepository itemCatalogoRepository;

    @Autowired
    private AsistenteRepository asistenteRepository;

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    @Autowired
    private PujoRepository pujoRepository;

    @Autowired
    private PujoExtRepository pujoExtRepository;

    @Autowired
    private MedioPagoRepository medioPagoRepository;

    @Autowired
    private AdjudicacionesRepository adjudicacionesRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private FotoProductoRepository fotoProductoRepository;

    private static final List<String> ORDEN_CATEGORIAS = Arrays.asList(
            "comun", "especial", "plata", "oro", "platino"
    );

    public List<Subasta> listarPorCategoria(String categoriaUsuario) {
        List<Subasta> todas = subastaRepository.findAll();
        int nivelUsuario = ORDEN_CATEGORIAS.indexOf(categoriaUsuario);
        return todas.stream()
                .filter(s -> ORDEN_CATEGORIAS.indexOf(s.getCategoria()) <= nivelUsuario)
                .toList();
    }

    public Subasta buscarPorId(Integer id) {
        return subastaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Subasta no encontrada"));
    }

    public List<CatalogoDTO> obtenerCatalogo(Integer subastaId, String estado) {
    Catalogo catalogo = catalogoRepository.findBySubastaId(subastaId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Catálogo no encontrado"));
 
    List<ItemCatalogo> items = itemCatalogoRepository.findByCatalogoId(catalogo.getIdentificador());
 
    return items.stream().map(item -> {
        // Traer descripción del producto
        String descripcion = productoRepository.findById(item.getProductoId())
                .map(p -> p.getDescripcionCatalogo())
                .orElse(null);
 
        // Traer primera foto del producto
        String fotoPrincipal = fotoProductoRepository.findByProducto(item.getProductoId())
                .stream()
                .findFirst()
                .map(f -> Base64.getEncoder().encodeToString(f.getFoto()))
                .orElse(null);
 
        return new CatalogoDTO(
                item.getIdentificador(),
                item.getProductoId(),
                estado.equals("E2") ? null : item.getPrecioBase(),
                item.getComision(),
                item.getSubastado(),
                descripcion,
                fotoPrincipal
        );
    }).toList();
}
    public CatalogoDTO obtenerItem(Integer subastaId, Integer itemId, String estado) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Item no encontrado"));
        return new CatalogoDTO(
                item.getIdentificador(),
                item.getProductoId(),
                estado.equals("E2") ? null : item.getPrecioBase(),
                item.getComision(),
                item.getSubastado(),
                null,
                null
        );
    }

    public ProductoDetalleDTO obtenerDetalleProducto(Integer subastaId, Integer itemId, String estado) {
        // 1. Validar que el catálogo existe para esta subasta
        catalogoRepository.findBySubastaId(subastaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Catálogo no encontrado"));

        // 2. Traer el ítem
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Item no encontrado"));

        // 3. Traer el producto
        Producto producto = productoRepository.findById(item.getProductoId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Producto no encontrado"));

        // 4. Traer las fotos y convertirlas a base64
        List<FotoProducto> fotos = fotoProductoRepository.findByProducto(producto.getIdentificador());
        List<String> fotosBase64 = fotos.stream()
                .map(f -> Base64.getEncoder().encodeToString(f.getFoto()))
                .toList();

        // 5. Armar el DTO
        ProductoDetalleDTO dto = new ProductoDetalleDTO();
        dto.setItemId(item.getIdentificador());
        dto.setProductoId(item.getProductoId());
        dto.setPrecioBase(item.getPrecioBase());
        dto.setComision(item.getComision());
        dto.setSubastado(item.getSubastado());
        dto.setDescripcionCatalogo(producto.getDescripcionCatalogo());
        dto.setDescripcionCompleta(producto.getDescripcionCompleta());
        dto.setFecha(producto.getFecha());
        dto.setDisponible(producto.getDisponible());
        dto.setFotos(fotosBase64);

        return dto;
    }

    @Transactional
    public SalaResponse unirseASala(Integer subastaId, String email) {
        Subasta subasta = buscarPorId(subastaId);
        if (!"abierta".equalsIgnoreCase(subasta.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La subasta no está activa o ya finalizó");
        }
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Integer clienteId = usuario.getClienteId();
        Optional<Asistente> actual = asistenteRepository.findByClienteId(clienteId);
        if (actual.isPresent()) {
            if (actual.get().getSubastaId().equals(subastaId)) {
                return construirSalaResponse(subastaId);
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ya estás conectado a otra subasta");
        }
        Asistente asistente = new Asistente();
        asistente.setClienteId(clienteId);
        asistente.setSubastaId(subastaId);
        asistente.setNumeroPostor((int) (Math.random() * 1000));
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
        if (!tienePujas) {
            asistenteRepository.delete(asistente);
        }
    }

    public SalaResponse obtenerEstadoVivo(Integer subastaId, String email) {
        buscarPorId(subastaId);
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        asistenteRepository.findByClienteIdAndSubastaId(usuario.getClienteId(), subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No estás conectado a esta subasta"));
        return construirSalaResponse(subastaId);
    }

    @Transactional
    public Pujo enviarPuja(Integer subastaId, String email, BidRequest request) {
        // 1. Validar que la subasta existe y está abierta
        Subasta subasta = buscarPorId(subastaId);
        if (!"abierta".equalsIgnoreCase(subasta.getEstado())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "La subasta no está activa");
        }

        // 2. Validar que el artículo existe y no está adjudicado
        ItemCatalogo item = itemCatalogoRepository.findById(request.getItem_id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Artículo no encontrado"));
        if ("si".equalsIgnoreCase(item.getSubastado())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "El artículo ya fue adjudicado");
        }

        // 3. Obtener usuario y validar que está en la sala
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Asistente asistente = asistenteRepository.findByClienteIdAndSubastaId(usuario.getClienteId(), subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No estás unido a esta sala"));

        // 4. Validar medio de pago verificado
        MedioPago medio = medioPagoRepository.findById(request.getPayment_method_id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Medio de pago no encontrado"));
        if (!medio.getClienteId().equals(usuario.getClienteId()) || !Boolean.TRUE.equals(medio.getVerificado())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El medio de pago no está verificado");
        }

        // 5. Validar que no hay una puja en proceso
        boolean tienePujaEnProceso = pujoExtRepository.existsByPujoIdAndEstado(
                asistente.getIdentificador(), "en_proceso");
        if (tienePujaEnProceso) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ya tenés una puja en proceso");
        }

        // 6. Guardar en pujos
        Pujo pujo = new Pujo();
        pujo.setAsistenteId(asistente.getIdentificador());
        pujo.setItemId(item.getIdentificador());
        pujo.setImporte(request.getMonto());
        Pujo savedPujo = pujoRepository.save(pujo);

        // 7. Guardar campos extra en pujos_ext
        PujoExt pujoExt = new PujoExt();
        pujoExt.setPujoId(savedPujo.getIdentificador());
        pujoExt.setMoneda(request.getMoneda());
        pujoExt.setEstado("confirmada");
        pujoExt.setMedioPagoId(medio.getId());
        pujoExtRepository.save(pujoExt);

        // 8. Notificar por WebSocket
        auctionNotificationService.notificarNuevaPuja(subastaId, savedPujo.getImporte(), request.getMoneda(), savedPujo.getIdentificador());

        return savedPujo;
    }

    public List<Pujo> obtenerPujaPorItem(Integer subastaId, Integer itemId) {
        ItemCatalogo item = itemCatalogoRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Item no encontrado"));
        return pujoRepository.findByItemId(item.getIdentificador());
    }

    public ResultadoItemDTO obtenerResultadoItem(Integer subastaId, Integer itemId, String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        Asistente asistente = asistenteRepository.findByClienteIdAndSubastaId(usuario.getClienteId(), subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No participaste en esta subasta"));

        ResultadoItemDTO resultado = new ResultadoItemDTO();

        Optional<Pujo> pujaGanadora = pujoRepository.findByAsistenteIdAndItemIdAndGanador(asistente.getIdentificador(), itemId, "si");

        if (pujaGanadora.isPresent()) {
            resultado.setGano(true);
            resultado.setMontoPujado(pujaGanadora.get().getImporte());
        } else {
            resultado.setGano(false);
            pujoRepository.findTopByAsistenteIdAndItemIdOrderByImporteDesc(
                    asistente.getIdentificador(), itemId).ifPresent(p -> resultado.setMontoPujado(p.getImporte()));
        }

        return resultado;
    }

    private SalaResponse construirSalaResponse(Integer subastaId) {
        SalaResponse response = new SalaResponse();
        Catalogo catalogo = catalogoRepository.findBySubastaId(subastaId).orElse(null);
        if (catalogo != null) {
            List<ItemCatalogo> items = itemCatalogoRepository.findByCatalogoId(catalogo.getIdentificador());
            Optional<ItemCatalogo> actual = items.stream()
                    .filter(i -> !"si".equalsIgnoreCase(i.getSubastado()))
                    .findFirst();
            actual.ifPresent(item -> {
                response.setArticuloActual(new CatalogoDTO(
                        item.getIdentificador(),
                        item.getProductoId(),
                        item.getPrecioBase(),
                        item.getComision(),
                        item.getSubastado(),
                        null,
                        null
                ));
                pujoRepository.findTopByItemIdOrderByImporteDesc(item.getIdentificador())
                        .ifPresent(p -> {
                            SalaResponse.MejorOferta mo = new SalaResponse.MejorOferta();
                            mo.setMonto(p.getImporte());
                            mo.setMoneda("ARS");
                            mo.setHaceSegundos(0L);
                            response.setMejorOferta(mo);
                        });
            });
        }
        response.setHistorialReciente(new ArrayList<>());
        response.setWebsocketUrl("/ws/auction/" + subastaId);
        return response;
    }
}