
package com.safeops.api.controller;

import com.safeops.api.model.Area;
import com.safeops.api.service.AreaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/areas")
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'GUEST')")
    public ResponseEntity<List<Area>> listar() {
        return ResponseEntity.ok(areaService.listar());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'GUEST')")
    public ResponseEntity<Area> obtenerPorId(
            @PathVariable Long id) {
        return ResponseEntity.ok(areaService.obtenerPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Area> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody Area area) {
        return ResponseEntity.ok(areaService.actualizar(id, area));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Area> registrar(
            @Valid @RequestBody Area area) {

        Area areaRegistrada = areaService.registrar(area);

        return new ResponseEntity<>(
                areaRegistrada, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id) {

        boolean eliminado = areaService.eliminar(id);

        if (!eliminado) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }
}
