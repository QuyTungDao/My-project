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
    const [filterType, setFilterType] = useState('ALL'); // NEW: Filter by test type
    const [sortBy, setSortBy] = useState('newest'); // NEW: Sort option
    const navigate = useNavigate();

    // ✅ FIXED: Implement getPartCount function properly
    const getPartCount = (testType) => {
        switch(testType) {
            case 'READING': return 3;
            case 'LISTENING': return 4;
            case 'WRITING': return 2;
            case 'SPEAKING': return 3;
            default: return 3;
        }
    };

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
                        // ✅ CLEAN: Use actual data from API
                        const formattedTests = data.map(test => {
                            console.log("✅ Processing test:", test.id, "Creator:", test.creatorName, "Questions:", test.questionCount);

                            return {
                                id: test.id,
                                title: test.testName || 'Untitled Test',
                                testType: test.testType || 'READING',
                                duration: test.durationMinutes || 60,
                                passingScore: test.passingScore || 5.0,
                                questionCount: test.questionCount || 0,
                                partCount: getPartCount(test.testType),
                                isPublished: test.isPublished || false,
                                createdAt: test.createdAt,
                                // ✅ FIXED: Use correct field name from API
                                authorName: test.creatorName || 'Unknown',
                                creatorEmail: test.creatorEmail || '',
                            };
                        });

                        console.log("Formatted tests:", formattedTests);
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
                        // ✅ FIXED: SỬ DỤNG CÙNG LOGIC MAPPING NHƯ TRÊN
                        const formattedTests = data.map(test => ({
                            id: test.id,
                            title: test.testName || 'Untitled Test',
                            testType: test.testType || 'READING',
                            duration: test.durationMinutes || 60,
                            passingScore: test.passingScore || 5.0,
                            questionCount: test.questionCount || 0, // ← KHÔNG RANDOM
                            partCount: getPartCount(test.testType), // ← SỬ DỤNG FUNCTION ĐÚNG
                            isPublished: test.isPublished || false,
                            authorName: test.creatorName || 'Unknown', // ← KHÔNG RANDOM
                            creatorEmail: test.creatorEmail || ''
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
                <>
                    {/* Statistics Bar */}
                    <div className="stats-bar">
                        <div className="stat-item">
                            <span className="stat-number">{tests.length}</span>
                            <span className="stat-label">Total Tests</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{tests.filter(t => t.testType === 'READING').length}</span>
                            <span className="stat-label">Reading</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{tests.filter(t => t.testType === 'LISTENING').length}</span>
                            <span className="stat-label">Listening</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{tests.filter(t => t.testType === 'WRITING').length}</span>
                            <span className="stat-label">Writing</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{tests.filter(t => t.testType === 'SPEAKING').length}</span>
                            <span className="stat-label">Speaking</span>
                        </div>
                    </div>

                    {/* Filters and Sort */}
                    <div className="filters-bar">
                        <div className="filter-group">
                            <label className="filter-label">📑 Filter by Type:</label>
                            <div className="filter-buttons">
                                {['ALL', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'].map(type => (
                                    <button
                                        key={type}
                                        className={`filter-btn ${filterType === type ? 'active' : ''}`}
                                        onClick={() => setFilterType(type)}
                                    >
                                        {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="sort-group">
                            <label className="sort-label">🔄 Sort by:</label>
                            <select
                                className="sort-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name">Name (A-Z)</option>
                            </select>
                        </div>
                    </div>

                    {/* Test List */}
                    <div className="test-list">
                        {tests
                            .filter(test => filterType === 'ALL' || test.testType === filterType)
                            .sort((a, b) => {
                                if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
                                if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
                                if (sortBy === 'name') return a.title.localeCompare(b.title);
                                return 0;
                            })
                            .map((test, index) => (
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

                                {/* ✅ FIXED: Display author name instead of testCode */}
                                <div className="test-stat">
                                    <span className="test-stat-icon">👤</span>
                                    <span className="test-stat-value">{test.authorName}</span>
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
                </>
            )}
        </div>
    );
}