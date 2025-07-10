// AdminSidebar.js - Updated với logout functionality
import React from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ THÊM: Import useNavigate
import {
    BarChart3,
    BookOpen,
    Users,
    CreditCard,
    Settings,
    LogOut
} from 'lucide-react';
import { logout } from '../../api'; // ✅ THÊM: Import logout function

export const AdminSidebar = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate(); // ✅ THÊM: Initialize navigation

    const navItems = [
        {
            id: 'overview',
            label: 'Tổng quan',
            icon: <BarChart3 className="nav-icon" />
        },
        {
            id: 'tests',
            label: 'Quản lý bài thi',
            icon: <BookOpen className="nav-icon" />
        },
        {
            id: 'users',
            label: 'Quản lý người dùng',
            icon: <Users className="nav-icon" />
        },
        {
            id: 'flashcards',
            label: 'Quản lý Flashcards',
            icon: <CreditCard className="nav-icon" />
        },
        {
            id: 'settings',
            label: 'Cài đặt',
            icon: <Settings className="nav-icon" />
        }
    ];

    // ✅ THÊM: Handle logout function
    const handleLogout = () => {
        try {
            console.log('Logging out from admin dashboard...');

            // ✅ Show confirmation dialog
            const confirmed = window.confirm('Bạn có chắc chắn muốn đăng xuất không?');

            if (confirmed) {
                // ✅ Call logout function from api.js
                logout();

                // ✅ Show success message
                alert('Đăng xuất thành công!');

                // ✅ Navigate to login page
                navigate('/login');

                console.log('✅ Logout completed successfully');
            }
        } catch (error) {
            console.error('❌ Error during logout:', error);
            alert('Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.');
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-title">🎓 Admin Dashboard</h1>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-items">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="sidebar-footer">
                    {/* ✅ CẬP NHẬT: Logout button với handler */}
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        title="Đăng xuất khỏi hệ thống"
                    >
                        <LogOut className="nav-icon" />
                        Đăng xuất
                    </button>
                </div>
            </nav>
        </div>
    );
};