import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api';
import './Register.css';

export default function Register() {
    const [input, setInput] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const navigate = useNavigate();

    // Password strength calculation
    const calculatePasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '' };
        
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) return { strength: 1, label: 'Weak', color: '#ef4444' };
        if (strength <= 3) return { strength: 2, label: 'Medium', color: '#f59e0b' };
        return { strength: 3, label: 'Strong', color: '#22c55e' };
    };

    const passwordStrength = calculatePasswordStrength(input.password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validation
            if (!input.fullName || !input.email || !input.password) {
                setError('Vui lòng điền đầy đủ thông tin');
                setLoading(false);
                return;
            }

            if (input.password.length < 6) {
                setError('Mật khẩu phải có ít nhất 6 ký tự');
                setLoading(false);
                return;
            }

            if (input.password !== input.confirmPassword) {
                setError('Mật khẩu xác nhận không khớp');
                setLoading(false);
                return;
            }

            if (!acceptTerms) {
                setError('Vui lòng đồng ý với điều khoản sử dụng');
                setLoading(false);
                return;
            }

            const response = await register({
                fullName: input.fullName,
                email: input.email,
                password: input.password,
                role: input.role
            });

            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (err) {
            console.error("Lỗi đăng ký:", err);

            if (err.response) {
                if (err.response.status === 400) {
                    setError(err.response.data || 'Thông tin đăng ký không hợp lệ');
                } else if (err.response.status === 409) {
                    setError('Email đã được sử dụng. Vui lòng chọn email khác.');
                } else {
                    setError(err.response.data || 'Có lỗi xảy ra khi đăng ký');
                }
            } else if (err.request) {
                setError('Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.');
            } else {
                setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-header">
                    <h2 className="register-title">Create Account</h2>
                    <p className="register-subtitle">Welcome to the platform, your future starts here.</p>
                </div>

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="register-input-group">
                        <div className="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={input.fullName}
                            onChange={(e) => setInput({...input, fullName: e.target.value})}
                            className="register-input"
                            required
                        />
                    </div>

                    <div className="register-input-group">
                        <div className="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="5" width="18" height="14" rx="2"/>
                                <polyline points="3 7 12 13 21 7"/>
                            </svg>
                        </div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={input.email}
                            onChange={(e) => setInput({...input, email: e.target.value})}
                            className="register-input"
                            required
                        />
                    </div>

                    <div className="register-input-group">
                        <div className="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={input.password}
                            onChange={(e) => setInput({...input, password: e.target.value})}
                            className="register-input"
                            minLength="6"
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            )}
                        </button>
                    </div>

                    {input.password && (
                        <div className="password-strength">
                            <div className="strength-bars">
                                <div className={`strength-bar ${passwordStrength.strength >= 1 ? 'active' : ''}`} style={{backgroundColor: passwordStrength.strength >= 1 ? passwordStrength.color : '#e2e8f0'}}></div>
                                <div className={`strength-bar ${passwordStrength.strength >= 2 ? 'active' : ''}`} style={{backgroundColor: passwordStrength.strength >= 2 ? passwordStrength.color : '#e2e8f0'}}></div>
                                <div className={`strength-bar ${passwordStrength.strength >= 3 ? 'active' : ''}`} style={{backgroundColor: passwordStrength.strength >= 3 ? passwordStrength.color : '#e2e8f0'}}></div>
                            </div>
                            <span className="strength-label" style={{color: passwordStrength.color}}>{passwordStrength.label}</span>
                        </div>
                    )}

                    <div className="register-input-group">
                        <div className="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            value={input.confirmPassword}
                            onChange={(e) => setInput({...input, confirmPassword: e.target.value})}
                            className="register-input"
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label="Toggle confirm password visibility"
                        >
                            {showConfirmPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            )}
                        </button>
                    </div>

                    <div className="register-input-group">
                        <div className="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                            </svg>
                        </div>
                        <select
                            value={input.role}
                            onChange={(e) => setInput({...input, role: e.target.value})}
                            className="register-select"
                        >
                            <option value="STUDENT">🎓 Student</option>
                            <option value="TEACHER">👨‍🏫 Teacher</option>
                        </select>
                    </div>

                    <label className="terms-checkbox">
                        <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                        />
                        <span>I agree to the <a href="/terms" className="terms-link">Terms & Privacy Policy</a></span>
                    </label>

                    {error && (
                        <div className="register-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="register-button"
                    >
                        {loading ? (
                            <span className="register-loading-text">
                                <span className="register-loading-spinner"></span>
                                Creating account...
                            </span>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="register-footer">
                    <p className="register-login-link">
                        Already have an account? <Link to="/login" className="register-link">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}