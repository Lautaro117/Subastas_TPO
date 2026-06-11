package com.example.subastas.service;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.subastas.dto.AuctionEventDTO;

@Service
public class AuctionNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notificarNuevaPuja(Integer subastaId, BigDecimal monto, String moneda, String postor) {
        String destination = "/topic/auction/" + subastaId;
        AuctionEventDTO.BidNewPayload payload = new AuctionEventDTO.BidNewPayload(monto, moneda, false);
        messagingTemplate.convertAndSend(destination, new AuctionEventDTO("bid.new", payload));
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
