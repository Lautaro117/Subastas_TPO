package com.example.subastas.service;

import com.example.subastas.model.*;
import com.example.subastas.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AdminService {

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private MedioPagoRepository medioPagoRepository;

    @Autowired
    private SubastaRepository subastaRepository;

    // --- Gestión de Usuarios ---

    public List<UsuarioAuth> listarUsuarios() {
        return usuarioAuthRepository.findAll();
    }

    public UsuarioAuth actualizarEstadoUsuario(Integer id, String nuevoEstado) {
        UsuarioAuth usuario = usuarioAuthRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        
        usuario.setEstado(nuevoEstado);
        
        // Si el estado pasa a ser verificado (E2 o E4 según lógica), habilitamos al cliente
        if ("E2".equals(nuevoEstado) || "E4".equals(nuevoEstado)) {
            Cliente cliente = clienteRepository.findById(usuario.getClienteId()).orElse(null);
            if (cliente != null) {
                cliente.setAdmitido("si");
                clienteRepository.save(cliente);
            }
        }
        
        return usuarioAuthRepository.save(usuario);
    }

    // --- Gestión de Medios de Pago ---

    public List<MedioPago> listarMediosPendientes() {
        return medioPagoRepository.findAll().stream()
                .filter(m -> "pendiente".equalsIgnoreCase(m.getEstado()) || m.getEstado().contains("pendiente"))
                .toList();
    }

    public MedioPago verificarMedioPago(Integer id) {
        MedioPago medio = medioPagoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medio de pago no encontrado"));
        
        medio.setEstado("verificado");
        return medioPagoRepository.save(medio);
    }

    // --- Gestión de Subastas ---

    public Subasta crearSubasta(Subasta subasta) {
        if (subasta.getEstado() == null) subasta.setEstado("proxima");
        return subastaRepository.save(subasta);
    }

    public Subasta cambiarEstadoSubasta(Integer id, String nuevoEstado) {
        Subasta subasta = subastaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subasta no encontrada"));
        subasta.setEstado(nuevoEstado);
        return subastaRepository.save(subasta);
    }
}
