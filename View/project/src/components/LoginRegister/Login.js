import React, {useEffect, useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, checkPassword } from "../../api";
import './Login.css';

export default function Login() {
    const [input, setInput] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState(''); // Thêm state để hiển thị token debug
    const [showToken, setShowToken] = useState(false); // Toggle hiển thị token
    const [debugMessage, setDebugMessage] = useState(''); // Thêm state để hiển thị thông tin debug
    const navigate = useNavigate();

    // Kiểm tra xem người dùng đã đăng nhập chưa khi component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            console.log("User already has a token, redirecting to home page");
            navigate('/');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setDebugMessage('');

        try {
            // Kiểm tra dữ liệu nhập vào
            if (!input.email || !input.password) {
                setError('Vui lòng nhập đầy đủ email và mật khẩu');
                setLoading(false);
                return;
            }

            console.log("Đang gửi dữ liệu đăng nhập:", input);
            const response = await login(input);
            console.log("Phản hồi đăng nhập:", response);

            if (response && (response.token || response.accessToken)) {
                const token = response.token || response.accessToken;

                // Đảm bảo token không có tiền tố "Bearer "
                const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;

                // Lưu token vào localStorage
                localStorage.setItem('token', cleanToken);
                console.log("Token đã lưu (độ dài):", cleanToken.length);
                setToken(cleanToken); // Lưu token vào state để hiển thị debug

                // Thông báo đăng nhập thành công
                alert('Đăng nhập thành công!');

                // Kích hoạt sự kiện storage để cập nhật trạng thái auth trong App.js
                window.dispatchEvent(new Event('storage'));

                // Chuyển hướng sau khi đăng nhập thành công
                // Sử dụng timeout nhỏ để đảm bảo localStorage được cập nhật trước khi chuyển trang
                setTimeout(() => {
                    navigate('/');
                }, 100);

            } else {
                console.error("Không tìm thấy token trong phản hồi:", response);
                setError('Định dạng phản hồi không đúng. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error("Lỗi đăng nhập:", err);
            setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.');
        } finally {
            setLoading(false);
        }
    };

    // Hàm xóa token và đăng nhập lại
    const handleClearTokens = () => {
        localStorage.removeItem('token');
        alert('Đã xóa token. Vui lòng đăng nhập lại.');
        setInput({ email: '', password: '' });
        setToken('');
        setDebugMessage('');
    };

    // Hàm kiểm tra mật khẩu (chỉ dùng cho debug)
    const handleCheckPassword = async () => {
        if (!input.email || !input.password) {
            setDebugMessage('Vui lòng nhập đầy đủ email và mật khẩu để kiểm tra');
            return;
        }

        try {
            setDebugMessage('Đang kiểm tra mật khẩu...');
            const result = await checkPassword(input);
            setDebugMessage('Kết quả kiểm tra: ' + JSON.stringify(result));
        } catch (err) {
            setDebugMessage('Lỗi kiểm tra mật khẩu: ' + (err.message || err));
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Đăng nhập</h2>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-input-group">
                        <input
                            type="email"
                            placeholder="Địa chỉ email"
                            value={input.email}
                            onChange={(e) => setInput({ ...input, email: e.target.value })}
                            className="login-input"
                            required
                        />
                    </div>

                    <div className="login-input-group">
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={input.password}
                            onChange={(e) => setInput({ ...input, password: e.target.value })}
                            className="login-input"
                            required
                        />
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-button"
                    >
                        {loading ? (
                            <span className="login-loading-text">
                                <span className="login-loading-spinner"></span>
                                Đang đăng nhập...
                            </span>
                        ) : (
                            'Đăng nhập'
                        )}
                    </button>
                </form>

                <p className="login-register-link">
                    Chưa có tài khoản? <Link to="/register" className="login-link">Đăng ký ngay</Link>
                </p>

                {/* Debug Section */}
                <div className="login-debug-section">
                    <button
                        onClick={handleClearTokens}
                        className="login-debug-button login-clear-button"
                        type="button"
                    >
                        🗑️ Xóa token và đăng nhập lại
                    </button>

                    <button
                        onClick={() => setShowToken(!showToken)}
                        className="login-debug-button login-toggle-button"
                        type="button"
                    >
                        {showToken ? '🙈 Ẩn thông tin token' : '👁️ Hiển thị thông tin token'}
                    </button>

                    <button
                        onClick={handleCheckPassword}
                        className="login-debug-button login-check-button"
                        type="button"
                    >
                        🔍 Kiểm tra mật khẩu (Debug)
                    </button>

                    {showToken && token && (
                        <div className="login-token-display">
                            <div className="login-token-label">Current Token:</div>
                            <div className="login-token-value">{token}</div>
                        </div>
                    )}

                    {showToken && (
                        <div className="login-token-display">
                            <div className="login-token-label">Token từ localStorage:</div>
                            <div className="login-token-value">
                                {localStorage.getItem('token') || "Không có token"}
                            </div>
                        </div>
                    )}

                    {debugMessage && (
                        <div className="login-debug-message">
                            <div className="login-debug-label">Thông tin debug:</div>
                            <div className="login-debug-text">{debugMessage}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}