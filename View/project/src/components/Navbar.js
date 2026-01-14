import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserInfo();
        }

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleStorageChange = () => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserInfo();
        } else {
            setUser(null);
        }
    };

    const fetchUserInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsUserDropdownOpen(false);
        setIsMobileMenuOpen(false);
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        setIsUserDropdownOpen(false);
    };

    const toggleUserDropdown = () => {
        setIsUserDropdownOpen(!isUserDropdownOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="navbar-container">
            <nav className="navbar">
                <div className="navbar-content">
                    {/* Logo */}
                    <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
                        EduLearn
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="navbar-menu">
                        <Link 
                            to="/" 
                            className={`navbar-link ${isActive('/') ? 'active' : ''}`}
                        >
                            Home
                        </Link>
                        <Link 
                            to="/online-exam" 
                            className={`navbar-link ${isActive('/online-exam') ? 'active' : ''}`}
                        >
                            Tests
                        </Link>
                        <Link 
                            to="/flashcards" 
                            className={`navbar-link ${isActive('/flashcards') ? 'active' : ''}`}
                        >
                            Flashcards
                        </Link>
                        {user && user.role === 'STUDENT' && (
                            <Link 
                                to="/my-test" 
                                className={`navbar-link ${isActive('/my-test') ? 'active' : ''}`}
                            >
                                My Progress
                            </Link>
                        )}
                        {user && (user.role === 'TEACHER' || user.role === 'ADMIN') && (
                            <>
                                <Link 
                                    to="/create-exam" 
                                    className={`navbar-link ${isActive('/create-exam') ? 'active' : ''}`}
                                >
                                    Create Test
                                </Link>
                                <Link 
                                    to="/admin" 
                                    className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
                                >
                                    Dashboard
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Right Section */}
                    <div className="navbar-right">
                        {user ? (
                            <div className="navbar-user">
                                <span className="navbar-username">{user.fullName}</span>
                                <div className="navbar-user-dropdown-wrapper">
                                    <button 
                                        className="navbar-avatar"
                                        onClick={toggleUserDropdown}
                                        aria-label="User menu"
                                    >
                                        {user.fullName?.charAt(0).toUpperCase() || 'U'}
                                    </button>
                                    {isUserDropdownOpen && (
                                        <div className="navbar-dropdown">
                                            <Link 
                                                to="/profile" 
                                                className="navbar-dropdown-item"
                                                onClick={() => setIsUserDropdownOpen(false)}
                                            >
                                                Profile
                                            </Link>
                                            <button 
                                                onClick={handleLogout}
                                                className="navbar-dropdown-item navbar-logout"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="navbar-auth-links">
                                <Link to="/login" className="navbar-auth-link">Sign In</Link>
                                <Link to="/register" className="navbar-auth-button">Sign Up</Link>
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button 
                            className="navbar-mobile-toggle"
                            onClick={toggleMobileMenu}
                            aria-label="Toggle menu"
                        >
                            <span className="navbar-hamburger"></span>
                            <span className="navbar-hamburger"></span>
                            <span className="navbar-hamburger"></span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="navbar-mobile-menu">
                        <Link 
                            to="/" 
                            className={`navbar-mobile-link ${isActive('/') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            Home
                        </Link>
                        <Link 
                            to="/online-exam" 
                            className={`navbar-mobile-link ${isActive('/online-exam') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            Tests
                        </Link>
                        <Link 
                            to="/flashcards" 
                            className={`navbar-mobile-link ${isActive('/flashcards') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            Flashcards
                        </Link>
                        {user && user.role === 'STUDENT' && (
                            <Link 
                                to="/my-test" 
                                className={`navbar-mobile-link ${isActive('/my-test') ? 'active' : ''}`}
                                onClick={closeMobileMenu}
                            >
                                My Progress
                            </Link>
                        )}
                        {user && (user.role === 'TEACHER' || user.role === 'ADMIN') && (
                            <>
                                <Link 
                                    to="/create-exam" 
                                    className={`navbar-mobile-link ${isActive('/create-exam') ? 'active' : ''}`}
                                    onClick={closeMobileMenu}
                                >
                                    Create Test
                                </Link>
                                <Link 
                                    to="/admin" 
                                    className={`navbar-mobile-link ${isActive('/admin') ? 'active' : ''}`}
                                    onClick={closeMobileMenu}
                                >
                                    Dashboard
                                </Link>
                            </>
                        )}
                        {user && (
                            <>
                                <div className="navbar-mobile-divider"></div>
                                <Link 
                                    to="/profile" 
                                    className="navbar-mobile-link"
                                    onClick={closeMobileMenu}
                                >
                                    Profile
                                </Link>
                                <button 
                                    onClick={handleLogout}
                                    className="navbar-mobile-logout"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                )}
            </nav>
        </div>
    );
}

export default Navbar;