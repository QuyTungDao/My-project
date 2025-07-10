import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Settings, RotateCcw } from 'lucide-react';
import './IELTSListening.css';

// ✅ Try to import TableCompletionRenderer with fallback
let TableCompletionRenderer;
try {
    TableCompletionRenderer = require('./TableCompletionRenderer').default;
    console.log('✅ TableCompletionRenderer imported successfully');
} catch (error) {
    console.error('❌ Failed to import TableCompletionRenderer:', error);
    // Fallback component
    TableCompletionRenderer = ({ contextData, questions, userAnswers, onAnswerChange }) => {
        console.log('🔧 Using fallback TableCompletionRenderer');
        return (
            <div style={{
                padding: '16px',
                border: '2px solid #f59e0b',
                borderRadius: '8px',
                background: '#fffbeb'
            }}>
                <h4 style={{ color: '#d97706', margin: '0 0 12px 0' }}>
                    ⚠️ TableCompletionRenderer not available - Using fallback
                </h4>
                <pre style={{
                    background: '#f3f4f6',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '200px'
                }}>
                    {contextData}
                </pre>
                <div style={{ marginTop: '12px' }}>
                    {questions.map((q, idx) => (
                        <div key={q.id || idx} style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                                Question {q.questionNumber || (idx + 1)}:
                            </label>
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px'
                                }}
                                value={userAnswers[q.id] || ''}
                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                placeholder="Your answer"
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };
}

// ===== ENHANCED IELTS LISTENING COMPONENT =====
// Integrates with existing Spring Boot backend structure

const IELTSListeningTest = ({
                                test,
                                audioList,
                                questions,
                                userAnswers,
                                onAnswerChange,
                                timer,
                                onSubmit,
                                submitting,
                                markedQuestions = [],
                                onToggleMarkQuestion = () => {},
                                onSaveProgress = () => {}
                            }) => {
    const [currentRecording, setCurrentRecording] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0); // ✅ Add duration state
    const [highlightMode, setHighlightMode] = useState(false);
    const [currentAudio, setCurrentAudio] = useState(null);
    const audioRef = useRef(null);

    // ✅ Map questions to recordings based on audioId
    const questionsByRecording = React.useMemo(() => {
        const grouped = {};

        // Initialize recordings
        for (let i = 1; i <= 4; i++) {
            grouped[i] = [];
        }

        // Group questions by their audio association
        questions.forEach(question => {
            let recordingNum = 1;

            if (question.audioId || question.audio_id) {
                // Find which recording this audio belongs to
                const audioId = question.audioId || question.audio_id;
                const audioIndex = audioList.findIndex(audio => audio.id === audioId);
                recordingNum = audioIndex >= 0 ? audioIndex + 1 : 1;
            } else {
                // Fallback: group by order_in_test
                const orderInTest = question.orderInTest || question.order_in_test || 1;
                recordingNum = Math.ceil(orderInTest / 10); // Assume 10 questions per recording
            }

            recordingNum = Math.min(Math.max(recordingNum, 1), 4); // Ensure 1-4 range
            grouped[recordingNum].push(question);
        });

        return grouped;
    }, [questions, audioList]);

    // ✅ Get current recording data
    const currentRecordingData = React.useMemo(() => {
        const audioData = audioList[currentRecording - 1];
        const questionsData = questionsByRecording[currentRecording] || [];

        return {
            audio: audioData,
            questions: questionsData.sort((a, b) =>
                (a.orderInTest || a.order_in_test || 0) - (b.orderInTest || b.order_in_test || 0)
            )
        };
    }, [currentRecording, audioList, questionsByRecording]);

    // ✅ FIXED: Enhanced audio loading with better error handling
    useEffect(() => {
        const audioData = currentRecordingData.audio;
        const audio = audioRef.current;

        if (!audioData || !audio) {
            console.log('No audio data or audio element');
            setCurrentAudio(null);
            return;
        }

        console.log('Loading audio for recording:', currentRecording);

        // Reset audio state
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);

        try {
            let audioSrc = null;

            // ✅ ENHANCED: Try multiple audio source formats
            if (audioData.audioBase64 || audioData.base64Data) {
                // Base64 audio data
                const base64Data = audioData.audioBase64 || audioData.base64Data;
                const mimeType = audioData.mimeType || 'audio/mpeg';

                if (base64Data.startsWith('data:')) {
                    audioSrc = base64Data;
                } else {
                    audioSrc = `data:${mimeType};base64,${base64Data}`;
                }
                console.log('Using base64 audio source');
            } else if (audioData.fileUrl) {
                // Direct file URL
                audioSrc = audioData.fileUrl;
                console.log('Using file URL:', audioData.fileUrl);
            } else if (audioData.filePath) {
                // File path - construct URL
                audioSrc = audioData.filePath.startsWith('http')
                    ? audioData.filePath
                    : `http://localhost:8080/api/${audioData.filePath.replace(/^\/+/, '')}`;
                console.log('Using constructed file path:', audioSrc);
            }

            if (audioSrc) {
                // Set audio source
                audio.src = audioSrc;
                setCurrentAudio(audioData);

                // Load the audio
                audio.load();
                console.log('✅ Audio source set:', audioSrc);
            } else {
                console.error('❌ No valid audio source found');
                setCurrentAudio(null);
            }
        } catch (error) {
            console.error('❌ Error setting audio source:', error);
            setCurrentAudio(null);
        }
    }, [currentRecording, currentRecordingData.audio]);

    // ✅ Enhanced audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            console.log('✅ Audio loaded successfully. Duration:', audio.duration);
            setDuration(audio.duration || 0);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleError = (e) => {
            console.error('❌ Audio error:', e);
            console.error('Audio src:', audio.src);
            console.error('Audio error details:', {
                error: audio.error,
                networkState: audio.networkState,
                readyState: audio.readyState
            });
            setIsPlaying(false);
        };

        const handleCanPlay = () => {
            console.log('✅ Audio can play');
        };

        const handleLoadStart = () => {
            console.log('🔄 Audio load started');
        };

        // Add all event listeners
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('loadstart', handleLoadStart);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('loadstart', handleLoadStart);
        };
    }, [currentAudio]);

    // ✅ Audio controls
    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio || !currentAudio) {
            console.log('❌ No audio element or audio data');
            return;
        }

        if (isPlaying) {
            audio.pause();
            console.log('⏸️ Audio paused');
        } else {
            audio.play()
                .then(() => {
                    console.log('▶️ Audio playing');
                })
                .catch(e => {
                    console.error('❌ Play error:', e);
                    console.error('Audio details:', {
                        src: audio.src,
                        readyState: audio.readyState,
                        networkState: audio.networkState,
                        error: audio.error
                    });
                });
        }
        setIsPlaying(!isPlaying);
    };

    const seekAudio = (seconds) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
        }
    };

    // ✅ Format time display
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimerLarge = (seconds) => {
        if (!seconds || isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const remainingSecs = seconds % 60;
        return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
    };

    // ✅ ENHANCED: Question rendering with table completion fix
    const renderQuestionInput = (question) => {
        const questionId = question.id || question.question_id;
        const questionType = question.questionType || question.question_type;
        const currentAnswer = userAnswers[questionId] || '';

        console.log('🔧 Rendering question:', {
            id: questionId,
            type: questionType,
            hasContext: !!(question.context && question.context.trim()),
            contextLength: question.context?.length || 0,
            contextPreview: question.context?.substring(0, 100)
        });

        // ✅ SPECIAL DEBUG for TABLE_COMPLETION
        if (questionType === 'TABLE_COMPLETION') {
            console.log('🎯 TABLE_COMPLETION detected!');
            console.log('Context data:', question.context);
            console.log('TableCompletionRenderer available:', !!TableCompletionRenderer);
        }

        switch (questionType) {
            case 'MCQ':
            case 'LISTENING_MCQ':
                let options = [];
                try {
                    if (typeof question.options === 'string') {
                        options = JSON.parse(question.options);
                    } else if (Array.isArray(question.options)) {
                        options = question.options;
                    }
                } catch (e) {
                    console.error('Error parsing options:', e);
                    options = ['A', 'B', 'C', 'D'];
                }

                return (
                    <div className="ielts-mcq-options">
                        {options.map((option, idx) => (
                            <label key={idx} className="ielts-mcq-option">
                                <input
                                    type="radio"
                                    name={`question-${questionId}`}
                                    value={String.fromCharCode(65 + idx)}
                                    checked={currentAnswer === String.fromCharCode(65 + idx)}
                                    onChange={(e) => onAnswerChange(questionId, e.target.value)}
                                />
                                <span>
                  {String.fromCharCode(65 + idx)}. {option}
                </span>
                            </label>
                        ))}
                    </div>
                );

            case 'FILL_IN_THE_BLANK':
            case 'LISTENING_FILL_IN_THE_BLANK':
            case 'NOTE_COMPLETION':
                // ✅ Handle context with placeholders
                if (question.context && question.context.includes('___')) {
                    return renderContextWithBlanks(question);
                }

                return (
                    <input
                        type="text"
                        className="ielts-answer-input"
                        value={currentAnswer}
                        onChange={(e) => onAnswerChange(questionId, e.target.value)}
                        placeholder="Your answer"
                    />
                );

            case 'SHORT_ANSWER':
            case 'LISTENING_SHORT_ANSWER':
                return (
                    <input
                        type="text"
                        className="ielts-answer-input"
                        value={currentAnswer}
                        onChange={(e) => onAnswerChange(questionId, e.target.value)}
                        placeholder="Maximum 3 words"
                    />
                );

            case 'FORM_FILLING':
                return renderFormFields(question);

            case 'TABLE_COMPLETION':
                console.log('🎯 Processing TABLE_COMPLETION case');
                console.log('Context available:', !!question.context);
                console.log('Context length:', question.context?.length);
                console.log('TableCompletionRenderer available:', !!TableCompletionRenderer);

                if (question.context && question.context.trim()) {
                    console.log('✅ Using TableCompletionRenderer for TABLE_COMPLETION');

                    // Find all TABLE_COMPLETION questions in current recording
                    const tableQuestions = currentRecordingData.questions.filter(q =>
                        (q.questionType || q.question_type) === 'TABLE_COMPLETION'
                    );

                    console.log('Table questions found:', tableQuestions.length);

                    try {
                        return (
                            <div className="table-completion-wrapper">
                                <div style={{
                                    background: '#e0f2fe',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    marginBottom: '12px',
                                    fontSize: '12px',
                                    color: '#0c4a6e'
                                }}>
                                    🔧 Debug: Rendering table with {tableQuestions.length} questions
                                </div>
                                <TableCompletionRenderer
                                    contextData={question.context}
                                    questions={tableQuestions}
                                    userAnswers={userAnswers}
                                    onAnswerChange={onAnswerChange}
                                    isSubmitted={submitting}
                                    showResults={false}
                                />
                            </div>
                        );
                    } catch (error) {
                        console.error('❌ Error rendering TableCompletionRenderer:', error);
                        return (
                            <div style={{
                                padding: '16px',
                                border: '2px solid #dc2626',
                                borderRadius: '8px',
                                background: '#fef2f2'
                            }}>
                                <h4 style={{ color: '#dc2626', margin: '0 0 12px 0' }}>
                                    ❌ TableCompletionRenderer Error
                                </h4>
                                <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '12px' }}>
                                    Error: {error.message}
                                </p>
                                <details>
                                    <summary style={{ cursor: 'pointer', fontSize: '12px' }}>View raw data</summary>
                                    <pre style={{
                                        background: '#f3f4f6',
                                        padding: '12px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        overflow: 'auto',
                                        maxHeight: '200px',
                                        marginTop: '8px'
                                    }}>
                                        {question.context}
                                    </pre>
                                </details>
                            </div>
                        );
                    }
                } else {
                    console.log('❌ No context available for TABLE_COMPLETION');
                    return (
                        <div style={{
                            padding: '12px',
                            border: '1px solid #f59e0b',
                            borderRadius: '4px',
                            background: '#fffbeb'
                        }}>
                            <p style={{ color: '#d97706', margin: 0 }}>
                                ⚠️ No table data available for this question
                            </p>
                        </div>
                    );
                }

            default:
                return (
                    <input
                        type="text"
                        className="ielts-answer-input"
                        value={currentAnswer}
                        onChange={(e) => onAnswerChange(questionId, e.target.value)}
                        placeholder="Your answer"
                    />
                );
        }
    };

    // ✅ Render context with fillable blanks
    const renderContextWithBlanks = (question) => {
        const questionId = question.id || question.question_id;
        const context = question.context || '';

        // Split context by placeholders
        const parts = context.split(/(___\d+___)/);

        return (
            <div className="ielts-context-blanks">
                <div className="ielts-context-content">
                    {parts.map((part, idx) => {
                        // Check if this part is a placeholder
                        const placeholderMatch = part.match(/___(\d+)___/);

                        if (placeholderMatch) {
                            const blankNumber = placeholderMatch[1];
                            const blankId = `${questionId}_${blankNumber}`;

                            return (
                                <span key={idx}>
                  <input
                      type="text"
                      className="ielts-blank-input"
                      value={userAnswers[blankId] || ''}
                      onChange={(e) => onAnswerChange(blankId, e.target.value)}
                      placeholder={blankNumber}
                  />
                </span>
                            );
                        } else {
                            // Regular text
                            return <span key={idx}>{part}</span>;
                        }
                    })}
                </div>
            </div>
        );
    };

    // ✅ Render form fields for complex question types
    const renderFormFields = (question) => {
        const questionId = question.id || question.question_id;
        const context = question.context || '';

        // Simple form field renderer
        const lines = context.split('\n').filter(line => line.trim());

        return (
            <div className="ielts-form-container">
                <div className="ielts-form-fields">
                    {lines.map((line, idx) => {
                        if (line.includes('___')) {
                            const parts = line.split('___');
                            if (parts.length >= 2) {
                                return (
                                    <div key={idx} className="ielts-form-field">
                                        <span className="ielts-form-label">{parts[0]}</span>
                                        <input
                                            type="text"
                                            value={userAnswers[`${questionId}_${idx}`] || ''}
                                            onChange={(e) => onAnswerChange(`${questionId}_${idx}`, e.target.value)}
                                            placeholder="Answer"
                                        />
                                        <span className="ielts-form-label">{parts[1]}</span>
                                    </div>
                                );
                            }
                        }
                        return <p key={idx} className="ielts-form-label">{line}</p>;
                    })}
                </div>
            </div>
        );
    };

    // ✅ ENHANCED GROUP QUESTIONS BY CONTEXT - Fix duplicate display issue
    const groupQuestionsByContext = (questions) => {
        const groups = [];
        const processedQuestions = new Set();

        // First, identify all unique contexts
        const contextGroups = new Map();

        questions.forEach(question => {
            const questionId = question.id || question.question_id;
            const questionType = question.questionType || question.question_type;
            const context = question.context;

            // Skip if already processed
            if (processedQuestions.has(questionId)) return;

            console.log('🔄 Processing question for grouping:', {
                id: questionId,
                type: questionType,
                hasContext: !!(context && context.trim()),
                contextLength: context?.length || 0
            });

            // Check if this is a context-based question type
            const isContextBasedType = ['NOTE_COMPLETION', 'TABLE_COMPLETION', 'FORM_FILLING', 'FILL_IN_THE_BLANK'].includes(questionType);

            if (context && context.trim() && isContextBasedType) {
                // Normalize context for comparison (trim whitespace, remove extra spaces)
                const normalizedContext = context.trim().replace(/\s+/g, ' ');

                if (!contextGroups.has(normalizedContext)) {
                    contextGroups.set(normalizedContext, {
                        originalContext: context,
                        questions: [],
                        contextType: questionType,
                        instructions: question.questionSetInstructions
                    });
                }

                // Add question to context group
                contextGroups.get(normalizedContext).questions.push(question);
                processedQuestions.add(questionId);
            }
        });

        // Create groups from context groups
        contextGroups.forEach((contextData, normalizedContext) => {
            if (contextData.questions.length > 0) {
                console.log(`📦 Creating context group with ${contextData.questions.length} questions`);

                // Sort questions by order
                contextData.questions.sort((a, b) => {
                    const orderA = a.orderInTest || a.order_in_test || 0;
                    const orderB = b.orderInTest || b.order_in_test || 0;
                    return orderA - orderB;
                });

                groups.push({
                    type: 'CONTEXT_GROUP',
                    contextType: contextData.contextType,
                    context: contextData.originalContext,
                    questions: contextData.questions,
                    instructions: contextData.instructions
                });
            }
        });

        // Add individual questions (those without context or different types)
        questions.forEach(question => {
            const questionId = question.id || question.question_id;

            if (!processedQuestions.has(questionId)) {
                groups.push({
                    type: 'INDIVIDUAL',
                    question: question
                });
                processedQuestions.add(questionId);
            }
        });

        console.log(`✅ Created ${groups.length} question groups (${contextGroups.size} context groups)`);
        return groups;
    };

    // ✅ Render a group of questions with shared context
    const renderQuestionGroup = (group, groupIndex) => {
        if (group.type === 'CONTEXT_GROUP') {
            const { contextType, context, questions, instructions } = group;

            console.log(`🎯 Rendering context group with ${questions.length} questions`);

            return (
                <div key={`group-${groupIndex}`} className="ielts-question-group">
                    {/* Group Header */}
                    <div className="ielts-group-header">
                        <div className="ielts-group-title">
                            <span className="ielts-group-type">{contextType}</span>
                            <span className="ielts-group-range">
                                Questions {questions[0]?.orderInTest || questions[0]?.order_in_test} - {questions[questions.length - 1]?.orderInTest || questions[questions.length - 1]?.order_in_test}
                            </span>
                        </div>
                    </div>

                    {/* Instructions */}
                    {instructions && (
                        <div className="ielts-question-instructions">
                            {instructions}
                        </div>
                    )}

                    {/* Render based on context type */}
                    {contextType === 'TABLE_COMPLETION' ? (
                        // Use TableCompletionRenderer for table
                        <div className="ielts-table-group">
                            <TableCompletionRenderer
                                contextData={context}
                                questions={questions}
                                userAnswers={userAnswers}
                                onAnswerChange={onAnswerChange}
                                isSubmitted={submitting}
                                showResults={false}
                            />
                        </div>
                    ) : (
                        // Use context with blanks for other types
                        <div className="ielts-context-group">
                            {renderContextWithBlanksForGroup(context, questions)}
                        </div>
                    )}
                </div>
            );

        } else {
            // Individual question
            const question = group.question;
            const questionId = question.id || question.question_id;
            const questionText = question.questionText || question.question_text;
            const orderInTest = question.orderInTest || question.order_in_test || (groupIndex + 1);

            return (
                <div key={questionId} className="ielts-question-item">
                    <div className="ielts-question-layout">
                        <div className="ielts-question-number">
                            {orderInTest}
                        </div>
                        <div className="ielts-question-content">
                            <p className="ielts-question-text">
                                {questionText}
                            </p>
                            {renderQuestionInput(question)}
                        </div>
                    </div>
                </div>
            );
        }
    };

    // ✅ Render context with blanks for a group of questions
    // Thay thế hàm renderContextWithBlanksForGroup
    const renderContextWithBlanksForGroup = (context, questions) => {
        // Split context by placeholders
        const parts = context.split(/(___\d+___)/);

        return (
            <div className="ielts-context-blanks-group">
                <div className="ielts-context-content">
                    {parts.map((part, idx) => {
                        // Check if this part is a placeholder
                        const placeholderMatch = part.match(/___(\d+)___/);

                        if (placeholderMatch) {
                            const questionNumber = parseInt(placeholderMatch[1]);

                            // Find the question with this number
                            const targetQuestion = questions.find(q => {
                                const orderInTest = q.orderInTest || q.order_in_test;
                                return orderInTest === questionNumber;
                            });

                            if (targetQuestion) {
                                const questionId = targetQuestion.id || targetQuestion.question_id;
                                return (
                                    <span key={idx} className="ielts-inline-question">
                                    <span className="ielts-question-number-inline">
                                        {questionNumber}
                                    </span>
                                    <input
                                        type="text"
                                        className="ielts-blank-input"
                                        value={userAnswers[questionId] || ''}
                                        onChange={(e) => onAnswerChange(questionId, e.target.value)}
                                        placeholder={`${questionNumber}`}
                                    />
                                </span>
                                );
                            } else {
                                return (
                                    <span key={idx} className="ielts-missing-question">
                                    ____{questionNumber}____
                                </span>
                                );
                            }
                        } else {
                            // ✅ FIX: Preserve line breaks cho regular text
                            return (
                                <span
                                    key={idx}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                    dangerouslySetInnerHTML={{
                                        __html: part.replace(/\n/g, '<br/>')
                                    }}
                                />
                            );
                        }
                    })}
                </div>
            </div>
        );
    };

    // ✅ Get question status for sidebar
    const getQuestionStatus = (questionId) => {
        return userAnswers[questionId] ? 'answered' : 'unanswered';
    };

    return (
        <div className="ielts-listening-container">
            {/* Header */}
            <div className="ielts-header">
                <div className="ielts-header-left">
                    <h1 className="ielts-test-title">
                        {test?.testName || 'IELTS Listening Test'}
                    </h1>
                    <button className="ielts-exit-btn">
                        Exit
                    </button>
                </div>
                <div className="ielts-header-right">
                    <label className="ielts-highlight-toggle">
                        <input
                            type="checkbox"
                            checked={highlightMode}
                            onChange={(e) => setHighlightMode(e.target.checked)}
                        />
                        <span>Highlight content</span>
                        <span>ⓘ</span>
                    </label>
                </div>
            </div>

            <div className="ielts-main-layout">
                {/* Main Content */}
                <div className="ielts-content-area">
                    {/* Recording Tabs */}
                    <div className="ielts-recording-tabs">
                        {audioList.map((audio, index) => {
                            const recordingNum = index + 1;
                            return (
                                <button
                                    key={recordingNum}
                                    onClick={() => setCurrentRecording(recordingNum)}
                                    className={`ielts-recording-tab ${
                                        currentRecording === recordingNum ? 'active' : ''
                                    }`}>
                                    Recording {recordingNum}
                                    {/* ✅ Hiển thị tên audio từ DB */}
                                    <span className="recording-title">
                                        {audio.title || `Section ${recordingNum}`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ✅ ENHANCED: Audio Player with better controls */}
                    <div className="ielts-audio-player">
                        <div className="ielts-audio-controls">
                            <button
                                onClick={togglePlay}
                                disabled={!currentAudio}
                                className="ielts-play-btn"
                                title={currentAudio ? (isPlaying ? 'Pause' : 'Play') : 'No audio loaded'}
                            >
                                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>

                            <button
                                onClick={() => seekAudio(-10)}
                                className="ielts-rewind-btn"
                                title="Rewind 10s"
                                disabled={!currentAudio}
                            >
                                <RotateCcw size={16} />
                            </button>

                            <div className="ielts-progress-container">
                                <div className="ielts-progress-bar">
                                    <div
                                        className="ielts-progress-fill"
                                        style={{
                                            width: duration > 0 && currentTime > 0 ?
                                                `${(currentTime / duration) * 100}%` : '0%'
                                        }}
                                    />
                                </div>
                            </div>

                            <span className="ielts-time-display">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>

                            <div className="ielts-volume-controls">
                                <Volume2 size={20} />
                                <div className="ielts-volume-slider" />
                                <Settings size={20} />
                            </div>
                        </div>

                        {/* ✅ Enhanced Audio Info */}
                        <div className="ielts-audio-info">
                            {currentAudio ? (
                                <>
                                    <span className="ielts-audio-title">{currentAudio.title}</span>
                                    {duration > 0 && (
                                        <span> - Duration: {formatTime(duration)}</span>
                                    )}
                                    <span className="audio-status">
                                        {!currentAudio ? ' - No audio' :
                                            isPlaying ? ' - Playing' : ' - Ready'}
                                    </span>
                                </>
                            ) : (
                                <span className="ielts-audio-title">No audio loaded for Recording {currentRecording}</span>
                            )}
                        </div>
                    </div>

                    {/* Questions Section */}
                    <div className="ielts-questions-container">
                        <div className="ielts-questions-header">
                            <h2 className="ielts-questions-title">
                                Recording {currentRecording} Questions
                            </h2>
                            {currentRecordingData.audio?.title && (
                                <p className="ielts-questions-subtitle">{currentRecordingData.audio.title}</p>
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="ielts-instructions">
                            <p className="ielts-instructions-title">Instructions:</p>
                            <p className="ielts-instructions-text">
                                Listen to the audio and answer the questions. You can play the audio multiple times.
                                Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer unless specified otherwise.
                            </p>
                        </div>

                        {/* ✅ ENHANCED: Questions with proper grouping */}
                        <div className="ielts-questions-list">
                            {(() => {
                                const questionGroups = groupQuestionsByContext(currentRecordingData.questions);
                                console.log(`📋 Rendering ${questionGroups.length} question groups`);

                                return questionGroups.map((group, groupIndex) =>
                                    renderQuestionGroup(group, groupIndex)
                                );
                            })()}
                        </div>

                        {/* Show transcript if available */}
                        {currentAudio?.transcript && (
                            <div className="ielts-transcript">
                                <details>
                                    <summary className="ielts-transcript-toggle">
                                        Show transcript (for reference)
                                    </summary>
                                    <div className="ielts-transcript-content">
                                        <pre className="ielts-transcript-text">{currentAudio.transcript}</pre>
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                {/* Sidebar - ĐỒNG BỘ VỚI READING */}
                <div className="test-sidebar">
                    {/* Timer giống Reading */}
                    <div className="sidebar-timer">
                        <h3>Thời gian còn lại:</h3>
                        <div className="time-display">{formatTimerLarge(timer)}</div>
                    </div>

                    {/* Submit button giống Reading */}
                    <button
                        className="submit-button"
                        onClick={onSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'ĐANG NỘP...' : 'NỘP BÀI'}
                    </button>

                    {/* Save progress giống Reading */}
                    <div className="save-progress" onClick={onSaveProgress}>
                        <span className="save-icon">↩</span> Khôi phục/lưu bài làm
                    </div>

                    {/* Review note giống Reading */}
                    <div className="review-note">
                        <strong>Chú ý:</strong> bạn có thể click vào số thứ tự câu hỏi trong bài để đánh dấu review. Có thể phát lại audio nhiều lần.
                    </div>

                    {/* ✅ DYNAMIC Question Navigation - dựa trên audioList thay vì hardcode [1,2,3,4] */}
                    {audioList.map((audio, audioIndex) => {
                        const recordingNum = audioIndex + 1;
                        const recordingQuestions = questionsByRecording[recordingNum] || [];

                        return (
                            <div key={recordingNum} className="recording-questions">
                                <h3>
                                    {audio.title || `Recording ${recordingNum}`}
                                    {recordingNum === currentRecording && (
                                        <span style={{
                                            marginLeft: '8px',
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#4285f4',
                                            borderRadius: '50%',
                                            display: 'inline-block'
                                        }}></span>
                                    )}
                                </h3>
                                <div className="question-buttons">
                                    {recordingQuestions.map((question) => {
                                        const questionId = question.id || question.question_id;
                                        const orderInTest = question.orderInTest || question.order_in_test;

                                        return (
                                            <button
                                                key={questionId}
                                                className={`question-button ${
                                                    markedQuestions?.includes(questionId) ? 'marked' : ''
                                                } ${
                                                    userAnswers[questionId] ? 'answered' : ''
                                                } ${
                                                    recordingNum === currentRecording ? 'current-recording' : ''
                                                }`}
                                                onClick={() => {
                                                    setCurrentRecording(recordingNum);
                                                    // Scroll to question logic có thể thêm sau
                                                }}
                                            >
                                                {orderInTest}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Progress Summary giống Reading */}
                    <div className="progress-summary">
                        <div className="progress-text">
                            <span className="font-medium">Tiến độ:</span> {Object.keys(userAnswers).length}/{questions.length} đã trả lời
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ Enhanced Audio Element with better error handling */}
            <audio
                ref={audioRef}
                preload="metadata"
                style={{ display: 'none' }}
                crossOrigin="anonymous"
            />
        </div>
    );
};

export default IELTSListeningTest;