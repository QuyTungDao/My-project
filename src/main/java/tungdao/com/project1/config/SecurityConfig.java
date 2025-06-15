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
                        // ✅ CORS preflight requests - MUST be first
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ✅ Error handling
                        .requestMatchers("/error").permitAll()

                        // ✅ PUBLIC: Authentication endpoints (login/register)
                        .requestMatchers("/api/auth/**").permitAll()

                        // ===== FLASHCARD ENDPOINTS =====

                        // ✅ PUBLIC: Flashcard browsing (anyone can view available flashcards and sets)
                        .requestMatchers(HttpMethod.GET, "/api/flashcards/public").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/flashcards/sets").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/flashcards/sets/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/flashcards/search").permitAll()

                        // ✅ AUTHENTICATED: Flashcard learning (any logged-in user can study)
                        .requestMatchers(HttpMethod.GET, "/api/flashcards/study/today").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/flashcards/rate").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/flashcards/statistics").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/flashcards/my-cards").authenticated()

                        // ✅ TEACHER+ ONLY: Creating and managing flashcards
                        .requestMatchers(HttpMethod.POST, "/api/flashcards/create").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/flashcards/**").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/flashcards/**").hasAnyRole("TEACHER", "ADMIN")

                        // ===== TEST ENDPOINTS =====

                        // ✅ PUBLIC: Test browsing (anyone can view available tests)
                        .requestMatchers(HttpMethod.GET, "/api/test").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/test/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/test/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/test/correct-answer/{questionId}").permitAll()

                        // ✅ AUTHENTICATED: Taking tests (any logged-in user can take tests)
                        .requestMatchers(HttpMethod.POST, "/api/test/attempts").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/test/validate-audio-response").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/test/attempts/{attemptId}/audio-stats").authenticated()

                        // ✅ AUTHENTICATED: Test attempt results (users can view their own results)
                        .requestMatchers("/api/test-attempts/**").authenticated()

                        // ✅ TEACHER+ ONLY: Creating and managing tests
                        .requestMatchers(HttpMethod.POST, "/api/test/create").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/test/{id}/update").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/test/{id}/delete").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/test/tests/{testId}/questions/batch").hasAnyRole("TEACHER", "ADMIN")

                        // ✅ TEACHER+ ONLY: Test management and file operations
                        .requestMatchers(HttpMethod.POST, "/api/test/upload").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/test/upload-audio").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/test/validate-file").hasAnyRole("TEACHER", "ADMIN")

                        // ✅ TEACHER+ ONLY: Getting own tests and management endpoints
                        .requestMatchers(HttpMethod.GET, "/api/test/my-tests").hasAnyRole("TEACHER", "ADMIN")

                        // ✅ ADMIN ONLY: Administrative functions
                        .requestMatchers(HttpMethod.GET, "/api/test/admin/all-tests").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // ✅ ADMIN ONLY: User management (if you have these endpoints)
                        .requestMatchers(HttpMethod.GET, "/api/users/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/users/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/users/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")

                        // ===== MVC VIEWS =====

                        // ✅ AUTHENTICATED: Flashcard MVC views
                        .requestMatchers("/flashcards/**").authenticated()

                        // ✅ AUTHENTICATED: All other test-related endpoints require login
                        .requestMatchers("/api/test/**").authenticated()
                        .requestMatchers("/api/tests/**").authenticated()

                        // ✅ DEFAULT: All other requests require authentication
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider());

        // ✅ Add JWT filter before username/password authentication filter
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