package com.example.subastas.service;

import java.math.BigDecimal;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.CustodiaDTO;
import com.example.subastas.dto.MiProductoDTO;
import com.example.subastas.dto.PropuestaAdminRequest;
import com.example.subastas.model.AdminProducto;
import com.example.subastas.model.Adjudicaciones;
import com.example.subastas.model.Cliente;
import com.example.subastas.model.CustodiaProductos;
import com.example.subastas.model.Depositos;
import com.example.subastas.model.Duenio;
import com.example.subastas.model.FotoProducto;
import com.example.subastas.model.ItemCatalogo;
import com.example.subastas.model.Producto;
import com.example.subastas.model.Seguro;
import com.example.subastas.repository.AdjudicacionesRepository;
import com.example.subastas.repository.AdminProductoRepository;
import com.example.subastas.repository.ClienteRepository;
import com.example.subastas.repository.CustodiaProductoRepository;
import com.example.subastas.repository.DepositoRepository;
import com.example.subastas.repository.DuenioRepository;
import com.example.subastas.repository.FotoProductoRepository;
import com.example.subastas.repository.ItemCatalogoRepository;
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

    @Autowired
    private ItemCatalogoRepository itemCatalogoRepository;

    @Autowired
    private AdjudicacionesRepository adjudicacionesRepository;

    private Integer getClienteId(String email) {
        return usuarioAuthRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED))
            .getClienteId();
    }

    /** Resuelve nombre y dirección del depósito asignado a un producto (null si no aplica). */
    private String[] resolverDeposito(Integer productoId) {
        return custodiaProductoRepository.findByProductoId(productoId)
            .filter(c -> c.getDepositoId() != null)
            .flatMap(c -> depositoRepository.findById(c.getDepositoId()))
            .map(d -> new String[]{ d.getNombre(), d.getDireccion() })
            .orElse(new String[]{ null, null });
    }

    /**
     * Resuelve el resultado de la subasta de un producto a partir de items_catalogo.subastado:
     * - "si" + existe una fila en Adjudicaciones para ese ítem → se vendió a un postor real:
     *   "vendido_subasta", monto = importe de la adjudicación.
     * - "si" + NO existe Adjudicaciones → nadie pujó y venció el timer, la empresa lo "compró"
     *   simulando la subasta: "comprado_empresa", monto = precio base.
     *   (items_catalogo.subastado tiene un CHECK constraint que solo permite 'si'/'no' — ver
     *   EstructuraActual.md — y 'no' ya es el valor por default para "pendiente" que pone el
     *   panel admin al cargar el ítem, así que no hay un tercer valor disponible para esto;
     *   por eso la distinción se calcula a partir de Adjudicaciones, no de subastado.)
     * - cualquier otro caso (todavía pendiente, o ni siquiera entró a un catálogo): null.
     *
     * No escribe nada nuevo: se deriva 100% de columnas que ya existen (sin cambios de schema).
     */
    private Object[] resolverResultadoVenta(Integer productoId) {
        List<ItemCatalogo> items = itemCatalogoRepository.findByProductoId(productoId);
        if (items.isEmpty()) {
            return new Object[]{ null, null };
        }
        // Si hubiera más de un ítem de catálogo para el mismo producto, nos quedamos con el más reciente.
        ItemCatalogo item = items.stream()
            .max(Comparator.comparing(ItemCatalogo::getIdentificador))
            .orElse(null);

        if ("si".equals(item.getSubastado())) {
            Optional<Adjudicaciones> adjudicacion = adjudicacionesRepository.findByItemId(item.getIdentificador());
            if (adjudicacion.isPresent()) {
                return new Object[]{ "vendido_subasta", adjudicacion.get().getImporte() };
            }
            return new Object[]{ "comprado_empresa", item.getPrecioBase() };
        }
        return new Object[]{ null, null };
    }

    public List<MiProductoDTO> getMisProductos(String email) {
        Integer clienteId = getClienteId(email);
        return productoRepository.findByDuenio(clienteId).stream().map(p -> {
            AdminProducto ap = adminProductoRepository.findByProductoId(p.getIdentificador()).orElse(null);
            String[] dep = resolverDeposito(p.getIdentificador());
            Object[] venta = resolverResultadoVenta(p.getIdentificador());
            return new MiProductoDTO(
                p.getIdentificador(),
                p.getDescripcionCatalogo(),
                p.getDescripcionCompleta(),
                p.getEstadoAdmin(),
                ap != null ? ap.getEstadoPropuesta() : null,
                ap != null ? ap.getPrecioPropuesto() : null,
                ap != null ? ap.getComision() : null,
                ap != null ? ap.getFechaSubasta() : null,
                null,
                ap != null ? ap.getMotivoRechazo() : null,
                ap != null ? ap.getEtapaRechazo() : null,
                dep[0], dep[1],
                (String) venta[0], (BigDecimal) venta[1]
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

    public void marcarEnviado(String email, Integer productoId) {
        Integer clienteId = getClienteId(email);
        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        if (!producto.getDuenio().equals(clienteId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        if (!"enviar_deposito".equals(producto.getEstadoAdmin())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El producto no está en estado de envío");
        }

        producto.setEstadoAdmin("en_deposito");
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

        producto.setEstadoAdmin("rechazado");
        productoRepository.save(producto);
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

    public void enviarPropuestaAdmin(Integer productoId, PropuestaAdminRequest body) {
        if (!productoRepository.existsById(productoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado");
        }

        AdminProducto ap = adminProductoRepository.findByProductoId(productoId)
            .orElseGet(() -> {
                AdminProducto nuevo = new AdminProducto();
                nuevo.setProductoId(productoId);
                return nuevo;
            });

        ap.setEstadoPropuesta("propuesta_enviada");
        if (body.getPrecioPropuesto() != null) ap.setPrecioPropuesto(body.getPrecioPropuesto());
        if (body.getComision() != null) ap.setComision(body.getComision());
        if (body.getFechaSubasta() != null) ap.setFechaSubasta(body.getFechaSubasta());
        adminProductoRepository.save(ap);

        if (body.getDepositoId() != null) {
            depositoRepository.findById(body.getDepositoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Depósito no encontrado"));

            CustodiaProductos custodia = custodiaProductoRepository.findByProductoId(productoId)
                .orElseGet(CustodiaProductos::new);

            custodia.setProductoId(productoId);
            custodia.setDepositoId(body.getDepositoId());
            if (custodia.getEstado() == null) custodia.setEstado("pendiente");
            if (custodia.getCreatedAt() == null) custodia.setCreatedAt(java.time.LocalDateTime.now());
            custodiaProductoRepository.save(custodia);
        }
    }

    public void asignarDepositoYEnviar(Integer productoId, Integer depositoId) {
        if (depositoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "depositoId es requerido");
        }

        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        depositoRepository.findById(depositoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Depósito no encontrado"));

        producto.setEstadoAdmin("enviar_deposito");
        productoRepository.save(producto);

        CustodiaProductos custodia = custodiaProductoRepository.findByProductoId(productoId)
            .orElseGet(CustodiaProductos::new);

        custodia.setProductoId(productoId);
        custodia.setDepositoId(depositoId);
        if (custodia.getEstado() == null) custodia.setEstado("pendiente");
        if (custodia.getCreatedAt() == null) custodia.setCreatedAt(java.time.LocalDateTime.now());
        custodiaProductoRepository.save(custodia);
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

        String[] dep = resolverDeposito(productoId);
        Object[] venta = resolverResultadoVenta(productoId);

        return new MiProductoDTO(
            producto.getIdentificador(),
            producto.getDescripcionCatalogo(),
            producto.getDescripcionCompleta(),
            producto.getEstadoAdmin(),
            ap != null ? ap.getEstadoPropuesta() : null,
            ap != null ? ap.getPrecioPropuesto() : null,
            ap != null ? ap.getComision() : null,
            ap != null ? ap.getFechaSubasta() : null,
            fotosBase64,
            ap != null ? ap.getMotivoRechazo() : null,
            ap != null ? ap.getEtapaRechazo() : null,
            dep[0], dep[1],
            (String) venta[0], (BigDecimal) venta[1]
        );
    }
}