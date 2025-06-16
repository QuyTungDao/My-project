import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FlashcardSetsList = () => {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        try {
            setError(null);

            // Try to fetch from API first
            const response = await fetch('http://localhost:8080/api/flashcards/sets');

            // Check if response is ok
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('Non-JSON response received:', responseText);
                throw new Error('Server returned non-JSON response');
            }

            const data = await response.json();

            // Ensure data is an array
            if (Array.isArray(data)) {
                setSets(data);
            } else if (data && typeof data === 'object' && data.sets) {
                // In case API returns {sets: [...]}
                setSets(data.sets);
            } else {
                console.error('Unexpected data format:', data);
                throw new Error('Unexpected data format from server');
            }

        } catch (error) {
            console.error('Error fetching sets:', error);
            setError(error.message);

            // Fallback: Try to get sets from localStorage or use mock data
            const cachedSets = localStorage.getItem('flashcard_sets');
            if (cachedSets) {
                try {
                    setSets(JSON.parse(cachedSets));
                } catch (parseError) {
                    setSets(getMockSets());
                }
            } else {
                setSets(getMockSets());
            }
        } finally {
            setLoading(false);
        }
    };

    // Mock data for development/testing
    const getMockSets = () => [
        'IELTS Academic Writing',
        'IELTS Environment & Technology',
        'IELTS Social Issues',
        'TOEIC Business Vocabulary',
        'Basic English Conversation',
        'Advanced Grammar'
    ];

    const retryFetch = () => {
        setLoading(true);
        fetchSets();
    };

    if (loading) {
        return (
            <div className="flashcard-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="sets-list-container">
            <div className="sets-list-header">
                <h1 className="sets-list-title">
                    📑 Bộ thẻ từ vựng
                </h1>
                <p className="sets-list-subtitle">
                    Chọn bộ thẻ phù hợp với mục tiêu học tập của bạn
                </p>

                {error && (
                    <div className="flashcard-error">
                        <div className="flashcard-error-title">⚠️ Không thể kết nối với server</div>
                        <p>Lỗi: {error}</p>
                        <p>Hiển thị dữ liệu mẫu để bạn có thể tiếp tục sử dụng.</p>
                        <button
                            onClick={retryFetch}
                            className="empty-state-btn"
                            style={{ marginTop: '10px' }}
                        >
                            🔄 Thử lại
                        </button>
                    </div>
                )}
            </div>

            <div className="sets-list-grid">
                {sets.map((setName, index) => (
                    <div key={index} className="sets-list-card">
                        <div className="sets-list-icon">
                            {getSetIcon(setName)}
                        </div>
                        <h3 className="sets-list-card-title">
                            {setName}
                        </h3>
                        <p className="sets-list-card-description">
                            {getSetDescription(setName)}
                        </p>
                        <div className="sets-list-actions">
                            <Link
                                to={`/flashcards/sets/${encodeURIComponent(setName)}`}
                                className="sets-list-btn secondary"
                            >
                                Xem thẻ
                            </Link>
                            <Link
                                to={`/flashcards/study?set=${encodeURIComponent(setName)}`}
                                className="sets-list-btn primary"
                            >
                                Học ngay
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {sets.length === 0 && !error && (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3 className="empty-state-title">
                        Chưa có bộ thẻ nào
                    </h3>
                    <p className="empty-state-description">
                        Hãy tạo bộ thẻ đầu tiên của bạn
                    </p>
                    <Link
                        to="/flashcards/create"
                        className="empty-state-btn"
                    >
                        Tạo flashcard mới
                    </Link>
                </div>
            )}
        </div>
    );

    // Helper function to get appropriate icon for each set
    function getSetIcon(setName) {
        const name = setName.toLowerCase();
        if (name.includes('ielts')) return '🎓';
        if (name.includes('toeic')) return '💼';
        if (name.includes('business')) return '📊';
        if (name.includes('conversation')) return '💬';
        if (name.includes('grammar')) return '📚';
        if (name.includes('academic')) return '🔬';
        if (name.includes('environment')) return '🌍';
        if (name.includes('social')) return '👥';
        return '📝';
    }

    // Helper function to get description for each set
    function getSetDescription(setName) {
        const name = setName.toLowerCase();
        if (name.includes('ielts academic')) return 'Từ vựng học thuật cho IELTS Writing Task 1 & 2';
        if (name.includes('ielts environment')) return 'Từ vựng về môi trường và công nghệ cho IELTS';
        if (name.includes('ielts social')) return 'Từ vựng về các vấn đề xã hội cho IELTS';
        if (name.includes('toeic')) return 'Từ vựng kinh doanh thiết yếu cho TOEIC';
        if (name.includes('conversation')) return 'Từ vựng cơ bản cho giao tiếp hàng ngày';
        if (name.includes('grammar')) return 'Ngữ pháp nâng cao và cấu trúc câu';
        return `Bộ từ vựng chuyên biệt cho ${setName}`;
    }
};

export default FlashcardSetsList;