import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, BookOpen, TrendingUp, Award, Calendar, Star } from 'lucide-react';

// ================================================
// MAIN FLASHCARD HOME COMPONENT
// ================================================
const FlashcardHome = () => {
    const [statistics, setStatistics] = useState(null);
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [setCounts, setSetCounts] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const promises = [];

            // Fetch statistics if user is logged in
            if (token && token !== 'undefined' && token !== 'null') {
                promises.push(
                    fetch('http://localhost:8080/api/flashcards/statistics', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => res.ok ? res.json() : null)
                );
            } else {
                promises.push(Promise.resolve(null));
            }

            // Fetch sets
            promises.push(fetch('http://localhost:8080/api/flashcards/sets').then(res => res.json()));

            // Fetch set counts
            promises.push(fetch('http://localhost:8080/api/flashcards/sets/counts').then(res => res.json()));

            const [statsData, setsData, countsData] = await Promise.all(promises);

            setStatistics(statsData);
            setSets(setsData);
            setSetCounts(countsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flashcard-container flashcard-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="flashcard-container flashcard-home">
            <div className="flashcard-home-container">
                {/* Header */}
                <div className="flashcard-home-header">
                    <h1 className="flashcard-home-title">
                        📚 Flashcards
                    </h1>
                    <p className="flashcard-home-subtitle">
                        Hệ thống học từ vựng thông minh với thuật toán <strong>Spaced Repetition</strong>,
                        giúp bạn nhớ từ lâu hơn và học hiệu quả hơn
                    </p>
                </div>

                {/* Statistics Section - Only show if user is logged in */}
                {statistics && (
                    <div className="stats-section">
                        <div className="stats-container">
                            <h2 className="stats-header">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                                Thống kê của bạn
                            </h2>

                            <div className="stats-grid">
                                <div className="stat-card blue">
                                    <div className="stat-number">
                                        {statistics.currentStreak || 0}
                                    </div>
                                    <div className="stat-label">Chuỗi ngày học</div>
                                    <div className="stat-sublabel">🔥 Streak hiện tại</div>
                                </div>

                                <div className="stat-card purple">
                                    <div className="stat-number">
                                        {statistics.longestStreak || 0}
                                    </div>
                                    <div className="stat-label">Kỷ lục dài nhất</div>
                                    <div className="stat-sublabel">🏆 Personal best</div>
                                </div>

                                <div className="stat-card green">
                                    <div className="stat-number">
                                        {statistics.totalLearned || 0}
                                    </div>
                                    <div className="stat-label">Tổng từ đã học</div>
                                    <div className="stat-sublabel">📈 Vocabulary mastered</div>
                                </div>

                            </div>

                            {/* Quick Actions */}
                            <div className="action-container">
                                <Link
                                    to="/flashcards/study"
                                    className="primary-action-btn"
                                >
                                    <Play className="w-5 h-5" />
                                    🎯 Bắt đầu học hôm nay
                                </Link>
                                <p className="action-subtitle">
                                    ⏰ Học tối đa 20 từ mới mỗi ngày để hiệu quả tối ưu
                                </p>
                            </div>

                            {/* Mastery Progress */}
                            {statistics.masteryBreakdown && statistics.masteryBreakdown.length > 0 && (
                                <div className="mastery-section">
                                    <h3 className="mastery-title">
                                        📊 Phân bố mức độ thành thạo
                                    </h3>
                                    <div className="mastery-grid">
                                        {statistics.masteryBreakdown.map(([level, count], index) => (
                                            <div key={index} className="mastery-item">
                                                <div className="mastery-count">{count}</div>
                                                <div className="mastery-label">
                                                    {level === 'NEW' ? '🆕 Từ mới' :
                                                        level === 'LEARNING' ? '📚 Đang học' :
                                                            level === 'REVIEW' ? '🔄 Ôn tập' :
                                                                level === 'MASTERED' ? '✅ Đã thuộc' : level}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Sets Section */}
                <div className="sets-section">
                    <div className="sets-header">
                        <h2 className="sets-title">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                            📑 Bộ thẻ từ vựng
                        </h2>
                        <Link
                            to="/flashcards/create"
                            className="create-btn"
                        >
                            ➕ Tạo thẻ mới
                        </Link>
                    </div>

                    <div className="sets-grid">
                        {sets.map((setName, index) => {
                            const setCount = setCounts.find(([name]) => name === setName)?.[1] || 0;

                            return (
                                <div key={index} className="set-card">
                                    <div className="set-card-header">
                                        <div className="set-icon">📝</div>
                                        <span className="set-count-badge">
                                            {setCount} thẻ
                                        </span>
                                    </div>

                                    <h3 className="set-title">
                                        {setName}
                                    </h3>
                                    <p className="set-description">
                                        Bộ từ vựng chuyên biệt cho <strong>{setName}</strong>
                                    </p>

                                    <div className="set-actions">
                                        <Link
                                            to={`/flashcards/sets/${setName}`}
                                            className="set-action-btn secondary"
                                        >
                                            👀 Xem thẻ
                                        </Link>
                                        <Link
                                            to={`/flashcards/study?set=${setName}`}
                                            className="set-action-btn primary"
                                        >
                                            🎯 Học ngay
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {sets.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <h3 className="empty-state-title">
                                Chưa có bộ thẻ nào
                            </h3>
                            <p className="empty-state-description">
                                Hãy tạo bộ thẻ đầu tiên của bạn để bắt đầu học
                            </p>
                            <Link
                                to="/flashcards/create"
                                className="empty-state-btn"
                            >
                                ✏️ Tạo flashcard đầu tiên
                            </Link>
                        </div>
                    )}
                </div>

                {/* Features Section */}
                <div className="features-section">
                    <h2 className="features-title">
                        ✨ Tính năng nổi bật
                    </h2>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🧠</div>
                            <h3 className="feature-title">Spaced Repetition</h3>
                            <p className="feature-description">
                                Thuật toán thông minh giúp bạn ôn tập đúng lúc, nhớ lâu hơn
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🔊</div>
                            <h3 className="feature-title">Phát âm chuẩn</h3>
                            <p className="feature-description">
                                Nghe phát âm từ native speaker, cải thiện kỹ năng speaking
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📈</div>
                            <h3 className="feature-title">Theo dõi tiến độ</h3>
                            <p className="feature-description">
                                Thống kê chi tiết về quá trình học, động lực mỗi ngày
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🎯</div>
                            <h3 className="feature-title">Học theo mục tiêu</h3>
                            <p className="feature-description">
                                Bộ thẻ được thiết kế cho IELTS, TOEIC, giao tiếp hàng ngày
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Section */}
                <div className="navigation-section">
                    <h2 className="navigation-title">
                        🚀 Khám phá thêm
                    </h2>

                    <div className="navigation-grid">
                        <Link
                            to="/flashcards/sets"
                            className="navigation-card"
                        >
                            <div className="navigation-icon">📚</div>
                            <h3 className="navigation-card-title">Tất cả bộ thẻ</h3>
                            <p className="navigation-card-description">Xem toàn bộ thư viện flashcards</p>
                        </Link>

                        {statistics && (
                            <Link
                                to="/flashcards/statistics"
                                className="navigation-card"
                            >
                                <div className="navigation-icon">📊</div>
                                <h3 className="navigation-card-title">Thống kê chi tiết</h3>
                                <p className="navigation-card-description">Phân tích tiến độ học tập của bạn</p>
                            </Link>
                        )}

                        <Link
                            to="/flashcards/create"
                            className="navigation-card"
                        >
                            <div className="navigation-icon">✏️</div>
                            <h3 className="navigation-card-title">Tạo flashcard</h3>
                            <p className="navigation-card-description">Tự tạo thẻ từ vựng riêng của bạn</p>
                        </Link>
                    </div>
                </div>

                {/* CTA Section for guests */}
                {!statistics && (
                    <div className="cta-section">
                        <h2 className="cta-title">
                            🚀 Bắt đầu hành trình học từ vựng
                        </h2>
                        <p className="cta-description">
                            Đăng ký ngay để theo dõi tiến độ và nhận gợi ý học tập cá nhân hóa
                        </p>
                        <div className="cta-buttons">
                            <Link
                                to="/register"
                                className="cta-btn primary"
                            >
                                📝 Đăng ký miễn phí
                            </Link>
                            <Link
                                to="/login"
                                className="cta-btn secondary"
                            >
                                🔑 Đã có tài khoản
                            </Link>
                        </div>
                    </div>
                )}

                {/* Study Tips Section */}
                <div className="study-tips">
                    <h3 className="study-tips-header">
                        <Award className="w-5 h-5" />
                        💡 Mẹo học hiệu quả
                    </h3>
                    <div className="study-tips-grid">
                        <div className="study-tip-item">
                            <Calendar className="study-tip-icon" />
                            <span><strong>Học đều đặn:</strong> 15-20 phút mỗi ngày hiệu quả hơn học dồn</span>
                        </div>
                        <div className="study-tip-item">
                            <Star className="study-tip-icon" />
                            <span><strong>Trung thực:</strong> Đánh giá độ khó thật để thuật toán hoạt động tốt</span>
                        </div>
                        <div className="study-tip-item">
                            <TrendingUp className="study-tip-icon" />
                            <span><strong>Kiên trì:</strong> Duy trì streak để tạo thói quen học tập bền vững</span>
                        </div>
                        <div className="study-tip-item">
                            <Play className="study-tip-icon" />
                            <span><strong>Thực hành:</strong> Sử dụng từ mới trong câu để nhớ lâu hơn</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlashcardHome;