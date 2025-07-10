// =====================================
// TableCompletionRenderer.js - Component render bảng cho học sinh làm bài
// Sử dụng JSON structure thay vì markdown
// =====================================

import React, { useState, useEffect } from 'react';
import './TableCompletionRenderer.css';

const TableCompletionRenderer = ({
                                     contextData,
                                     questions = [],
                                     userAnswers = {},
                                     onAnswerChange,
                                     isSubmitted = false,
                                     showResults = false
                                 }) => {
    const [tableStructure, setTableStructure] = useState(null);
    const [questionMapping, setQuestionMapping] = useState({});

    // ✅ Parse context data (JSON hoặc markdown fallback)
    useEffect(() => {
        if (!contextData) return;

        try {
            // Try parsing as JSON first
            const parsed = JSON.parse(contextData);
            if (parsed.type === 'ielts_table_completion') {
                console.log('✅ Loading JSON table structure for student');
                setTableStructure(parsed);
                createQuestionMapping(parsed, questions);
                return;
            }
        } catch (e) {
            console.log('⚠️ Context is not JSON, trying markdown fallback...');
            // Fallback to markdown parsing if needed
            const markdownTable = parseMarkdownForStudent(contextData);
            if (markdownTable) {
                setTableStructure(markdownTable);
                createQuestionMapping(markdownTable, questions);
            }
        }
    }, [contextData, questions]);

    // ✅ Create mapping between table questions and actual questions
    const createQuestionMapping = (tableStruct, questionList) => {
        const mapping = {};

        // Map table questions to actual question objects
        tableStruct.questions.forEach(tableQ => {
            const actualQuestion = questionList.find(q =>
                q.questionNumber === tableQ.questionNumber ||
                q.orderInTest === tableQ.questionNumber
            );

            if (actualQuestion) {
                mapping[tableQ.questionNumber] = {
                    questionId: actualQuestion.id,
                    questionNumber: tableQ.questionNumber,
                    position: tableQ.position,
                    correctAnswer: tableQ.correctAnswer,
                    actualQuestion: actualQuestion
                };
            }
        });

        console.log('📋 Question mapping created:', Object.keys(mapping).length, 'mapped');
        setQuestionMapping(mapping);
    };

    // ✅ Fallback markdown parser (for backward compatibility)
    const parseMarkdownForStudent = (markdown) => {
        try {
            const lines = markdown.split('\n').filter(line => line.trim());
            let title = '';
            let tableLines = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line && !line.includes('|') && !line.includes('-')) {
                    title = line;
                } else if (line.includes('|') && !line.includes('---')) {
                    const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
                    tableLines.push(cells);
                }
            }

            if (tableLines.length === 0) return null;

            // Convert to JSON structure
            const structure = {
                id: 'markdown_table',
                type: 'ielts_table_completion',
                title: title || 'Table Completion',
                structure: {
                    rows: tableLines.length,
                    columns: tableLines[0].length,
                    hasHeaders: true
                },
                data: tableLines,
                styling: {
                    columnWidths: Array(tableLines[0].length).fill(120),
                    rowHeights: Array(tableLines.length).fill(35)
                },
                questions: []
            };

            // Extract questions from markdown
            tableLines.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    const match = cell.match(/___(\d+)___/);
                    if (match) {
                        structure.questions.push({
                            questionNumber: parseInt(match[1]),
                            position: { row: rowIndex, col: colIndex },
                            placeholder: match[0]
                        });
                    }
                });
            });

            return structure;
        } catch (error) {
            console.error('❌ Error parsing markdown for student:', error);
            return null;
        }
    };

    // ✅ Handle answer change
    const handleAnswerChange = (questionNumber, value) => {
        const mapping = questionMapping[questionNumber];
        if (mapping && onAnswerChange) {
            onAnswerChange(mapping.questionId, value);
        }
    };

    // ✅ Get user answer for question
    const getUserAnswer = (questionNumber) => {
        const mapping = questionMapping[questionNumber];
        if (mapping) {
            return userAnswers[mapping.questionId] || '';
        }
        return '';
    };

    // ✅ Check if answer is correct (for results view)
    const isAnswerCorrect = (questionNumber) => {
        if (!showResults) return null;

        const mapping = questionMapping[questionNumber];
        if (!mapping) return null;

        const userAnswer = getUserAnswer(questionNumber);
        const correctAnswer = mapping.correctAnswer || mapping.actualQuestion?.correctAnswer;

        if (!userAnswer || !correctAnswer) return null;

        // Normalize answers for comparison
        const normalizedUser = userAnswer.toLowerCase().trim();
        const normalizedCorrect = correctAnswer.toLowerCase().trim();

        return normalizedUser === normalizedCorrect;
    };

    // ✅ Render table cell content
    const renderTableCell = (cell, rowIndex, colIndex) => {
        // Check if this cell contains a question
        const questionMatch = cell.match(/___(\d+)___/);

        if (questionMatch) {
            const questionNumber = parseInt(questionMatch[1]);
            const mapping = questionMapping[questionNumber];
            const userAnswer = getUserAnswer(questionNumber);
            const isCorrect = isAnswerCorrect(questionNumber);

            return (
                <div className="table-question-cell">
                    <div className="question-number-badge">
                        {questionNumber}
                    </div>
                    <input
                        type="text"
                        className={`table-question-input ${
                            showResults
                                ? isCorrect === true ? 'correct'
                                    : isCorrect === false ? 'incorrect'
                                        : 'neutral'
                                : ''
                        }`}
                        placeholder={`Answer ${questionNumber}`}
                        value={userAnswer}
                        onChange={(e) => handleAnswerChange(questionNumber, e.target.value)}
                        disabled={isSubmitted}
                        maxLength={50}
                    />
                    {showResults && mapping && (
                        <div className="answer-feedback">
                            {isCorrect === true && <span className="correct-mark">✓</span>}
                            {isCorrect === false && (
                                <div className="correction">
                                    <span className="incorrect-mark">✗</span>
                                    <div className="correct-answer">
                                        Correct: {mapping.correctAnswer || mapping.actualQuestion?.correctAnswer}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        } else {
            // Regular data cell
            return (
                <div className="table-data-cell">
                    {cell}
                </div>
            );
        }
    };

    // ✅ Calculate completion stats
    const getCompletionStats = () => {
        const totalQuestions = Object.keys(questionMapping).length;
        const answeredQuestions = Object.keys(questionMapping).filter(qNum =>
            getUserAnswer(parseInt(qNum)).trim() !== ''
        ).length;

        return { total: totalQuestions, answered: answeredQuestions };
    };

    if (!tableStructure) {
        return (
            <div className="table-loading">
                <div className="loading-message">
                    📊 Loading table...
                </div>
            </div>
        );
    }

    const stats = getCompletionStats();

    return (
        <div className="table-completion-renderer">
            {/* Table header */}
            <div className="table-header">
                <h4 className="table-title">{tableStructure.title}</h4>
                <div className="completion-stats">
                    <span className="stats-badge">
                        {stats.answered}/{stats.total} completed
                    </span>
                    {showResults && (
                        <span className="results-badge">
                            📊 Results View
                        </span>
                    )}
                </div>
            </div>

            {/* Instructions */}
            {tableStructure.instructions && (
                <div className="table-instructions">
                    <div className="instructions-icon">📋</div>
                    <div className="instructions-text">
                        {tableStructure.instructions}
                    </div>
                </div>
            )}

            {/* Main table */}
            <div className="table-container">
                <table className="completion-table">
                    {tableStructure.structure.hasHeaders && (
                        <thead>
                        <tr>
                            {tableStructure.data[0]?.map((header, colIndex) => (
                                <th
                                    key={colIndex}
                                    className="table-header-cell"
                                    style={{
                                        width: `${tableStructure.styling.columnWidths[colIndex]}px`,
                                        minWidth: '100px'
                                    }}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                        </thead>
                    )}
                    <tbody>
                    {tableStructure.data.slice(tableStructure.structure.hasHeaders ? 1 : 0).map((row, rowIndex) => (
                        <tr key={rowIndex} className="table-row">
                            {row.map((cell, colIndex) => (
                                <td
                                    key={colIndex}
                                    className="table-cell"
                                    style={{
                                        width: `${tableStructure.styling.columnWidths[colIndex]}px`,
                                        minWidth: '100px'
                                    }}
                                >
                                    {renderTableCell(cell, rowIndex + (tableStructure.structure.hasHeaders ? 1 : 0), colIndex)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Progress indicator */}
            <div className="progress-indicator">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{
                            width: `${stats.total > 0 ? (stats.answered / stats.total) * 100 : 0}%`
                        }}
                    ></div>
                </div>
                <div className="progress-text">
                    {stats.answered} of {stats.total} questions answered
                </div>
            </div>

            {/* Question summary (for mobile/accessibility) */}
            <div className="question-summary">
                <details>
                    <summary>📱 Question List (Mobile View)</summary>
                    <div className="question-list">
                        {Object.entries(questionMapping).map(([qNum, mapping]) => {
                            const userAnswer = getUserAnswer(parseInt(qNum));
                            const isCorrect = isAnswerCorrect(parseInt(qNum));

                            return (
                                <div key={qNum} className="question-item">
                                    <div className="question-header">
                                        <span className="question-number">Question {qNum}</span>
                                        <span className={`status-indicator ${
                                            showResults
                                                ? isCorrect === true ? 'correct'
                                                    : isCorrect === false ? 'incorrect'
                                                        : 'neutral'
                                                : userAnswer ? 'answered' : 'unanswered'
                                        }`}>
                                            {showResults
                                                ? isCorrect === true ? '✓'
                                                    : isCorrect === false ? '✗'
                                                        : '○'
                                                : userAnswer ? '●' : '○'
                                            }
                                        </span>
                                    </div>
                                    <div className="question-content">
                                        <input
                                            type="text"
                                            className="mobile-question-input"
                                            placeholder={`Answer ${qNum}`}
                                            value={userAnswer}
                                            onChange={(e) => handleAnswerChange(parseInt(qNum), e.target.value)}
                                            disabled={isSubmitted}
                                        />
                                        {showResults && isCorrect === false && mapping.correctAnswer && (
                                            <div className="mobile-correction">
                                                Correct answer: <strong>{mapping.correctAnswer}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </details>
            </div>

            {/* Debug info (development only) */}
            {process.env.NODE_ENV === 'development' && (
                <details className="debug-info">
                    <summary>🔧 Debug Info</summary>
                    <div style={{ fontSize: '12px', background: '#f8f9fa', padding: '10px', marginTop: '10px' }}>
                        <div><strong>Table Structure:</strong></div>
                        <div>Type: {tableStructure.type}</div>
                        <div>Dimensions: {tableStructure.structure.rows}×{tableStructure.structure.columns}</div>
                        <div>Questions: {tableStructure.questions.length}</div>
                        <div>Question Mapping: {Object.keys(questionMapping).length} mapped</div>
                        <div><strong>User Answers:</strong> {JSON.stringify(userAnswers, null, 2)}</div>
                    </div>
                </details>
            )}
        </div>
    );
};

export default TableCompletionRenderer;