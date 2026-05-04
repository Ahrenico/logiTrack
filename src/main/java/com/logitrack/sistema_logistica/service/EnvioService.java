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

        @Autowired
        private Historial_EstadosRepository historialRepository;
        @Autowired
        private EnvioRepository envioRepository;
        @Autowired
        private EstablecimientoRepository establecimientoRepository;
        @Autowired
        private Chofer_DetalleRepository choferDetalleRepository;
        @Autowired
        private CamionRepository camionRepository;
        @Autowired
        private Historial_EstadosRepository historialEstadosRepository;
        @Autowired
        private UsuarioRepository usuarioRepository;

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

        // que pasa si el envío existe o si no se encuentra.
        public Envio buscarPorTracking(String trackingCtg) {
                return envioRepository.buscarPorTracking(trackingCtg)
                                .orElseThrow(() -> new RuntimeException(
                                                "No se encontró el envío con el Tracking ID: " + trackingCtg));
        }

        public List<Historial_Estados> obtenerHistorialPorEnvio(String idEnvio) {
                return historialRepository.buscarHistorialPorEnvio(idEnvio);
        }

        ////////////////////////////////////////////////////////////////////////////////////////////////
        // Lo siguiente se agregó como recomendación de Gemini para
        // cumplir con las funciones que tiene el front.

        @Transactional // Garantiza que si falla el historial, no se guarde el envío a medias
        public Envio actualizarEstadoYPrioridad(String idEnvio, String nuevoEstadoStr, String nuevaPrioridad,
                        Usuario usuarioModificador) {

                // 1. Buscar el envío existente por su ID principal (LT-XXXXXX)
                Envio envio = envioRepository.findById(idEnvio)
                                .orElseThrow(() -> new RuntimeException("No se encontró el envío con ID: " + idEnvio));

                // 2. Capturar el estado actual antes de modificarlo para el historial
                Estado_Envio estadoAnterior = envio.getEstado_actual();

                // Convertir el String que viene del DTO/Frontend al Enum de Java
                Estado_Envio estadoNuevo = Estado_Envio.valueOf(nuevoEstadoStr);

                // 3. Verificar qué datos cambiaron realmente
                boolean estadoCambio = !estadoAnterior.equals(estadoNuevo);
                boolean prioridadCambio = (nuevaPrioridad != null && !nuevaPrioridad.equals(envio.getPrioridad_ia()));

                // Si no hubo cambios reales, simplemente devolvemos el envío tal cual
                if (!estadoCambio && !prioridadCambio) {
                        return envio;
                }

                // 4. Actualizar los valores en el objeto Envio
                if (estadoCambio) {
                        envio.setEstado_actual(estadoNuevo);
                }
                if (prioridadCambio) {
                        envio.setPrioridad_ia(nuevaPrioridad);
                }

                // 5. Guardar el envío actualizado
                Envio envioGuardado = envioRepository.save(envio);

                // 6. Generar el registro de Auditoría SOLO si el estado logístico cambió
                if (estadoCambio) {
                        Historial_Estados historial = Historial_Estados.builder()
                                        .envio(envioGuardado)
                                        .usuario(usuarioModificador)
                                        .estado_anterior(estadoAnterior)
                                        .estado_nuevo(estadoNuevo)
                                        // La fecha_hora se genera sola por el @PrePersist en tu modelo
                                        .build();

                        historialEstadosRepository.save(historial);
                }

                return envioGuardado;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////
}