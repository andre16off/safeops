package com.safeops.api;

import com.safeops.api.model.Area;
import com.safeops.api.model.Riesgo;
import com.safeops.api.repository.AreaRepository;
import com.safeops.api.repository.RiesgoRepository;
import com.safeops.api.service.RiesgoService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RiesgoServiceTest {

    @Mock
    private RiesgoRepository riesgoRepository;

    @Mock
    private AreaRepository areaRepository;

    @InjectMocks
    private RiesgoService riesgoService;

    @Test
    void debeCalcularNivelAlto() {

        String resultado = riesgoService.calcularNivel(3, 5);

        assertEquals("ALTO", resultado);
    }

    @Test
    void debeRegistrarRiesgoCorrectamente() {

        Area area = new Area();
        area.setId(1L);
        area.setNombre("Almacén");
        area.setUbicacion("Área de almacenamiento principal");

        Riesgo riesgo = new Riesgo();
        riesgo.setPeligro("Piso mojado");
        riesgo.setDescripcion("Posible caída del personal");
        riesgo.setProbabilidad(3);
        riesgo.setImpacto(5);

        when(areaRepository.findById(1L))
                .thenReturn(Optional.of(area));

        when(riesgoRepository.save(riesgo))
                .thenReturn(riesgo);

        Riesgo resultado = riesgoService.registrar(1L, riesgo);

        assertEquals("ALTO", resultado.getNivel());
        assertEquals(area, resultado.getArea());

        verify(areaRepository).findById(1L);
        verify(riesgoRepository).save(riesgo);
    }

    @Test
    void debeRechazarProbabilidadMayorQueCinco() {

        Riesgo riesgo = new Riesgo();
        riesgo.setPeligro("Piso mojado");
        riesgo.setDescripcion("Posible caída del personal");
        riesgo.setProbabilidad(6);
        riesgo.setImpacto(5);

        ValidatorFactory factory =
                Validation.buildDefaultValidatorFactory();

        Validator validator = factory.getValidator();

        Set<ConstraintViolation<Riesgo>> errores =
                validator.validate(riesgo);

        assertEquals(1, errores.size());

        factory.close();
    }
}