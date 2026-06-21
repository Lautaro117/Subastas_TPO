package com.example.subastas.service;

import java.time.LocalDateTime;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.subastas.model.ItemTimerEstado;
import com.example.subastas.repository.ItemTimerEstadoRepository;

/**
 * Aísla la persistencia del timer (item_timer_estado, ver ItemTimerService) en su
 * PROPIA transacción (REQUIRES_NEW), separada de la del que llama (ej. activarItem
 * en SubastaService).
 *
 * Por qué hace falta esto: si esta tabla tiene un problema (todavía no se creó, falla
 * de conexión, lo que sea) y el error ocurre DENTRO de la misma transacción de
 * activarItem, Spring marca esa transacción como "rollback-only" en el momento del
 * error — atraparlo localmente con un try/catch NO deshace esa marca. Al terminar el
 * método normalmente, Spring intenta hacer commit, ve que está marcada rollback-only,
 * y tira UnexpectedRollbackException de todas formas, aunque el error "ya se haya
 * manejado". Con REQUIRES_NEW, esto pasa en una transacción aparte: si falla, falla
 * solo ella, y la transacción real de la subasta queda intacta.
 */
@Service
public class ItemTimerEstadoService {

    private static final ZoneId ZONA_AR = ZoneId.of("America/Argentina/Buenos_Aires");

    @Autowired
    private ItemTimerEstadoRepository itemTimerEstadoRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void persistir(Integer subastaId, Integer itemId, long deadlineEpochMs, int segundos) {
        ItemTimerEstado estado = new ItemTimerEstado();
        estado.setSubastaId(subastaId);
        estado.setItemId(itemId);
        estado.setDeadlineEpochMs(deadlineEpochMs);
        estado.setTotalSegundos(segundos);
        estado.setUpdatedAt(LocalDateTime.now(ZONA_AR));
        itemTimerEstadoRepository.save(estado);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void borrar(Integer subastaId) {
        itemTimerEstadoRepository.deleteById(subastaId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ItemTimerEstado obtener(Integer subastaId) {
        return itemTimerEstadoRepository.findById(subastaId).orElse(null);
    }
}
