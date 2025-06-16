import React, { useState, useEffect, useRef } from 'react';
import './WritingTestDisplay.css';

const WritingTestDisplay = ({
                                test,
                                questions,
                                userAnswers,
                                onAnswerChange,
                                isSubmitted,
                                timer,
                                onSubmit,
                                submitting
                            }) => {
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [wordCounts, setWordCounts] = useState({});
    const [showInstructions, setShowInstructions] = useState(true);
    const [autoSaveStatus, setAutoSaveStatus] = useState('');
    const autoSaveRef = useRef(null);

    // Group questions by task type
    const groupedTasks = questions.reduce((groups, question) => {
        const taskType = question.questionType;
        if (!groups[taskType]) {
            groups[taskType] = [];
        }
        groups[taskType].push(question);
        return groups;
    }, {});

    const taskList = Object.entries(groupedTasks).map(([type, questions]) => ({
        type,
        questions: questions.sort((a, b) => a.orderInTest - b.orderInTest),
        name: getTaskName(type),
        timeLimit: getTimeLimit(type),
        wordLimit: getWordLimit(type)
    }));

    // Get task metadata
    function getTaskName(type) {
        switch (type) {
            case 'WRITING_TASK1_ACADEMIC':
                return 'Task 1 - Academic Writing';
            case 'WRITING_TASK1_GENERAL':
                return 'Task 1 - General Training';
            case 'WRITING_TASK2':
                return 'Task 2 - Essay Writing';
            case 'ESSAY':
                return 'Essay Writing';
            default:
                return 'Writing Task';
        }
    }

    function getTimeLimit(type) {
        switch (type) {
            case 'WRITING_TASK1_ACADEMIC':
            case 'WRITING_TASK1_GENERAL':
                return 20;
            case 'WRITING_TASK2':
            case 'ESSAY':
                return 40;
            default:
                return 30;
        }
    }

    function getWordLimit(type) {
        switch (type) {
            case 'WRITING_TASK1_ACADEMIC':
            case 'WRITING_TASK1_GENERAL':
                return 150;
            case 'WRITING_TASK2':
            case 'ESSAY':
                return 250;
            default:
                return 200;
        }
    }

    // Count words in text
    const countWords = (text) => {
        if (!text || typeof text !== 'string') return 0;
        return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    };

    // Update word count when answer changes
    useEffect(() => {
        const newWordCounts = {};
        Object.keys(userAnswers).forEach(questionId => {
            const answer = userAnswers[questionId];
            newWordCounts[questionId] = countWords(answer);
        });
        setWordCounts(newWordCounts);
    }, [userAnswers]);

    // Auto-save functionality
    useEffect(() => {
        if (autoSaveRef.current) {
            clearTimeout(autoSaveRef.current);
        }

        autoSaveRef.current = setTimeout(() => {
            if (Object.keys(userAnswers).length > 0) {
                setAutoSaveStatus('Đã lưu tự động');
                setTimeout(() => setAutoSaveStatus(''), 2000);
            }
        }, 30000); // Auto-save every 30 seconds

        return () => {
            if (autoSaveRef.current) {
                clearTimeout(autoSaveRef.current);
            }
        };
    }, [userAnswers]);

    // Format time
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Get time warning class
    const getTimeWarningClass = () => {
        if (timer <= 300) return 'critical'; // 5 minutes
        if (timer <= 600) return 'warning';  // 10 minutes
        return '';
    };

    const currentTask = taskList[currentTaskIndex];
    const currentQuestion = currentTask?.questions[0]; // Usually one question per task

    return (
        <div className="writing-test-container">
            {/* Header */}
            <div className="writing-test-header">
                <div className="test-info">
                    <h1 className="test-title">{test.testName}</h1>
                    <div className="test-meta">
                        <span>IELTS Writing</span>
                        <span>•</span>
                        <span>{taskList.length} Tasks</span>
                    </div>
                </div>

                <div className="timer-container">
                    <div className={`timer-display ${getTimeWarningClass()}`}>
                        <div className="timer-label">Time Remaining</div>
                        <div className="timer-value">{formatTime(timer)}</div>
                    </div>
                    {autoSaveStatus && (
                        <div className="auto-save-status">{autoSaveStatus}</div>
                    )}
                </div>
            </div>

            {/* Instructions Panel */}
            {showInstructions && (
                <div className="instructions-panel">
                    <div className="instructions-header">
                        <h3>📋 Writing Test Instructions</h3>
                        <button
                            className="close-instructions"
                            onClick={() => setShowInstructions(false)}
                        >
                            ×
                        </button>
                    </div>
                    <div className="instructions-content">
                        <ul>
                            <li>This writing test consists of {taskList.length} task(s)</li>
                            <li>You have {Math.floor(timer / 60)} minutes total to complete all tasks</li>
                            <li>Task 1: Write at least 150 words (recommended 20 minutes)</li>
                            <li>Task 2: Write at least 250 words (recommended 40 minutes)</li>
                            <li>Your work is auto-saved every 30 seconds</li>
                            <li>You can switch between tasks using the tabs above</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Task Navigation */}
            <div className="task-navigation">
                {taskList.map((task, index) => (
                    <button
                        key={index}
                        className={`task-tab ${currentTaskIndex === index ? 'active' : ''} ${
                            userAnswers[task.questions[0]?.id] ? 'has-content' : ''
                        }`}
                        onClick={() => setCurrentTaskIndex(index)}
                    >
                        <div className="task-tab-info">
                            <span className="task-name">{task.name}</span>
                            <span className="task-meta">
                                {task.timeLimit}min • {task.wordLimit}+ words
                            </span>
                        </div>
                        <div className="task-word-count">
                            {wordCounts[task.questions[0]?.id] || 0} words
                        </div>
                    </button>
                ))}
            </div>

            {/* Writing Area */}
            <div className="writing-main-content">
                {currentTask && (
                    <div className="writing-task">
                        {/* Task Header */}
                        <div className="task-header">
                            <div className="task-title">
                                <h2>{currentTask.name}</h2>
                                <div className="task-requirements">
                                    <span className="time-requirement">
                                        ⏱ Recommended: {currentTask.timeLimit} minutes
                                    </span>
                                    <span className="word-requirement">
                                        📝 Minimum: {currentTask.wordLimit} words
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Task Instructions */}
                        {currentQuestion?.questionSetInstructions && (
                            <div className="task-instructions">
                                <h4>Instructions:</h4>
                                <p>{currentQuestion.questionSetInstructions}</p>
                            </div>
                        )}

                        {/* Question Prompt */}
                        <div className="question-prompt">
                            <h4>Task:</h4>
                            <div className="prompt-content">
                                {currentQuestion?.questionText}
                            </div>
                        </div>

                        {/* Visual Material (for Task 1 Academic) */}
                        {currentTask.type === 'WRITING_TASK1_ACADEMIC' && currentQuestion?.visualMaterialPath && (
                            <div className="visual-material">
                                <h4>Chart/Graph to describe:</h4>
                                <img
                                    src={currentQuestion.visualMaterialPath}
                                    alt="Visual material for writing task"
                                    className="visual-content"
                                />
                            </div>
                        )}

                        {/* Writing Input */}
                        <div className="writing-input-section">
                            <div className="writing-input-header">
                                <h4>Your Response:</h4>
                                <div className="word-counter">
                                    <span className={`word-count ${
                                        (wordCounts[currentQuestion?.id] || 0) >= currentTask.wordLimit
                                            ? 'sufficient' : 'insufficient'
                                    }`}>
                                        {wordCounts[currentQuestion?.id] || 0} words
                                    </span>
                                    <span className="word-target">
                                        (minimum: {currentTask.wordLimit})
                                    </span>
                                </div>
                            </div>

                            <textarea
                                className="writing-textarea"
                                placeholder={`Write your ${currentTask.name.toLowerCase()} here... (minimum ${currentTask.wordLimit} words)`}
                                value={userAnswers[currentQuestion?.id] || ''}
                                onChange={(e) => onAnswerChange(currentQuestion?.id, e.target.value)}
                                disabled={isSubmitted}
                                rows={20}
                            />

                            {/* Writing Progress */}
                            <div className="writing-progress">
                                <div className="progress-stats">
                                    <div className="stat">
                                        <span className="stat-label">Characters:</span>
                                        <span className="stat-value">
                                            {(userAnswers[currentQuestion?.id] || '').length}
                                        </span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Paragraphs:</span>
                                        <span className="stat-value">
                                            {(userAnswers[currentQuestion?.id] || '').split('\n\n').filter(p => p.trim()).length}
                                        </span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Progress:</span>
                                        <span className="stat-value">
                                            {Math.round(((wordCounts[currentQuestion?.id] || 0) / currentTask.wordLimit) * 100)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${Math.min(((wordCounts[currentQuestion?.id] || 0) / currentTask.wordLimit) * 100, 100)}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="writing-action-bar">
                <div className="action-left">
                    <button
                        className="show-instructions-btn"
                        onClick={() => setShowInstructions(true)}
                    >
                        📋 Show Instructions
                    </button>
                </div>

                <div className="action-center">
                    <div className="completion-status">
                        {taskList.map((task, index) => (
                            <div key={index} className="task-status">
                                <span className="task-status-name">{task.name}:</span>
                                <span className={`task-status-words ${
                                    (wordCounts[task.questions[0]?.id] || 0) >= task.wordLimit
                                        ? 'complete' : 'incomplete'
                                }`}>
                                    {wordCounts[task.questions[0]?.id] || 0}/{task.wordLimit} words
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="action-right">
                    <button
                        className="submit-test-btn"
                        onClick={onSubmit}
                        disabled={submitting || isSubmitted}
                    >
                        {submitting ? '⏳ Submitting...' : '📤 Submit Test'}
                    </button>
                </div>
            </div>

            {/* Warning for low word count */}
            {taskList.some(task => (wordCounts[task.questions[0]?.id] || 0) < task.wordLimit) && (
                <div className="word-count-warning">
                    ⚠️ Some tasks are below the minimum word requirement. Make sure to meet the word count for better scoring.
                </div>
            )}
        </div>
    );
};

export default WritingTestDisplay;