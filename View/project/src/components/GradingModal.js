import React, { useState, useEffect } from 'react';
import './GradingModal.css'; // ✅ Import CSS file
import { saveCriteriaGrading } from '../api'; // ✅ Import the API function

const GradingModal = ({ isOpen, onClose, attemptId, testType, onGradingComplete }) => {
    const [gradingData, setGradingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [scores, setScores] = useState({});
    const [feedback, setFeedback] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState({});
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage] = useState(3); // Show 3 responses per page
    const [audioPlaying, setAudioPlaying] = useState({});

    // ✅ NEW: State for criteria-based grading (Speaking/Writing)
    const [criteriaScores, setCriteriaScores] = useState({});
    const [overallFeedback, setOverallFeedback] = useState('');

    // ✅ NEW: Detect if this is speaking/writing test
    const isSpeakingWritingTest = () => {
        return testType?.toUpperCase().includes('SPEAKING') ||
            testType?.toUpperCase().includes('WRITING') ||
            gradingData?.responses?.some(r =>
                r.questionType?.toUpperCase().includes('SPEAKING') ||
                r.questionType?.toUpperCase().includes('WRITING')
            );
    };

    // ✅ NEW: Get criteria for speaking/writing
    const getSpeakingWritingCriteria = () => {
        const isSpeaking = testType?.toUpperCase().includes('SPEAKING') ||
            gradingData?.responses?.some(r => r.questionType?.toUpperCase().includes('SPEAKING'));

        if (isSpeaking) {
            return [
                { id: 'fluency', name: 'Fluency and Coherence', max: 9 },
                { id: 'lexical', name: 'Lexical Resource', max: 9 },
                { id: 'grammar', name: 'Grammatical Range and Accuracy', max: 9 },
                { id: 'pronunciation', name: 'Pronunciation', max: 9 }
            ];
        } else {
            return [
                { id: 'task_achievement', name: 'Task Achievement', max: 9 },
                { id: 'coherence', name: 'Coherence and Cohesion', max: 9 },
                { id: 'lexical', name: 'Lexical Resource', max: 9 },
                { id: 'grammar', name: 'Grammatical Range and Accuracy', max: 9 }
            ];
        }
    };

    // Load grading data when modal opens
    useEffect(() => {
        if (isOpen && attemptId) {
            loadGradingData();
        }
    }, [isOpen, attemptId]);

    const loadGradingData = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('🔍 Loading grading data for attempt:', attemptId);

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/grading/item/${attemptId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to load grading data: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Grading data loaded:', data);

            setGradingData(data);

            // Initialize scores and feedback from existing data
            const initialScores = {};
            const initialFeedback = {};

            data.responses?.forEach(response => {
                if (response.currentScore !== null && response.currentScore !== undefined) {
                    initialScores[response.id] = response.currentScore;
                }
                if (response.manualScore !== null && response.manualScore !== undefined) {
                    initialScores[response.id] = response.manualScore;
                }
                if (response.feedback) {
                    initialFeedback[response.id] = response.feedback;
                }
            });

            setScores(initialScores);
            setFeedback(initialFeedback);

        } catch (error) {
            console.error('❌ Error loading grading data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const validateScore = (score) => {
        const numScore = parseFloat(score);
        if (isNaN(numScore)) {
            return { isValid: false, error: 'Điểm phải là số' };
        }
        if (numScore < 0 || numScore > 9) {
            return { isValid: false, error: 'Điểm phải từ 0 đến 9' };
        }
        if (numScore % 0.5 !== 0) {
            return { isValid: false, error: 'Điểm phải là bội số của 0.5 (0, 0.5, 1.0, 1.5, ...)' };
        }
        return { isValid: true, score: numScore };
    };

    const handleScoreChange = (responseId, score) => {
        setScores(prev => ({
            ...prev,
            [responseId]: score
        }));
        // Clear save status when score changes
        setSaveStatus(prev => ({ ...prev, [responseId]: null }));
    };

    const handleFeedbackChange = (responseId, feedbackText) => {
        setFeedback(prev => ({
            ...prev,
            [responseId]: feedbackText
        }));
        // Clear save status when feedback changes
        setSaveStatus(prev => ({ ...prev, [responseId]: null }));
    };

    const saveGrading = async (responseId) => {
        const score = scores[responseId];
        const feedbackText = feedback[responseId] || '';

        if (score === undefined || score === '') {
            alert('Vui lòng nhập điểm số');
            return;
        }

        const validation = validateScore(score);
        if (!validation.isValid) {
            alert(validation.error);
            return;
        }

        try {
            setSaveStatus(prev => ({ ...prev, [responseId]: 'saving' }));

            const requestData = {
                responseId: responseId,
                manualScore: validation.score,
                feedback: feedbackText
            };

            console.log('💾 Saving grading for response:', responseId, requestData);

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/grading/response/${responseId}/grade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save grading: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Grading saved:', result);

            // Update the grading data to reflect the saved score
            setGradingData(prev => ({
                ...prev,
                responses: prev.responses.map(resp =>
                    resp.id === responseId
                        ? {
                            ...resp,
                            currentScore: validation.score,
                            manualScore: validation.score,
                            feedback: feedbackText,
                            feedbackGivenAt: new Date().toISOString()
                        }
                        : resp
                )
            }));

            setSaveStatus(prev => ({ ...prev, [responseId]: 'saved' }));

            // Clear status after 3 seconds
            setTimeout(() => {
                setSaveStatus(prev => ({ ...prev, [responseId]: null }));
            }, 3000);

        } catch (error) {
            console.error('❌ Error saving grading:', error);
            setSaveStatus(prev => ({ ...prev, [responseId]: 'error' }));
            alert('Lỗi khi lưu điểm: ' + error.message);
        }
    };

    // ✅ NEW: Save speaking/writing grading using API function
    const saveSpeakingWritingGrading = async () => {
        console.log('🎯 Starting speaking/writing grading save...');
        console.log('Current criteriaScores:', criteriaScores);

        // Validate all criteria have scores
        const criteriaKeys = getSpeakingWritingCriteria().map(c => c.id);
        const missingCriteria = criteriaKeys.filter(key => !criteriaScores[key] || criteriaScores[key] === '');

        if (missingCriteria.length > 0) {
            alert(`Please provide scores for all criteria. Missing: ${missingCriteria.join(', ')}`);
            return;
        }

        // Validate all scores are valid numbers
        const validatedScores = {};
        let hasValidationErrors = false;

        for (const key of criteriaKeys) {
            const validation = validateScore(criteriaScores[key]);
            if (!validation.isValid) {
                alert(`Invalid score for ${key}: ${validation.error}`);
                hasValidationErrors = true;
                break;
            }
            validatedScores[key] = validation.score;
        }

        if (hasValidationErrors) return;

        // Calculate overall score
        const scores = Object.values(validatedScores);
        const overallScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 2) / 2;

        try {
            setSaving(true);

            // ✅ Map frontend criteria names to backend expected format
            const mappedCriteriaScores = {};

            const isSpeaking = testType?.toUpperCase().includes('SPEAKING');

            if (isSpeaking) {
                // Speaking mapping
                mappedCriteriaScores.fluency = validatedScores.fluency;
                mappedCriteriaScores.lexical = validatedScores.lexical;
                mappedCriteriaScores.grammar = validatedScores.grammar;
                mappedCriteriaScores.pronunciation = validatedScores.pronunciation;
            } else {
                // Writing mapping
                mappedCriteriaScores.task_achievement = validatedScores.task_achievement;
                mappedCriteriaScores.coherence = validatedScores.coherence;
                mappedCriteriaScores.lexical = validatedScores.lexical;
                mappedCriteriaScores.grammar = validatedScores.grammar;
            }

            const requestData = {
                attemptId: attemptId,
                overallScore: overallScore,
                criteriaScores: mappedCriteriaScores,
                feedback: overallFeedback || '',
                testType: testType
            };

            console.log('💾 Sending request data:', requestData);

            // ✅ Use API function instead of direct fetch
            const result = await saveCriteriaGrading(requestData);

            console.log('✅ Success response:', result);

            alert(`Assessment saved successfully! Overall Band Score: ${overallScore}`);

            if (onGradingComplete) {
                onGradingComplete();
            }

            onClose();

        } catch (error) {
            console.error('❌ Error saving grading:', error);
            alert('Error saving assessment: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const saveAllGrading = async () => {
        const unscoredResponses = gradingData.responses.filter(response =>
            scores[response.id] === undefined || scores[response.id] === ''
        );

        if (unscoredResponses.length > 0) {
            const proceed = window.confirm(
                `Còn ${unscoredResponses.length} câu chưa chấm điểm. Bạn có muốn tiếp tục lưu những câu đã chấm không?`
            );
            if (!proceed) return;
        }

        try {
            setSaving(true);

            const gradingRequests = gradingData.responses
                .filter(response => scores[response.id] !== undefined && scores[response.id] !== '')
                .map(response => {
                    const validation = validateScore(scores[response.id]);
                    if (!validation.isValid) {
                        throw new Error(`Điểm không hợp lệ cho câu ${response.id}: ${validation.error}`);
                    }
                    return {
                        responseId: response.id,
                        manualScore: validation.score,
                        feedback: feedback[response.id] || ''
                    };
                });

            if (gradingRequests.length === 0) {
                alert('Không có câu nào được chấm điểm');
                return;
            }

            console.log('💾 Saving all grading:', gradingRequests);

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/grading/batch-grade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(gradingRequests)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save all grading: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ All grading saved:', result);

            alert(`Đã lưu ${result.successCount || gradingRequests.length} điểm thành công!`);

            if (onGradingComplete) {
                onGradingComplete();
            }

            onClose(); // Close modal after successful save

        } catch (error) {
            console.error('❌ Error saving all grading:', error);
            alert('Lỗi khi lưu tất cả điểm: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 7) return '#4CAF50'; // Green
        if (score >= 5) return '#FF9800'; // Orange
        return '#F44336'; // Red
    };

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

            // Enhanced audio source handling
            const audioSrc = audioBase64.startsWith('data:')
                ? audioBase64
                : `data:audio/webm;base64,${audioBase64}`;

            const audio = new Audio();

            // Enhanced audio settings for better quality
            audio.preload = 'metadata';
            audio.crossOrigin = 'anonymous';

            // Set up comprehensive event listeners
            audio.onloadstart = () => {
                console.log('🎵 Audio loading started for response:', responseId);
            };

            audio.oncanplaythrough = () => {
                console.log('✅ Audio ready to play for response:', responseId);
                setAudioPlaying(prev => ({ ...prev, [responseId]: audio }));
                audio.play().catch(err => {
                    console.error('Play failed:', err);
                    setAudioPlaying(prev => ({ ...prev, [responseId]: null }));
                    alert('Không thể phát audio. Hãy thử lại.');
                });
            };

            audio.onended = () => {
                console.log('🔚 Audio ended for response:', responseId);
                setAudioPlaying(prev => ({ ...prev, [responseId]: null }));
            };

            audio.onpause = () => {
                console.log('⏸️ Audio paused for response:', responseId);
            };

            audio.onerror = (e) => {
                console.error('❌ Audio error for response:', responseId, e);
                setAudioPlaying(prev => ({ ...prev, [responseId]: null }));

                // More detailed error messages
                const error = audio.error;
                let errorMessage = 'Không thể phát audio';

                if (error) {
                    switch (error.code) {
                        case error.MEDIA_ERR_ABORTED:
                            errorMessage = 'Phát audio bị hủy';
                            break;
                        case error.MEDIA_ERR_NETWORK:
                            errorMessage = 'Lỗi mạng khi tải audio';
                            break;
                        case error.MEDIA_ERR_DECODE:
                            errorMessage = 'Lỗi decode audio - file có thể bị hỏng';
                            break;
                        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            errorMessage = 'Định dạng audio không được hỗ trợ';
                            break;
                    }
                }

                alert(errorMessage);
            };

            // Set source and start loading
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
            audio.currentTime = 0; // Reset to beginning
            setAudioPlaying(prev => ({ ...prev, [responseId]: null }));
            console.log('⏹️ Audio stopped for response:', responseId);
        }
    };

    // Add new function to get audio duration and current time
    const getAudioInfo = (responseId) => {
        const audio = audioPlaying[responseId];
        if (audio && typeof audio.duration === 'number') {
            return {
                duration: audio.duration,
                currentTime: audio.currentTime || 0,
                isPlaying: !audio.paused
            };
        }
        return { duration: 0, currentTime: 0, isPlaying: false };
    };

    // Add function to format audio time
    const formatAudioTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Add function to seek audio
    const seekAudio = (responseId, time) => {
        const audio = audioPlaying[responseId];
        if (audio && typeof audio.currentTime === 'number') {
            audio.currentTime = time;
        }
    };

    const getGradingProgress = () => {
        if (!gradingData?.responses) return { graded: 0, total: 0, percentage: 0 };

        if (isSpeakingWritingTest()) {
            // For speaking/writing, check if overall assessment is done
            const hasOverallScore = gradingData.currentScore !== null && gradingData.currentScore !== undefined;
            return {
                graded: hasOverallScore ? 1 : 0,
                total: 1,
                percentage: hasOverallScore ? 100 : 0
            };
        } else {
            // For individual question grading
            const total = gradingData.responses.length;
            const graded = gradingData.responses.filter(r =>
                scores[r.id] !== undefined && scores[r.id] !== ''
            ).length;

            return {
                graded,
                total,
                percentage: total > 0 ? Math.round((graded / total) * 100) : 0
            };
        }
    };

    const getCriteriaHint = (questionType) => {
        if (questionType?.toUpperCase().includes('SPEAKING')) {
            return {
                title: 'Tiêu chí chấm Speaking:',
                details: 'Fluency & Coherence • Lexical Resource • Grammatical Range & Accuracy • Pronunciation'
            };
        }
        if (questionType?.toUpperCase().includes('WRITING')) {
            return {
                title: 'Tiêu chí chấm Writing:',
                details: 'Task Achievement • Coherence & Cohesion • Lexical Resource • Grammatical Range & Accuracy'
            };
        }
        return null;
    };

    // Pagination logic for regular tests
    const totalPages = gradingData?.responses ? Math.ceil(gradingData.responses.length / itemsPerPage) : 0;
    const currentResponses = gradingData?.responses?.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    ) || [];

    const progress = getGradingProgress();

    if (!isOpen) return null;

    return (
        <div className="grading-modal-overlay">
            <div className="grading-modal-container">
                {/* Header */}
                <div className="grading-modal-header">
                    <div>
                        <h2 className="grading-modal-title">
                            🎯 Chấm điểm bài thi
                        </h2>
                        {gradingData && (
                            <p className="grading-modal-subtitle">
                                {gradingData.studentName} • {gradingData.testName}
                            </p>
                        )}
                    </div>
                    <button
                        className="grading-modal-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {/* Progress Bar */}
                {gradingData && (
                    <div className="grading-progress-container">
                        <div className="grading-progress-info">
                            <span>
                                {isSpeakingWritingTest()
                                    ? `Assessment Progress: ${progress.graded ? 'Complete' : 'Pending'}`
                                    : `Tiến độ chấm bài: ${progress.graded}/${progress.total} câu`
                                }
                            </span>
                            <span>
                                {progress.percentage}%
                            </span>
                        </div>
                        <div className="grading-progress-bar">
                            <div
                                className="grading-progress-fill"
                                style={{ width: `${progress.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="grading-modal-content">
                    {loading && (
                        <div className="grading-loading">
                            <div className="grading-loading-content">
                                <div className="grading-spinner"></div>
                                <p className="grading-loading-text">Đang tải bài làm...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="grading-error">
                            <div className="grading-error-content">
                                <span className="grading-error-icon">❌</span>
                                <p className="grading-error-text">{error}</p>
                            </div>
                            <button
                                onClick={loadGradingData}
                                className="grading-error-retry"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {gradingData && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="grading-student-info">
                                <h3 className="grading-student-title">
                                    👤 Thông tin học sinh
                                </h3>
                                <div className="grading-student-grid">
                                    <div className="grading-student-field">
                                        <strong>Tên:</strong> {gradingData.studentName}
                                    </div>
                                    <div className="grading-student-field">
                                        <strong>Email:</strong> {gradingData.studentEmail}
                                    </div>
                                    <div className="grading-student-field">
                                        <strong>Bài thi:</strong> {gradingData.testName}
                                    </div>
                                    <div className="grading-student-field">
                                        <strong>Loại:</strong> {gradingData.testType}
                                    </div>
                                    <div className="grading-student-field">
                                        <strong>Nộp lúc:</strong> {new Date(gradingData.submittedAt).toLocaleString('vi-VN')}
                                    </div>
                                    <div className="grading-student-field">
                                        <strong>Điểm hiện tại:</strong>
                                        <span
                                            className="grading-current-score"
                                            style={{
                                                color: getScoreColor(gradingData.currentScore || 0),
                                                fontWeight: '600'  // Thay vì dùng CSS class có thể có border
                                            }}
                                        >
                                            {gradingData.currentScore || 'Chưa chấm'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Responses */}
                            <div>
                                {isSpeakingWritingTest() ? (
                                    // ✅ NEW: Speaking/Writing Test Layout
                                    <div className="speaking-writing-grading">
                                        <h3 className="grading-responses-title">
                                            🎯 {testType?.toUpperCase().includes('SPEAKING') ? 'Speaking' : 'Writing'} Test Responses
                                        </h3>

                                        {/* Display all questions/responses for review */}
                                        <div className="responses-review-section">
                                            <h4>📝 Student Responses:</h4>
                                            {gradingData.responses.map((response, index) => (
                                                <div key={response.id} className="response-review-item">
                                                    <div className="response-review-header">
                                                        <h5>Question {index + 1}</h5>
                                                    </div>

                                                    <div className="response-review-question">
                                                        <strong>Prompt:</strong> {response.questionText}
                                                    </div>

                                                    <div className="response-review-content">
                                                        {/* Audio Response */}
                                                        {(() => {
                                                            let audioData = response.responseText && response.responseText.length > 100 && !response.responseText.includes(' ')
                                                                ? response.responseText
                                                                : response.audioBase64;

                                                            return audioData ? (
                                                                <div className="grading-audio-response">
                                                                    <div className="grading-audio-header">
                                                                        <span className="grading-audio-label">🎤 Audio Recording</span>
                                                                    </div>
                                                                    <div className="grading-audio-controls">
                                                                        {audioPlaying[response.id] === 'loading' ? (
                                                                            <button className="grading-audio-btn loading" disabled>
                                                                                ⏳ Loading...
                                                                            </button>
                                                                        ) : audioPlaying[response.id] ? (
                                                                            <div className="grading-audio-playing">
                                                                                <button onClick={() => stopAudio(response.id)} className="grading-audio-btn stop">
                                                                                    ⏹️ Stop
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const audio = audioPlaying[response.id];
                                                                                        audio.paused ? audio.play() : audio.pause();
                                                                                    }}
                                                                                    className="grading-audio-btn play"
                                                                                >
                                                                                    {audioPlaying[response.id].paused ? '▶️ Play' : '⏸️ Pause'}
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => playAudio(response.id, audioData)}
                                                                                className="grading-audio-btn play"
                                                                            >
                                                                                ▶️ Play Audio
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : response.responseText ? (
                                                                <div className="grading-text-response">
                                                                    <div className="grading-text-content">{response.responseText}</div>
                                                                    <div className="grading-word-count">
                                                                        Words: {response.responseText.split(/\s+/).length}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="grading-no-response">No response provided</div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Criteria-based Grading Section */}
                                        <div className="criteria-grading-section">
                                            <h4>🎯 Band Score Assessment</h4>
                                            <p className="criteria-instruction">
                                                Grade each criterion separately. The overall band score will be calculated automatically.
                                            </p>

                                            <div className="criteria-grid">
                                                {getSpeakingWritingCriteria().map(criterion => (
                                                    <div key={criterion.id} className="criterion-item">
                                                        <label className="criterion-label">{criterion.name}</label>
                                                        <div className="criterion-input-group">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="9"
                                                                step="0.5"
                                                                value={criteriaScores[criterion.id] || ''}
                                                                onChange={(e) => setCriteriaScores(prev => ({
                                                                    ...prev,
                                                                    [criterion.id]: e.target.value
                                                                }))}
                                                                className="criterion-score-input"
                                                                placeholder="0-9"
                                                            />
                                                            <span className="criterion-max">/ {criterion.max}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Overall Score Display */}
                                            <div className="overall-score-display">
                                                <label>Overall Band Score:</label>
                                                <div className="overall-score-value">
                                                    {(() => {
                                                        const scores = Object.values(criteriaScores).map(s => parseFloat(s)).filter(s => !isNaN(s));
                                                        if (scores.length === 4) {
                                                            const average = scores.reduce((a, b) => a + b, 0) / scores.length;
                                                            return Math.round(average * 2) / 2; // Round to nearest 0.5
                                                        }
                                                        return '—';
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Overall Feedback */}
                                            <div className="overall-feedback-section">
                                                <label className="feedback-label">Overall Feedback:</label>
                                                <textarea
                                                    value={overallFeedback}
                                                    onChange={(e) => setOverallFeedback(e.target.value)}
                                                    className="overall-feedback-textarea"
                                                    placeholder="Provide detailed feedback on the student's performance..."
                                                    rows={6}
                                                />
                                            </div>

                                            {/* Save Button */}
                                            <div className="criteria-save-section">
                                                <button
                                                    onClick={saveSpeakingWritingGrading}
                                                    disabled={(() => {
                                                        const requiredCriteria = getSpeakingWritingCriteria().map(c => c.id);
                                                        const filledCriteria = requiredCriteria.filter(key =>
                                                            criteriaScores[key] && criteriaScores[key] !== ''
                                                        );
                                                        return filledCriteria.length < requiredCriteria.length || saving;
                                                    })()}
                                                    className={`criteria-save-btn ${
                                                        (() => {
                                                            const requiredCriteria = getSpeakingWritingCriteria().map(c => c.id);
                                                            const filledCriteria = requiredCriteria.filter(key =>
                                                                criteriaScores[key] && criteriaScores[key] !== ''
                                                            );
                                                            return filledCriteria.length === requiredCriteria.length ? 'enabled' : 'disabled';
                                                        })()
                                                    }`}
                                                >
                                                    {saving ? '⏳ Saving...' : '💾 Save Assessment'}
                                                </button>

                                                {/* Progress indicator */}
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                                    {(() => {
                                                        const requiredCriteria = getSpeakingWritingCriteria().map(c => c.id);
                                                        const filledCriteria = requiredCriteria.filter(key =>
                                                            criteriaScores[key] && criteriaScores[key] !== ''
                                                        );
                                                        return `${filledCriteria.length}/${requiredCriteria.length} criteria completed`;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // ✅ Original: Individual question grading for other test types
                                    <div>
                                        <h3 className="grading-responses-title">
                                            📝 Câu trả lời ({gradingData.responses?.length || 0} câu)
                                        </h3>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="grading-pagination">
                                                <button
                                                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                                    disabled={currentPage === 0}
                                                    className="grading-pagination-btn"
                                                >
                                                    ← Trước
                                                </button>
                                                <span className="grading-pagination-info">
                                                    Trang {currentPage + 1} / {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                                    disabled={currentPage === totalPages - 1}
                                                    className="grading-pagination-btn"
                                                >
                                                    Sau →
                                                </button>
                                            </div>
                                        )}

                                        {currentResponses.map((response, index) => {
                                            const globalIndex = currentPage * itemsPerPage + index;
                                            const criteria = getCriteriaHint(response.questionType);

                                            return (
                                                <div key={response.id} className="grading-response-card">
                                                    {/* Response Header */}
                                                    <div className="grading-response-header">
                                                        <h4 className="grading-response-number">
                                                            Câu {globalIndex + 1}
                                                        </h4>
                                                        <div>
                                                            {(response.currentScore !== null && response.currentScore !== undefined) ||
                                                            (response.manualScore !== null && response.manualScore !== undefined) ? (
                                                                <span
                                                                    className="grading-status-badge grading-status-completed"
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.25rem',
                                                                        padding: '0.25rem 0.75rem',
                                                                        borderRadius: '9999px',
                                                                        fontSize: '0.875rem',
                                                                        fontWeight: '500',
                                                                        backgroundColor: `${getScoreColor(response.currentScore || response.manualScore)}20`,
                                                                        color: getScoreColor(response.currentScore || response.manualScore)
                                                                    }}
                                                                >
                                                                ✅ {response.currentScore || response.manualScore}/9
                                                            </span>
                                                            ) : (
                                                                <span className="grading-status-badge grading-status-pending">
                                                                ⏳ Chưa chấm
                                                            </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Question */}
                                                    <div className="grading-question">
                                                        <div className="grading-question-label">Câu hỏi:</div>
                                                        <p className="grading-question-text">{response.questionText}</p>
                                                    </div>

                                                    {/* Response Content */}
                                                    <div className="grading-response-content">
                                                        <div className="grading-response-label">Câu trả lời:</div>

                                                        {/* Enhanced Audio Response - Handle audio in responseText */}
                                                        {(() => {
                                                            // For speaking tests, audio data might be in responseText instead of separate audio field
                                                            let audioData = null;

                                                            // Check if responseText contains base64 audio data (no spaces, long string)
                                                            if (response.responseText &&
                                                                response.responseText.length > 100 &&
                                                                !response.responseText.includes(' ') &&
                                                                /^[A-Za-z0-9+/=]+$/.test(response.responseText)) {
                                                                audioData = response.responseText;
                                                                console.log('🎵 Found audio in responseText for response', response.id);
                                                            }

                                                            // Also check traditional audio fields as fallback
                                                            if (!audioData) {
                                                                audioData = response.audioBase64 ||
                                                                    response.audioResponse ||
                                                                    response.audio_base64 ||
                                                                    response.audioData ||
                                                                    response.responseAudio;
                                                            }

                                                            console.log('🔍 Audio detection for response', response.id, {
                                                                responseTextLength: response.responseText?.length || 0,
                                                                isLikelyAudio: !!(response.responseText && response.responseText.length > 100 && !response.responseText.includes(' ')),
                                                                audioBase64: !!response.audioBase64,
                                                                foundAudio: !!audioData,
                                                                audioLength: audioData?.length || 0
                                                            });

                                                            return audioData ? (
                                                                <div className="grading-audio-response">
                                                                    <div className="grading-audio-header">
                                                                        <span className="grading-audio-label">🎤 Audio Recording</span>
                                                                        <span className="grading-audio-info">
                                                                        Size: {Math.round(audioData.length * 0.75 / 1024)}KB
                                                                    </span>
                                                                        {(() => {
                                                                            const audioInfo = getAudioInfo(response.id);
                                                                            return audioInfo.duration > 0 && (
                                                                                <span className="grading-audio-duration">
                                                                                {formatAudioTime(audioInfo.currentTime)} / {formatAudioTime(audioInfo.duration)}
                                                                            </span>
                                                                            );
                                                                        })()}
                                                                    </div>

                                                                    <div className="grading-audio-controls">
                                                                        {audioPlaying[response.id] === 'loading' ? (
                                                                            <div className="grading-audio-loading">
                                                                                <button className="grading-audio-btn loading" disabled>
                                                                                    ⏳ Đang tải...
                                                                                </button>
                                                                                <span className="grading-audio-status">Đang tải audio...</span>
                                                                            </div>
                                                                        ) : audioPlaying[response.id] && typeof audioPlaying[response.id].pause === 'function' ? (
                                                                            <div className="grading-audio-playing">
                                                                                <button
                                                                                    onClick={() => stopAudio(response.id)}
                                                                                    className="grading-audio-btn stop"
                                                                                    title="Dừng và reset về đầu"
                                                                                >
                                                                                    ⏹️ Dừng
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const audio = audioPlaying[response.id];
                                                                                        if (audio.paused) {
                                                                                            audio.play();
                                                                                        } else {
                                                                                            audio.pause();
                                                                                        }
                                                                                    }}
                                                                                    className="grading-audio-btn play"
                                                                                    title={(() => {
                                                                                        const audio = audioPlaying[response.id];
                                                                                        return audio && audio.paused ? 'Tiếp tục phát' : 'Tạm dừng';
                                                                                    })()}
                                                                                >
                                                                                    {(() => {
                                                                                        const audio = audioPlaying[response.id];
                                                                                        return audio && audio.paused ? '▶️ Phát' : '⏸️ Dừng';
                                                                                    })()}
                                                                                </button>
                                                                                <span className="grading-audio-status">
                                                                                {(() => {
                                                                                    const audio = audioPlaying[response.id];
                                                                                    return audio && audio.paused ? 'Đã tạm dừng' : '🔊 Đang phát...';
                                                                                })()}
                                                                            </span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="grading-audio-ready">
                                                                                <button
                                                                                    onClick={() => playAudio(response.id, audioData)}
                                                                                    className="grading-audio-btn play"
                                                                                    title="Phát audio từ đầu"
                                                                                >
                                                                                    ▶️ Phát audio
                                                                                </button>
                                                                                <span className="grading-audio-status">Sẵn sàng phát</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Audio Progress Bar (if playing) */}
                                                                    {audioPlaying[response.id] && typeof audioPlaying[response.id].duration === 'number' && (
                                                                        <div className="grading-audio-progress">
                                                                            <input
                                                                                type="range"
                                                                                min="0"
                                                                                max={audioPlaying[response.id].duration || 100}
                                                                                value={audioPlaying[response.id].currentTime || 0}
                                                                                onChange={(e) => seekAudio(response.id, parseFloat(e.target.value))}
                                                                                className="grading-audio-seek"
                                                                                title="Kéo để tua audio"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* Audio Tips */}
                                                                    <div className="grading-audio-tips">
                                                                        <small>💡 Tips: Click "Phát audio" để nghe bài nói của học sinh. Bạn có thể tua và phát lại nhiều lần.</small>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // Show text response if no audio found
                                                                response.responseText && response.responseText.length < 500 && response.responseText.includes(' ') ? (
                                                                    <div className="grading-text-response">
                                                                        <div className="grading-text-content">
                                                                            {response.responseText}
                                                                        </div>
                                                                        <div className="grading-word-count">
                                                                            Số từ: {response.responseText.split(/\s+/).length}
                                                                        </div>
                                                                    </div>
                                                                ) : null
                                                            );
                                                        })()}

                                                        {/* No Response */}
                                                        {!response.responseText && !response.audioBase64 && (
                                                            <div className="grading-no-response">
                                                                <div className="grading-no-response-icon">📝</div>
                                                                <div className="grading-no-response-text">Học sinh không trả lời câu này</div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Grading Criteria */}
                                                    {criteria && (
                                                        <div className="grading-criteria">
                                                            <p className="grading-criteria-title">{criteria.title}</p>
                                                            <p className="grading-criteria-details">{criteria.details}</p>
                                                        </div>
                                                    )}

                                                    {/* Grading Section */}
                                                    <div className="grading-form-section">
                                                        <h5 className="grading-form-title">Chấm điểm:</h5>

                                                        <div className="grading-form-grid">
                                                            <div className="grading-form-group">
                                                                <label className="grading-form-label">
                                                                    Điểm số (0-9) *
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="9"
                                                                    step="0.5"
                                                                    value={scores[response.id] || ''}
                                                                    onChange={(e) => handleScoreChange(response.id, e.target.value)}
                                                                    className="grading-form-input"
                                                                    placeholder="VD: 7.5"
                                                                />
                                                                <p className="grading-form-hint">
                                                                    Band scores: 0, 0.5, 1.0, 1.5, ... 9.0
                                                                </p>
                                                            </div>

                                                            <div className="grading-form-group">
                                                                <label className="grading-form-label">
                                                                    Nhận xét
                                                                </label>
                                                                <textarea
                                                                    value={feedback[response.id] || ''}
                                                                    onChange={(e) => handleFeedbackChange(response.id, e.target.value)}
                                                                    className="grading-form-input grading-form-textarea"
                                                                    placeholder="Nhập nhận xét cho học sinh..."
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grading-actions">
                                                            <div>
                                                                {saveStatus[response.id] === 'saving' && (
                                                                    <span className="grading-save-status saving">
                                                                    💾 Đang lưu...
                                                                </span>
                                                                )}
                                                                {saveStatus[response.id] === 'saved' && (
                                                                    <span className="grading-save-status saved">
                                                                    ✅ Đã lưu thành công!
                                                                </span>
                                                                )}
                                                                {saveStatus[response.id] === 'error' && (
                                                                    <span className="grading-save-status error">
                                                                    ❌ Lỗi khi lưu
                                                                </span>
                                                                )}
                                                            </div>

                                                            <button
                                                                onClick={() => saveGrading(response.id)}
                                                                disabled={!scores[response.id] || saveStatus[response.id] === 'saving'}
                                                                className={`grading-save-btn ${
                                                                    scores[response.id] ? 'enabled' : 'disabled'
                                                                }`}
                                                            >
                                                                {saveStatus[response.id] === 'saving'
                                                                    ? '💾 Đang lưu...'
                                                                    : (response.currentScore !== null || response.manualScore !== null)
                                                                        ? 'Cập nhật điểm'
                                                                        : 'Lưu câu này'
                                                                }
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Bottom Pagination */}
                                        {totalPages > 1 && (
                                            <div className="grading-pagination bottom">
                                                <button
                                                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                                    disabled={currentPage === 0}
                                                    className="grading-pagination-btn"
                                                >
                                                    ← Trước
                                                </button>
                                                <span className="grading-pagination-info">
                                                    Trang {currentPage + 1} / {totalPages} •
                                                    Hiển thị câu {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, gradingData.responses.length)}
                                                    / {gradingData.responses.length}
                                                </span>
                                                <button
                                                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                                    disabled={currentPage === totalPages - 1}
                                                    className="grading-pagination-btn"
                                                >
                                                    Sau →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="grading-modal-footer">
                    <button
                        className="grading-footer-close"
                        onClick={onClose}
                    >
                        Đóng
                    </button>

                    {gradingData && !isSpeakingWritingTest() && (
                        <div className="grading-footer-actions">
                            <span className="grading-footer-progress">
                                {progress.graded}/{progress.total} câu đã chấm
                            </span>
                            <button
                                className={`grading-save-all-btn ${
                                    saving || progress.graded === 0 ? 'disabled' : 'enabled'
                                }`}
                                onClick={saveAllGrading}
                                disabled={saving || progress.graded === 0}
                            >
                                {saving ? '⏳ Đang lưu...' : `💾 Lưu tất cả (${progress.graded} câu)`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GradingModal;