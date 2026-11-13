
package com.safeops.api.controller;

import com.safeops.api.model.Riesgo;
import com.safeops.api.service.RiesgoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RiesgoController {

    private final RiesgoService riesgoService;

    public RiesgoController(RiesgoService riesgoService) {
        this.riesgoService = riesgoService;
    }

    // Listar todos los riesgos
    @GetMapping("/riesgos")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'GUEST')")
    public ResponseEntity<List<Riesgo>> listar() {
        return ResponseEntity.ok(riesgoService.listar());
    }

    // Consultar un riesgo por su id
    @GetMapping("/riesgos/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'GUEST')")
    public ResponseEntity<Riesgo> obtenerPorId(
            @PathVariable Long id) {
        return ResponseEntity.ok(riesgoService.obtenerPorId(id));
    }

    // Listar riesgos de un área
    @GetMapping("/areas/{areaId}/riesgos")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'GUEST')")
    public ResponseEntity<List<Riesgo>> listarPorArea(
            @PathVariable Long areaId) {

        return ResponseEntity.ok(
                riesgoService.listarPorArea(areaId));
    }

    // Registrar un riesgo
    @PostMapping("/areas/{areaId}/riesgos")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Riesgo> registrar(
            @PathVariable Long areaId,
            @Valid @RequestBody Riesgo riesgo) {

        Riesgo riesgoRegistrado =
                riesgoService.registrar(areaId, riesgo);

        return new ResponseEntity<>(
                riesgoRegistrado, HttpStatus.CREATED);
    }

    // Actualizar un riesgo
    @PutMapping("/riesgos/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Riesgo> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody Riesgo riesgo) {

        return ResponseEntity.ok(
                riesgoService.actualizar(id, riesgo));
    }

    // Eliminar un riesgo: solo ADMIN
    @DeleteMapping("/riesgos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id) {

        riesgoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // Consulta JPQL por nivel de riesgo
    @GetMapping("/riesgos/nivel/{nivel}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'GUEST')")
    public ResponseEntity<List<Riesgo>> listarPorNivel(
            @PathVariable String nivel) {

        return ResponseEntity.ok(
                riesgoService.listarPorNivel(
                        nivel.toUpperCase()));
    }

    // Consulta JPQL por impacto mínimo
    @GetMapping("/riesgos/impacto-minimo/{impacto}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'GUEST')")
    public ResponseEntity<List<Riesgo>> listarPorImpactoMinimo(
            @PathVariable Integer impacto) {

        return ResponseEntity.ok(
                riesgoService.listarPorImpactoMinimo(impacto));
    }
}
