export const getUserFromToken = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        // Simple base64 decode of JWT payload (second part)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        console.log('🔍 Decoded token:', decoded);

        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
            console.warn('⚠️ Token expired');
            localStorage.removeItem('token');
            return null;
        }

        return {
            id: decoded.userId || decoded.sub,
            email: decoded.email || decoded.sub,
            role: decoded.role || 'STUDENT',
            fullName: decoded.fullName || decoded.email,
            exp: decoded.exp,
            authorities: decoded.authorities || []
        };
    } catch (error) {
        console.error('❌ Error decoding token:', error);
        localStorage.removeItem('token'); // Remove invalid token
        return null;
    }
};

export const isTokenExpired = () => {
    const user = getUserFromToken();
    return !user; // getUserFromToken already checks expiration
};

export const hasRole = (requiredRole) => {
    const user = getUserFromToken();
    if (!user) return false;

    const userRole = user.role.toUpperCase();
    const required = requiredRole.toUpperCase();

    // Admin has all permissions
    if (userRole === 'ADMIN') return true;

    // Check specific role
    return userRole === required;
};

export const canCreateExam = () => {
    return hasRole('TEACHER') || hasRole('ADMIN');
};

export const canGradeExam = () => {
    return hasRole('TEACHER') || hasRole('ADMIN');
};

export const canViewAllResults = () => {
    return hasRole('TEACHER') || hasRole('ADMIN');
};

export const canDeleteTest = (testCreatorId) => {
    const user = getUserFromToken();
    if (!user) return false;

    // Admin can delete any test
    if (user.role === 'ADMIN') return true;

    // Teacher can only delete their own tests
    return user.role === 'TEACHER' && user.id === testCreatorId;
};

export const getCurrentUser = () => {
    return getUserFromToken();
};