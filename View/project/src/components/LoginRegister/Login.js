import React, {useEffect, useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, checkPassword } from "../../api";

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
            setDebugMessage('Kết quả kiểm tra: ' + result);
        } catch (err) {
            setDebugMessage('Lỗi kiểm tra mật khẩu: ' + (err.message || err));
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-6 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-4">Đăng nhập</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={input.email}
                        onChange={(e) => setInput({ ...input, email: e.target.value })}
                        className="w-full p-2 mb-4 border rounded"
                    />
                    <input
                        type="password"
                        placeholder="Mật khẩu"
                        value={input.password}
                        onChange={(e) => setInput({ ...input, password: e.target.value })}
                        className="w-full p-2 mb-4 border rounded"
                    />
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                {/* ✅ SỬA: Sử dụng Link thay vì href */}
                <p className="mt-4 text-center">
                    Chưa có tài khoản? <Link to="/register" className="text-blue-500 hover:underline">Đăng ký</Link>
                </p>

                {/* Thêm nút xóa token và debug */}
                <div className="mt-6 pt-4 border-t">
                    <button
                        onClick={handleClearTokens}
                        className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 mb-2"
                    >
                        Xóa token và đăng nhập lại
                    </button>

                    <button
                        onClick={() => setShowToken(!showToken)}
                        className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 mb-2"
                    >
                        {showToken ? 'Ẩn thông tin token' : 'Hiển thị thông tin token'}
                    </button>

                    <button
                        onClick={handleCheckPassword}
                        className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
                    >
                        Kiểm tra mật khẩu (Debug)
                    </button>

                    {showToken && token && (
                        <div className="mt-4 p-2 bg-gray-100 rounded">
                            <p className="font-semibold">Token:</p>
                            <p className="text-xs break-all">{token}</p>
                        </div>
                    )}

                    {showToken && (
                        <div className="mt-4 p-2 bg-gray-100 rounded">
                            <p className="font-semibold">Token từ localStorage:</p>
                            <p className="text-xs break-all">{localStorage.getItem('token') || "Không có token"}</p>
                        </div>
                    )}

                    {debugMessage && (
                        <div className="mt-4 p-2 bg-gray-100 rounded">
                            <p className="font-semibold">Thông tin debug:</p>
                            <p className="text-xs break-all">{debugMessage}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}