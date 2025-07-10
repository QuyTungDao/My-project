import React, { useState, useEffect } from 'react';
import { Play, RotateCw, Home, TrendingUp, Award, Calendar } from 'lucide-react';
import {getTodayStudyCards, rateFlashcard} from "../../api";

// ================================================
// MAIN FLASHCARD STUDY COMPONENT
// ================================================
const FlashcardStudy = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSet, setCurrentSet] = useState(null);
    const [sessionStats, setSessionStats] = useState({
        studied: 0,
        correct: 0,
        total: 0
    });

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const setName = urlParams.get('set');
        setCurrentSet(setName);
        fetchTodayCards(setName);
    }, []);

    // ✅ FIXED: Use API function instead of direct fetch
    const fetchTodayCards = async (setName = null) => {
        try {
            setLoading(true);
            setError(null);

            console.log('=== FETCHING TODAY CARDS ===');
            console.log('Set name:', setName);

            // ✅ Use the API function from api.js
            const data = await getTodayStudyCards();

            console.log('✅ Flashcards received:', data);

            // ✅ Filter by set if specified
            let filteredCards = data;
            if (setName) {
                filteredCards = data.filter(card =>
                    card.setName && card.setName.toLowerCase() === setName.toLowerCase()
                );
                console.log(`Filtered to ${filteredCards.length} cards for set "${setName}"`);
            }

            setFlashcards(filteredCards);
            setSessionStats(prev => ({ ...prev, total: filteredCards.length }));
            setLoading(false);

        } catch (error) {
            console.error('❌ Error fetching flashcards:', error);
            setError(error.message);
            setFlashcards([]);
            setSessionStats(prev => ({ ...prev, total: 0 }));
            setLoading(false);

            // ✅ Check if it's an authentication error
            if (error.message.includes('401') || error.message.includes('authentication') || error.message.includes('Unauthorized')) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

                // ✅ Redirect to login after a delay
                setTimeout(() => {
                    localStorage.setItem('redirectAfterLogin', window.location.pathname);
                    window.location.href = '/login';
                }, 2000);
            }
        }
    };

    const playPronunciation = async (word) => {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const data = await response.json();

            if (data[0]?.phonetics) {
                const audioUrl = data[0].phonetics.find(p => p.audio)?.audio;
                if (audioUrl) {
                    const audio = new Audio(audioUrl);
                    audio.play();
                    return;
                }
            }
        } catch (error) {
            console.log('Dictionary API failed, using Speech Synthesis');
        }

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.rate = 0.8;
            utterance.lang = 'en-US';
            speechSynthesis.speak(utterance);
        }
    };

    // ✅ FIXED: Use API function instead of direct fetch
    const rateCard = async (rating) => {
        const currentCard = flashcards[currentIndex];

        // ✅ Convert frontend rating to backend enum
        const convertRatingToEnum = (frontendRating) => {
            const ratingMap = {
                'EASY': 'EASY',
                'MEDIUM': 'MEDIUM',
                'HARD': 'HARD',
                'SKIP': 'AGAIN'
            };
            return ratingMap[frontendRating] || 'AGAIN';
        };

        const backendRating = convertRatingToEnum(rating);

        console.log('🚀 RATING FLASHCARD:', {
            cardId: currentCard.id,
            cardWord: currentCard.word,
            frontendRating: rating,
            backendRating: backendRating,
            cardIdType: typeof currentCard.id
        });

        try {
            // ✅ Use the API function from api.js which handles authentication automatically
            const responseData = await rateFlashcard(currentCard.id, backendRating);

            console.log('✅ Rating saved successfully:', responseData);

            // ✅ Show success notification
            showNotification(`✅ Đã lưu rating "${rating}" cho "${currentCard.word}"`, 'success');

            // ✅ Update session stats after successful save
            setSessionStats(prev => ({
                ...prev,
                studied: prev.studied + 1,
                correct: ['EASY', 'MEDIUM'].includes(rating) ? prev.correct + 1 : prev.correct
            }));

            // ✅ Move to next card
            nextCard();

        } catch (error) {
            console.error('❌ Error rating flashcard:', error);

            // ✅ Handle different types of errors
            if (error.message.includes('401') || error.message.includes('authentication') || error.message.includes('Unauthorized')) {
                showNotification('❌ Phiên đăng nhập đã hết hạn. Đang chuyển đến trang đăng nhập...', 'error');

                setTimeout(() => {
                    localStorage.setItem('redirectAfterLogin', window.location.pathname);
                    window.location.href = '/login';
                }, 2000);

            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                showNotification('❌ Bạn không có quyền thực hiện thao tác này.', 'error');

            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                showNotification('❌ Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.', 'error');

            } else {
                showNotification(`❌ Lỗi: ${error.message}`, 'error');
            }
        }
    };

    // ✅ Helper function to show notifications
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#10b981' : '#ef4444';

        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            background: ${bgColor}; color: white; padding: 12px 16px;
            border-radius: 8px; font-size: 14px; max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            word-wrap: break-word;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, type === 'error' ? 4000 : 2000);
    };

    const nextCard = () => {
        if (currentIndex + 1 >= flashcards.length) {
            return;
        }
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
    };

    const retryFetch = () => {
        setLoading(true);
        setCurrentIndex(0);
        setIsFlipped(false);
        setSessionStats({ studied: 0, correct: 0, total: 0 });
        fetchTodayCards(currentSet);
    };

    // ✅ Check authentication on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, redirecting to login');
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = '/login';
            return;
        }

        // ✅ Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);

            if (payload.exp <= now) {
                console.log('Token expired, redirecting to login');
                localStorage.removeItem('token');
                localStorage.setItem('redirectAfterLogin', window.location.pathname);
                window.location.href = '/login';
                return;
            }
        } catch (e) {
            console.error('Invalid token format, redirecting to login');
            localStorage.removeItem('token');
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = '/login';
            return;
        }
    }, []);

    if (loading) {
        return (
            <div className="flashcard-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải thẻ học {currentSet ? `cho "${currentSet}"` : 'hôm nay'}...</p>
            </div>
        );
    }

    if (flashcards.length === 0) {
        return (
            <div className="study-container">
                <div className="completion-screen">
                    <div className="completion-container">
                        <div className="completion-icon">📭</div>
                        <h2 className="completion-title">
                            {currentSet ?
                                `Không có thẻ nào trong "${currentSet}"` :
                                'Không có thẻ nào để học hôm nay'
                            }
                        </h2>
                        <p className="completion-subtitle">
                            {error ?
                                'Không thể kết nối với server. Vui lòng thử lại sau.' :
                                currentSet ?
                                    'Bộ thẻ này có thể chưa có từ vựng hoặc bạn đã học hết.' :
                                    'Bạn đã hoàn thành tất cả thẻ hoặc chưa có thẻ mới.'
                            }
                        </p>

                        {error && (
                            <div className="flashcard-error" style={{ marginBottom: '20px' }}>
                                <div className="flashcard-error-title">⚠️ Lỗi kết nối</div>
                                <p>Chi tiết: {error}</p>
                                <button
                                    onClick={retryFetch}
                                    className="empty-state-btn"
                                    style={{ marginTop: '10px' }}
                                >
                                    🔄 Thử lại
                                </button>
                            </div>
                        )}

                        <div className="completion-actions">
                            <button
                                onClick={() => window.location.href = '/flashcards'}
                                className="completion-btn primary"
                            >
                                🏠 Về trang chủ Flashcards
                            </button>

                            {!currentSet && (
                                <button
                                    onClick={() => window.location.href = '/flashcards/create'}
                                    className="completion-btn secondary"
                                >
                                    ➕ Tạo thẻ mới
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (currentIndex >= flashcards.length) {
        return <CompletionScreen sessionStats={sessionStats} flashcards={flashcards} currentSet={currentSet} />;
    }

    const currentCard = flashcards[currentIndex];
    const progress = ((currentIndex + 1) / flashcards.length) * 100;

    return (
        <div className="study-container">
            {/* Set info header */}
            {currentSet && (
                <div className="set-info-header">
                    <div className="set-info-content">
                        <h2 className="set-info-title">📚 {currentSet}</h2>
                    </div>
                </div>
            )}

            {/* Error display */}
            {error && (
                <div className="flashcard-error" style={{ marginBottom: '20px' }}>
                    <div className="flashcard-error-title">⚠️ Thông báo</div>
                    <p>{error}</p>
                    <button
                        onClick={retryFetch}
                        className="retry-btn"
                        style={{ marginLeft: '10px' }}
                    >
                        🔄 Thử lại
                    </button>
                </div>
            )}

            {/* Flashcard */}
            <div className="flashcard">
                <div className="flashcard-content">
                    {/* New Word Badge */}
                    <div className="word-badge">
                        {currentSet ? `${currentSet}` : 'Từ mới'}
                    </div>

                    {!isFlipped ? (
                        // FRONT SIDE - Hiển thị TỪ VỰNG (mặt trước)
                        <div className="flashcard-front">
                            <h1 className="word-display">
                                {currentCard.word}
                            </h1>

                            {currentCard.pronunciation && (
                                <div className="pronunciation-container">
                                    <button
                                        onClick={() => playPronunciation(currentCard.word)}
                                        className="pronunciation-btn"
                                        title="Phát âm"
                                    >
                                        <Play className="w-4 h-4" />
                                        <span className="pronunciation-text">{currentCard.pronunciation}</span>
                                    </button>
                                    {currentCard.wordType && (
                                        <span className="word-type">
                                            ({currentCard.wordType})
                                        </span>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => setIsFlipped(true)}
                                className="flip-btn"
                                title="Lật thẻ để xem nghĩa"
                            >
                                <RotateCw className="w-6 h-6" />
                                <span>Xem nghĩa</span>
                            </button>
                        </div>
                    ) : (
                        // BACK SIDE - Hiển thị ĐỊNH NGHĨA (mặt sau)
                        <div className="flashcard-back">
                            <div className="definition-section">
                                <h3 className="section-title">Định nghĩa:</h3>
                                <p className="definition-text">{currentCard.meaning}</p>
                            </div>

                            {currentCard.exampleSentence && (
                                <div className="definition-section">
                                    <h3 className="section-title">Ví dụ:</h3>
                                    <ul className="example-list">
                                        <li className="example-item">"{currentCard.exampleSentence}"</li>
                                    </ul>
                                </div>
                            )}

                            {currentCard.synonyms && (
                                <div className="definition-section">
                                    <h3 className="section-title">Từ đồng nghĩa:</h3>
                                    <p className="synonyms-text">{currentCard.synonyms}</p>
                                </div>
                            )}

                            {currentCard.imageUrl && (
                                <div className="definition-section">
                                    <img
                                        src={currentCard.imageUrl}
                                        alt="Illustration"
                                        className="flashcard-image"
                                    />
                                </div>
                            )}

                            <button
                                onClick={() => setIsFlipped(false)}
                                className="flip-btn"
                                title="Lật lại để xem từ"
                            >
                                <RotateCw className="w-6 h-6" />
                                <span>Xem từ</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Rating Buttons */}
            <div className="rating-section">
                <h3 className="rating-title">Đánh giá mức độ hiểu của bạn:</h3>
                <div className="rating-grid">
                    <button
                        onClick={() => rateCard('EASY')}
                        className="rating-btn easy"
                        title="Từ này rất dễ hiểu"
                    >
                        <div className="rating-emoji">😊</div>
                        <div className="rating-label">Dễ</div>
                        <div className="rating-description">Hiểu ngay</div>
                    </button>

                    <button
                        onClick={() => rateCard('MEDIUM')}
                        className="rating-btn medium"
                        title="Từ này cần suy nghĩ một chút"
                    >
                        <div className="rating-emoji">😐</div>
                        <div className="rating-label">Trung bình</div>
                        <div className="rating-description">Cần suy nghĩ</div>
                    </button>

                    <button
                        onClick={() => rateCard('HARD')}
                        className="rating-btn hard"
                        title="Từ này khó hiểu, cần học lại"
                    >
                        <div className="rating-emoji">😖</div>
                        <div className="rating-label">Khó</div>
                        <div className="rating-description">Học lại sớm</div>
                    </button>

                    <button
                        onClick={() => rateCard('SKIP')}
                        className="rating-btn skip"
                        title="Cần xem lại ngay"
                    >
                        <div className="rating-emoji">🔄</div>
                        <div className="rating-label">Lại</div>
                        <div className="rating-description">Xem lại ngay</div>
                    </button>
                </div>
            </div>

            {/* Study Tip */}
            <div className="study-tip">
                💡 <strong>Mẹo học hiệu quả:</strong> Hãy đọc to từ vựng và tạo câu ví dụ của riêng bạn để ghi nhớ tốt hơn.
            </div>

            {/* Quick Navigation */}
            <div className="quick-nav">
                <button
                    onClick={() => window.location.href = '/flashcards'}
                    className="nav-btn"
                    title="Về trang chủ"
                >
                    <Home className="w-4 h-4" />
                </button>
                <button
                    onClick={() => window.location.href = '/flashcards/statistics'}
                    className="nav-btn"
                    title="Xem thống kê"
                >
                    <TrendingUp className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// ================================================
// COMPLETION SCREEN COMPONENT (unchanged)
// ================================================
const CompletionScreen = ({ sessionStats, flashcards, currentSet }) => {
    const accuracy = sessionStats.total > 0 ?
        Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;

    const studyTimeMinutes = Math.max(1, Math.floor(sessionStats.studied * 1.5));

    return (
        <div className="completion-screen">
            <div className="completion-container">
                <div className="completion-icon">🎉</div>
                <h2 className="completion-title">
                    Xuất sắc!
                </h2>
                <p className="completion-subtitle">
                    {currentSet ?
                        `Bạn đã hoàn thành bộ "${currentSet}"` :
                        'Bạn đã hoàn thành session học hôm nay'
                    }
                </p>

                {/* Session Statistics */}
                <div className="completion-stats">
                    <div className="completion-stat">
                        <div className="completion-stat-number blue">
                            {sessionStats.studied}
                        </div>
                        <div className="completion-stat-label">Thẻ đã học</div>
                    </div>
                    <div className="completion-stat">
                        <div className="completion-stat-number green">
                            {accuracy}%
                        </div>
                        <div className="completion-stat-label">Độ chính xác</div>
                    </div>
                    <div className="completion-stat">
                        <div className="completion-stat-number purple">
                            {studyTimeMinutes}
                        </div>
                        <div className="completion-stat-label">Phút học</div>
                    </div>
                    <div className="completion-stat">
                        <div className="completion-stat-number orange">
                            {flashcards ? flashcards.length : 0}
                        </div>
                        <div className="completion-stat-label">Tổng từ</div>
                    </div>
                </div>

                {/* Achievement Badges */}
                <div className="achievement-section">
                    <h4 className="achievement-title">🏆 Thành tích hôm nay:</h4>
                    <div className="achievement-badges">
                        {accuracy >= 90 && (
                            <div className="achievement-badge gold">
                                🥇 Chính xác cao
                                <span className="badge-desc">≥90% đúng</span>
                            </div>
                        )}
                        {sessionStats.studied >= 10 && (
                            <div className="achievement-badge silver">
                                📚 Học chăm chỉ
                                <span className="badge-desc">≥10 thẻ</span>
                            </div>
                        )}
                        {sessionStats.studied >= sessionStats.total && sessionStats.total > 0 && (
                            <div className="achievement-badge bronze">
                                ✅ Hoàn thành mục tiêu
                                <span className="badge-desc">100% hoàn thành</span>
                            </div>
                        )}
                        {studyTimeMinutes >= 15 && (
                            <div className="achievement-badge diamond">
                                ⏰ Kiên trì học tập
                                <span className="badge-desc">≥15 phút</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="completion-actions">
                    <button
                        onClick={() => window.location.href = '/flashcards'}
                        className="completion-btn primary"
                    >
                        🏠 Về trang chủ
                    </button>
                    <button
                        onClick={() => window.location.href = '/flashcards/statistics'}
                        className="completion-btn secondary"
                    >
                        📊 Xem thống kê chi tiết
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="completion-btn tertiary"
                    >
                        🔄 Học thêm
                    </button>
                </div>

                {/* Next Study Reminder */}
                <div className="next-study-reminder">
                    <div className="reminder-content">
                        <h5 className="reminder-title">💡 Lời khuyên học tập:</h5>
                        <ul className="reminder-list">
                            <li>🗓️ Hãy quay lại vào cùng giờ ngày mai để duy trì thói quen</li>
                            <li>🔔 Thẻ ôn tập sẽ xuất hiện dựa trên đường cong quên lãng</li>
                            <li>📈 Học đều đặn 15-20 phút/ngày hiệu quả hơn học dồn</li>
                            <li>🎯 Tập trung vào những từ được đánh giá "Khó" để cải thiện</li>
                        </ul>
                    </div>
                </div>

                {/* Progress Motivation */}
                <div className="progress-motivation">
                    <p className="motivation-text">
                        🌟 <strong>Tuyệt vời!</strong> Bạn đang trên đường chinh phục {sessionStats.studied} từ vựng mới{currentSet ? ` từ "${currentSet}"` : ''}.
                        Hãy tiếp tục duy trì và bạn sẽ thấy sự tiến bộ rõ rệt!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FlashcardStudy;