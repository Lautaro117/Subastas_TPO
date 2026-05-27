package com.example.subastas.service;

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
import com.example.subastas.repository.AdjudicacionesRepository;
import com.example.subastas.repository.AsistenteRepository;
import com.example.subastas.repository.ClienteRepository;
import com.example.subastas.repository.ItemCatalogoRepository;
import com.example.subastas.repository.ProductoRepository;
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
                return new MisComprasDTO(adj.getId(), adj.getItemId(), descripcion,
                    adj.getImporte(), adj.getComision(), adj.getCostoEnvio(), adj.getDireccionEnvio());
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
        if (item != null) {
            Producto producto = productoRepository.findById(item.getProductoId()).orElse(null);
            if (producto != null) descripcion = producto.getDescripcionCatalogo();
        }

        return new MisComprasDTO(adj.getId(), adj.getItemId(), descripcion,
            adj.getImporte(), adj.getComision(), adj.getCostoEnvio(), adj.getDireccionEnvio());
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
}