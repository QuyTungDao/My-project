package tungdao.com.project1.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tungdao.com.project1.login_register.AuthEntryPointJwt;
import tungdao.com.project1.login_register.AuthTokenFilter;
import tungdao.com.project1.login_register.JwtUtils;
import tungdao.com.project1.service.UserDetailsServiceImpl;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    private final AuthEntryPointJwt unauthorizedHandler;
    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;

    public SecurityConfig(AuthEntryPointJwt unauthorizedHandler,
                          JwtUtils jwtUtils,
                          UserDetailsServiceImpl userDetailsService) {
        this.unauthorizedHandler = unauthorizedHandler;
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter(jwtUtils, userDetailsService);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());

        // Bật debug - hiển thị các lỗi chi tiết khi xác thực
        authProvider.setHideUserNotFoundExceptions(false);

        return authProvider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(withDefaults())
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Cho phép truy cập không cần xác thực
                        .requestMatchers("/api/auth/**").permitAll()

                        // Các endpoint GET cho test không yêu cầu xác thực
                        .requestMatchers(HttpMethod.GET, "/api/test/**").permitAll()
                        // Endpoint upload audio không yêu cầu xác thực
                        .requestMatchers("/api/test/upload-audio").permitAll()

                        // YÊU CẦU XÁC THỰC CHO CÁC ENDPOINT TẠO BÀI THI
                        .requestMatchers(HttpMethod.POST, "/api/test/create", "/test/create").authenticated()
                        // YÊU CẦU XÁC THỰC CHO CÁC ENDPOINT NỘP BÀI THI
                        .requestMatchers(HttpMethod.POST, "/api/test/attempts").authenticated()

                        // Các endpoint khác trong /api/test/ cho phép truy cập
                        .requestMatchers("/api/test/**").permitAll()

                        // Cho phép /api/tests/** và /api/test-attempts/**
                        .requestMatchers("/api/tests/**").permitAll()
                        .requestMatchers("/api/test-attempts/**").permitAll()

                        // Các endpoint khác yêu cầu xác thực
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider());

        http.addFilterBefore(authenticationJwtTokenFilter(),
                UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}