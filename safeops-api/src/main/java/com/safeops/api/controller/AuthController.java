
package com.safeops.api.controller;

import com.safeops.api.model.Usuario;
import com.safeops.api.repository.UsuarioRepository;
import com.safeops.api.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrar(
            @RequestBody Usuario datos) {

        if (datos.getNombreUsuario() == null
                || datos.getNombreUsuario().isBlank()
                || datos.getPassword() == null
                || datos.getPassword().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje",
                            "El usuario y la contraseña son obligatorios"));
        }

        if (usuarioRepository.existsByNombreUsuario(
                datos.getNombreUsuario())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensaje",
                            "El nombre de usuario ya existe"));
        }

        Usuario usuario = new Usuario();
        usuario.setNombreUsuario(datos.getNombreUsuario());
        usuario.setPassword(
                passwordEncoder.encode(datos.getPassword()));

        // No permitir que el registro público elija el rol ADMIN.
        String rolSolicitado = datos.getRol();
        if ("ADMIN".equalsIgnoreCase(rolSolicitado)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje",
                            "No se puede registrar un ADMIN públicamente"));
        }

        usuario.setRol("USER");
        Usuario guardado = usuarioRepository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "id", guardado.getId(),
                        "nombreUsuario", guardado.getNombreUsuario(),
                        "rol", guardado.getRol(),
                        "mensaje", "Usuario registrado correctamente"
                )
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> datos) {

        String nombreUsuario = datos.get("nombreUsuario");
        String password = datos.get("password");

        if (nombreUsuario == null || password == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje",
                            "El usuario y la contraseña son obligatorios"));
        }

        Usuario usuario = usuarioRepository
                .findByNombreUsuario(nombreUsuario)
                .orElse(null);

        if (usuario == null
                || !passwordEncoder.matches(
                        password, usuario.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje",
                            "Usuario o contraseña incorrectos"));
        }

        String token = jwtService.generarToken(
                usuario.getNombreUsuario(), usuario.getRol());

        return ResponseEntity.ok(
                Map.of(
                        "token", token,
                        "tipo", "Bearer",
                        "nombreUsuario", usuario.getNombreUsuario(),
                        "rol", usuario.getRol()
                )
        );
    }
}
