import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api';
import './Register.css';

export default function Register() {
    const [input, setInput] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'STUDENT'  // Đổi thành chữ hoa để khớp với enum phía server
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous error
        setLoading(true); // Show loading state

        try {
            // ✅ Validation cơ bản
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

            console.log("Đang gửi dữ liệu đăng ký:", input);
            const response = await register(input);
            console.log("Đăng ký thành công:", response);

            // ✅ Hiển thị thông báo thành công và chuyển hướng
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (err) {
            console.error("Lỗi đăng ký:", err);

            if (err.response) {
                // Server responded with an error
                console.error("Status:", err.response.status);
                console.error("Data:", err.response.data);

                // ✅ Xử lý các lỗi cụ thể từ server
                if (err.response.status === 400) {
                    setError(err.response.data || 'Thông tin đăng ký không hợp lệ');
                } else if (err.response.status === 409) {
                    setError('Email đã được sử dụng. Vui lòng chọn email khác.');
                } else {
                    setError(err.response.data || 'Có lỗi xảy ra khi đăng ký');
                }
            } else if (err.request) {
                // Request was made but no response was received
                console.error("Không nhận được phản hồi:", err.request);
                setError('Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.');
            } else {
                // Other errors
                console.error("Lỗi:", err.message);
                setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false); // Hide loading state
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h2 className="register-title">Tạo tài khoản</h2>
                <p className="register-subtitle">Tham gia cộng đồng học tiếng Anh của chúng tôi</p>

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="register-input-group">
                        <input
                            type="text"
                            placeholder="Họ và tên đầy đủ"
                            value={input.fullName}
                            onChange={(e) => setInput({...input, fullName: e.target.value})}
                            className="register-input"
                            required
                        />
                    </div>

                    <div className="register-input-group">
                        <input
                            type="email"
                            placeholder="Địa chỉ email"
                            value={input.email}
                            onChange={(e) => setInput({...input, email: e.target.value})}
                            className="register-input"
                            required
                        />
                    </div>

                    <div className="register-input-group">
                        <input
                            type="password"
                            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                            value={input.password}
                            onChange={(e) => setInput({...input, password: e.target.value})}
                            className="register-input"
                            minLength="6"
                            required
                        />
                    </div>

                    <div className="register-input-group">
                        <select
                            value={input.role}
                            onChange={(e) => setInput({...input, role: e.target.value})}
                            className="register-select"
                        >
                            <option value="STUDENT">🎓 Học viên</option>
                            <option value="TEACHER">👨‍🏫 Giáo viên</option>
                        </select>
                    </div>

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
                                Đang đăng ký...
                            </span>
                        ) : (
                            'Tạo tài khoản'
                        )}
                    </button>
                </form>

                <div className="register-links">
                    <p className="register-login-link">
                        Đã có tài khoản? {' '}
                        <Link
                            to="/login"
                            className="register-link"
                        >
                            Đăng nhập ngay
                        </Link>
                    </p>

                    <div>
                        <Link
                            to="/"
                            className="register-home-link"
                        >
                            ← Quay về trang chủ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}