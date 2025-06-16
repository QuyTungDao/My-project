import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUserFromToken, isTokenExpired } from './authUtils';

const ProtectedRoute = ({ children, requiredRole = null, fallbackPath = '/login' }) => {
    console.log("🛡️ ProtectedRoute: Checking access...");
    console.log("🛡️ Required role:", requiredRole);
    console.log("🛡️ Fallback path:", fallbackPath);

    // Kiểm tra token có hết hạn không
    if (isTokenExpired()) {
        console.log("❌ Token expired, redirecting to login");
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    // Lấy thông tin user từ token
    const user = getUserFromToken();
    console.log("👤 ProtectedRoute: Current user:", user);

    if (!user) {
        console.log("❌ No user found, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    // Nếu không yêu cầu role cụ thể, cho phép truy cập
    if (!requiredRole) {
        console.log("✅ No specific role required, access granted");
        return children;
    }

    // Xử lý requiredRole có thể là string hoặc array
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    console.log("🎭 Required roles (array):", requiredRoles);
    console.log("🎭 User role:", user.role);

    // Kiểm tra role với nhiều format khác nhau
    const hasAccess = requiredRoles.some(role => {
        // So sánh trực tiếp
        if (user.role === role) {
            console.log(`✅ Direct match: ${user.role} === ${role}`);
            return true;
        }

        // So sánh với prefix ROLE_
        if (user.role === `ROLE_${role}`) {
            console.log(`✅ Prefix match: ${user.role} === ROLE_${role}`);
            return true;
        }

        // So sánh bỏ prefix ROLE_
        if (user.role?.replace('ROLE_', '') === role) {
            console.log(`✅ No prefix match: ${user.role.replace('ROLE_', '')} === ${role}`);
            return true;
        }

        // So sánh role yêu cầu có prefix với user role không prefix
        if (role?.replace('ROLE_', '') === user.role) {
            console.log(`✅ Reverse match: ${role.replace('ROLE_', '')} === ${user.role}`);
            return true;
        }

        return false;
    });

    console.log("🔐 Access check result:", hasAccess);

    if (hasAccess) {
        console.log("✅ Access granted!");
        return children;
    } else {
        console.log(`❌ Access denied. Redirecting to ${fallbackPath}`);
        console.log(`❌ User role '${user.role}' not in required roles:`, requiredRoles);
        return <Navigate to={fallbackPath} replace />;
    }
};

export default ProtectedRoute;