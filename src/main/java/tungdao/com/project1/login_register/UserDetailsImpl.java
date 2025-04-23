package tungdao.com.project1.login_register;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import tungdao.com.project1.entity.User;

import java.util.Collection;
import java.util.List;

public class UserDetailsImpl implements UserDetails {
    private final int id;
    private final String username;
    @JsonIgnore
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean enabled;

    public UserDetailsImpl(User u) {
        this.id = u.getUserId();
        this.username = u.getEmail();
        this.password = u.getPassword();
        this.authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + u.getRole().name().toUpperCase())
        );
        this.enabled = Boolean.TRUE.equals(u.getIsActive());
    }

    // factory
    public static UserDetailsImpl build(User u) {
        return new UserDetailsImpl(u);
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
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
}
