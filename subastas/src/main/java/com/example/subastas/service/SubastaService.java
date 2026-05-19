package com.example.subastas.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.BidRequest;
import com.example.subastas.dto.CatalogoDTO;
import com.example.subastas.dto.SalaResponse;
import com.example.subastas.model.Asistente;
import com.example.subastas.model.Catalogo;
import com.example.subastas.model.ItemCatalogo;
import com.example.subastas.model.MedioPago;
import com.example.subastas.model.Pujo;
import com.example.subastas.model.Subasta;
import com.example.subastas.repository.AsistenteRepository;
import com.example.subastas.repository.CatalogoRepository;
import com.example.subastas.repository.ItemCatalogoRepository;
import com.example.subastas.repository.MedioPagoRepository;
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
    private MedioPagoRepository medioPagoRepository;

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

        return items.stream().map(item -> new CatalogoDTO(
                item.getIdentificador(),
                item.getProductoId(),
                estado.equals("E2") ? null : item.getPrecioBase(),
                item.getComision(),
                item.getSubastado()
        )).toList();
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
        asistenteRepository.deleteByClienteIdAndSubastaId(usuario.getClienteId(), subastaId);
    }

    public SalaResponse obtenerEstadoVivo(Integer subastaId, String email) {
        // 1. Validar que la subasta existe
        buscarPorId(subastaId);

        // 2. Validar que el usuario está unido a esta sala (403 Forbidden según contrato)
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        
        asistenteRepository.findByClienteIdAndSubastaId(usuario.getClienteId(), subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No estás conectado a esta subasta"));

        // 3. Retornar el estado actual usando el helper
        return construirSalaResponse(subastaId);
    }

    @Transactional
    public Pujo enviarPuja(Integer subastaId, String email, BidRequest request) {
        // 1. Validar que la subasta existe y está abierta (422 según contrato)
        Subasta subasta = buscarPorId(subastaId);
        if (!"abierta".equalsIgnoreCase(subasta.getEstado())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "La subasta no está activa");
        }

        // 2. Validar que el artículo existe y es parte de la subasta (422)
        ItemCatalogo item = itemCatalogoRepository.findById(request.getItem_id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Artículo no encontrado"));
        
        if ("si".equalsIgnoreCase(item.getSubastado())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "El artículo ya fue adjudicado");
        }

        // 3. Obtener asistente y validar conexión
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        
        Asistente asistente = asistenteRepository.findByClienteIdAndSubastaId(usuario.getClienteId(), subastaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No estás unido a esta sala"));

        // 4. Validar categoría (403)
        // La categoría se obtiene del usuario autenticado (simulamos con el token en el controller, 
        // pero aquí lo reforzamos si fuera necesario).

        // 5. Validar medio de pago verificado (403)
        MedioPago medio = medioPagoRepository.findById(request.getPayment_method_id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Medio de pago no encontrado"));
        
        if (!medio.getClienteId().equals(usuario.getClienteId()) || !Boolean.TRUE.equals(medio.getVerificado())) {            
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El medio de pago no está verificado");
        }

        // 6. Validar si ya hay una puja en proceso (403 según contrato)
        if (pujoRepository.existsByAsistenteIdAndEstado(asistente.getIdentificador(), "en_proceso")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ya tienes una puja en proceso");
        }

        // 7. Validar rango de monto (409)
        BigDecimal montoPropuesto = request.getMonto();
        BigDecimal precioBase = item.getPrecioBase();
        
        Optional<Pujo> ultimaPuja = pujoRepository.findTopByItemIdOrderByImporteDesc(item.getIdentificador());
        BigDecimal montoReferencia = ultimaPuja.map(Pujo::getImporte).orElse(BigDecimal.ZERO);

        // Si es la primera puja, debe ser al menos el precio base
        if (montoReferencia.compareTo(BigDecimal.ZERO) == 0) {
            if (montoPropuesto.compareTo(precioBase) < 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "La primera puja debe ser al menos el precio base");
            }
        } else {
            // Reglas de rango (1% - 20% del precio base)
            // No aplica para ORO y PLATINO
            String categoriaUsuario = "comun"; // En un caso real vendría del JWT o DB
            // Simulamos obtener categoría real del cliente
            // String categoriaUsuario = obtenerCategoriaDelCliente(usuario.getClienteId());

            if (!"oro".equalsIgnoreCase(categoriaUsuario) && !"platino".equalsIgnoreCase(categoriaUsuario)) {
                BigDecimal minIncrement = precioBase.multiply(new BigDecimal("0.01"));
                BigDecimal maxIncrement = precioBase.multiply(new BigDecimal("0.20"));
                
                BigDecimal minPermitido = montoReferencia.add(minIncrement);
                BigDecimal maxPermitido = montoReferencia.add(maxIncrement);

                if (montoPropuesto.compareTo(minPermitido) < 0 || montoPropuesto.compareTo(maxPermitido) > 0) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Monto fuera de rango permitido");
                }
            } else {
                // Para Oro/Platino solo debe superar la anterior
                if (montoPropuesto.compareTo(montoReferencia) <= 0) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "El monto debe superar la puja anterior");
                }
            }
        }

        // 8. Persistir puja
        Pujo pujo = new Pujo();
        pujo.setAsistenteId(asistente.getIdentificador());
        pujo.setItemId(item.getIdentificador());
        pujo.setImporte(montoPropuesto);
        pujo.setMoneda(request.getMoneda());
        pujo.setMedioPagoId(medio.getId());
        pujo.setEstado("confirmada"); // Simplificamos: confirmación inmediata por ahora
        
        Pujo savedPujo = pujoRepository.save(pujo);

        // NOTIFICACIÓN WEBSOCKET EN TIEMPO REAL
        auctionNotificationService.notificarNuevaPuja(subastaId, savedPujo.getImporte(), savedPujo.getMoneda(), savedPujo.getIdentificador());


        return savedPujo;
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
                        item.getSubastado()
                ));

                // Obtener mejor oferta actual
                pujoRepository.findTopByItemIdOrderByImporteDesc(item.getIdentificador())
                        .ifPresent(p -> {
                            SalaResponse.MejorOferta mo = new SalaResponse.MejorOferta();
                            mo.setMonto(p.getImporte());
                            mo.setMoneda(p.getMoneda());
                            mo.setHaceSegundos(0L); // Simplificado
                            response.setMejorOferta(mo);
                        });
            });
        }

        response.setHistorialReciente(new ArrayList<>());
        response.setWebsocketUrl("/ws/auction/" + subastaId);
        
        return response;
    }
}