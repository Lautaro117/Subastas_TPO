package com.example.subastas.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.model.Notificacion;
import com.example.subastas.repository.NotificacionRepository;
import com.example.subastas.repository.UsuarioAuthRepository;

@Service
public class NotificacionService {

    // Fijo (no el default del JVM del servidor) para que la hora mostrada al usuario
    // no quede corrida si el host no está configurado en horario argentino.
    private static final ZoneId ZONA_AR = ZoneId.of("America/Argentina/Buenos_Aires");

    /**
     * Tipo interno (no se le muestra al usuario): se crea cuando alguien toca la campanita
     * de un ítem que todavía no se subastó. mensaje = itemId como String. Cuando ese ítem
     * pasa a ser "próximo a subastarse" (arranca su cooldown), SubastaService busca todas
     * las marcas pendientes para ese itemId y le manda a cada cliente una notificación real
     * de tipo "campanita_item". No usa una tabla nueva: reaprovecha "notificaciones".
     */
    public static final String TIPO_CAMPANITA_PENDIENTE = "campanita_pendiente";

    @Autowired
    private NotificacionRepository notificacionRepository;

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    public List<Notificacion> listar(String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return notificacionRepository.findByClienteIdOrderByCreatedAtDesc(usuario.getClienteId())
                .stream()
                .filter(n -> !TIPO_CAMPANITA_PENDIENTE.equals(n.getTipo()))
                .collect(Collectors.toList());
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
                .findByClienteIdAndLeidaFalseOrderByCreatedAtDesc(usuario.getClienteId())
                .stream()
                .filter(n -> !TIPO_CAMPANITA_PENDIENTE.equals(n.getTipo()))
                .collect(Collectors.toList());

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
        n.setCreatedAt(LocalDateTime.now(ZONA_AR));
        return notificacionRepository.save(n);
    }

    /** Crea una notificacion para el usuario autenticado (llamado desde el mobile). */
    public Notificacion crearParaUsuario(String email, String tipo, String mensaje) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return crearNotificacion(usuario.getClienteId(), tipo, mensaje);
    }

    /**
     * Notifica a todos los clientes que marcaron la campanita de este ítem que está a punto
     * de subastarse (se llama cuando arranca el cooldown de 30s hacia este ítem), y consume
     * (marca leída) la marca pendiente para que no se vuelva a disparar.
     */
    public void notificarCampanitaItem(Integer itemId, String descripcionProducto) {
        List<Notificacion> marcas = notificacionRepository.findByTipoAndMensajeAndLeidaFalse(
                TIPO_CAMPANITA_PENDIENTE, String.valueOf(itemId));
        if (marcas.isEmpty()) return;

        String desc = descripcionProducto != null ? descripcionProducto : "Un producto";
        for (Notificacion marca : marcas) {
            crearNotificacion(marca.getClienteId(), "campanita_item",
                    "🔔 \"" + desc + "\" va a subastarse en breve, no te lo pierdas");
            marca.setLeida(true);
        }
        notificacionRepository.saveAll(marcas);
    }

    /** Devuelve la cantidad de notificaciones no leidas del usuario. */
    public Map<String, Integer> contarNoLeidas(String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        long count = notificacionRepository
                .findByClienteIdAndLeidaFalseOrderByCreatedAtDesc(usuario.getClienteId())
                .stream()
                .filter(n -> !TIPO_CAMPANITA_PENDIENTE.equals(n.getTipo()))
                .count();
        return Map.of("count", (int) count);
    }
}
