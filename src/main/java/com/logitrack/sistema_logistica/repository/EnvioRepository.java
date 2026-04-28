package com.logitrack.sistema_logistica.repository;

import com.logitrack.sistema_logistica.model.Envio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvioRepository extends JpaRepository<Envio, String> {
}