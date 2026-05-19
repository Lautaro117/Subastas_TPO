package com.example.subastas.service;

import com.example.subastas.dto.AuctionEventDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class AuctionNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notificarNuevaPuja(Integer subastaId, BigDecimal monto, String moneda, Integer pujoId) {
        // Notificar a todos los asistentes de la sala
        String destination = "/topic/auction/" + subastaId;
        
        // Evento bid.new (Broadcast general)
        AuctionEventDTO.BidNewPayload payload = new AuctionEventDTO.BidNewPayload(monto, moneda, false);
        messagingTemplate.convertAndSend(destination, new AuctionEventDTO("bid.new", payload));
        
        // Evento bid.confirmed (Podría ser privado al usuario, pero aquí lo enviamos al canal de la sala por simplicidad)
        AuctionEventDTO.BidConfirmedPayload confirmed = new AuctionEventDTO.BidConfirmedPayload(pujoId, "confirmada");
        messagingTemplate.convertAndSend(destination, new AuctionEventDTO("bid.confirmed", confirmed));
    }

    public void notificarSiguienteItem(Integer subastaId, Object itemData) {
        String destination = "/topic/auction/" + subastaId;
        messagingTemplate.convertAndSend(destination, new AuctionEventDTO("item.next", itemData));
    }
}
