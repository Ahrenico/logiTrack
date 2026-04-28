package com.logitrack.sistema_logistica.repository;

import com.logitrack.sistema_logistica.model.Envio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EnvioRepository extends JpaRepository<Envio, String> {
    
    // Forzamos a Hibernate a buscar por el nombre exacto de la variable en el modelo
    @Query("SELECT e FROM Envio e WHERE e.tracking_ctg = :tracking")
    Optional<Envio> buscarPorTracking(@Param("tracking") String tracking);
}