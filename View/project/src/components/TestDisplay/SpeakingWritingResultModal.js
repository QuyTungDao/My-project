import React, { useState, useEffect } from 'react';
import './SpeakingWritingResultModal.css';

const SpeakingWritingResultModal = ({ isOpen, onClose, attemptId, testType }) => {
    const [resultData, setResultData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [audioPlaying, setAudioPlaying] = useState({});

    // Load result data when modal opens
    useEffect(() => {
        if (isOpen && attemptId) {
            loadResultData();
        }

        // Cleanup function
        return () => {
            // Stop all playing audio when component unmounts
            Object.values(audioPlaying).forEach(audio => {
                if (audio && typeof audio.pause === 'function') {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        };
    }, [isOpen, attemptId]);

    const loadResultData = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('🔍 Loading Speaking/Writing result for attempt:', attemptId);

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/test-attempts/${attemptId}/detailed-result`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to load result: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Result data loaded:', data);

            setResultData(data);

        } catch (error) {
            console.error('❌ Error loading result data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Determine if this is speaking or writing test
    const isSpeakingTest = () => {
        return resultData?.testType === 'SPEAKING' ||
            testType?.toUpperCase().includes('SPEAKING');
    };

    // Get criteria for the test type
    const getCriteria = () => {
        if (isSpeakingTest()) {
            return [
                { id: 'fluency', name: 'Fluency and Coherence', description: 'Khả năng nói trôi chảy và mạch lạc' },
                { id: 'lexical', name: 'Lexical Resource', description: 'Vốn từ vựng phong phú' },
                { id: 'grammar', name: 'Grammatical Range and Accuracy', description: 'Ngữ pháp đa dạng và chính xác' },
                { id: 'pronunciation', name: 'Pronunciation', description: 'Phát âm rõ ràng' }
            ];
        } else {
            return [
                { id: 'task_achievement', name: 'Task Achievement', description: 'Hoàn thành nhiệm vụ' },
                { id: 'coherence', name: 'Coherence and Cohesion', description: 'Tính mạch lạc và liên kết' },
                { id: 'lexical', name: 'Lexical Resource', description: 'Vốn từ vựng phong phú' },
                { id: 'grammar', name: 'Grammatical Range and Accuracy', description: 'Ngữ pháp đa dạng và chính xác' }
            ];
        }
    };

    // Play audio function
    const playAudio = async (responseId, audioBase64) => {
        try {
            // Stop any currently playing audio
            Object.keys(audioPlaying).forEach(id => {
                if (audioPlaying[id] && id !== responseId && typeof audioPlaying[id].pause === 'function') {
                    audioPlaying[id].pause();
                    audioPlaying[id].currentTime = 0;
                }
            });

            setAudioPlaying(prev => ({ ...prev, [responseId]: 'loading' }));

            const audioSrc = audioBase64.startsWith('data:')
                ? audioBase64
                : `data:audio/webm;base64,${audioBase64}`;

            const audio = new Audio();
            audio.preload = 'metadata';
            audio.crossOrigin = 'anonymous';

            audio.oncanplaythrough = () => {
                console.log('✅ Audio ready to play for response:', responseId);
                setAudioPlaying(prev => ({ ...prev, [responseId]: audio }));
                audio.play().catch(err => {
                    console.error('Play failed:', err);
                    setAudioPlaying(prev => ({ ...prev, [responseId]: null }));
                });
            };

            audio.onended = () => {
                console.log('🔚 Audio ended for response:', responseId);
                setAudioPlaying(prev => ({ ...prev, [responseId]: null }));
            };

            audio.onerror = (e) => {
                console.error('❌ Audio error for response:', responseId, e);
                setAudioPlaying(prev => ({ ...prev, [responseId]: null }));
                alert('Không thể phát audio');
            };

            audio.src = audioSrc;

        } catch (error) {
            console.error('❌ Error setting up audio player:', error);
            setAudioPlaying(prev => ({ ...prev, [responseId]: null }));
            alert('Lỗi khởi tạo audio player: ' + error.message);
        }
    };

    const stopAudio = (responseId) => {
        const audio = audioPlaying[responseId];
        if (audio && typeof audio.pause === 'function') {
            audio.pause();
            audio.currentTime = 0;
            setAudioPlaying(prev => ({ ...prev, [responseId]: null }));
        }
    };

    // Get score color
    const getScoreColor = (score) => {
        if (score >= 7) return '#4CAF50'; // Green
        if (score >= 5) return '#FF9800'; // Orange
        return '#F44336'; // Red
    };

    // Format score for display
    const formatScore = (score) => {
        if (score === null || score === undefined) return 'Chưa có điểm';
        return parseFloat(score).toFixed(1);
    };

    // Get performance badge
    const getPerformanceBadge = (level) => {
        const badges = {
            'Excellent': { icon: '🌟', color: '#4CAF50' },
            'Good': { icon: '👍', color: '#FF9800' },
            'Satisfactory': { icon: '📈', color: '#2196F3' },
            'Needs Improvement': { icon: '📚', color: '#F44336' },
            'Pending': { icon: '⏳', color: '#9E9E9E' }
        };
        return badges[level] || badges['Pending'];
    };

    // Safe check for response methods
    const hasAudioResponse = (response) => {
        return response.audioBase64 || (response.hasAudioResponse && typeof response.hasAudioResponse === 'function' && response.hasAudioResponse());
    };

    const hasTextResponse = (response) => {
        return response.responseText || (response.hasTextResponse && typeof response.hasTextResponse === 'function' && response.hasTextResponse());
    };

    const getWordCount = (response) => {
        if (response.getWordCount && typeof response.getWordCount === 'function') {
            return response.getWordCount();
        }
        return response.responseText ? response.responseText.split(/\s+/).filter(word => word.length > 0).length : 0;
    };

    const getFormattedDuration = (response) => {
        if (response.getFormattedDuration && typeof response.getFormattedDuration === 'function') {
            return response.getFormattedDuration();
        }
        return response.audioDuration ? Math.round(response.audioDuration) + 's' : '';
    };

    if (!isOpen) return null;

    return (
        <div className="speaking-writing-result-modal-overlay">
            <div className="speaking-writing-result-modal-container">
                {/* Header */}
                <div className="result-modal-header">
                    <div>
                        <h2 className="result-modal-title">
                            {isSpeakingTest() ? '🎤 Kết quả IELTS Speaking' : '✍️ Kết quả IELTS Writing'}
                        </h2>
                        {resultData && (
                            <p className="result-modal-subtitle">
                                {resultData.testName}
                            </p>
                        )}
                    </div>
                    <button
                        className="result-modal-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="result-modal-content">
                    {loading && (
                        <div className="result-loading">
                            <div className="result-loading-content">
                                <div className="result-spinner"></div>
                                <p className="result-loading-text">Đang tải kết quả...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="result-error">
                            <div className="result-error-content">
                                <span className="result-error-icon">❌</span>
                                <p className="result-error-text">{error}</p>
                            </div>
                            <button
                                onClick={loadResultData}
                                className="result-error-retry"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {resultData && (
                        <div className="result-content">
                            {/* Overall Score Section */}
                            <div className="overall-score-section">
                                <h3>📊 Điểm tổng kết</h3>
                                <div className="overall-score-display">
                                    <div className="score-circle">
                                        <div
                                            className="score-value"
                                            style={{ color: getScoreColor(resultData.overallScore || 0) }}
                                        >
                                            {formatScore(resultData.overallScore)}
                                        </div>
                                        <div className="score-label">Band Score</div>
                                    </div>

                                    {/* Performance Level Badge */}
                                    {resultData.performanceLevel && (
                                        <div className="performance-badge">
                                            <div
                                                className="badge-icon"
                                                style={{ color: getPerformanceBadge(resultData.performanceLevel).color }}
                                            >
                                                {getPerformanceBadge(resultData.performanceLevel).icon}
                                            </div>
                                            <div className="badge-text">
                                                <div className="badge-level">{resultData.performanceLevel}</div>
                                                <div className="badge-summary">{resultData.performanceSummary}</div>
                                            </div>
                                        </div>
                                    )}

                                    {resultData.overallFeedback && (
                                        <div className="overall-feedback">
                                            <h4>Nhận xét chung từ giáo viên:</h4>
                                            <div className="feedback-content">
                                                {resultData.overallFeedback}
                                            </div>
                                            {resultData.gradedAt && (
                                                <div className="feedback-timestamp">
                                                    Chấm điểm vào: {new Date(resultData.gradedAt).toLocaleString('vi-VN')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Criteria Scores Section */}
                            {resultData.criteriaScores && Object.keys(resultData.criteriaScores).length > 0 && (
                                <div className="criteria-scores-section">
                                    <h3>🎯 Điểm theo tiêu chí</h3>
                                    <div className="criteria-grid">
                                        {getCriteria().map(criterion => {
                                            const score = resultData.criteriaScores[criterion.id];
                                            return (
                                                <div key={criterion.id} className="criterion-card">
                                                    <div className="criterion-header">
                                                        <h4 className="criterion-name">{criterion.name}</h4>
                                                        <div
                                                            className="criterion-score"
                                                            style={{ color: getScoreColor(score || 0) }}
                                                        >
                                                            {formatScore(score)}
                                                        </div>
                                                    </div>
                                                    <p className="criterion-description">{criterion.description}</p>

                                                    {/* Score bar visualization */}
                                                    <div className="score-bar-container">
                                                        <div className="score-bar">
                                                            <div
                                                                className="score-fill"
                                                                style={{
                                                                    width: `${((score || 0) / 9) * 100}%`,
                                                                    backgroundColor: getScoreColor(score || 0)
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <div className="score-labels">
                                                            <span>0</span>
                                                            <span>4.5</span>
                                                            <span>9</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Student Responses Section */}
                            <div className="student-responses-section">
                                <h3>📝 Bài làm của bạn</h3>

                                {resultData.responses && resultData.responses.map((response, index) => (
                                    <div key={response.id || index} className="response-review-item">
                                        <div className="response-review-header">
                                            <h4>Câu hỏi {response.questionNumber || index + 1}</h4>
                                            {response.feedback && (
                                                <div className="response-feedback-indicator">
                                                    <span className="feedback-icon">💬</span>
                                                    Có nhận xét
                                                </div>
                                            )}
                                            {response.manualScore && (
                                                <div className="individual-score-badge">
                                                    <span
                                                        className="score-badge"
                                                        style={{ color: getScoreColor(response.manualScore) }}
                                                    >
                                                        {formatScore(response.manualScore)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="response-review-question">
                                            <strong>Đề bài:</strong> {response.questionText}
                                        </div>

                                        <div className="response-review-content">
                                            {/* Audio Response */}
                                            {hasAudioResponse(response) ? (
                                                <div className="student-audio-response">
                                                    <div className="audio-response-header">
                                                        <span className="audio-label">🎤 Bài nói của bạn</span>
                                                        {response.audioDuration && (
                                                            <span className="audio-duration">
                                                                Thời lượng: {getFormattedDuration(response)}
                                                            </span>
                                                        )}
                                                        {response.audioFileSize && (
                                                            <span className="audio-size">
                                                                Kích thước: {Math.round(response.audioFileSize / 1024)}KB
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="audio-controls">
                                                        {audioPlaying[response.id] === 'loading' ? (
                                                            <button className="audio-btn loading" disabled>
                                                                ⏳ Đang tải...
                                                            </button>
                                                        ) : audioPlaying[response.id] ? (
                                                            <div className="audio-playing">
                                                                <button onClick={() => stopAudio(response.id)} className="audio-btn stop">
                                                                    ⏹️ Dừng
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const audio = audioPlaying[response.id];
                                                                        if (audio && typeof audio.play === 'function') {
                                                                            audio.paused ? audio.play() : audio.pause();
                                                                        }
                                                                    }}
                                                                    className="audio-btn play"
                                                                >
                                                                    {audioPlaying[response.id].paused ? '▶️ Phát' : '⏸️ Tạm dừng'}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => playAudio(response.id, response.audioBase64)}
                                                                className="audio-btn play"
                                                            >
                                                                ▶️ Nghe lại bài nói
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : hasTextResponse(response) ? (
                                                <div className="student-text-response">
                                                    <div className="text-response-header">
                                                        <span className="text-label">✍️ Bài viết của bạn</span>
                                                        <div className="word-count">
                                                            Số từ: {getWordCount(response)}
                                                        </div>
                                                    </div>
                                                    <div className="text-content">
                                                        {response.responseText}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="no-response">Không có bài làm</div>
                                            )}

                                            {/* Individual Feedback */}
                                            {response.feedback && (
                                                <div className="individual-feedback">
                                                    <h5>💬 Nhận xét cho câu này:</h5>
                                                    <div className="feedback-content">
                                                        {response.feedback}
                                                    </div>
                                                    {response.feedbackGivenAt && (
                                                        <div className="feedback-timestamp">
                                                            Nhận xét vào: {new Date(response.feedbackGivenAt).toLocaleString('vi-VN')}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Performance Tips Section */}
                            <div className="performance-tips-section">
                                <h3>💡 Gợi ý cải thiện</h3>
                                <div className="tips-content">
                                    {isSpeakingTest() ? (
                                        <div className="speaking-tips">
                                            <div className="tip-category">
                                                <h4>🗣️ Fluency & Coherence</h4>
                                                <ul>
                                                    <li>Luyện tập nói liên tục không ngắt quãng</li>
                                                    <li>Sử dụng linking words để nối các ý tưởng</li>
                                                    <li>Tránh lặp lại từ ngữ quá nhiều</li>
                                                </ul>
                                            </div>
                                            <div className="tip-category">
                                                <h4>📚 Lexical Resource</h4>
                                                <ul>
                                                    <li>Mở rộng vốn từ vựng theo chủ đề</li>
                                                    <li>Sử dụng idioms và collocations phù hợp</li>
                                                    <li>Tránh lặp lại từ vựng cơ bản</li>
                                                </ul>
                                            </div>
                                            <div className="tip-category">
                                                <h4>📝 Grammar</h4>
                                                <ul>
                                                    <li>Sử dụng đa dạng cấu trúc câu</li>
                                                    <li>Chú ý thì của động từ</li>
                                                    <li>Luyện tập câu phức và câu ghép</li>
                                                </ul>
                                            </div>
                                            <div className="tip-category">
                                                <h4>🔊 Pronunciation</h4>
                                                <ul>
                                                    <li>Luyện phát âm các âm khó</li>
                                                    <li>Chú ý trọng âm từ và câu</li>
                                                    <li>Luyện intonation tự nhiên</li>
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="writing-tips">
                                            <div className="tip-category">
                                                <h4>🎯 Task Achievement</h4>
                                                <ul>
                                                    <li>Đọc kỹ đề bài và trả lời đầy đủ</li>
                                                    <li>Đưa ra ví dụ cụ thể và phù hợp</li>
                                                    <li>Đảm bảo đạt đủ số từ yêu cầu</li>
                                                </ul>
                                            </div>
                                            <div className="tip-category">
                                                <h4>🔗 Coherence & Cohesion</h4>
                                                <ul>
                                                    <li>Sử dụng linking words hiệu quả</li>
                                                    <li>Bố cục bài viết rõ ràng, logic</li>
                                                    <li>Liên kết ý tưởng giữa các đoạn</li>
                                                </ul>
                                            </div>
                                            <div className="tip-category">
                                                <h4>📚 Lexical Resource</h4>
                                                <ul>
                                                    <li>Sử dụng từ vựng đa dạng và chính xác</li>
                                                    <li>Tránh lặp từ, sử dụng synonyms</li>
                                                    <li>Áp dụng academic vocabulary</li>
                                                </ul>
                                            </div>
                                            <div className="tip-category">
                                                <h4>📝 Grammar</h4>
                                                <ul>
                                                    <li>Đa dạng hóa cấu trúc câu</li>
                                                    <li>Kiểm tra lỗi ngữ pháp cơ bản</li>
                                                    <li>Sử dụng câu phức hợp lý</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Next Steps Section */}
                                <div className="next-steps-section">
                                    <h3>📈 Bước tiếp theo</h3>
                                    <div className="next-steps-content">
                                        <div className="step-item">
                                            <div className="step-icon">📖</div>
                                            <div className="step-text">
                                                <strong>Xem lại feedback:</strong> Đọc kỹ các nhận xét của giáo viên để hiểu điểm mạnh và điểm yếu
                                            </div>
                                        </div>
                                        <div className="step-item">
                                            <div className="step-icon">🎯</div>
                                            <div className="step-text">
                                                <strong>Luyện tập focused:</strong> Tập trung vào tiêu chí có điểm thấp nhất
                                            </div>
                                        </div>
                                        <div className="step-item">
                                            <div className="step-icon">📚</div>
                                            <div className="step-text">
                                                <strong>Học từ vựng:</strong> Sử dụng flashcards để mở rộng vốn từ vựng
                                            </div>
                                        </div>
                                        <div className="step-item">
                                            <div className="step-icon">🔄</div>
                                            <div className="step-text">
                                                <strong>Thực hành thường xuyên:</strong> Làm thêm các bài test tương tự để cải thiện
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="result-modal-footer">
                    <button
                        className="result-footer-close"
                        onClick={onClose}
                    >
                        Đóng
                    </button>

                    {resultData && (
                        <div className="result-footer-actions">
                            <button
                                className="result-footer-action print"
                                onClick={() => window.print()}
                            >
                                🖨️ In kết quả
                            </button>
                            <button
                                className="result-footer-action share"
                                onClick={() => {
                                    const shareText = `Tôi vừa hoàn thành bài ${resultData.testName} với điểm ${formatScore(resultData.overallScore)}! 🎉`;
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Kết quả IELTS',
                                            text: shareText
                                        });
                                    } else {
                                        navigator.clipboard.writeText(shareText);
                                        alert('Đã copy kết quả vào clipboard!');
                                    }
                                }}
                            >
                                📤 Chia sẻ
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpeakingWritingResultModal;