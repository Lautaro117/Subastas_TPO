package com.example.subastas.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.subastas.model.Adjudicaciones;

public interface AdjudicacionesRepository extends JpaRepository<Adjudicaciones, Integer> {
    Optional<Adjudicaciones> findByItemIdAndAsistenteId(Integer itemId, Integer asistenteId);
    Optional<Adjudicaciones> findByItemId(Integer itemId);
    int countByAsistenteId(Integer asistenteId);
    List<Adjudicaciones> findAllByAsistenteId(Integer asistenteId);

    /**
     * Suma de lo ya ganado (adjudicado) con este medio de pago, en CUALQUIER subasta —
     * esa plata queda reservada para pagar esas compras y no está disponible para pujar
     * en ningún otro lado, aunque todavía no se haya pagado de verdad (eso es otra etapa).
     */
    @Query("SELECT COALESCE(SUM(a.importe), 0) FROM Adjudicaciones a WHERE a.medioPagoId = :medioPagoId")
    BigDecimal sumImporteByMedioPagoId(@Param("medioPagoId") Integer medioPagoId);
}