package com.example.subastas.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.subastas.dto.AuctionEventDTO;

@Service
public class AuctionNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public AuctionNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notificarNuevaPuja(Integer subastaId, Object salaActualizada) {
        String destination = "/topic/auction/" + subastaId;
        messagingTemplate.convertAndSend(destination, new AuctionEventDTO("bid.new", salaActualizada));
    }

    public void notificarSiguienteItem(Integer subastaId, Object itemData) {
        String destination = "/topic/auction/" + subastaId;
        messagingTemplate.convertAndSend(destination, new AuctionEventDTO("item.next", itemData));
    }

    public void notificarCierre(Integer subastaId) {
        String destination = "/topic/auction/" + subastaId;
        messagingTemplate.convertAndSend(destination, new AuctionEventDTO("auction.closed", null));
    }
 

}
