package com.hr_management.config;

import com.hr_management.Util.JwtUtil;
import com.hr_management.filter.JwtAuthenticationFilter;
import com.hr_management.Repository.UserRepository;
import com.hr_management.Entity.User;
import com.hr_management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;


    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtUtil, userService);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/departments").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/roles").permitAll()

                        // --- UPDATED HR and DIRECTOR Rules ---
                        .requestMatchers("/api/hr/holidays/**").hasAnyRole("HR", "DIRECTOR")
                        .requestMatchers(HttpMethod.GET, "/api/hr/pending-signups").hasAnyRole("HR", "DIRECTOR")
                        .requestMatchers(HttpMethod.POST, "/api/hr/approve-signup/*").hasAnyRole("HR", "DIRECTOR")
                        .requestMatchers(HttpMethod.POST, "/api/hr/disapprove-signup/*").hasAnyRole("HR", "DIRECTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/hr/delete-signup/*").hasAnyRole("HR", "DIRECTOR")
                        .requestMatchers(HttpMethod.GET, "/api/hr/profiles/verification").hasAnyRole("HR", "DIRECTOR")
                        .requestMatchers(HttpMethod.GET, "/api/hr/profiles/*").hasAnyRole("HR", "DIRECTOR")
                        .requestMatchers(HttpMethod.POST, "/api/hr/profiles/*/approve").hasAnyRole("HR", "DIRECTOR")
                        .requestMatchers(HttpMethod.POST, "/api/hr/profiles/*/reject").hasAnyRole("HR", "DIRECTOR")
                        .requestMatchers("/api/hr/**").hasAnyRole("HR", "DIRECTOR")

                        .requestMatchers(HttpMethod.POST, "/api/departments").hasAnyRole("DIRECTOR", "HR")
                        .requestMatchers(HttpMethod.POST, "/api/roles").hasAnyRole("DIRECTOR", "HR")
                        .requestMatchers(HttpMethod.GET, "/api/departments/stats").hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.GET, "/api/users/hods").hasRole("DIRECTOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/*/status").hasRole("DIRECTOR")

                        .requestMatchers(HttpMethod.POST, "/api/superadmin/approve-hr-signup/*").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/superadmin/disapprove-hr-signup/*").hasRole("SUPER_ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/leaves").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/leaves").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/leaves/balance").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/leaves/pending").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/leaves/stats").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/leaves/*/approve").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/leaves/*/reject").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/subordinates").authenticated()
                        .requestMatchers("/api/documents/view/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/me").authenticated()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}