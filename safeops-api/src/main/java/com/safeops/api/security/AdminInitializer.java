
package com.safeops.api.security;

import com.safeops.api.model.Usuario;
import com.safeops.api.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {

    @Bean
    public CommandLineRunner crearUsuariosIniciales(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${safeops.admin.password}") String adminPassword,
            @Value("${safeops.invitado.password}") String invitadoPassword) {

        return args -> {
            asegurarUsuario(usuarioRepository, passwordEncoder,
                    "superadmin", adminPassword, "ADMIN");

            asegurarUsuario(usuarioRepository, passwordEncoder,
                    "invitado", invitadoPassword, "GUEST");
        };
    }

    // Crea el usuario inicial si no existe. Si ya existe pero su contraseña
    // guardada no coincide con la configurada, la actualiza.
    private void asegurarUsuario(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            String nombreUsuario,
            String password,
            String rol) {

        Usuario usuario = usuarioRepository
                .findByNombreUsuario(nombreUsuario)
                .orElse(null);

        if (usuario == null) {
            usuario = new Usuario();
            usuario.setNombreUsuario(nombreUsuario);
            usuario.setPassword(passwordEncoder.encode(password));
            usuario.setRol(rol);
            usuarioRepository.save(usuario);

            System.out.println(
                    "Usuario inicial creado: " + nombreUsuario);
            return;
        }

        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            usuario.setPassword(passwordEncoder.encode(password));
            usuarioRepository.save(usuario);

            System.out.println(
                    "Contraseña del usuario inicial sincronizada: "
                            + nombreUsuario);
        }
    }
}
