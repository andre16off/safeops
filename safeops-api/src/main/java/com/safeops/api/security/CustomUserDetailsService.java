package com.safeops.api.security;

import com.safeops.api.model.Usuario;
import com.safeops.api.repository.UsuarioRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String nombreUsuario)
            throws UsernameNotFoundException {

        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuario)
            .orElseThrow(() -> new UsernameNotFoundException(
                "Usuario no encontrado: " + nombreUsuario
            ));

        return User.builder()
            .username(usuario.getNombreUsuario())
            .password(usuario.getPassword())
            .authorities(List.of(
                new SimpleGrantedAuthority("ROLE_" + usuario.getRol())
            ))
            .build();
    }
}