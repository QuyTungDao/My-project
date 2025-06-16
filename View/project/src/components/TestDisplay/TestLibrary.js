import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TestLibrary.css';
import { getAllTests, deleteTest } from "../../api";

export default function TestLibrary() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    // State để theo dõi ID của test đang mở menu
    const [activeMenuId, setActiveMenuId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTests = async () => {
            try {
                setLoading(true);
                console.log("Đang gọi API để lấy danh sách đề thi...");

                // Kiểm tra token
                const token = localStorage.getItem('token');
                console.log("Token hiện tại:", token ? "Có token" : "Không có token");

                if (!token) {
                    setError("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem danh sách đề thi.");
                    setLoading(false);
                    return;
                }

                // Sử dụng hàm từ api.js
                const data = await getAllTests();
                console.log("Dữ liệu nhận được từ API:", data);

                if (data && Array.isArray(data)) {
                    if (data.length === 0) {
                        setError("Không có bài thi nào trong hệ thống.");
                    } else {
                        // Map data từ API vào state
                        const formattedTests = data.map(test => ({
                            id: test.id,
                            title: test.testName,
                            duration: `${test.durationMinutes} phút`,
                            code: `${test.id}${Math.floor(1000 + Math.random() * 9000)}`,
                            score: test.passingScore ? `${test.passingScore}` : '5.0',
                            questions: `${test.testType === 'READING' ? '3 phần thi' : '4 phần thi'} | ${Math.floor(20 + Math.random() * 20)} câu hỏi`,
                            tags: [
                                'IELTS Academic',
                                test.testType ? test.testType.charAt(0) + test.testType.slice(1).toLowerCase() : 'Unknown'
                            ]
                        }));

                        setTests(formattedTests);
                    }
                } else {
                    console.error("API response format unexpected:", data);
                    setError("Định dạng dữ liệu không đúng từ máy chủ.");
                }
            } catch (err) {
                console.error('Error fetching tests:', err);

                if (err.response) {
                    console.error("Error response:", err.response);

                    if (err.response.status === 401) {
                        // Thay đổi cách xử lý lỗi 401
                        setError("Phiên đăng nhập có vấn đề. Nhấn nút 'Thử lại' hoặc đăng nhập lại.");
                        // KHÔNG chuyển hướng tự động về trang login
                        // KHÔNG xóa token
                    } else {
                        setError(`Lỗi từ máy chủ: ${err.response.status} - ${err.response.statusText}`);
                    }
                } else if (err.request) {
                    console.error("Error request:", err.request);
                    setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.");
                } else {
                    setError(`Lỗi: ${err.message}`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTests();

        // Đóng menu khi click ra ngoài
        const handleClickOutside = (event) => {
            if (activeMenuId && !event.target.closest('.menu-dropdown') &&
                !event.target.closest('.menu-button')) {
                setActiveMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [navigate]);

    const handleSearch = async () => {
        // Xử lý tìm kiếm
    };

    // Thêm hàm thử lại
    const handleRetry = () => {
        setLoading(true);
        setError(null);
        setTimeout(() => {
            const fetchTestsAgain = async () => {
                try {
                    const data = await getAllTests();
                    if (data && Array.isArray(data)) {
                        const formattedTests = data.map(test => ({
                            id: test.id,
                            title: test.testName,
                            duration: `${test.durationMinutes} phút`,
                            code: `${test.id}${Math.floor(1000 + Math.random() * 9000)}`,
                            score: test.passingScore ? `${test.passingScore}` : '5.0',
                            questions: `${test.testType === 'READING' ? '3 phần thi' : '4 phần thi'} | ${Math.floor(20 + Math.random() * 20)} câu hỏi`,
                            tags: [
                                'IELTS Academic',
                                test.testType ? test.testType.charAt(0) + test.testType.slice(1).toLowerCase() : 'Unknown'
                            ]
                        }));
                        setTests(formattedTests);
                    } else {
                        setError("Không tìm thấy bài thi nào.");
                    }
                } catch (err) {
                    console.error("Lỗi khi thử lại:", err);
                    setError("Vẫn không thể tải dữ liệu. Vui lòng đăng nhập lại.");
                    // Nếu thử lại vẫn thất bại, cho phép chuyển về trang login
                    navigate('/login');
                } finally {
                    setLoading(false);
                }
            };
            fetchTestsAgain();
        }, 1000);
    };

    const handleViewDetail = (testId) => {
        navigate(`/test-detail/${testId}`);
    };

    const handleLogin = () => {
        navigate('/login');
    };

    // Hàm xử lý khi click vào nút menu
    const toggleMenu = (testId, e) => {
        e.stopPropagation(); // Ngăn chặn sự kiện lan ra ngoài
        setActiveMenuId(activeMenuId === testId ? null : testId);
    };

    // Hàm điều hướng đến trang chỉnh sửa
    const handleEditTest = (testId) => {
        // Điều hướng đến trang tạo/chỉnh sửa bài thi với tham số id
        navigate(`/create-exam?id=${testId}`);
    };

    // Hàm xử lý xóa bài thi
    const handleDeleteTest = async (testId) => {
        // Hiển thị hộp thoại xác nhận trước khi xóa
        if (window.confirm("Bạn có chắc chắn muốn xóa bài thi này không?")) {
            try {
                setLoading(true); // Hiển thị trạng thái đang tải

                // Gọi API để xóa bài thi từ cơ sở dữ liệu
                await deleteTest(testId);

                console.log("Đã xóa bài thi với ID:", testId);

                // Sau khi xóa thành công, cập nhật lại danh sách
                setTests(tests.filter(test => test.id !== testId));
                setActiveMenuId(null); // Đóng menu

                // Thông báo xóa thành công
                alert("Bài thi đã được xóa thành công!");
            } catch (err) {
                console.error("Lỗi khi xóa bài thi:", err);

                // Hiển thị thông báo lỗi chi tiết
                let errorMessage = "Có lỗi xảy ra khi xóa bài thi: ";

                if (err.response) {
                    console.error("Error response:", err.response);
                    if (err.response.status === 404) {
                        errorMessage = "Không tìm thấy bài thi này. Có thể bài thi đã bị xóa trước đó.";
                        // Cập nhật danh sách để loại bỏ bài thi không tồn tại
                        setTests(tests.filter(test => test.id !== testId));
                    } else if (err.response.status === 401 || err.response.status === 403) {
                        errorMessage = "Bạn không có quyền xóa bài thi này hoặc phiên làm việc đã hết hạn. Bài thi vẫn tồn tại.";
                        // KHÔNG chuyển hướng về trang login
                    } else {
                        errorMessage += err.response.data || `${err.response.status} - ${err.response.statusText}`;
                    }
                } else if (err.request) {
                    errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
                } else {
                    errorMessage += err.message || "Lỗi không xác định";
                }

                setError(errorMessage);
                alert(errorMessage);
            } finally {
                setLoading(false); // Kết thúc trạng thái đang tải
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-center text-black mb-6">Thư viện đề thi</h1>

            {/* Thanh tìm kiếm */}
            <div className="flex justify-center mb-6">
                <div className="flex w-full max-w-md">
                    <input
                        type="text"
                        placeholder="Nhập từ khóa để tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition-colors"
                    >
                        Tìm kiếm
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-center mb-4 p-4 bg-red-50 rounded-lg">
                    <p className="font-semibold">Lỗi:</p>
                    <p>{error}</p>
                    <div className="mt-4 flex justify-center space-x-4">
                        <button
                            onClick={handleRetry}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                            Thử lại
                        </button>
                        <button
                            onClick={handleLogin}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                        >
                            Đăng nhập lại
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2">Đang tải...</p>
                </div>
            ) : tests.length === 0 && !error ? (
                <div className="text-center py-10 bg-white p-8 rounded-lg shadow">
                    <p className="text-lg font-semibold mb-2">Không tìm thấy bài thi nào.</p>
                    <p className="text-gray-600">Có thể chưa có bài thi nào được thêm vào hệ thống hoặc bài thi đang bị ẩn.</p>
                </div>
            ) : (
                <div className="test-list">
                    {tests.map((test, index) => (
                        <div key={index} className="test-item relative">
                            {/* Nút menu 3 gạch ở góc trên bên phải */}
                            <button
                                className="menu-button absolute top-3 right-3 cursor-pointer"
                                onClick={(e) => toggleMenu(test.id, e)}
                            >
                                <div className="w-5 h-5 flex flex-col justify-between">
                                    <div className="h-0.5 w-full bg-gray-600"></div>
                                    <div className="h-0.5 w-full bg-gray-600"></div>
                                    <div className="h-0.5 w-full bg-gray-600"></div>
                                </div>
                            </button>

                            {/* Menu dropdown hiển thị khi activeMenuId === test.id */}
                            {activeMenuId === test.id && (
                                <div className="menu-dropdown absolute top-10 right-3 bg-white shadow-lg rounded-md p-2 z-10 min-w-32">
                                    <ul>
                                        <li
                                            className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer rounded-md"
                                            onClick={() => handleEditTest(test.id)}
                                        >
                                            Chỉnh sửa
                                        </li>
                                        <li
                                            className="px-4 py-2 text-sm hover:bg-gray-100 text-red-500 cursor-pointer rounded-md"
                                            onClick={() => handleDeleteTest(test.id)}
                                        >
                                            Xóa
                                        </li>
                                    </ul>
                                </div>
                            )}

                            <h3 className="test-title">{test.title}</h3>
                            <div className="test-info">
                                <span>⏱️ {test.duration}</span> |
                                <span>👤 {test.code}</span>
                            </div>
                            <div className="test-info">
                                <span>💬 {test.score}</span>
                            </div>
                            <div className="test-info">
                                {test.questions}
                            </div>
                            <div className="test-tags">
                                {test.tags.map((tag, idx) => (
                                    <span key={idx}>#{tag}</span>
                                )).reduce((prev, curr) => [prev, ' ', curr])}
                            </div>
                            <button
                                className="detail-button"
                                onClick={() => handleViewDetail(test.id)}
                            >
                                Chi tiết
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}