import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const FlashcardStatistics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            setError(null);

            // ✅ FIX: Add full URL with hostname
            const response = await fetch('http://localhost:8080/api/flashcards/statistics', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('Non-JSON response received:', responseText);
                throw new Error('Server returned non-JSON response');
            }

            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            setError(error.message);

            // Fallback: Use mock data if user is logged in
            const token = localStorage.getItem('token');
            if (token) {
                setStats(getMockStats());
            }
        } finally {
            setLoading(false);
        }
    };

    // Mock statistics data
    const getMockStats = () => ({
        currentStreak: 7,
        longestStreak: 15,
        totalLearned: 245,
        accuracy: 78,
        masteryBreakdown: [
            ['NEW', 12],
            ['LEARNING', 35],
            ['REVIEW', 89],
            ['MASTERED', 109]
        ]
    });

    const retryFetch = () => {
        setLoading(true);
        fetchStatistics();
    };

    if (loading) {
        return (
            <div className="flashcard-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!stats && !error) {
        return (
            <div className="statistics-container">
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h2 className="empty-state-title">
                        Chưa có dữ liệu thống kê
                    </h2>
                    <p className="empty-state-description">
                        Hãy bắt đầu học flashcards để xem thống kê của bạn
                    </p>
                    <Link
                        to="/flashcards/study"
                        className="empty-state-btn"
                    >
                        Bắt đầu học
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="statistics-container">
            <div className="statistics-header">
                <h1 className="statistics-title">
                    📊 Thống kê học tập
                </h1>
                <p className="statistics-subtitle">
                    Theo dõi tiến độ và thành tích học flashcards của bạn
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

            {/* Overview Stats */}
            <div className="statistics-overview">
                <div className="statistics-card blue">
                    <div className="statistics-number blue">
                        {stats.currentStreak || 0}
                    </div>
                    <div className="statistics-label blue">Chuỗi ngày học hiện tại</div>
                </div>

                <div className="statistics-card purple">
                    <div className="statistics-number purple">
                        {stats.longestStreak || 0}
                    </div>
                    <div className="statistics-label purple">Kỷ lục dài nhất</div>
                </div>

                <div className="statistics-card green">
                    <div className="statistics-number green">
                        {stats.totalLearned || 0}
                    </div>
                    <div className="statistics-label green">Tổng từ đã học</div>
                </div>

                {/*<div className="statistics-card orange">*/}
                {/*    <div className="statistics-number orange">*/}
                {/*        {Math.round(stats.accuracy || 0)}%*/}
                {/*    </div>*/}
                {/*    /!*<div className="statistics-label orange">Độ chính xác</div>*!/*/}
                {/*</div>*/}
            </div>

            {/* Mastery Breakdown */}
            <div className="mastery-section">
                <h3 className="mastery-title">
                    📈 Phân bố mức độ thành thạo
                </h3>
                <div className="mastery-grid">
                    {stats.masteryBreakdown && stats.masteryBreakdown.map(([level, count], index) => (
                        <div key={index} className="mastery-item">
                            <div className="mastery-count">{count}</div>
                            <div className="mastery-label">
                                {level === 'NEW' ? 'Từ mới' :
                                    level === 'LEARNING' ? 'Đang học' :
                                        level === 'REVIEW' ? 'Ôn tập' :
                                            level === 'MASTERED' ? 'Đã thuộc' : level}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="statistics-actions">
                <Link
                    to="/flashcards/study"
                    className="statistics-action-btn primary"
                >
                    🎯 Tiếp tục học
                </Link>
                <Link
                    to="/flashcards"
                    className="statistics-action-btn secondary"
                >
                    🏠 Về trang chủ
                </Link>
            </div>
        </div>
    );
};

export default FlashcardStatistics;