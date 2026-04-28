package com.logitrack.sistema_logistica.service;

import com.logitrack.sistema_logistica.model.Envio;
import com.logitrack.sistema_logistica.repository.EnvioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EnvioService {

    @Autowired
    private EnvioRepository envioRepository;

    // Método para obtener todos los envíos de la base de datos
    public List<Envio> obtenerTodos() {
        return envioRepository.findAll();
    }

    //que pasa si el envío existe o si no se encuentra.
    public Envio buscarPorTracking(String trackingCtg) {
        return envioRepository.buscarPorTracking(trackingCtg)
            .orElseThrow(() -> new RuntimeException("No se encontró el envío con el Tracking ID: " + trackingCtg));
}
}
