package com.example.subastas.service;

import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.MisComprasDTO;
import com.example.subastas.model.Adjudicaciones;
import com.example.subastas.model.Cliente;
import com.example.subastas.model.ItemCatalogo;
import com.example.subastas.model.Producto;
import com.example.subastas.model.Seguro;
import com.example.subastas.repository.AdjudicacionesRepository;
import com.example.subastas.repository.AsistenteRepository;
import com.example.subastas.repository.ClienteRepository;
import com.example.subastas.repository.FotoProductoRepository;
import com.example.subastas.repository.ItemCatalogoRepository;
import com.example.subastas.repository.ProductoRepository;
import com.example.subastas.model.PagoAdjudicacion;
import com.example.subastas.repository.PagoAdjudicacionRepository;
import com.example.subastas.repository.SeguroRepository;
import com.example.subastas.repository.UsuarioAuthRepository;

@Service
public class MisComprasService {

    @Autowired
    private AdjudicacionesRepository adjudicacionesRepository;

    @Autowired
    private AsistenteRepository asistenteRepository;

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    @Autowired
    private ItemCatalogoRepository itemCatalogoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ProductoRepository productoRepository;
    @Autowired
    private FotoProductoRepository fotoProductoRepository;

    @Autowired
    private SeguroRepository seguroRepository;

    @Autowired
    private PagoAdjudicacionRepository pagoAdjudicacionRepository;

    private static final java.time.ZoneId ZONA_AR = java.time.ZoneId.of("America/Argentina/Buenos_Aires");

    private Integer getClienteId(String email) {
        return usuarioAuthRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED))
            .getClienteId();
    }

    public List<MisComprasDTO> getMisCompras(String email) {
        Integer clienteId = getClienteId(email);
        return asistenteRepository.findAllByClienteId(clienteId).stream()
            .flatMap(a -> adjudicacionesRepository.findAllByAsistenteId(a.getIdentificador()).stream())
            .map(adj -> {
                ItemCatalogo item = itemCatalogoRepository.findById(adj.getItemId()).orElse(null);
                String descripcion = "Item #" + adj.getItemId();
                if (item != null) {
                    Producto producto = productoRepository.findById(item.getProductoId()).orElse(null);
                    if (producto != null) descripcion = producto.getDescripcionCatalogo();
}
                return new MisComprasDTO(adj.getId(), adj.getItemId(), descripcion, null,
    adj.getImporte(), adj.getComision(), adj.getCostoEnvio(), adj.getDireccionEnvio(),
    null, null, null, adj.getMedioPagoId());
            })
            .collect(Collectors.toList());
    }

    public MisComprasDTO getDetalle(String email, Integer adjId) {
    Integer clienteId = getClienteId(email);
    Adjudicaciones adj = adjudicacionesRepository.findById(adjId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compra no encontrada"));

    boolean esDelUsuario = asistenteRepository.findAllByClienteId(clienteId).stream()
        .anyMatch(a -> a.getIdentificador().equals(adj.getAsistenteId()));

    if (!esDelUsuario) throw new ResponseStatusException(HttpStatus.FORBIDDEN);

    ItemCatalogo item = itemCatalogoRepository.findById(adj.getItemId()).orElse(null);
    String descripcion = "Item #" + adj.getItemId();
    String descripcionCompleta = null;
    String nroPoliza = null;
    String companiaSeguro = null;
    List<String> fotos = Collections.emptyList();

    if (item != null) {
        Producto producto = productoRepository.findById(item.getProductoId()).orElse(null);
        if (producto != null) {
            descripcion = producto.getDescripcionCatalogo();
            descripcionCompleta = producto.getDescripcionCompleta();

            if (producto.getSeguro() != null) {
                Seguro seguro = seguroRepository.findById(producto.getSeguro().toString()).orElse(null);
                if (seguro != null) {
                    nroPoliza = seguro.getNroPoliza();
                    companiaSeguro = seguro.getCompania();
                }
            }

            fotos = fotoProductoRepository.findByProducto(producto.getIdentificador()).stream()
                .map(f -> Base64.getEncoder().encodeToString(f.getFoto()))
                .collect(Collectors.toList());
        }
    }

    return new MisComprasDTO(adj.getId(), adj.getItemId(), descripcion, descripcionCompleta,
        adj.getImporte(), adj.getComision(), adj.getCostoEnvio(), adj.getDireccionEnvio(),
        nroPoliza, companiaSeguro, fotos, adj.getMedioPagoId());
}

    public void setDireccionEnvio(String email, Integer adjId) {
    Integer clienteId = getClienteId(email);
    
    Adjudicaciones adj = adjudicacionesRepository.findById(adjId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compra no encontrada"));

    boolean esDelUsuario = asistenteRepository.findAllByClienteId(clienteId).stream()
        .anyMatch(a -> a.getIdentificador().equals(adj.getAsistenteId()));

    if (!esDelUsuario) throw new ResponseStatusException(HttpStatus.FORBIDDEN);

    Cliente cliente = clienteRepository.findById(clienteId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    String direccion = cliente.getPersona().getDireccion();
    adj.setDireccionEnvio(direccion);
    adjudicacionesRepository.save(adj);
}


// El medioPagoId YA NO se recibe por parámetro acá: queda fijo desde el momento en que
// se adjudicó (es el medio con el que pujó y ganó, ver SubastaService.enviarPuja /
// onTimerExpired / adjudicarItem). Esta confirmación solo define cómo se entrega.
public void confirmarEntrega(String email, Integer adjId, String tipoEntrega) {
    Integer clienteId = getClienteId(email);

    Adjudicaciones adj = adjudicacionesRepository.findById(adjId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compra no encontrada"));

    boolean esDelUsuario = asistenteRepository.findAllByClienteId(clienteId).stream()
        .anyMatch(a -> a.getIdentificador().equals(adj.getAsistenteId()));

    if (!esDelUsuario) throw new ResponseStatusException(HttpStatus.FORBIDDEN);

    if ("envio".equals(tipoEntrega)) {
        Cliente cliente = clienteRepository.findById(clienteId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        adj.setDireccionEnvio(cliente.getPersona().getDireccion());
    }

    adj.setTipoEntrega(tipoEntrega);
    adjudicacionesRepository.save(adj);

    // Crear registro de pago si todavía no existe
    pagoAdjudicacionRepository.findByAdjudicacionId(adjId).ifPresentOrElse(
        p -> {},
        () -> {
            PagoAdjudicacion pago = new PagoAdjudicacion();
            pago.setAdjudicacionId(adjId);
            pago.setItemId(adj.getItemId());
            pago.setMedioPagoId(adj.getMedioPagoId());
            pago.setEstado("pendiente");
            pago.setCreatedAt(java.time.LocalDateTime.now(ZONA_AR));
            pago.setUpdatedAt(java.time.LocalDateTime.now(ZONA_AR));
            pagoAdjudicacionRepository.save(pago);
        }
    );
}

public PagoAdjudicacion getPago(String email, Integer adjId) {
    Integer clienteId = getClienteId(email);

    Adjudicaciones adj = adjudicacionesRepository.findById(adjId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compra no encontrada"));

    boolean esDelUsuario = asistenteRepository.findAllByClienteId(clienteId).stream()
        .anyMatch(a -> a.getIdentificador().equals(adj.getAsistenteId()));

    if (!esDelUsuario) throw new ResponseStatusException(HttpStatus.FORBIDDEN);

    return pagoAdjudicacionRepository.findByAdjudicacionId(adjId).orElse(null);
}
}