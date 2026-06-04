package com.example.subastas.service;

import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.CustodiaDTO;
import com.example.subastas.dto.MiProductoDTO;
import com.example.subastas.model.AdminProducto;
import com.example.subastas.model.Cliente;
import com.example.subastas.model.CustodiaProductos;
import com.example.subastas.model.Depositos;
import com.example.subastas.model.Duenio;
import com.example.subastas.model.FotoProducto;
import com.example.subastas.model.Producto;
import com.example.subastas.model.Seguro;
import com.example.subastas.repository.AdminProductoRepository;
import com.example.subastas.repository.ClienteRepository;
import com.example.subastas.repository.CustodiaProductoRepository;
import com.example.subastas.repository.DepositoRepository;
import com.example.subastas.repository.DuenioRepository;
import com.example.subastas.repository.FotoProductoRepository;
import com.example.subastas.repository.ProductoRepository;
import com.example.subastas.repository.SeguroRepository;
import com.example.subastas.repository.UsuarioAuthRepository;

@Service
public class MiProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private AdminProductoRepository adminProductoRepository;

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    @Autowired
    private CustodiaProductoRepository custodiaProductoRepository;

    @Autowired
    private DepositoRepository depositoRepository;

    @Autowired
    private SeguroRepository seguroRepository;

    @Autowired
    private FotoProductoRepository fotoProductoRepository;

    @Autowired
    private DuenioRepository duenioRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    private Integer getClienteId(String email) {
        return usuarioAuthRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED))
            .getClienteId();
    }

    public List<MiProductoDTO> getMisProductos(String email) {
        Integer clienteId = getClienteId(email);
        return productoRepository.findByDuenio(clienteId).stream().map(p -> {
            AdminProducto ap = adminProductoRepository.findByProductoId(p.getIdentificador()).orElse(null);
            return new MiProductoDTO(
            p.getIdentificador(),
            p.getDescripcionCatalogo(),
            p.getDescripcionCompleta(),
            p.getEstadoAdmin(),
            ap != null ? ap.getEstadoPropuesta() : null,
            ap != null ? ap.getPrecioPropuesto() : null,
            null
        );
        }).collect(Collectors.toList());
    }

    public Producto agregarProducto(String email, String descripcionCatalogo, String descripcionCompleta, List<MultipartFile> fotos) {
    if (fotos == null || fotos.size() < 6) {
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Se requieren al menos 6 fotos");
    }
 
    Integer clienteId = getClienteId(email);
 
    // Si el usuario no existe en duenios, lo creamos con valores por defecto
    if (!duenioRepository.existsById(clienteId)) {
        Cliente cliente = clienteRepository.findById(clienteId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));
 
        Duenio duenio = new Duenio();
        duenio.setIdentificador(clienteId);
        duenio.setNumeroPais(cliente.getNumeroPais());
        duenio.setVerificacionFinanciera("no");
        duenio.setVerificacionJudicial("no");
        duenio.setCalificacionRiesgo(1);
        duenio.setVerificador(1);
        duenioRepository.save(duenio);
    }
 
    Producto producto = new Producto();
    producto.setDuenio(clienteId);
    producto.setDescripcionCatalogo(descripcionCatalogo);
    producto.setDescripcionCompleta(descripcionCompleta);
    producto.setEstadoAdmin("pendiente");
    producto.setRevisor(1);
    productoRepository.save(producto);
 
    for (MultipartFile foto : fotos) {
        try {
            FotoProducto fp = new FotoProducto();
            fp.setProducto(producto.getIdentificador());
            fp.setFoto(foto.getBytes());
            fotoProductoRepository.save(fp);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar foto");
        }
    }
 
    return producto;
}

    public void aceptarPropuesta(String email, Integer productoId) {
        Integer clienteId = getClienteId(email);
        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        if (!producto.getDuenio().equals(clienteId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        AdminProducto ap = adminProductoRepository.findByProductoId(productoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Propuesta no encontrada"));

        ap.setEstadoPropuesta("propuesta_aceptada");
        adminProductoRepository.save(ap);

        producto.setEstadoAdmin("aprobado");
        productoRepository.save(producto);
    }

    public void rechazarPropuesta(String email, Integer productoId) {
        Integer clienteId = getClienteId(email);
        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        if (!producto.getDuenio().equals(clienteId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        AdminProducto ap = adminProductoRepository.findByProductoId(productoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Propuesta no encontrada"));

        ap.setEstadoPropuesta("propuesta_rechazada");
        adminProductoRepository.save(ap);
    }

    public CustodiaDTO getCustodia(String email, Integer productoId) {
        Integer clienteId = getClienteId(email);

        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        if (!producto.getDuenio().equals(clienteId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        CustodiaProductos custodia = custodiaProductoRepository.findByProductoId(productoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El producto no está en custodia"));

        Depositos deposito = depositoRepository.findById(custodia.getDepositoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Depósito no encontrado"));

        String nroPoliza = null;
        String compania = null;

        if (producto.getSeguro() != null) {
            Seguro seguro = seguroRepository.findById(producto.getSeguro().toString()).orElse(null);
            if (seguro != null) {
                nroPoliza = seguro.getNroPoliza();
                compania = seguro.getCompania();
            }
        }

        return new CustodiaDTO(deposito.getNombre(), deposito.getDireccion(),
            custodia.getEstado(), nroPoliza, compania);
    }



public MiProductoDTO getDetalle(String email, Integer productoId) {
    Integer clienteId = getClienteId(email);

    Producto producto = productoRepository.findById(productoId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

    if (!producto.getDuenio().equals(clienteId)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    AdminProducto ap = adminProductoRepository.findByProductoId(productoId).orElse(null);

    List<String> fotosBase64 = fotoProductoRepository.findByProducto(productoId).stream()        
    .map(f -> Base64.getEncoder().encodeToString(f.getFoto()))
        .collect(Collectors.toList());

    return new MiProductoDTO(
        producto.getIdentificador(),
        producto.getDescripcionCatalogo(),
        producto.getDescripcionCompleta(),
        producto.getEstadoAdmin(),
        ap != null ? ap.getEstadoPropuesta() : null,
        ap != null ? ap.getPrecioPropuesto() : null,
        fotosBase64
    );
}
}