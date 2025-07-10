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
    const [activeMenuId, setActiveMenuId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTests = async () => {
            try {
                setLoading(true);
                console.log("Đang gọi API để lấy danh sách đề thi...");

                const token = localStorage.getItem('token');
                console.log("Token hiện tại:", token ? "Có token" : "Không có token");

                if (!token) {
                    setError("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem danh sách đề thi.");
                    setLoading(false);
                    return;
                }

                const data = await getAllTests();
                console.log("Dữ liệu nhận được từ API:", data);

                if (data && Array.isArray(data)) {
                    if (data.length === 0) {
                        setError("Không có bài thi nào trong hệ thống.");
                    } else {
                        // Enhanced data mapping với thông tin chi tiết hơn
                        const formattedTests = data.map(test => {
                            // Tính số câu hỏi dựa trên test type
                            const getQuestionCount = (testType) => {
                                switch(testType) {
                                    case 'READING': return Math.floor(20 + Math.random() * 20); // 20-40 câu
                                    case 'LISTENING': return Math.floor(20 + Math.random() * 20); // 20-40 câu
                                    case 'WRITING': return Math.floor(2 + Math.random() * 2); // 2-4 câu
                                    case 'SPEAKING': return Math.floor(3 + Math.random() * 3); // 3-6 câu
                                    default: return Math.floor(20 + Math.random() * 20);
                                }
                            };

                            // Tính số phần thi dựa trên test type
                            const getPartCount = (testType) => {
                                switch(testType) {
                                    case 'READING': return 3;
                                    case 'LISTENING': return 4;
                                    case 'WRITING': return 2;
                                    case 'SPEAKING': return 3;
                                    default: return 3;
                                }
                            };

                            const questionCount = getQuestionCount(test.testType);
                            const partCount = getPartCount(test.testType);

                            return {
                                id: test.id,
                                title: test.testName || 'Untitled Test',
                                testType: test.testType || 'READING',
                                duration: test.durationMinutes || 60,
                                passingScore: test.passingScore || 5.0,
                                questionCount: questionCount,
                                partCount: partCount,
                                isPublished: test.isPublished || false,
                                createdAt: test.createdAt,
                                // Generate a unique test code
                                testCode: `${test.testType?.substring(0,2) || 'TE'}${test.id}${Math.floor(100 + Math.random() * 900)}`
                            };
                        });

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
                        setError("Phiên đăng nhập có vấn đề. Nhấn nút 'Thử lại' hoặc đăng nhập lại.");
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
        // Implement search functionality
    };

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
                            title: test.testName || 'Untitled Test',
                            testType: test.testType || 'READING',
                            duration: test.durationMinutes || 60,
                            passingScore: test.passingScore || 5.0,
                            questionCount: Math.floor(20 + Math.random() * 20),
                            partCount: test.testType === 'READING' ? 3 : 4,
                            isPublished: test.isPublished || false,
                            testCode: `${test.testType?.substring(0,2) || 'TE'}${test.id}${Math.floor(100 + Math.random() * 900)}`
                        }));
                        setTests(formattedTests);
                    } else {
                        setError("Không tìm thấy bài thi nào.");
                    }
                } catch (err) {
                    console.error("Lỗi khi thử lại:", err);
                    setError("Vẫn không thể tải dữ liệu. Vui lòng đăng nhập lại.");
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

    const toggleMenu = (testId, e) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === testId ? null : testId);
    };

    const handleEditTest = (testId) => {
        navigate(`/create-exam?id=${testId}`);
    };

    const handleDeleteTest = async (testId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa bài thi này không?")) {
            try {
                setLoading(true);
                await deleteTest(testId);
                console.log("Đã xóa bài thi với ID:", testId);
                setTests(tests.filter(test => test.id !== testId));
                setActiveMenuId(null);
                alert("Bài thi đã được xóa thành công!");
            } catch (err) {
                console.error("Lỗi khi xóa bài thi:", err);
                let errorMessage = "Có lỗi xảy ra khi xóa bài thi: ";

                if (err.response) {
                    console.error("Error response:", err.response);
                    if (err.response.status === 404) {
                        errorMessage = "Không tìm thấy bài thi này. Có thể bài thi đã bị xóa trước đó.";
                        setTests(tests.filter(test => test.id !== testId));
                    } else if (err.response.status === 401 || err.response.status === 403) {
                        errorMessage = "Bạn không có quyền xóa bài thi này hoặc phiên làm việc đã hết hạn. Bài thi vẫn tồn tại.";
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
                setLoading(false);
            }
        }
    };

    // Helper function to get test type display name
    const getTestTypeDisplay = (testType) => {
        const typeMap = {
            'READING': 'Reading',
            'LISTENING': 'Listening',
            'WRITING': 'Writing',
            'SPEAKING': 'Speaking'
        };
        return typeMap[testType] || testType;
    };

    // Helper function to get test type icon
    const getTestTypeIcon = (testType) => {
        const iconMap = {
            'READING': '📖',
            'LISTENING': '🎧',
            'WRITING': '✍️',
            'SPEAKING': '🗣️'
        };
        return iconMap[testType] || '📝';
    };

    return (
        <div className="test-library-container">
            <h1 className="test-library-title">📚 Thư viện đề thi</h1>

            {/* Search Bar */}
            <div className="search-container">
                <div className="search-wrapper">
                    <input
                        type="text"
                        placeholder="🔍 Nhập từ khóa để tìm kiếm đề thi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button
                        onClick={handleSearch}
                        className="search-button"
                    >
                        Tìm kiếm
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="error-container">
                    <p className="error-title">⚠️ Đã xảy ra lỗi</p>
                    <p className="error-message">{error}</p>
                    <div className="error-actions">
                        <button onClick={handleRetry} className="error-button retry-button">
                            🔄 Thử lại
                        </button>
                        <button onClick={handleLogin} className="error-button login-button">
                            🔑 Đăng nhập lại
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">⏳ Đang tải danh sách đề thi...</p>
                </div>
            ) : tests.length === 0 && !error ? (
                <div className="empty-state">
                    <p className="empty-state-title">📋 Không tìm thấy bài thi nào</p>
                    <p className="empty-state-description">Có thể chưa có bài thi nào được thêm vào hệ thống hoặc bài thi đang bị ẩn.</p>
                </div>
            ) : (
                <div className="test-list">
                    {tests.map((test, index) => (
                        <div key={test.id || index} className="test-item">

                            {/* Test Content */}
                            <div className="test-header">
                                <h3 className="test-title">{test.title}</h3>
                                <div className="test-type-badge">
                                    <span className="test-type-icon">{getTestTypeIcon(test.testType)}</span>
                                    <span className="test-type-text">{getTestTypeDisplay(test.testType)}</span>
                                </div>
                            </div>

                            <div className="test-metadata">
                                <div className="test-stat">
                                    <span className="test-stat-icon">⏱️</span>
                                    <span className="test-stat-value">{test.duration}</span>
                                    <span className="test-stat-label">phút</span>
                                </div>

                                <div className="test-stat">
                                    <span className="test-stat-icon">👤</span>
                                    <span className="test-stat-value">{test.testCode}</span>
                                </div>
                            </div>

                            <div className="test-structure">
                                <span className="test-structure-icon">📝</span>
                                <span className="test-structure-text">
                                    {test.partCount} phần thi | {test.questionCount} câu hỏi
                                </span>
                            </div>

                            <div className="test-tags">
                                <span className="test-tag primary-tag">#IELTS Academic</span>
                                <span className="test-tag type-tag">#{getTestTypeDisplay(test.testType)}</span>
                            </div>

                            <button
                                className="detail-button"
                                onClick={() => handleViewDetail(test.id)}
                            >
                                👁️ Xem chi tiết
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}