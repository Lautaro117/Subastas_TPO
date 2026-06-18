package com.example.subastas.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.model.Notificacion;
import com.example.subastas.repository.NotificacionRepository;
import com.example.subastas.repository.UsuarioAuthRepository;

@Service
public class NotificacionService {

    @Autowired
    private NotificacionRepository notificacionRepository;

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    public List<Notificacion> listar(String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return notificacionRepository.findByClienteIdOrderByCreatedAtDesc(usuario.getClienteId());
    }

    public Notificacion marcarLeida(Integer id, String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificacion no encontrada"));

        if (!notificacion.getClienteId().equals(usuario.getClienteId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        notificacion.setLeida(true);
        return notificacionRepository.save(notificacion);
    }

    public int marcarTodasLeidas(String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        List<Notificacion> pendientes = notificacionRepository
                .findByClienteIdAndLeidaFalseOrderByCreatedAtDesc(usuario.getClienteId());

        pendientes.forEach(n -> n.setLeida(true));
        notificacionRepository.saveAll(pendientes);

        return pendientes.size();
    }

    /** Crea una notificacion para un cliente (usado internamente por el backend). */
    public Notificacion crearNotificacion(Integer clienteId, String tipo, String mensaje) {
        Notificacion n = new Notificacion();
        n.setClienteId(clienteId);
        n.setTipo(tipo);
        n.setMensaje(mensaje);
        n.setLeida(false);
        n.setCreatedAt(LocalDateTime.now());
        return notificacionRepository.save(n);
    }

    /** Crea una notificacion para el usuario autenticado (llamado desde el mobile). */
    public Notificacion crearParaUsuario(String email, String tipo, String mensaje) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return crearNotificacion(usuario.getClienteId(), tipo, mensaje);
    }

    /** Devuelve la cantidad de notificaciones no leidas del usuario. */
    public Map<String, Integer> contarNoLeidas(String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        int count = notificacionRepository
                .findByClienteIdAndLeidaFalseOrderByCreatedAtDesc(usuario.getClienteId()).size();
        return Map.of("count", count);
    }
}
