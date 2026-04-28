package com.logitrack.sistema_logistica.repository;

import com.logitrack.sistema_logistica.model.Historial_Estados;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Historial_EstadosRepository extends JpaRepository<Historial_Estados, Integer> {
}