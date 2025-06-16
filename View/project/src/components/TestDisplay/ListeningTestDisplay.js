// =====================================
// UPDATED ListeningTestDisplay.js - With Enhanced Table Support from Popup
// =====================================

import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ListeningTestDisplay.css';

const ListeningTestDisplay = ({
                                  test,
                                  audioList,
                                  questions,
                                  userAnswers,
                                  onAnswerChange,
                                  isSubmitted = false,
                                  timer,
                                  onSubmit,
                                  submitting = false
                              }) => {
    const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    // ✅ NEW: Audio loading states
    const [audioReady, setAudioReady] = useState(false);
    const [audioError, setAudioError] = useState(null);
    const [loadingAudio, setLoadingAudio] = useState(false);

    const audioRef = useRef();
    const currentAudio = audioList && audioList[currentAudioIndex];

    // ✅ ENHANCED: Smart audio source detection (reduced logging)
    const getValidAudioSource = (audioData) => {
        if (!audioData) {
            return null;
        }

        // ✅ PRIORITY 1: audioBase64 field (from form submission)
        if (audioData.audioBase64) {
            let base64Data = audioData.audioBase64;

            // Check if already in data URL format
            if (base64Data.startsWith('data:')) {
                return base64Data;
            } else {
                // Convert to data URL
                const mimeType = audioData.mimeType ||
                    getMimeTypeFromFileType(audioData.fileType) ||
                    'audio/mpeg';

                const dataUrl = `data:${mimeType};base64,${base64Data}`;
                return dataUrl;
            }
        }

        // ✅ PRIORITY 2: base64Data field (alternative field name)
        if (audioData.base64Data) {
            let base64Data = audioData.base64Data;

            if (base64Data.startsWith('data:')) {
                return base64Data;
            } else {
                const mimeType = audioData.mimeType ||
                    getMimeTypeFromFileType(audioData.fileType) ||
                    'audio/mpeg';

                const dataUrl = `data:${mimeType};base64,${base64Data}`;
                return dataUrl;
            }
        }

        // ✅ PRIORITY 3: fileUrl (direct URL)
        if (audioData.fileUrl) {
            return audioData.fileUrl;
        }

        // ✅ PRIORITY 4: filePath (construct URL)
        if (audioData.filePath) {
            const url = audioData.filePath.startsWith('http')
                ? audioData.filePath
                : `${window.location.origin}/api${audioData.filePath}`;
            return url;
        }

        return null;
    };

    const getMimeTypeFromFileType = (fileType) => {
        if (!fileType) return null;

        const mimeMap = {
            'MP3': 'audio/mpeg',
            'WAV': 'audio/wav',
            'OGG': 'audio/ogg',
            'M4A': 'audio/m4a',
            'AAC': 'audio/aac'
        };

        return mimeMap[fileType.toUpperCase()] || 'audio/mpeg';
    };

    // ✅ ENHANCED TABLE DETECTION (Reduced logging)
    const getQuestionSubType = useCallback((questionType, context) => {
        if (questionType === 'FILL_IN_THE_BLANK' && context) {
            if (context.includes('|')) {
                const lines = context.split('\n').filter(line => line.trim());
                const tableLines = lines.filter(line => line.includes('|'));

                if (tableLines.length >= 2) {
                    return 'TABLE_COMPLETION';
                }
            } else if (context.includes('Notes') || context.includes('NOTES')) {
                return 'NOTE_COMPLETION';
            } else if (context.includes('FORM') || context.includes('Form')) {
                return 'FORM_FILLING';
            } else if (context.includes('Map') || context.includes('Plan')) {
                return 'PLAN_MAP_COMPLETION';
            } else {
                return 'FLEXIBLE_CONTEXT';
            }
        }
        return questionType;
    }, []);

    // ✅ MEMOIZED: Determine layout type based on question type and context
    const getLayoutType = useCallback((questionType, context) => {
        // ✅ SIMPLIFIED: Chỉ dùng VERTICAL layout cho FILL_IN_THE_BLANK có context
        if (questionType === 'FILL_IN_THE_BLANK' && context && context.trim()) {
            return 'VERTICAL'; // Luôn dùng vertical để hiển thị context + input inline
        }

        if (questionType === 'MCQ' || questionType === 'TRUE_FALSE_NOT_GIVEN') {
            return 'VERTICAL'; // MCQ luôn dùng layout dọc
        }

        if (questionType === 'MATCHING' && context && context.trim()) {
            return 'VERTICAL'; // Matching luôn dùng vertical
        }

        if (context && context.trim()) {
            return 'VERTICAL'; // Có context thì dùng vertical
        }

        return 'SINGLE'; // Không có context
    }, []);

    // ✅ MEMOIZED: Process questions để group theo audio và context
    const processQuestions = useMemo(() => {
        if (!questions || questions.length === 0) {
            return [];
        }

        // Group questions by audioId, instructions, and context
        const groups = {};

        questions.forEach((question, idx) => {
            // ✅ Handle both formats
            const audioId = question.audioId || question.audio_id || null;
            const instructions = question.questionSetInstructions || question.question_set_instructions || '';
            const questionType = question.questionType || question.question_type || 'FILL_IN_THE_BLANK';
            const context = question.context || '';
            const orderInTest = question.orderInTest || question.order_in_test || (idx + 1);

            // ✅ Create unique key for grouping - enhanced grouping logic
            const contextKey = context ? context.substring(0, 50) : 'no_context';
            const instructionsKey = instructions ? instructions.substring(0, 30) : 'no_instructions';
            const key = `${audioId}_${questionType}_${contextKey}_${instructionsKey}`;

            if (!groups[key]) {
                groups[key] = {
                    audioId: audioId,
                    questionType: questionType,
                    subType: getQuestionSubType(questionType, context),
                    instructions: instructions,
                    context: context,
                    requiresContext: !!(context && context.trim()),
                    layoutType: getLayoutType(questionType, context),
                    questions: []
                };
            }

            // ✅ Add question to group with normalized format
            groups[key].questions.push({
                id: question.id || question.question_id,
                questionText: question.questionText || question.question_text || '',
                questionNumber: orderInTest,
                questionType: questionType,
                correctAnswer: question.correctAnswer || question.correct_answer || '',
                options: question.options || [],
                wordLimit: question.wordLimit || question.word_limit,
                audioId: audioId,
                context: context,
                instructions: instructions
            });
        });

        const result = Object.values(groups)
            .map(group => ({
                ...group,
                questions: group.questions.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0))
            }))
            .sort((a, b) => (a.audioId || 0) - (b.audioId || 0));

        return result;
    }, [questions, getQuestionSubType, getLayoutType]);

    // ✅ NEW: Enhanced table rendering using exact logic from QuestionDetailPopup
    const renderRealContextWithBlanks = (contextText, group) => {
        if (!contextText) return null;

        // Split into lines and clean
        const rawLines = contextText.split(/\r?\n/);
        const lines = rawLines
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // 1) Locate header row by matching columns pattern
        const headerRegex = /\|\s*Transport\s*\|\s*Cash\s*Fare\s*\|\s*Card\s*Fare\s*\|/i;
        const headerIndex = lines.findIndex(line => headerRegex.test(line));

        let headers = [];
        let tableData = [];

        if (headerIndex >= 0) {
            // Extract header line
            let headerLine = lines[headerIndex];

            // If headerLine starts with "Table <num> |", strip that prefix
            if (/^Table\s*\d+/i.test(headerLine)) {
                headerLine = headerLine.replace(/^[^|]+\|\s*/, '');
            }
            // Remove surrounding pipes if present
            if (headerLine.startsWith('|')) headerLine = headerLine.slice(1);
            if (headerLine.endsWith('|')) headerLine = headerLine.slice(0, -1);
            // Split into column headers
            headers = headerLine.split(/\s*\|\s*/).map(h => h.trim());

            // 3) Gather data rows until non-pipe line
            for (let i = headerIndex + 1; i < lines.length; i++) {
                const row = lines[i];
                // Skip separator lines
                if (/^[\|\-\s]+$/.test(row)) continue;
                if (!row.includes('|')) break;

                let cleanRow = row;
                if (cleanRow.startsWith('|')) cleanRow = cleanRow.slice(1);
                if (cleanRow.endsWith('|')) cleanRow = cleanRow.slice(0, -1);
                const cells = cleanRow.split(/\s*\|\s*/).map(c => c.trim());

                if (cells.length >= 2) {
                    // Pad or trim to match header length
                    while (cells.length < headers.length) cells.push('');
                    tableData.push(cells.slice(0, headers.length));
                }
            }
        }

        // 4) Render it with interactive inputs:
        return (
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <div style={{
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '15px',
                    color: '#1976d2',
                    padding: '10px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px'
                }}>
                    Table 1
                </div>

                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '2px solid #1976d2',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <thead>
                    <tr>
                        {headers.map((h, idx) => (
                            <th key={idx} style={{
                                backgroundColor: '#1976d2',
                                color: 'white',
                                padding: '12px 8px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                border: '1px solid #1976d2'
                            }}>{h}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {tableData.map((row, r) => (
                        <tr key={r}>
                            {row.map((cell, c) => {
                                const blankMatch = cell.match(/___(\d+)___/);
                                if (blankMatch) {
                                    const num = blankMatch[1];
                                    const question = group.questions.find(q => q.questionNumber == num);
                                    const after = cell.replace(/___\d+___/, '').trim();

                                    return (
                                        <td key={c} style={{
                                            padding: '12px 8px',
                                            textAlign: 'left',
                                            backgroundColor: '#fff3cd',
                                            border: '2px solid #ffc107',
                                            position: 'relative'
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                zIndex: 1
                                            }}>{num}</span>

                                            <span style={{
                                                display: 'inline-block',
                                                minWidth: '60px',
                                                padding: '6px 12px',
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontWeight: 'bold'
                                            }}>
                                                <input
                                                    type="text"
                                                    style={{
                                                        border: 'none',
                                                        outline: 'none',
                                                        backgroundColor: 'transparent',
                                                        width: '100%',
                                                        textAlign: 'center',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        minWidth: '50px'
                                                    }}
                                                    placeholder=""
                                                    value={userAnswers[question?.id] || ''}
                                                    onChange={(e) => question && onAnswerChange(question.id, e.target.value)}
                                                    disabled={isSubmitted}
                                                />
                                            </span>
                                            {after && <span style={{ marginLeft: '8px' }}>{after}</span>}
                                        </td>
                                    );
                                }

                                // normal cell
                                return (
                                    <td key={c} style={{
                                        padding: '12px 8px',
                                        textAlign: 'left',
                                        border: '1px solid #dee2e6',
                                        fontSize: '14px'
                                    }}>{cell}</td>
                                );
                            })}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // ✅ ENHANCED: Context display with popup-style rendering
    const renderContextDisplay = (group) => {
        if (!group.context || !group.context.trim()) {
            return null;
        }

        // ✅ TABLE COMPLETION: Use enhanced table rendering
        if (group.subType === 'TABLE_COMPLETION') {
            return (
                <div className="listening-context">
                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '15px'
                    }}>
                        {renderRealContextWithBlanks(group.context, group)}
                    </div>
                </div>
            );
        }

        // ✅ NON-TABLE CONTEXTS: Enhanced rendering with inline inputs
        const renderCompletionTextWithBlanks = (text) => {
            if (!text) return null;

            // Split text and find blanks with numbers
            const parts = text.split(/(\s*___\d+___\s*)/);

            return (
                <div>
                    {parts.map((part, index) => {
                        const blankMatch = part.match(/___(\d+)___/);

                        if (blankMatch) {
                            const questionNum = blankMatch[1];
                            const question = group.questions.find(q => q.questionNumber == questionNum);
                            const remainingText = part.replace(/___\d+___/, '').trim();

                            return (
                                <span
                                    key={index}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        backgroundColor: '#fff3cd',
                                        border: '2px solid #ffc107',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        margin: '0 4px',
                                        minWidth: '80px',
                                        justifyContent: 'center',
                                        fontFamily: 'monospace',
                                        fontWeight: 'bold',
                                        position: 'relative'
                                    }}
                                >
                                    <span style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        left: '-8px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        {questionNum}
                                    </span>

                                    <input
                                        type="text"
                                        style={{
                                            border: 'none',
                                            outline: 'none',
                                            backgroundColor: 'transparent',
                                            textAlign: 'center',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            width: '60px',
                                            color: '#28a745'
                                        }}
                                        placeholder=""
                                        value={userAnswers[question?.id] || ''}
                                        onChange={(e) => question && onAnswerChange(question.id, e.target.value)}
                                        disabled={isSubmitted}
                                    />
                                </span>
                            );
                        }

                        return <span key={index}>{part}</span>;
                    })}
                </div>
            );
        };

        return (
            <div className="listening-context">
                <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '20px',
                    lineHeight: '1.8',
                    fontSize: '14px'
                }}>
                    {renderCompletionTextWithBlanks(group.context)}
                </div>
            </div>
        );
    };

    // ✅ ENHANCED: Render standalone questions (cho VERTICAL và SINGLE layout)
    const renderStandaloneQuestions = (group) => {
        return (
            <div className="standalone-questions">
                {group.questions.map((question, qIdx) => (
                    <div key={question.id} className="question-item">
                        <div className="question-number-circle">
                            {question.questionNumber}
                        </div>

                        <div className="question-content">
                            {question.questionText && (
                                <div className="question-text">
                                    {question.questionText}
                                </div>
                            )}

                            {renderQuestionInput(question, group.questionType)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderQuestionInput = (question, questionType) => {
        switch (questionType) {
            case 'MCQ':
                const options = Array.isArray(question.options) ? question.options : [];
                return (
                    <div className="mcq-options">
                        {['A', 'B', 'C', 'D'].map((letter, idx) => (
                            <label key={letter} className="mcq-option">
                                <input
                                    type="radio"
                                    name={`question_${question.id}`}
                                    value={letter}
                                    checked={userAnswers[question.id] === letter}
                                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                                    disabled={isSubmitted}
                                />
                                <span className="option-letter">{letter}</span>
                                <span className="option-text">{options[idx] || ''}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'MATCHING':
                return (
                    <div className="matching-input">
                        <input
                            type="text"
                            className="answer-input"
                            placeholder="Enter letter (A, B, C, etc.)"
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => onAnswerChange(question.id, e.target.value)}
                            disabled={isSubmitted}
                        />
                    </div>
                );

            case 'SHORT_ANSWER':
                return (
                    <div className="short-answer-input">
                        <input
                            type="text"
                            className="answer-input"
                            placeholder="Enter your answer"
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => onAnswerChange(question.id, e.target.value)}
                            disabled={isSubmitted}
                        />
                        {question.wordLimit && (
                            <div className="word-limit">{question.wordLimit}</div>
                        )}
                    </div>
                );

            case 'TRUE_FALSE_NOT_GIVEN':
                return (
                    <div className="tf-options">
                        {['TRUE', 'FALSE', 'NOT_GIVEN'].map((option) => (
                            <label key={option} className="tf-option">
                                <input
                                    type="radio"
                                    name={`question_${question.id}`}
                                    value={option}
                                    checked={userAnswers[question.id] === option}
                                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                                    disabled={isSubmitted}
                                />
                                <span className="option-text">
                                    {option === 'TRUE' ? 'True' :
                                        option === 'FALSE' ? 'False' : 'Not Given'}
                                </span>
                            </label>
                        ))}
                    </div>
                );

            case 'FILL_IN_THE_BLANK':
                return (
                    <div className="fill-blank-input">
                        <input
                            type="text"
                            className="answer-input"
                            placeholder="Enter your answer"
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => onAnswerChange(question.id, e.target.value)}
                            disabled={isSubmitted}
                        />
                    </div>
                );

            default:
                return (
                    <div className="default-input">
                        <input
                            type="text"
                            className="answer-input"
                            placeholder="Enter your answer"
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => onAnswerChange(question.id, e.target.value)}
                            disabled={isSubmitted}
                        />
                    </div>
                );
        }
    };

    // ✅ DEBUG: Log initial data only once
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('=== LISTENING TEST DISPLAY INITIALIZED ===');
            console.log('Questions count:', questions?.length || 0);
            console.log('Audio count:', audioList?.length || 0);
        }
    }, []); // Only run once

    // ✅ FIXED: Enhanced audio loading with reduced logging
    useEffect(() => {
        if (!currentAudio || !audioRef.current) {
            return;
        }

        const audio = audioRef.current;

        // Reset states
        setAudioReady(false);
        setAudioError(null);
        setLoadingAudio(true);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);

        // Get valid audio source
        const audioSrc = getValidAudioSource(currentAudio);
        if (!audioSrc) {
            setLoadingAudio(false);
            setAudioError('No valid audio source available');
            return;
        }

        // Create timeout for loading
        const loadTimeout = setTimeout(() => {
            setLoadingAudio(false);
            setAudioError('Audio took too long to load. Please check your internet connection.');
        }, 15000); // 15 second timeout

        // Event handlers
        const handleCanPlay = () => {
            clearTimeout(loadTimeout);
            setLoadingAudio(false);
            setAudioReady(true);
            setAudioError(null);
        };

        const handleLoadedData = () => {
            // Audio data loaded
        };

        const handleLoadedMetadata = () => {
            if (audio.duration && !isNaN(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        const handleError = (e) => {
            clearTimeout(loadTimeout);
            setLoadingAudio(false);
            setAudioReady(false);

            const errorCode = audio.error?.code;
            const errorMessage = audio.error?.message || 'Unknown audio error';

            let userMessage = 'Unable to play audio. ';
            switch (errorCode) {
                case 1: // MEDIA_ERR_ABORTED
                    userMessage += 'Audio loading was aborted.';
                    break;
                case 2: // MEDIA_ERR_NETWORK
                    userMessage += 'Network error occurred.';
                    break;
                case 3: // MEDIA_ERR_DECODE
                    userMessage += 'Audio format not supported.';
                    break;
                case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                    userMessage += 'Audio source not supported.';
                    break;
                default:
                    userMessage += errorMessage;
            }

            setAudioError(userMessage);
        };

        const handleTimeUpdate = () => {
            if (audio.currentTime) {
                setCurrentTime(audio.currentTime);
            }
        };

        const handlePlay = () => {
            setIsPlaying(true);
        };

        const handlePause = () => {
            setIsPlaying(false);
        };

        const handleEnded = () => {
            setIsPlaying(false);
        };

        // Add event listeners
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('loadeddata', handleLoadedData);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('error', handleError);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        // Set source and load
        audio.src = audioSrc;
        audio.load();

        // Cleanup function
        return () => {
            clearTimeout(loadTimeout);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('loadeddata', handleLoadedData);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);

            // Revoke object URL if created
            if (audioSrc && audioSrc.startsWith('blob:')) {
                URL.revokeObjectURL(audioSrc);
            }
        };
    }, [currentAudio,]);

    // ✅ FIXED: Enhanced play/pause with reduced logging
    const togglePlay = async () => {
        if (!audioRef.current) {
            return;
        }

        const audio = audioRef.current;

        if (loadingAudio) {
            return;
        }

        if (audioError) {
            // Try to reload audio
            const audioSrc = getValidAudioSource(currentAudio);
            if (audioSrc) {
                audio.src = audioSrc;
                audio.load();
                return;
            }
        }

        if (!audioReady) {
            return;
        }

        try {
            if (isPlaying) {
                audio.pause();
            } else {
                await audio.play();
            }
        } catch (error) {
            let errorMessage = 'Unable to play audio. ';
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please click the play button again to allow audio playback.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage += 'This audio format is not supported by your browser.';
            } else {
                errorMessage += 'Please check if the audio file is valid.';
            }

            setAudioError(errorMessage);
        }
    };

    // ✅ NEW: Handle progress bar click for seeking
    const handleProgressClick = (e) => {
        if (!audioRef.current || !audioReady || !duration) {
            return;
        }

        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const progressWidth = rect.width;
        const clickPercentage = clickX / progressWidth;
        const newTime = clickPercentage * duration;

        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds === 0) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimerLarge = (seconds) => {
        if (!seconds || seconds === 0) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getAnsweredCount = () => {
        return Object.keys(userAnswers).filter(key => userAnswers[key]?.trim()).length;
    };

    const getTotalQuestions = () => {
        return questions ? questions.length : 0;
    };

    // ✅ Get current audio questions for display
    const getCurrentAudioQuestions = () => {
        if (!questions) return [];

        // Nếu có audioList và currentAudio
        if (audioList && audioList.length > 0 && currentAudio) {
            const questionsForCurrentAudio = questions.filter(q => {
                const questionAudioId = q.audioId || q.audio_id;
                return questionAudioId === currentAudio.id;
            });

            // Nếu tìm được questions cho audio hiện tại
            if (questionsForCurrentAudio.length > 0) {
                return questionsForCurrentAudio;
            }
        }

        // Fallback: Nếu không map được, chia đều questions cho các audio
        if (audioList && audioList.length > 0) {
            const questionsPerAudio = Math.ceil(questions.length / audioList.length);
            const startIndex = currentAudioIndex * questionsPerAudio;
            const endIndex = startIndex + questionsPerAudio;

            return questions.slice(startIndex, endIndex);
        }

        // Final fallback: hiển thị tất cả questions nếu chỉ có 1 audio hoặc không có audioList
        return questions;
    };

    const questionGroups = processQuestions;

    return (
        <div className="listening-test-display">
            {/* Header */}
            <div className="test-header">
                <h1 className="test-title">{test?.testName || 'IELTS Listening Test'}</h1>
                <button
                    className="exit-btn"
                    onClick={() => window.history.back()}
                >
                    Thoát
                </button>
            </div>

            {/* Audio Player */}
            <div className="audio-section">
                {/* Recording Tabs */}
                <div className="recording-tabs">
                    {audioList && audioList.length > 0 ? audioList.map((audio, index) => (
                        <button
                            key={audio.id || index}
                            className={`recording-tab ${currentAudioIndex === index ? 'active' : ''}`}
                            onClick={() => setCurrentAudioIndex(index)}
                        >
                            Recording {index + 1}
                        </button>
                    )) : (
                        <div className="no-audio-tabs">
                            <div className="recording-tab active">Recording 1</div>
                        </div>
                    )}
                </div>

                {/* Audio Controls */}
                <div className="audio-player">
                    {/* ✅ Audio Status Indicator */}
                    <div className="audio-status">
                        {loadingAudio && (
                            <div className="loading-indicator">
                                <span className="loading-spinner">⏳</span>
                                <span className="loading-text">Loading audio...</span>
                            </div>
                        )}

                        {audioError && (
                            <div className="error-indicator">
                                <span className="error-icon">❌</span>
                                <span className="error-text">{audioError}</span>
                                <button
                                    className="retry-btn"
                                    onClick={() => {
                                        setAudioError(null);
                                        const audioSrc = getValidAudioSource(currentAudio);
                                        if (audioSrc && audioRef.current) {
                                            audioRef.current.src = audioSrc;
                                            audioRef.current.load();
                                        }
                                    }}
                                >
                                    Retry
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        className={`play-btn ${!audioReady ? 'disabled' : ''}`}
                        onClick={togglePlay}
                        disabled={loadingAudio || !!audioError}
                        title={
                            loadingAudio ? 'Loading audio...' :
                                audioError ? 'Audio error - click retry' :
                                    !audioReady ? 'Audio not ready' :
                                        isPlaying ? 'Pause' : 'Play'
                        }
                    >
                        {loadingAudio ? '⏳' : isPlaying ? '⏸️' : '▶️'}
                    </button>

                    <div className="progress-container">
                        <div className="progress-bar" onClick={handleProgressClick}>
                            <div
                                className="progress-fill"
                                style={{width: duration ? `${(currentTime / duration) * 100}%` : '0%'}}
                            />
                        </div>
                    </div>

                    <div className="time-display">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>

                    <div className="volume-control">
                        <span className="volume-icon">🔊</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="volume-slider"
                        />
                    </div>

                    <button className="settings-btn">⚙️</button>
                </div>
            </div>

            {/* Main Content - Adaptive Layout */}
            <div className="main-content">
                <div className="questions-area">
                    {questionGroups.length > 0 ? questionGroups.map((group, groupIndex) => {
                        // ✅ Filter for current audio
                        let shouldShowGroup = false;

                        if (audioList && audioList.length > 0 && currentAudio) {
                            shouldShowGroup = group.audioId === currentAudio.id;
                        } else {
                            const questionsPerAudio = Math.ceil(questions.length / (audioList?.length || 1));
                            const groupQuestionNumber = group.questions[0]?.questionNumber || 1;
                            const expectedAudioIndex = Math.floor((groupQuestionNumber - 1) / questionsPerAudio);
                            shouldShowGroup = expectedAudioIndex === currentAudioIndex;
                        }

                        if (!shouldShowGroup) {
                            return null;
                        }

                        return (
                            <div key={groupIndex} className={`question-group layout-${group.layoutType.toLowerCase()}`}>
                                {/* Instructions */}
                                {group.instructions && group.instructions.trim() && (
                                    <div className="instructions">
                                        <div className="instructions-text">
                                            {group.instructions.split('\n').map((line, idx) => (
                                                <div key={idx}>{line}</div>
                                            ))}
                                        </div>
                                        {group.questionType === 'FILL_IN_THE_BLANK' && group.questions[0]?.wordLimit && (
                                            <div className="word-limit-notice">
                                                Write <strong>{group.questions[0].wordLimit}</strong> for each answer.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ✅ ADAPTIVE LAYOUT - Enhanced with popup-style rendering */}
                                {group.layoutType === 'VERTICAL' ? (
                                    // Vertical Layout: Context above, Questions below (if needed)
                                    <div className="vertical-layout">
                                        <div className="context-section">
                                            {renderContextDisplay(group)}
                                        </div>
                                        {/* ✅ Only show questions section for non-completion types */}
                                        {!['TABLE_COMPLETION', 'NOTE_COMPLETION', 'FORM_FILLING', 'PLAN_MAP_COMPLETION', 'FLEXIBLE_CONTEXT'].includes(group.subType) && (
                                            <div className="questions-section">
                                                {renderStandaloneQuestions(group)}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Single Layout: Just questions, no context
                                    <div className="single-layout">
                                        {renderStandaloneQuestions(group)}
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="no-questions">
                            <h3>No questions available</h3>
                            <p>Questions will be displayed here.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="test-sidebar">
                    <div className="timer-section">
                        <div className="timer-label">Thời gian còn lại:</div>
                        <div className="timer-value">{formatTimerLarge(timer)}</div>
                    </div>

                    <button
                        className="submit-btn"
                        onClick={onSubmit}
                        disabled={submitting || isSubmitted}
                    >
                        {submitting ? 'ĐANG NỘP...' : 'NỘP BÀI'}
                    </button>

                    {/* Question Navigation */}
                    {audioList && audioList.length > 0 ? audioList.map((audio, audioIndex) => {
                        let audioQuestions = [];

                        // Thử map theo audioId trước
                        audioQuestions = questions.filter(q => (q.audioId || q.audio_id) === audio.id);

                        // Nếu không có questions nào match, dùng fallback chia đều
                        if (audioQuestions.length === 0) {
                            const questionsPerAudio = Math.ceil(questions.length / audioList.length);
                            const startIndex = audioIndex * questionsPerAudio;
                            const endIndex = startIndex + questionsPerAudio;
                            audioQuestions = questions.slice(startIndex, endIndex);
                        }

                        if (audioQuestions.length === 0) return null;

                        return (
                            <div key={audioIndex} className="recording-section">
                                <h3>Recording {audioIndex + 1}</h3>
                                <div className="question-buttons">
                                    {audioQuestions
                                        .sort((a, b) => (a.orderInTest || a.order_in_test || 0) - (b.orderInTest || b.order_in_test || 0))
                                        .map(question => {
                                            const questionId = question.id || question.question_id;
                                            const questionNumber = question.questionNumber || question.order_in_test || question.orderInTest;
                                            const isAnswered = userAnswers[questionId]?.trim();

                                            return (
                                                <button
                                                    key={questionId}
                                                    className={`question-btn ${isAnswered ? 'answered' : ''}`}
                                                    onClick={() => setCurrentAudioIndex(audioIndex)}
                                                >
                                                    {questionNumber}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        );
                    }) : (
                        // Fallback nếu không có audioList
                        questions && questions.length > 0 && (
                            <div className="recording-section">
                                <h3>All Questions</h3>
                                <div className="question-buttons">
                                    {questions.map(question => {
                                        const questionId = question.id || question.question_id;
                                        const questionNumber = question.questionNumber || question.order_in_test || question.orderInTest;
                                        const isAnswered = userAnswers[questionId]?.trim();

                                        return (
                                            <button
                                                key={questionId}
                                                className={`question-btn ${isAnswered ? 'answered' : ''}`}
                                            >
                                                {questionNumber}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    )}

                    <div className="progress-info">
                        <div className="save-progress">
                            <span className="save-icon">↩</span> Khôi phục/lưu bài làm
                        </div>

                        <div className="review-note">
                            <strong>Chú ý:</strong> bạn có thể click vào số thứ tự câu hỏi trong bài để đánh dấu review
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                volume={volume}
                preload="metadata"
                crossOrigin="anonymous"
            />
        </div>
    );
};

export default ListeningTestDisplay;