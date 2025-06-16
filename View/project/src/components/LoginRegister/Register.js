import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api';

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
        <div className="flex items-center justify-center min-h-screen bg-gray-100 py-8">
            <div className="bg-white p-6 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Đăng ký tài khoản</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Họ và tên"
                            value={input.fullName}
                            onChange={(e) => setInput({...input, fullName: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={input.email}
                            onChange={(e) => setInput({...input, email: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <input
                            type="password"
                            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                            value={input.password}
                            onChange={(e) => setInput({...input, password: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            minLength="6"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <select
                            value={input.role}
                            onChange={(e) => setInput({...input, role: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="STUDENT">🎓 Học viên</option>
                            <option value="TEACHER">👨‍🏫 Giáo viên</option>
                        </select>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition duration-200 font-medium"
                    >
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                </form>

                {/* ✅ SỬA: Sử dụng Link thay vì href */}
                <p className="mt-6 text-center text-gray-600">
                    Đã có tài khoản? {' '}
                    <Link
                        to="/login"
                        className="text-blue-500 hover:text-blue-700 hover:underline font-medium"
                    >
                        Đăng nhập
                    </Link>
                </p>

                {/* ✅ Thêm link về trang chủ */}
                <div className="mt-4 text-center">
                    <Link
                        to="/"
                        className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                    >
                        ← Về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}