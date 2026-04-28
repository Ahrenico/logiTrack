package com.logitrack.sistema_logistica.service;

import com.logitrack.sistema_logistica.dto.EnvioRequestDTO;
import com.logitrack.sistema_logistica.model.*;
import com.logitrack.sistema_logistica.model.enums.Estado_Envio;
import com.logitrack.sistema_logistica.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class EnvioService {

    @Autowired private Historial_EstadosRepository historialRepository;
    @Autowired private EnvioRepository envioRepository;
    @Autowired private EstablecimientoRepository establecimientoRepository;
    @Autowired private Chofer_DetalleRepository choferDetalleRepository;
    @Autowired private CamionRepository camionRepository;
    @Autowired private Historial_EstadosRepository historialEstadosRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    @Transactional // Si algo falla, no se guarda ni el envío ni el historial
    public Envio crearNuevoEnvio(EnvioRequestDTO dto) {
        
        // 1. Buscar todas las relaciones en la Base de Datos
        Establecimiento origen = establecimientoRepository.findById(dto.getId_origen())
                .orElseThrow(() -> new RuntimeException("Establecimiento de origen no encontrado"));
                
        Establecimiento destino = establecimientoRepository.findById(dto.getId_destino())
                .orElseThrow(() -> new RuntimeException("Establecimiento de destino no encontrado"));
                
        Chofer_Detalle chofer = choferDetalleRepository.findById(dto.getId_chofer())
                .orElseThrow(() -> new RuntimeException("Chofer no encontrado"));
                
        Camion camion = camionRepository.findById(dto.getPatente_camion())
                .orElseThrow(() -> new RuntimeException("Camión no encontrado"));
                
        Usuario usuarioCreador = usuarioRepository.findById(dto.getId_usuario_creador())
                .orElseThrow(() -> new RuntimeException("Usuario creador no encontrado"));

        // 2. Construir el objeto Envio
        Envio nuevoEnvio = Envio.builder()
                .tracking_ctg(dto.getTracking_ctg())
                .cpe(dto.getCpe())
                .origen(origen)
                .destino(destino)
                .chofer(chofer)
                .camion(camion)
                .tipo_grano(dto.getTipo_grano())
                .prioridad_ia(dto.getPrioridad_ia())
                .kg_origen(dto.getKg_origen())
                .estado_actual(Estado_Envio.PENDIENTE) // Todo envío nace como PENDIENTE
                .build();

        // 3. Guardar el Envío (Acá se autogenera el id "LT-XXXXXX" y la fecha)
        nuevoEnvio = envioRepository.save(nuevoEnvio);

        // 4. Crear y guardar el Historial inicial
        Historial_Estados historial = Historial_Estados.builder()
                .envio(nuevoEnvio)
                .usuario(usuarioCreador)
                .estado_nuevo(Estado_Envio.PENDIENTE)
                // estado_anterior queda en null porque es el primer estado
                .build();
                
        historialEstadosRepository.save(historial);

        // 5. Retornar el envío ya creado
        return nuevoEnvio;
    }

    //que pasa si el envío existe o si no se encuentra.
    public Envio buscarPorTracking(String trackingCtg) {
        return envioRepository.buscarPorTracking(trackingCtg)
            .orElseThrow(() -> new RuntimeException("No se encontró el envío con el Tracking ID: " + trackingCtg));
    }

    public List<Historial_Estados> obtenerHistorialPorEnvio(String idEnvio) {
    return historialRepository.buscarHistorialPorEnvio(idEnvio);
}
}
