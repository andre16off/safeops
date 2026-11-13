package com.safeops.api.service;

import com.safeops.api.exception.ConflictoException;
import com.safeops.api.exception.RecursoNoEncontradoException;
import com.safeops.api.model.Area;
import com.safeops.api.repository.AreaRepository;
import com.safeops.api.repository.RiesgoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AreaService {

    private final AreaRepository areaRepository;
    private final RiesgoRepository riesgoRepository;

    public AreaService(
            AreaRepository areaRepository,
            RiesgoRepository riesgoRepository) {
        this.areaRepository = areaRepository;
        this.riesgoRepository = riesgoRepository;
    }

    @Transactional(readOnly = true)
    public List<Area> listar() {
        return areaRepository.findAll();
    }

    @Transactional
    public Area registrar(Area area) {
        return areaRepository.save(area);
    }

    @Transactional(readOnly = true)
    public Area obtenerPorId(Long id) {
        return areaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Área no encontrada"));
    }

    @Transactional
    public Area actualizar(Long id, Area datosActualizados) {
        Area area = obtenerPorId(id);

        area.setNombre(datosActualizados.getNombre());
        area.setUbicacion(datosActualizados.getUbicacion());

        return areaRepository.save(area);
    }

    @Transactional
    public boolean eliminar(Long id) {
        if (!areaRepository.existsById(id)) {
            return false;
        }

        if (riesgoRepository.existsByAreaId(id)) {
            throw new ConflictoException(
                    "No se puede eliminar el área porque tiene riesgos asociados");
        }

        areaRepository.deleteById(id);
        return true;
    }
}