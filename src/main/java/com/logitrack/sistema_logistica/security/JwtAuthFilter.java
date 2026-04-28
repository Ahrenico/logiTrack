package com.logitrack.sistema_logistica.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.auth0.jwt.exceptions.JWTVerificationException;
import com.logitrack.sistema_logistica.repository.UsuarioRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // Saca el "Bearer " del principio

        try {
            String username = jwtService.validateTokenAndGetUsername(token);

            // Verificamos que el usuario exista en la BD y esté activo
            usuarioRepository.findByUsername(username).ifPresent(usuario -> {
                if (Boolean.TRUE.equals(usuario.getActivo())) {
                    // Cargamos el rol como autoridad de Spring Security
                    var auth = new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name()))
                    );
                    // Registramos la autenticación en el contexto de esta request
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            });

        } catch (JWTVerificationException e) {
            // Token inválido no se autentica
            // El SecurityConfig decidirá si bloquea o no la ruta
        }

        filterChain.doFilter(request, response);
    }
}