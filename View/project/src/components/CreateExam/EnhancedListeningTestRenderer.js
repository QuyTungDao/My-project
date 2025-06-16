// =====================================
// FIXED EnhancedListeningTestRenderer.js - Show Both Context AND Questions
// =====================================

import React, { useState, useEffect } from 'react';
import ListeningAudioPlayer from './ListeningAudioPlayer';
import './EnhancedListeningTestRenderer.css';

const EnhancedListeningTestRenderer = ({
                                           test,
                                           audioList,
                                           questionSets,
                                           userAnswers,
                                           onAnswerChange,
                                           isSubmitted = false,
                                           currentAudioIndex,
                                           setCurrentAudioIndex
                                       }) => {
    const [expandedSets, setExpandedSets] = useState(new Set());

    // Auto-expand all sets initially
    useEffect(() => {
        if (questionSets && questionSets.length > 0) {
            setExpandedSets(new Set(questionSets.map(set => set.id)));
        }
    }, [questionSets]);

    const toggleSetExpansion = (setId) => {
        const newExpanded = new Set(expandedSets);
        if (newExpanded.has(setId)) {
            newExpanded.delete(setId);
        } else {
            newExpanded.add(setId);
        }
        setExpandedSets(newExpanded);
    };

    // ✅ ENHANCED: Visual Table Renderer for Table Completion
    const renderVisualTable = (set) => {
        if (!set.context || !set.requiresContext || set.subType !== 'TABLE_COMPLETION') {
            return null;
        }

        // Parse table from context
        const lines = set.context.split('\n');
        const tableLines = lines.filter(line => line.includes('|') && !line.includes('---'));

        if (tableLines.length === 0) {
            return renderContextDisplay(set); // Fallback to old method
        }

        const tableData = tableLines.map(line =>
            line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
        );

        // Find table title
        let tableTitle = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.includes('|') && !line.includes('---')) {
                const nextLines = lines.slice(i + 1, i + 3);
                if (nextLines.some(l => l.includes('|'))) {
                    tableTitle = line;
                    break;
                }
            }
        }

        return (
            <div className="visual-table-display">
                {tableTitle && (
                    <h4 className="table-title">{tableTitle}</h4>
                )}

                <div className="table-container">
                    <table className="listening-table">
                        <thead>
                        <tr>
                            {tableData[0]?.map((header, colIndex) => (
                                <th key={colIndex} className="table-header">
                                    {header}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {tableData.slice(1).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, colIndex) => {
                                    const questionMatch = cell.match(/___(\d+)___/);

                                    if (questionMatch) {
                                        const questionNumber = questionMatch[1];
                                        const question = set.questions.find(q => q.questionNumber === parseInt(questionNumber));

                                        return (
                                            <td key={colIndex} className="table-cell question-cell">
                                                <div className="question-input-container">
                                                    <span className="question-number">{questionNumber}</span>
                                                    <input
                                                        type="text"
                                                        className="table-question-input"
                                                        placeholder={`Answer ${questionNumber}`}
                                                        value={userAnswers[question?.id] || ''}
                                                        onChange={(e) => question && onAnswerChange(question.id, e.target.value)}
                                                        disabled={isSubmitted}
                                                    />
                                                </div>
                                            </td>
                                        );
                                    } else {
                                        return (
                                            <td key={colIndex} className="table-cell data-cell">
                                                {cell}
                                            </td>
                                        );
                                    }
                                })}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // ✅ ORIGINAL: Context Display for other types (Notes, Forms, etc.)
    const renderContextDisplay = (set) => {
        if (!set.context || !set.requiresContext) {
            return null;
        }

        // Parse context and replace numbered blanks with input fields
        const contextLines = set.context.split('\n');

        return (
            <div className="context-display">
                <div className="context-content">
                    {contextLines.map((line, lineIndex) => {
                        // Replace ___1___, ___2___, etc. with actual input fields
                        const parts = line.split(/___(\d+)___/);

                        return (
                            <div key={lineIndex} className="context-line">
                                {parts.map((part, partIndex) => {
                                    // If this part is a number (question number)
                                    if (partIndex % 2 === 1) {
                                        const questionNumber = parseInt(part);
                                        const question = set.questions.find(q => q.questionNumber === questionNumber);

                                        if (question) {
                                            return (
                                                <span key={partIndex} className="inline-answer">
                                                    <input
                                                        type="text"
                                                        className="context-input"
                                                        placeholder={`${questionNumber}`}
                                                        value={userAnswers[question.id] || ''}
                                                        onChange={(e) => onAnswerChange(question.id, e.target.value)}
                                                        disabled={isSubmitted}
                                                    />
                                                </span>
                                            );
                                        } else {
                                            return <span key={partIndex} className="missing-question">___{part}___</span>;
                                        }
                                    }
                                    // Regular text
                                    return <span key={partIndex}>{part}</span>;
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ✅ ENHANCED: Standalone Questions with proper question text display
    const renderStandaloneQuestions = (set) => {
        // ✅ ALWAYS show standalone questions for MCQ, Matching, Short Answer
        // ✅ ALSO show for context-based questions that have individual question text

        return (
            <div className="standalone-questions">
                {set.questions.map((question, qIdx) => (
                    <div key={question.id} className="question-item">
                        <div className="question-header">
                            <span className="question-number">{question.questionNumber}</span>
                            <span className="question-type-badge">{set.subType || set.type}</span>
                        </div>

                        {/* ✅ ENHANCED: Always show question text if available */}
                        {question.questionText && (
                            <div className="question-text">
                                <p>{question.questionText}</p>
                            </div>
                        )}

                        <div className="question-input">
                            {renderQuestionInput(question, set.type, set.subType)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // ✅ ENHANCED: Question input renderer with Short Answer improvements
    const renderQuestionInput = (question, questionType, subType) => {
        switch (questionType) {
            case 'MCQ':
                let options = [];
                try {
                    options = Array.isArray(question.options) ? question.options : [];
                } catch (e) {
                    options = [];
                }

                return (
                    <div className="mcq-options">
                        {['A', 'B', 'C', 'D'].map((letter, idx) => (
                            <label key={letter} className="option-label">
                                <input
                                    type="radio"
                                    name={`question_${question.id}`}
                                    value={letter}
                                    checked={userAnswers[question.id] === letter}
                                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                                    disabled={isSubmitted}
                                />
                                <span className="option-letter">{letter}</span>
                                <span className="option-text">{options[idx] || `Option ${letter}`}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'MATCHING':
                return (
                    <div className="matching-input">
                        <input
                            type="text"
                            placeholder="Enter letter (A, B, C, etc.)"
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => onAnswerChange(question.id, e.target.value)}
                            disabled={isSubmitted}
                            className="answer-input"
                        />
                    </div>
                );

            case 'SHORT_ANSWER':
                return (
                    <div className="short-answer-input">
                        <div className="answer-instruction">
                            <small>Write NO MORE THAN THREE WORDS for your answer</small>
                        </div>
                        <input
                            type="text"
                            placeholder="Enter your answer"
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => onAnswerChange(question.id, e.target.value)}
                            disabled={isSubmitted}
                            className="answer-input short-answer"
                        />
                    </div>
                );

            // ✅ COMPLETION TYPES - Check if already handled in context
            case 'FILL_IN_THE_BLANK':
                // If this question is already handled in table/context display, don't show input again
                if (subType === 'TABLE_COMPLETION' || subType === 'NOTE_COMPLETION' ||
                    subType === 'FORM_FILLING' || subType === 'PLAN_MAP_COMPLETION') {
                    return null; // Already handled in context display
                }

                // For other completion types, show regular input
                return (
                    <div className="text-input">
                        <input
                            type="text"
                            placeholder="Enter your answer"
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => onAnswerChange(question.id, e.target.value)}
                            disabled={isSubmitted}
                            className="answer-input"
                        />
                    </div>
                );

            default:
                return (
                    <div className="text-input">
                        <input
                            type="text"
                            placeholder="Enter your answer"
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => onAnswerChange(question.id, e.target.value)}
                            disabled={isSubmitted}
                            className="answer-input"
                        />
                    </div>
                );
        }
    };

    const getAnsweredQuestionsInSet = (set) => {
        return set.questions.filter(q => userAnswers[q.id] && userAnswers[q.id].trim() !== '').length;
    };

    const getAudioTitle = (audioId) => {
        if (!audioId || !audioList) return 'No Audio';
        const audio = audioList.find(a => a.id === audioId);
        return audio ? audio.title : `Audio ${audioId}`;
    };

    if (!questionSets || questionSets.length === 0) {
        return (
            <div className="no-questions">
                <div className="no-questions-icon">🎧</div>
                <h3>No questions available</h3>
                <p>Please add some questions to this listening test.</p>
            </div>
        );
    }

    return (
        <div className="enhanced-listening-test-renderer">
            {questionSets.map((set) => (
                <div key={set.id} className={`question-set ${expandedSets.has(set.id) ? 'expanded' : ''}`}>
                    {/* Question Set Header */}
                    <div className="question-set-header" onClick={() => toggleSetExpansion(set.id)}>
                        <div className="set-info">
                            <div className="set-title">
                                <span className="set-type-badge">{set.subType || set.type}</span>
                                <h3>{set.name}</h3>
                            </div>
                            <div className="set-meta">
                                <span className="question-count">
                                    Questions {set.questions[0]?.questionNumber || 1} - {set.questions[set.questions.length - 1]?.questionNumber || set.questions.length}
                                </span>
                                <span className="audio-info">
                                    🎧 {getAudioTitle(set.audioId)}
                                </span>
                                <span className="progress-info">
                                    {getAnsweredQuestionsInSet(set)}/{set.questions.length} answered
                                </span>
                            </div>
                        </div>
                        <div className="expand-toggle">
                            <span className="expand-icon">
                                {expandedSets.has(set.id) ? '▼' : '▶'}
                            </span>
                        </div>
                    </div>

                    {/* Question Set Content */}
                    {expandedSets.has(set.id) && (
                        <div className="question-set-content">
                            {/* ✅ ENHANCED: Instructions always displayed prominently */}
                            {set.instructions && (
                                <div className="set-instructions">
                                    <div className="instructions-icon">📋</div>
                                    <div className="instructions-text">
                                        <strong>Instructions:</strong>
                                        <div className="instructions-content">
                                            {set.instructions.split('\n').map((line, idx) => (
                                                <p key={idx}>{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ✅ ENHANCED: Word Limit Info for completion types */}
                            {set.requiresContext && (
                                <div className="word-limit-notice">
                                    <span className="word-limit-badge">
                                        💡 {set.questions[0]?.wordLimit || 'NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer'}
                                    </span>
                                </div>
                            )}

                            {/* ✅ ENHANCED: Context Display (Table/Notes/Forms) */}
                            {set.context && set.requiresContext && (
                                <div className="context-section">
                                    {set.subType === 'TABLE_COMPLETION' ?
                                        renderVisualTable(set) :
                                        renderContextDisplay(set)
                                    }
                                </div>
                            )}

                            {/* ✅ ENHANCED: Standalone Questions for ALL types */}
                            {set.questions.length > 0 && (
                                <div className="questions-section">
                                    {/* Only show standalone questions for non-context types OR context types with individual question text */}
                                    {(!set.requiresContext ||
                                            set.questions.some(q => q.questionText && q.questionText.trim())) &&
                                        renderStandaloneQuestions(set)
                                    }
                                </div>
                            )}

                            {/* ✅ ENHANCED: Question Numbers Reference for completion types */}
                            {set.requiresContext && (
                                <div className="question-numbers-reference">
                                    <h4>Questions in this section:</h4>
                                    <div className="question-numbers-grid">
                                        {set.questions.map(question => (
                                            <div key={question.id} className="question-number-item">
                                                <span className="number">{question.questionNumber}</span>
                                                <span className={`status ${userAnswers[question.id] ? 'answered' : 'unanswered'}`}>
                                                    {userAnswers[question.id] ? '✓' : '○'}
                                                </span>
                                                {/* ✅ Show answer preview */}
                                                {userAnswers[question.id] && (
                                                    <span className="answer-preview">
                                                        {userAnswers[question.id].length > 15
                                                            ? userAnswers[question.id].substring(0, 15) + '...'
                                                            : userAnswers[question.id]
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {/* ✅ ENHANCED: Summary with detailed progress */}
            <div className="test-summary">
                <div className="summary-stats">
                    <div className="stat-item">
                        <span className="stat-number">{questionSets.reduce((acc, set) => acc + getAnsweredQuestionsInSet(set), 0)}</span>
                        <span className="stat-label">Answered</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{questionSets.reduce((acc, set) => acc + set.questions.length, 0)}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{questionSets.length}</span>
                        <span className="stat-label">Sections</span>
                    </div>
                </div>

                {/* ✅ Progress by question type */}
                <div className="progress-by-type">
                    {questionSets.map(set => {
                        const answered = getAnsweredQuestionsInSet(set);
                        const total = set.questions.length;
                        const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

                        return (
                            <div key={set.id} className="type-progress">
                                <span className="type-name">{set.name}</span>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <span className="progress-text">{answered}/{total}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EnhancedListeningTestRenderer;