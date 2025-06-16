import React, { useEffect, useState } from "react";
import { Play } from 'lucide-react';

const FlashcardSetView = ({ setName }) => {
    const [flashcards, setFlashcards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (setName) {
            fetchSetFlashcards();
        }
    }, [setName]);

    const fetchSetFlashcards = async () => {
        try {
            setError(null);

            // ✅ FIX: Add full URL with hostname
            const response = await fetch(`http://localhost:8080/api/flashcards/sets/${encodeURIComponent(setName)}`);

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
            setFlashcards(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching set flashcards:', error);
            setError(error.message);
            setLoading(false);

            // Fallback: Use mock data
            setFlashcards(getMockFlashcards(setName));
        }
    };

    // Mock data for development
    const getMockFlashcards = (setName) => {
        const mockCards = {
            'IELTS Academic Writing': [
                {
                    id: 1,
                    word: 'consequently',
                    pronunciation: '/ˈkɑːnsəkwəntli/',
                    wordType: 'adverb',
                    meaning: 'As a result; therefore',
                    exampleSentence: 'The weather was terrible; consequently, the match was cancelled.',
                    synonyms: 'therefore, thus, hence'
                },
                {
                    id: 2,
                    word: 'substantial',
                    pronunciation: '/səbˈstænʃəl/',
                    wordType: 'adjective',
                    meaning: 'Large in amount, extent, or intensity; considerable',
                    exampleSentence: 'There has been substantial progress in medical research.',
                    synonyms: 'significant, considerable, major'
                }
            ],
            'IELTS Environment & Technology': [
                {
                    id: 3,
                    word: 'sustainable',
                    pronunciation: '/səˈsteɪnəbəl/',
                    wordType: 'adjective',
                    meaning: 'Able to be maintained at a certain rate or level',
                    exampleSentence: 'We need to find sustainable solutions to climate change.',
                    synonyms: 'renewable, viable, maintainable'
                }
            ]
        };

        return mockCards[setName] || [];
    };

    const playPronunciation = async (word) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.rate = 0.8;
            utterance.lang = 'en-US';
            speechSynthesis.speak(utterance);
        }
    };

    const retryFetch = () => {
        setLoading(true);
        fetchSetFlashcards();
    };

    if (loading) {
        return (
            <div className="flashcard-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="set-view-container">
            <div className="set-view-header">
                <h1 className="set-view-title">
                    📝 {setName}
                </h1>
                <p className="set-view-subtitle">
                    {flashcards.length} thẻ từ vựng trong bộ này
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

                <div className="set-view-actions">
                    <button
                        onClick={() => window.location.href = `/flashcards/study?set=${setName}`}
                        className="set-view-btn primary"
                    >
                        🎯 Học bộ thẻ này
                    </button>
                    <button
                        onClick={() => window.location.href = '/flashcards'}
                        className="set-view-btn secondary"
                    >
                        ← Quay lại
                    </button>
                </div>
            </div>

            <div className="cards-grid">
                {flashcards.map((card) => (
                    <div key={card.id} className="card-item">
                        <div className="card-header">
                            <h3 className="card-word">
                                {card.word}
                            </h3>
                            {card.pronunciation && (
                                <button
                                    onClick={() => playPronunciation(card.word)}
                                    className="card-pronunciation-btn"
                                >
                                    <Play className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {card.pronunciation && (
                            <p className="card-pronunciation">
                                {card.pronunciation}
                            </p>
                        )}

                        {card.wordType && (
                            <span className="card-word-type">
                                {card.wordType}
                            </span>
                        )}

                        <p className="card-meaning">
                            {card.meaning}
                        </p>

                        {card.exampleSentence && (
                            <div className="card-example">
                                <p className="card-example-text">
                                    "{card.exampleSentence}"
                                </p>
                            </div>
                        )}

                        {card.synonyms && (
                            <div className="card-synonyms">
                                <strong>Từ đồng nghĩa:</strong> {card.synonyms}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {flashcards.length === 0 && !error && (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3 className="empty-state-title">
                        Chưa có thẻ nào trong bộ này
                    </h3>
                    <p className="empty-state-description">
                        Hãy tạo thẻ đầu tiên cho bộ "{setName}"
                    </p>
                </div>
            )}
        </div>
    );
};

export default FlashcardSetView;