import React, { useState, useEffect, useRef } from 'react';
import './SpeakingTestDisplay.css';

const SpeakingTestDisplay = ({
                                 test,
                                 questions,
                                 userAnswers,
                                 onAnswerChange,
                                 isSubmitted,
                                 timer,
                                 onSubmit,
                                 submitting
                             }) => {
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [preparationTime, setPreparationTime] = useState(0);
    const [preparationStarted, setPreparationStarted] = useState(false);
    const [recordings, setRecordings] = useState({});
    const [showInstructions, setShowInstructions] = useState(true);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [microphoneAccess, setMicrophoneAccess] = useState(false);
    const [currentPhase, setCurrentPhase] = useState('intro');
    const [preparationNotes, setPreparationNotes] = useState('');// intro, preparation, speaking, completed

    const recordingTimerRef = useRef(null);
    const preparationTimerRef = useRef(null);
    const audioRef = useRef(null);
    const currentRecordingTimeRef = useRef(0); // Add ref to track current recording time

    // Group questions by speaking part
    const groupedParts = questions.reduce((groups, question) => {
        const partType = question.questionType || 'SPEAKING_PART1';
        if (!groups[partType]) {
            groups[partType] = [];
        }
        groups[partType].push(question);
        return groups;
    }, {});

    const partsList = Object.entries(groupedParts).map(([type, questions]) => ({
        type,
        questions: questions.sort((a, b) => a.orderInTest - b.orderInTest),
        name: getPartName(type),
        duration: getPartDuration(type),
        preparationTime: getPreparationTime(type),
        description: getPartDescription(type)
    }));

    // Get part metadata
    function getPartName(type) {
        switch (type) {
            case 'SPEAKING_PART1':
                return 'Part 1 - Introduction & Interview';
            case 'SPEAKING_PART2':
                return 'Part 2 - Long Turn (Cue Card)';
            case 'SPEAKING_PART3':
                return 'Part 3 - Discussion';
            default:
                return 'Speaking Task';
        }
    }

    function getPartDuration(type) {
        switch (type) {
            case 'SPEAKING_PART1':
                return 5; // 4-5 minutes
            case 'SPEAKING_PART2':
                return 2; // 1-2 minutes speaking
            case 'SPEAKING_PART3':
                return 5; // 4-5 minutes
            default:
                return 3;
        }
    }

    function getPreparationTime(type) {
        switch (type) {
            case 'SPEAKING_PART1':
                return 0; // No preparation time
            case 'SPEAKING_PART2':
                return 60; // 1 minute preparation
            case 'SPEAKING_PART3':
                return 0; // No preparation time
            default:
                return 0;
        }
    }

    function getPartDescription(type) {
        switch (type) {
            case 'SPEAKING_PART1':
                return 'Answer questions about familiar topics like your home, family, work, studies and interests.';
            case 'SPEAKING_PART2':
                return 'Speak for 1-2 minutes about a topic given on a cue card. You have 1 minute to prepare.';
            case 'SPEAKING_PART3':
                return 'Discuss more abstract ideas and issues related to the topic in Part 2.';
            default:
                return 'Complete the speaking task as instructed.';
        }
    }

    // Initialize microphone access
    useEffect(() => {
        const initializeMicrophone = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setMicrophoneAccess(true);

                // Stop the initial stream
                stream.getTracks().forEach(track => track.stop());

                console.log('✅ Microphone access granted');
            } catch (error) {
                console.error('❌ Microphone access denied:', error);
                setMicrophoneAccess(false);
                alert('Microphone access is required for the speaking test. Please allow microphone access and refresh the page.');
            }
        };

        initializeMicrophone();
    }, []);

    // Format time
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Start preparation timer
    const startPreparation = () => {
        if (!preparationStarted) {
            setPreparationStarted(true);
            setCurrentPhase('preparation');
            const part = partsList[currentPartIndex];
            setPreparationTime(part.preparationTime);

            if (part.preparationTime > 0) {
                preparationTimerRef.current = setInterval(() => {
                    setPreparationTime(prev => {
                        if (prev <= 1) {
                            clearInterval(preparationTimerRef.current);
                            setCurrentPhase('speaking');
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setCurrentPhase('speaking');
            }
        }
    };

    // ✅ THÊM: Function để skip preparation time
    const skipPreparation = () => {
        if (preparationTimerRef.current) {
            clearInterval(preparationTimerRef.current);
        }
        setPreparationTime(0);
        setCurrentPhase('speaking');
    };

    // Start recording
    const startRecording = async () => {
        if (!microphoneAccess) {
            alert('Microphone access is required. Please allow microphone access and try again.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            const recorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            const chunks = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);

                const currentQuestion = getCurrentQuestion();
                const recordingData = {
                    blob: audioBlob,
                    url: audioUrl,
                    duration: currentRecordingTimeRef.current, // Use ref value instead of state
                    timestamp: new Date().toISOString()
                };

                setRecordings(prev => ({
                    ...prev,
                    [currentQuestion.id]: recordingData
                }));

                // Convert blob to base64 for storage
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Data = reader.result.split(',')[1];
                    onAnswerChange(currentQuestion.id, base64Data);
                };
                reader.readAsDataURL(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            setMediaRecorder(recorder);
            setAudioChunks(chunks);
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            currentRecordingTimeRef.current = 0; // Reset ref

            // Start recording timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    currentRecordingTimeRef.current = newTime; // Update ref with current time
                    return newTime;
                });
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Failed to start recording. Please check your microphone and try again.');
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            // Stop timer first and save current time
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }

            // Stop recording
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    // Get current question
    const getCurrentQuestion = () => {
        const currentPart = partsList[currentPartIndex];
        return currentPart?.questions[currentQuestionIndex];
    };

    // Navigate to next question
    const nextQuestion = () => {
        const currentPart = partsList[currentPartIndex];

        if (currentQuestionIndex < currentPart.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else if (currentPartIndex < partsList.length - 1) {
            setCurrentPartIndex(prev => prev + 1);
            setCurrentQuestionIndex(0);
            setCurrentPhase('intro');
            setPreparationStarted(false);
        } else {
            setCurrentPhase('completed');
        }

        // Reset timers
        setRecordingTime(0);
        currentRecordingTimeRef.current = 0;
        setPreparationTime(0);
        setPreparationNotes(''); // Reset notes
    };

    // Navigate to previous question
    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        } else if (currentPartIndex > 0) {
            setCurrentPartIndex(prev => prev - 1);
            const prevPart = partsList[currentPartIndex - 1];
            setCurrentQuestionIndex(prevPart.questions.length - 1);
        }

        setCurrentPhase('speaking');
        setRecordingTime(0);
        currentRecordingTimeRef.current = 0;
    };

    // Play recorded audio
    const playRecording = (questionId) => {
        const recording = recordings[questionId];
        if (recording && audioRef.current) {
            audioRef.current.src = recording.url;
            audioRef.current.play();
        }
    };

    // Clean up timers
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
            if (preparationTimerRef.current) {
                clearInterval(preparationTimerRef.current);
            }
        };
    }, []);

    if (!microphoneAccess) {
        return (
            <div className="speaking-test-container">
                <div className="microphone-setup">
                    <div className="setup-content">
                        <div className="setup-icon">🎤</div>
                        <h2>Microphone Access Required</h2>
                        <p>This speaking test requires access to your microphone to record your responses.</p>
                        <p>Please allow microphone access when prompted by your browser.</p>
                        <button
                            className="retry-mic-btn"
                            onClick={() => window.location.reload()}
                        >
                            Retry Microphone Access
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentPart = partsList[currentPartIndex];
    const currentQuestion = getCurrentQuestion();

    return (
        <div className="speaking-test-container">
            {/* Header */}
            <div className="speaking-test-header">
                <div className="test-info">
                    <h1 className="test-title">{test.testName}</h1>
                    <div className="test-meta">
                        <span>IELTS Speaking</span>
                        <span>•</span>
                        <span>{partsList.length} Parts</span>
                    </div>
                </div>

                <div className="timer-container">
                    <div className="timer-display">
                        <div className="timer-label">Total Time Remaining</div>
                        <div className="timer-value">{formatTime(timer)}</div>
                    </div>
                </div>
            </div>

            {/* Instructions Panel */}
            {showInstructions && (
                <div className="instructions-panel">
                    <div className="instructions-header">
                        <h3>🎤 Speaking Test Instructions</h3>
                        <button
                            className="close-instructions"
                            onClick={() => setShowInstructions(false)}
                        >
                            ×
                        </button>
                    </div>
                    <div className="instructions-content">
                        <ul>
                            <li>This speaking test consists of {partsList.length} parts</li>
                            <li>You will be recorded throughout the test</li>
                            <li>Part 2 includes 1 minute preparation time</li>
                            <li>Speak clearly and at a natural pace</li>
                            <li>You can replay your recordings before submitting</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="progress-container">
                <div className="progress-bar">
                    {partsList.map((part, partIndex) => (
                        <div key={partIndex} className="progress-part">
                            <div className={`progress-segment ${
                                partIndex < currentPartIndex ? 'completed' :
                                    partIndex === currentPartIndex ? 'active' : 'pending'
                            }`}>
                                <span className="part-number">{partIndex + 1}</span>
                                <span className="part-name">{part.name.split(' - ')[0]}</span>
                            </div>
                            {partIndex < partsList.length - 1 && <div className="progress-connector"></div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="speaking-main-content">
                {currentPhase === 'completed' ? (
                    <div className="completion-screen">
                        <div className="completion-content">
                            <div className="completion-icon">✅</div>
                            <h2>Speaking Test Completed!</h2>
                            <p>You have completed all parts of the speaking test.</p>

                            <div className="recordings-summary">
                                <h3>Your Recordings:</h3>
                                {Object.keys(recordings).map(questionId => {
                                    const recording = recordings[questionId];
                                    const question = questions.find(q => q.id === parseInt(questionId));
                                    return (
                                        <div key={questionId} className="recording-item">
                                            <div className="recording-info">
                                                <span className="recording-question">
                                                    {question?.questionText.substring(0, 50)}...
                                                </span>
                                                <span className="recording-duration">
                                                    {formatTime(recording.duration)}
                                                </span>
                                            </div>
                                            <button
                                                className="play-btn"
                                                onClick={() => playRecording(questionId)}
                                            >
                                                ▶️ Play
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                className="submit-test-btn"
                                onClick={onSubmit}
                                disabled={submitting}
                            >
                                {submitting ? '⏳ Submitting...' : '📤 Submit Speaking Test'}
                            </button>
                        </div>
                    </div>
                ) : currentPart && (
                    <div className="speaking-task">
                        {/* Part Header */}
                        <div className="part-header">
                            <h2>{currentPart.name}</h2>
                            <div className="part-info">
                                <span className="part-duration">
                                    ⏱ {currentPart.duration} minutes
                                </span>
                                <span className="question-progress">
                                    Question {currentQuestionIndex + 1} of {currentPart.questions.length}
                                </span>
                            </div>
                        </div>

                        {/* Part Description */}
                        <div className="part-description">
                            <p>{currentPart.description}</p>
                        </div>

                        {/* Current Question */}
                        {currentQuestion && (
                            <div className="question-section">
                                {/* Question Instructions */}
                                {currentQuestion.questionSetInstructions && (
                                    <div className="question-instructions">
                                        <h4>Instructions:</h4>
                                        <p>{currentQuestion.questionSetInstructions}</p>
                                    </div>
                                )}

                                {/* Question Content */}
                                <div className="question-content">
                                    <h4>Question:</h4>
                                    <div className="question-text">
                                        {currentQuestion.questionText}
                                    </div>
                                </div>

                                {/* Phase-specific Content */}
                                {currentPhase === 'intro' && (
                                    <div className="intro-phase">
                                        <div className="phase-content">
                                            <h3>Ready for {currentPart.name}?</h3>
                                            <p>Click "Start" when you're ready to begin this part.</p>
                                            {currentPart.preparationTime > 0 && (
                                                <p>⏰ You will have {currentPart.preparationTime} seconds to prepare.</p>
                                            )}
                                            <button
                                                className="start-btn"
                                                onClick={startPreparation}
                                            >
                                                Start {currentPart.name.split(' - ')[0]}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {currentPhase === 'preparation' && (
                                    <div className="preparation-phase">
                                        <div className="preparation-content">
                                            <h3>Preparation Time</h3>
                                            <div className="preparation-timer">
                                                {formatTime(preparationTime)}
                                            </div>
                                            <p>Use this time to think about your answer and make notes if needed.</p>
                                            <p className="skip-hint">💡 You can start speaking anytime when ready!</p>

                                            <div className="preparation-notes">
                <textarea
                    placeholder="Make notes here (optional)..."
                    value={preparationNotes}
                    onChange={(e) => setPreparationNotes(e.target.value)}
                    rows={4}
                />
                                            </div>

                                            {/* ✅ THÊM: Skip button */}
                                            <div className="preparation-actions">
                                                <button
                                                    className="skip-prep-btn"
                                                    onClick={skipPreparation}
                                                    disabled={preparationTime <= 0}
                                                >
                                                    🚀 Ready to Speak - Start Now
                                                </button>
                                                <span className="or-wait">or wait {formatTime(preparationTime)} for auto-start</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentPhase === 'speaking' && (
                                    <div className="speaking-phase">
                                        <div className="recording-controls">
                                            <div className="recording-status">
                                                {isRecording ? (
                                                    <div className="recording-active">
                                                        <div className="recording-indicator"></div>
                                                        <span>Recording... {formatTime(recordingTime)}</span>
                                                    </div>
                                                ) : recordings[currentQuestion.id] ? (
                                                    <div className="recording-completed">
                                                        <span>✅ Recorded ({formatTime(recordings[currentQuestion.id].duration)})</span>
                                                    </div>
                                                ) : (
                                                    <div className="recording-ready">
                                                        <span>Ready to record</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="recording-buttons">
                                                {!isRecording ? (
                                                    <button
                                                        className="record-btn"
                                                        onClick={startRecording}
                                                    >
                                                        🎤 {recordings[currentQuestion.id] ? 'Record Again' : 'Start Recording'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="stop-btn"
                                                        onClick={stopRecording}
                                                    >
                                                        ⏹ Stop Recording
                                                    </button>
                                                )}

                                                {recordings[currentQuestion.id] && (
                                                    <button
                                                        className="play-btn"
                                                        onClick={() => playRecording(currentQuestion.id)}
                                                    >
                                                        ▶️ Play Recording
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="speaking-tips">
                                            <h4>💡 Speaking Tips:</h4>
                                            <ul>
                                                <li>Speak clearly and at a natural pace</li>
                                                <li>Give detailed answers with examples</li>
                                                <li>Don't worry about small mistakes</li>
                                                <li>Use the full time allocated</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="question-navigation">
                            <button
                                className="nav-btn prev-btn"
                                onClick={previousQuestion}
                                disabled={currentPartIndex === 0 && currentQuestionIndex === 0}
                            >
                                ← Previous
                            </button>

                            <div className="nav-info">
                                <span>Part {currentPartIndex + 1} - Question {currentQuestionIndex + 1}</span>
                            </div>

                            <button
                                className="nav-btn next-btn"
                                onClick={nextQuestion}
                                disabled={currentPhase === 'preparation' ||
                                    (currentPhase === 'speaking' && !recordings[currentQuestion?.id])}
                            >
                                {currentPartIndex === partsList.length - 1 &&
                                currentQuestionIndex === currentPart.questions.length - 1 ?
                                    'Finish' : 'Next'} →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden Audio Element */}
            <audio ref={audioRef} className="hidden" controls />
        </div>
    );
};

export default SpeakingTestDisplay;