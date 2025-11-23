package com.codearena.problemservice.config;

import static org.springframework.security.config.Customizer.withDefaults;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Swagger & OpenAPI public
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // Public read endpoints
                        .requestMatchers(HttpMethod.GET, "/problems/**").permitAll()

                        // Admin only for write operations
                        .requestMatchers("/problems/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .httpBasic(withDefaults()); // simple for now: Basic Auth

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        // Simple in-memory users for now (dev / testing)
        UserDetails admin = User.withDefaultPasswordEncoder()
                .username("admin")
                .password("adminpass")
                .roles("ADMIN")
                .build();

        UserDetails user = User.withDefaultPasswordEncoder()
                .username("user")
                .password("userpass")
                .roles("USER")
                .build();

        return new InMemoryUserDetailsManager(admin, user);
    }
}
