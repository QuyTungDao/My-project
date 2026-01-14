import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCw } from 'lucide-react';
import { getTodayStudyCards, rateFlashcard } from "../../api";

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

        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = '/login';
            return;
        }
    }, []);

    const fetchTodayCards = async (setName = null) => {
        try {
            setLoading(true);
            setError(null);

            const data = await getTodayStudyCards();
            let filteredCards = data;
            
            if (setName) {
                filteredCards = data.filter(card =>
                    card.setName && card.setName.toLowerCase() === setName.toLowerCase()
                );
            }

            setFlashcards(filteredCards);
            setSessionStats(prev => ({ ...prev, total: filteredCards.length }));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching flashcards:', error);
            setError(error.message);
            setFlashcards([]);
            setLoading(false);

            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
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
            console.log('Using Speech Synthesis');
        }

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.rate = 0.8;
            utterance.lang = 'en-US';
            speechSynthesis.speak(utterance);
        }
    };

    const rateCard = async (rating) => {
        const currentCard = flashcards[currentIndex];
        
        const ratingMap = {
            'EASY': 'EASY',
            'MEDIUM': 'MEDIUM',
            'HARD': 'HARD',
            'SKIP': 'AGAIN'
        };
        
        const backendRating = ratingMap[rating];

        try {
            await rateFlashcard(currentCard.id, backendRating);
            
            setSessionStats(prev => ({
                ...prev,
                studied: prev.studied + 1,
                correct: ['EASY', 'MEDIUM'].includes(rating) ? prev.correct + 1 : prev.correct
            }));

            nextCard();
        } catch (error) {
            console.error('Error rating flashcard:', error);
        }
    };

    const nextCard = () => {
        if (currentIndex + 1 >= flashcards.length) {
            return;
        }
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
    };

    // Keyboard shortcuts
    const handleKeyPress = useCallback((event) => {
        if (event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            setIsFlipped(prev => !prev);
        }
        if (isFlipped) {
            if (event.key === '1') rateCard('EASY');
            if (event.key === '2') rateCard('MEDIUM');
            if (event.key === '3') rateCard('HARD');
            if (event.key === '4') rateCard('SKIP');
        }
    }, [isFlipped, currentIndex]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    if (loading) {
        return (
            <div className="flashcard-loading">
                <div className="loading-spinner"></div>
                <p>Loading flashcards...</p>
            </div>
        );
    }

    if (flashcards.length === 0) {
        return (
            <div className="study-container">
                <div className="completion-screen">
                    <div className="completion-icon">📭</div>
                    <h2 className="completion-title">
                        {currentSet ? `No cards in "${currentSet}"` : 'No cards to study today'}
                    </h2>
                    <p className="completion-message">
                        {error ? 'Unable to connect to server.' : 'You\'ve completed all cards or no new cards available.'}
                    </p>
                    <div className="completion-actions">
                        <button
                            onClick={() => window.location.href = '/flashcards'}
                            className="completion-btn primary"
                        >
                            🏠 Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (currentIndex >= flashcards.length) {
        const accuracy = sessionStats.total > 0 ?
            Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;

        return (
            <div className="study-container">
                <div className="completion-screen">
                    <div className="completion-icon">🎉</div>
                    <h2 className="completion-title">Excellent!</h2>
                    <p className="completion-message">
                        {currentSet ? `You completed "${currentSet}"` : 'You completed today\'s session'}
                    </p>

                    <div className="completion-stats">
                        <div className="completion-stat">
                            <div className="completion-stat-value">{sessionStats.studied}</div>
                            <div className="completion-stat-label">Cards Studied</div>
                        </div>
                        <div className="completion-stat">
                            <div className="completion-stat-value">{accuracy}%</div>
                            <div className="completion-stat-label">Accuracy</div>
                        </div>
                        <div className="completion-stat">
                            <div className="completion-stat-value">{flashcards.length}</div>
                            <div className="completion-stat-label">Total Cards</div>
                        </div>
                    </div>

                    <div className="completion-actions">
                        <button
                            onClick={() => window.location.href = '/flashcards'}
                            className="completion-btn primary"
                        >
                            🏠 Back to Home
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="completion-btn secondary"
                        >
                            🔄 Study More
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentCard = flashcards[currentIndex];
    const progress = ((currentIndex + 1) / flashcards.length) * 100;

    return (
        <div className="study-container">
            {/* Progress Header */}
            <div className="study-progress">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="progress-info">
                    <span>{currentIndex + 1} / {flashcards.length}</span>
                    <span>{sessionStats.studied} studied</span>
                    <span>{sessionStats.correct}/{sessionStats.studied} correct</span>
                </div>
            </div>

            {/* Set Title */}
            {currentSet && (
                <div className="set-title-header">
                    <h2>📚 {currentSet}</h2>
                </div>
            )}

            {/* Main Flashcard */}
            <div className="flashcard" onClick={() => setIsFlipped(!isFlipped)}>
                <div className="flashcard-content">
                    {!isFlipped ? (
                        // FRONT - Word
                        <div className="flashcard-front">
                            <h1 className="word-display">{currentCard.word}</h1>

                            {currentCard.pronunciation && (
                                <div className="word-phonetic">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            playPronunciation(currentCard.word);
                                        }}
                                        className="pronunciation-btn"
                                    >
                                        <Play className="w-4 h-4" />
                                        <span>{currentCard.pronunciation}</span>
                                    </button>
                                    {currentCard.wordType && (
                                        <span className="word-type">({currentCard.wordType})</span>
                                    )}
                                </div>
                            )}

                            <div className="flip-hint">
                                <RotateCw className="w-5 h-5" />
                                <span>Click or press SPACE to reveal</span>
                            </div>
                        </div>
                    ) : (
                        // BACK - Definition
                        <div className="flashcard-back">
                            <div className="definition-section">
                                <h3 className="definition-label">Definition:</h3>
                                <p className="word-definition">{currentCard.meaning}</p>
                            </div>

                            {currentCard.exampleSentence && (
                                <div className="example-section">
                                    <h3 className="example-label">Example:</h3>
                                    <p className="word-example">"{currentCard.exampleSentence}"</p>
                                </div>
                            )}

                            {currentCard.synonyms && (
                                <div className="synonyms-section">
                                    <h3 className="synonyms-label">Synonyms:</h3>
                                    <p className="word-synonyms">{currentCard.synonyms}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Rating Buttons - Only show when flipped */}
            {isFlipped && (
                <div className="rating-section">
                    <h3 className="rating-title">How well did you know this?</h3>
                    <div className="rating-buttons">
                        <button
                            onClick={() => rateCard('SKIP')}
                            className="rating-btn again"
                        >
                            <span className="rating-emoji">🔄</span>
                            <span className="rating-label">Again</span>
                            <span className="rating-key">Press 4</span>
                        </button>
                        <button
                            onClick={() => rateCard('HARD')}
                            className="rating-btn hard"
                        >
                            <span className="rating-emoji">😖</span>
                            <span className="rating-label">Hard</span>
                            <span className="rating-key">Press 3</span>
                        </button>
                        <button
                            onClick={() => rateCard('MEDIUM')}
                            className="rating-btn good"
                        >
                            <span className="rating-emoji">😐</span>
                            <span className="rating-label">Good</span>
                            <span className="rating-key">Press 2</span>
                        </button>
                        <button
                            onClick={() => rateCard('EASY')}
                            className="rating-btn easy"
                        >
                            <span className="rating-emoji">😊</span>
                            <span className="rating-label">Easy</span>
                            <span className="rating-key">Press 1</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts Hint */}
            <div className="keyboard-hints">
                <span>⌨️ SPACE = Flip</span>
                {isFlipped && <span>| 1-4 = Rate</span>}
            </div>
        </div>
    );
};

export default FlashcardStudy;