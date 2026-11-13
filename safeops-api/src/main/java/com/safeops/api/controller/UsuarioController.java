package com.safeops.api.controller;

import com.safeops.api.exception.ConflictoException;
import com.safeops.api.exception.RecursoNoEncontradoException;
import com.safeops.api.model.Usuario;
import com.safeops.api.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Administración de usuarios: solo para el rol ADMIN.
// Las respuestas nunca incluyen la contraseña.
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    public UsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> listar() {
        List<Map<String, Object>> usuarios = usuarioRepository.findAll()
                .stream()
                .map(this::sinPassword)
                .toList();

        return ResponseEntity.ok(usuarios);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id,
            Authentication authentication) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() ->
                        new RecursoNoEncontradoException("Usuario no encontrado"));

        if (usuario.getNombreUsuario().equals(authentication.getName())) {
            throw new ConflictoException(
                    "No puedes eliminar tu propia cuenta");
        }

        usuarioRepository.delete(usuario);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> sinPassword(Usuario usuario) {
        Map<String, Object> datos = new LinkedHashMap<>();
        datos.put("id", usuario.getId());
        datos.put("nombreUsuario", usuario.getNombreUsuario());
        datos.put("rol", usuario.getRol());
        return datos;
    }
}
