
package com.safeops.api.service;

import com.safeops.api.exception.RecursoNoEncontradoException;
import com.safeops.api.model.Area;
import com.safeops.api.model.Riesgo;
import com.safeops.api.repository.AreaRepository;
import com.safeops.api.repository.RiesgoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RiesgoService {

    private final RiesgoRepository riesgoRepository;
    private final AreaRepository areaRepository;

    public RiesgoService(
            RiesgoRepository riesgoRepository,
            AreaRepository areaRepository) {
        this.riesgoRepository = riesgoRepository;
        this.areaRepository = areaRepository;
    }

    @Transactional(readOnly = true)
    public List<Riesgo> listar() {
        return riesgoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Riesgo obtenerPorId(Long id) {
        return riesgoRepository.findById(id)
                .orElseThrow(() ->
                        new RecursoNoEncontradoException("Riesgo no encontrado"));
    }

    @Transactional(readOnly = true)
    public List<Riesgo> listarPorArea(Long areaId) {
        return riesgoRepository.findByAreaId(areaId);
    }

    @Transactional(readOnly = true)
    public List<Riesgo> listarPorNivel(String nivel) {
        return riesgoRepository.buscarPorNivel(nivel);
    }

    @Transactional(readOnly = true)
    public List<Riesgo> listarPorImpactoMinimo(Integer impactoMinimo) {
        return riesgoRepository.buscarPorImpactoMinimo(impactoMinimo);
    }

    @Transactional
    public Riesgo registrar(Long areaId, Riesgo riesgo) {
        Area area = areaRepository.findById(areaId)
                .orElseThrow(() ->
                        new RecursoNoEncontradoException("Área no encontrada"));

        riesgo.setArea(area);
        riesgo.setNivel(
                calcularNivel(
                        riesgo.getProbabilidad(),
                        riesgo.getImpacto()
                )
        );

        return riesgoRepository.save(riesgo);
    }

    @Transactional
    public Riesgo actualizar(Long id, Riesgo datosActualizados) {
        Riesgo riesgo = riesgoRepository.findById(id)
                .orElseThrow(() ->
                        new RecursoNoEncontradoException("Riesgo no encontrado"));

        riesgo.setPeligro(datosActualizados.getPeligro());
        riesgo.setDescripcion(datosActualizados.getDescripcion());
        riesgo.setProbabilidad(datosActualizados.getProbabilidad());
        riesgo.setImpacto(datosActualizados.getImpacto());

        riesgo.setNivel(
                calcularNivel(
                        riesgo.getProbabilidad(),
                        riesgo.getImpacto()
                )
        );

        return riesgoRepository.save(riesgo);
    }

    @Transactional
    public void eliminar(Long id) {
        Riesgo riesgo = riesgoRepository.findById(id)
                .orElseThrow(() ->
                        new RecursoNoEncontradoException("Riesgo no encontrado"));

        riesgoRepository.delete(riesgo);
    }

    public String calcularNivel(Integer probabilidad, Integer impacto) {
        int resultado = probabilidad * impacto;

        if (resultado <= 5) {
            return "BAJO";
        }

        if (resultado <= 12) {
            return "MEDIO";
        }

        return "ALTO";
    }
}
