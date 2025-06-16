import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ListeningAudioPlayer from './ListeningAudioPlayer';
import ListeningQuestionRenderer from './ListeningQuestionRenderer';
import { getTestDetail, submitTest } from '../../api';

const TakeListeningTest = () => {
    const { testId } = useParams();
    const navigate = useNavigate();

    // Test data
    const [test, setTest] = useState(null);
    const [audioList, setAudioList] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Test taking state
    const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [startTime] = useState(new Date());

    // Audio interaction tracking
    const [audioStats, setAudioStats] = useState({
        totalPlayTime: 0,
        pauseCount: 0,
        replayCount: 0,
        sectionTimes: {}
    });

    // Timer
    const [timerInterval, setTimerInterval] = useState(null);

    useEffect(() => {
        loadTest();
        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, [testId]);

    const AudioDebugInfo = ({ audio }) => {
        if (process.env.NODE_ENV === 'production') return null;

        return (
            <div style={{
                fontSize: '12px',
                background: '#f0f0f0',
                padding: '5px',
                margin: '5px 0',
                borderRadius: '3px'
            }}>
                <strong>Debug Audio {audio.id}:</strong><br/>
                Storage: {audio.storageType}<br/>
                Base64 length: {audio.base64Data?.length || 'None'}<br/>
                File path: {audio.filePath || 'None'}<br/>
                URL length: {audio.fileUrl?.length || 'None'}<br/>
                MIME: {audio.mimeType || 'Unknown'}
            </div>
        );
    };

    const loadTest = async () => {
        try {
            setLoading(true);
            const testData = await getTestDetail(testId);

            if (!testData || !testData.test) {
                throw new Error('Không tìm thấy bài thi');
            }

            setTest(testData.test);
            setQuestions(testData.questions || []);

            // ✅ Process audio data với base64 support
            const audioData = testData.audio || [];
            console.log('Raw audio data from API:', audioData);

            const formattedAudio = audioData.map(audio => {
                const processedAudio = {
                    ...audio,
                    fileUrl: getAudioFileUrl(audio), // Sẽ return base64 hoặc file URL

                    // Giữ lại base64 data để sử dụng
                    base64Data: audio.base64Data,
                    mimeType: audio.mimeType,
                    fileSize: audio.fileSize,
                    originalFileName: audio.originalFileName,

                    // Metadata bổ sung
                    storageType: audio.base64Data ? 'base64' : 'file',
                    duration: audio.durationSeconds || 0
                };

                console.log('Processed audio:', {
                    id: audio.id,
                    title: audio.title,
                    storageType: processedAudio.storageType,
                    hasBase64: !!audio.base64Data,
                    hasFilePath: !!audio.filePath,
                    fileUrlLength: processedAudio.fileUrl?.length
                });

                return processedAudio;
            });

            setAudioList(formattedAudio);
            setTimeRemaining(testData.test.durationMinutes * 60);
            startTimer();

        } catch (err) {
            console.error('Error loading test:', err);
            setError(err.message || 'Có lỗi khi tải bài thi');
        } finally {
            setLoading(false);
        }
    };

    const getAudioFileUrl = (audioData) => {
        console.log('Processing audio data:', audioData);

        // ✅ ENHANCED: Check base64 data format
        if (audioData.base64Data) {
            console.log('Using base64 data for audio:', audioData.id);

            // ✅ Ensure proper data URL format
            if (audioData.base64Data.startsWith('data:')) {
                return audioData.base64Data;
            } else {
                // ✅ Add data URL prefix if missing
                const mimeType = audioData.mimeType || 'audio/mpeg';
                return `data:${mimeType};base64,${audioData.base64Data}`;
            }
        }

        // ✅ Fallback for file path
        if (audioData.filePath) {
            const url = audioData.filePath.startsWith('http')
                ? audioData.filePath
                : `http://localhost:8080/api${audioData.filePath}`;
            console.log('Using file path for audio:', audioData.id, url);
            return url;
        }

        console.warn('❌ No valid audio data found for:', audioData.id);
        return '';
    };

    const startTimer = () => {
        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        setTimerInterval(interval);
    };

    const handleAutoSubmit = () => {
        if (!isSubmitted) {
            alert('Hết thời gian làm bài! Bài thi sẽ được nộp tự động.');
            handleSubmit(true);
        }
    };

    const formatTimeRemaining = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId, answer) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleAudioPlay = (section) => {
        console.log(`Audio started playing: ${section}`);
    };

    const handleAudioPause = (section) => {
        setAudioStats(prev => ({
            ...prev,
            pauseCount: prev.pauseCount + 1
        }));
    };

    const handleAudioReplay = (section) => {
        setAudioStats(prev => ({
            ...prev,
            replayCount: prev.replayCount + 1
        }));
    };

    const handleAudioTimeUpdate = (currentTime, section) => {
        setAudioStats(prev => ({
            ...prev,
            totalPlayTime: prev.totalPlayTime + 1,
            sectionTimes: {
                ...prev.sectionTimes,
                [section]: currentTime
            }
        }));
    };

    const navigateToAudio = (index) => {
        if (index >= 0 && index < audioList.length) {
            setCurrentAudioIndex(index);
        }
    };

    const handleSubmit = async (isAutoSubmit = false) => {
        try {
            if (isSubmitted) return;

            const confirmed = isAutoSubmit || window.confirm(
                'Bạn có chắc chắn muốn nộp bài? Sau khi nộp sẽ không thể chỉnh sửa.'
            );

            if (!confirmed) return;

            setIsSubmitted(true);

            if (timerInterval) {
                clearInterval(timerInterval);
            }

            // Prepare responses - sử dụng format từ submitTest có sẵn
            const responses = Object.entries(userAnswers).map(([questionId, answer]) => ({
                questionId: parseInt(questionId),
                responseText: answer || ''
            }));

            const result = await submitTest(testId, responses);

            alert('Nộp bài thành công!');
            navigate(`/test-result/${result.attemptId}`);
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('Có lỗi khi nộp bài. Vui lòng thử lại.');
            setIsSubmitted(false);
        }
    };

    const getQuestionsForCurrentAudio = () => {
        const currentAudio = audioList[currentAudioIndex];
        if (!currentAudio) return [];

        return questions.filter(q => q.audioId === currentAudio.id);
    };

    if (loading) {
        return (
            <div className="test-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải bài thi...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="test-error">
                <div className="error-icon">❌</div>
                <h2>Lỗi tải bài thi</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/')} className="btn-back-home">
                    Về trang chủ
                </button>
            </div>
        );
    }

    if (!test) {
        return (
            <div className="test-not-found">
                <h2>Không tìm thấy bài thi</h2>
                <button onClick={() => navigate('/')} className="btn-back-home">
                    Về trang chủ
                </button>
            </div>
        );
    }

    const currentAudio = audioList[currentAudioIndex];
    const currentQuestions = getQuestionsForCurrentAudio();
    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = questions.length;

    return (
        <div className="take-listening-test">
            {/* Test Header */}
            <div className="test-header">
                <div className="test-info">
                    <h1>{test.testName}</h1>
                    <div className="test-meta">
                        <span className="test-type">IELTS Listening</span>
                        <span className="question-progress">
                            {answeredCount}/{totalQuestions} câu đã làm
                        </span>
                    </div>
                </div>

                <div className="test-timer">
                    <div className={`timer-display ${timeRemaining < 300 ? 'warning' : ''}`}>
                        ⏰ {formatTimeRemaining(timeRemaining)}
                    </div>
                    {timeRemaining < 300 && (
                        <div className="timer-warning">
                            Còn ít thời gian!
                        </div>
                    )}
                </div>
            </div>

            <div className="test-content">
                {/* Audio Navigation Sidebar */}
                <div className="audio-navigation">
                    <h3>Sections</h3>
                    <div className="audio-list">
                        {audioList.map((audio, index) => (
                            <button
                                key={audio.id}
                                className={`audio-nav-item ${index === currentAudioIndex ? 'active' : ''}`}
                                onClick={() => navigateToAudio(index)}
                            >
                                <div className="audio-nav-title">{audio.title}</div>
                                <div className="audio-nav-section">{audio.section}</div>
                                <div className="audio-nav-questions">
                                    {questions.filter(q => q.audioId === audio.id).length} câu hỏi
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Progress Summary */}
                    <div className="progress-summary">
                        <h4>Tiến độ</h4>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                            ></div>
                        </div>
                        <div className="progress-text">
                            {answeredCount}/{totalQuestions} câu
                        </div>
                    </div>
                </div>

                {/* Main Test Area */}
                <div className="test-main">
                    {currentAudio && (
                        <>
                            {/* Audio Player */}
                            <div className="audio-section">
                                <AudioDebugInfo audio={currentAudio} />

                                <ListeningAudioPlayer
                                    audioSrc={currentAudio.fileUrl}
                                    title={currentAudio.title}
                                    section={currentAudio.section}
                                    onTimeUpdate={handleAudioTimeUpdate}
                                    onPlay={handleAudioPlay}
                                    onPause={handleAudioPause}
                                    onReplay={handleAudioReplay}
                                    allowSeeking={test.isPractice}
                                    isCurrentSection={true}
                                />
                            </div>

                            {/* Instructions */}
                            {test.instructions && (
                                <div className="test-instructions">
                                    <h3>Hướng dẫn</h3>
                                    <div className="instructions-content">
                                        {test.instructions.split('\n').map((line, index) => (
                                            <p key={index}>{line}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Questions for Current Audio */}
                            <div className="questions-section">
                                <h3>Câu hỏi cho {currentAudio.title}</h3>

                                {currentQuestions.length === 0 ? (
                                    <div className="no-questions">
                                        <p>Không có câu hỏi nào cho section này.</p>
                                    </div>
                                ) : (
                                    <div className="questions-list">
                                        {currentQuestions.map((question, index) => {
                                            const showInstructions = index === 0 ||
                                                question.questionSetInstructions !== currentQuestions[index - 1]?.questionSetInstructions;

                                            return (
                                                <div key={question.id} className="question-wrapper">
                                                    {showInstructions && question.questionSetInstructions && (
                                                        <div className="question-set-instructions">
                                                            <div className="instructions-header">📋 Hướng dẫn</div>
                                                            <div className="instructions-text">
                                                                {question.questionSetInstructions}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <ListeningQuestionRenderer
                                                        question={question}
                                                        questionIndex={questions.findIndex(q => q.id === question.id)}
                                                        userAnswer={userAnswers[question.id]}
                                                        onAnswerChange={handleAnswerChange}
                                                        isSubmitted={isSubmitted}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Navigation Controls */}
                            <div className="audio-navigation-controls">
                                <button
                                    className="nav-btn prev-btn"
                                    onClick={() => navigateToAudio(currentAudioIndex - 1)}
                                    disabled={currentAudioIndex === 0}
                                >
                                    ← Section trước
                                </button>

                                <span className="section-indicator">
                                    Section {currentAudioIndex + 1} / {audioList.length}
                                </span>

                                <button
                                    className="nav-btn next-btn"
                                    onClick={() => navigateToAudio(currentAudioIndex + 1)}
                                    disabled={currentAudioIndex === audioList.length - 1}
                                >
                                    Section tiếp theo →
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Submit Section */}
            <div className="test-submit-section">
                <div className="submit-info">
                    <div className="answer-summary">
                        <span className="answered-count">{answeredCount}</span>
                        <span className="total-count">/ {totalQuestions}</span>
                        <span className="summary-text">câu đã trả lời</span>
                    </div>

                    {answeredCount < totalQuestions && (
                        <div className="incomplete-warning">
                            ⚠️ Bạn chưa trả lời {totalQuestions - answeredCount} câu hỏi
                        </div>
                    )}
                </div>

                <button
                    className="submit-btn"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitted}
                >
                    {isSubmitted ? 'Đang nộp bài...' : 'Nộp bài thi'}
                </button>
            </div>
        </div>
    );
};

export default TakeListeningTest;