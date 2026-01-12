package tungdao.com.project1.login_register;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import tungdao.com.project1.entity.User;

import java.util.Collection;
import java.util.List;

public class UserDetailsImpl implements UserDetails {
    private static final Logger logger = LoggerFactory.getLogger(UserDetailsImpl.class);

    private final int id;
    private final String username;
    @JsonIgnore
    private final String password;
    private final String fullName;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean enabled;

    public UserDetailsImpl(User u) {
        this.id = u.getId();
        this.username = u.getEmail();
        this.password = u.getPassword();
        this.fullName = u.getFullName();

        // Log thông tin password đã mã hóa để debug
        logger.debug("Creating UserDetailsImpl with encoded password: {}", this.password);

        this.authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + u.getRole().name())
        );
        this.enabled = Boolean.TRUE.equals(u.getIsActive());

        // Log thông tin quyền và trạng thái
        logger.debug("User authorities: {}", this.authorities);
        logger.debug("User enabled status: {}", this.enabled);
    }

    // factory
    public static UserDetailsImpl build(User u) {
        logger.info("Building UserDetailsImpl for user: {}", u.getEmail());
        return new UserDetailsImpl(u);
    }

    public String getFullName() {
        return fullName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    public int getId() {
        return id;
    }

    // 3 method còn lại thường để true
    @Override public boolean isAccountNonExpired() {
        return true;
    }

    @Override public boolean isAccountNonLocked() {
        return true;
    }

    @Override public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public String toString() {
        return "UserDetailsImpl{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", fullName='" + fullName + '\'' +
                ", enabled=" + enabled +
                ", authorities=" + authorities +
                '}';
    }
}