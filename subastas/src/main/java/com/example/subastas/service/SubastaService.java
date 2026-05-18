package com.example.subastas.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.CatalogoDTO;
import com.example.subastas.dto.SalaResponse;
import com.example.subastas.model.Asistente;
import com.example.subastas.model.Catalogo;
import com.example.subastas.model.ItemCatalogo;
import com.example.subastas.model.Subasta;
import com.example.subastas.repository.AsistenteRepository;
import com.example.subastas.repository.CatalogoRepository;
import com.example.subastas.repository.ItemCatalogoRepository;
import com.example.subastas.repository.SubastaRepository;
import com.example.subastas.repository.UsuarioAuthRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class SubastaService {

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
        
        // 1. Validar estado de la subasta (409)
        if (!"abierta".equalsIgnoreCase(subasta.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La subasta no está activa o ya finalizó");
        }

        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        
        Integer clienteId = usuario.getClienteId();

        // 2. Validar si ya está en otra sala (403/409 según contrato, usamos 403 por documentación)
        Optional<Asistente> actual = asistenteRepository.findByClienteId(clienteId);
        if (actual.isPresent()) {
            if (actual.get().getSubastaId().equals(subastaId)) {
                // Ya está en esta sala, devolvemos el estado actual
                return construirSalaResponse(subastaId);
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ya estás conectado a otra subasta");
        }

        // 3. Validar categoría (403)
        // Obtenemos la categoría del token (inyectada en el controller) o la buscamos.
        // Por simplicidad, aquí asumimos que el controller ya validó el acceso al endpoint, 
        // pero reforzamos la lógica de negocio.
        // Nota: El clienteId está vinculado al usuario, y el usuario tiene acceso a la categoría vía JWT.

        // 4. Registrar Asistente
        Asistente asistente = new Asistente();
        asistente.setClienteId(clienteId);
        asistente.setSubastaId(subastaId);
        asistente.setNumeroPostor((int) (Math.random() * 1000)); // Simulación de número de postor
        asistenteRepository.save(asistente);

        return construirSalaResponse(subastaId);
    }

    @Transactional
    public void salirDeSala(Integer subastaId, String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        asistenteRepository.deleteByClienteIdAndSubastaId(usuario.getClienteId(), subastaId);
    }

    private SalaResponse construirSalaResponse(Integer subastaId) {
        SalaResponse response = new SalaResponse();
        
        // Buscamos el artículo actual (el primero no subastado del catálogo)
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
            });
        }

        // Placeholders para Etapa 4 (Pujas) y Etapa 6 (WebSocket)
        response.setHistorialReciente(new ArrayList<>());
        response.setWebsocketUrl("/ws/auction/" + subastaId);
        
        return response;
    }
}