// =====================================
// SimpleTableEditor.js - Replacement for EnhancedVisualTableEditor
// Intuitive one-click table builder for IELTS
// =====================================

import React, { useState, useEffect } from 'react';

const TableEditor = ({
                               context,
                               onContextChange,
                               questionCounter,
                               setQuestionCounter
                           }) => {
    const [tableData, setTableData] = useState([
        ['Course Name', 'Duration', 'Price', 'Start Date'],
        ['Basic English', '6 weeks', '$200', 'March 15'],
        ['Advanced Writing', '8 weeks', '$300', 'April 1'],
        ['Business English', '12 weeks', '$450', 'April 20']
    ]);

    const [questions, setQuestions] = useState({});
    const [tableTitle, setTableTitle] = useState('Course Information');
    const [instructions, setInstructions] = useState('Complete the table below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.');
    const [isPreview, setIsPreview] = useState(false);

    // ✅ Load from existing context
    useEffect(() => {
        if (context && context.trim()) {
            loadFromContext(context);
        }
    }, [context]);

    // ✅ Parse context từ DB (JSON hoặc markdown)
    const loadFromContext = (contextData) => {
        try {
            const parsed = JSON.parse(contextData);
            if (parsed.type === 'ielts_table_completion') {
                console.log('✅ Loading SimpleTableEditor from JSON structure');
                setTableData(parsed.data || tableData);
                setTableTitle(parsed.title || 'Course Information');
                setInstructions(parsed.instructions || instructions);

                // Recreate questions mapping
                const questionsMap = {};
                if (parsed.questions) {
                    parsed.questions.forEach(q => {
                        const cellKey = `${q.position.row}-${q.position.col}`;
                        questionsMap[cellKey] = {
                            questionNumber: q.questionNumber,
                            originalValue: q.correctAnswer || '',
                            correctAnswer: q.correctAnswer || '',
                            alternatives: q.alternativeAnswers || ''
                        };
                    });
                }
                setQuestions(questionsMap);

                // Update counter
                const maxQ = parsed.questions ? Math.max(...parsed.questions.map(q => q.questionNumber), 0) : 0;
                setQuestionCounter(maxQ + 1);
                return;
            }
        } catch (e) {
            // Try markdown fallback
            console.log('⚠️ SimpleTableEditor: Trying markdown fallback');
            parseMarkdown(contextData);
        }
    };

    // ✅ Parse markdown (backward compatibility)
    const parseMarkdown = (markdown) => {
        const lines = markdown.split('\n').filter(l => l.trim());
        let title = '';
        let tableLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.includes('|') && !line.includes('-')) {
                title = line;
            } else if (line.includes('|') && !line.includes('---')) {
                const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
                tableLines.push(cells);
            }
        }

        if (tableLines.length > 0) {
            setTableData(tableLines);
            setTableTitle(title || 'Table Completion');

            // Extract questions
            const questionsMap = {};
            let maxQuestionNum = 0;

            tableLines.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    const match = cell.match(/___(\d+)___/);
                    if (match) {
                        const qNum = parseInt(match[1]);
                        questionsMap[`${rowIndex}-${colIndex}`] = {
                            questionNumber: qNum,
                            originalValue: '',
                            correctAnswer: '',
                            alternatives: ''
                        };
                        maxQuestionNum = Math.max(maxQuestionNum, qNum);
                    }
                });
            });

            setQuestions(questionsMap);
            setQuestionCounter(maxQuestionNum + 1);
        }
    };

    // ✅ Generate JSON structure for DB
    const generateContextForDB = () => {
        const structure = {
            id: `table_${Date.now()}`,
            type: 'ielts_table_completion',
            title: tableTitle,
            instructions: instructions,
            metadata: {
                createdAt: new Date().toISOString(),
                questionType: 'TABLE_COMPLETION',
                version: '2.0'
            },
            structure: {
                rows: tableData.length,
                columns: tableData[0]?.length || 0,
                hasHeaders: true,
                headerRowCount: 1
            },
            data: tableData,
            styling: {
                columnWidths: Array(tableData[0]?.length || 0).fill(120),
                rowHeights: Array(tableData.length).fill(35),
                theme: 'ielts-standard'
            },
            questions: Object.entries(questions).map(([cellKey, question]) => {
                const [row, col] = cellKey.split('-').map(Number);
                return {
                    questionNumber: question.questionNumber,
                    position: { row, col },
                    correctAnswer: question.correctAnswer,
                    alternativeAnswers: question.alternatives,
                    placeholder: `___${question.questionNumber}___`,
                    createdAt: new Date().toISOString()
                };
            })
        };

        return JSON.stringify(structure, null, 2);
    };

    // ✅ Auto-save to parent
    useEffect(() => {
        const timer = setTimeout(() => {
            if (onContextChange) {
                const contextJson = generateContextForDB();
                console.log('🔄 SimpleTableEditor auto-saving context...');
                onContextChange(contextJson);
            }
        }, 1000); // Debounce 1s

        return () => clearTimeout(timer);
    }, [tableData, questions, tableTitle, instructions]);

    // ✅ Toggle question
    const toggleQuestion = (rowIndex, colIndex) => {
        if (rowIndex === 0) return; // No questions in header

        const cellKey = `${rowIndex}-${colIndex}`;

        if (questions[cellKey]) {
            // Remove question - restore original value
            const newTableData = [...tableData];
            newTableData[rowIndex][colIndex] = questions[cellKey].originalValue;
            setTableData(newTableData);

            const newQuestions = { ...questions };
            delete newQuestions[cellKey];
            setQuestions(newQuestions);
        } else {
            // Create question
            const originalValue = tableData[rowIndex][colIndex];
            const questionNum = questionCounter;

            setQuestions(prev => ({
                ...prev,
                [cellKey]: {
                    questionNumber: questionNum,
                    originalValue: originalValue,
                    correctAnswer: originalValue,
                    alternatives: ''
                }
            }));

            const newTableData = [...tableData];
            newTableData[rowIndex][colIndex] = `___${questionNum}___`;
            setTableData(newTableData);
            setQuestionCounter(prev => prev + 1);
        }
    };

    // ✅ Update cell
    const updateCell = (rowIndex, colIndex, value) => {
        const newTableData = [...tableData];
        newTableData[rowIndex][colIndex] = value;
        setTableData(newTableData);
    };

    // ✅ Update question
    const updateQuestion = (cellKey, field, value) => {
        setQuestions(prev => ({
            ...prev,
            [cellKey]: {
                ...prev[cellKey],
                [field]: value
            }
        }));
    };

    // ✅ Table operations
    const addRow = () => setTableData([...tableData, Array(tableData[0].length).fill('')]);
    const addColumn = () => setTableData(tableData.map(row => [...row, '']));

    const removeRow = (index) => {
        if (tableData.length <= 2) return;
        setTableData(tableData.filter((_, i) => i !== index));
    };

    const removeColumn = (index) => {
        if (tableData[0].length <= 2) return;
        setTableData(tableData.map(row => row.filter((_, i) => i !== index)));
    };

    // ✅ Helper functions
    const isQuestion = (rowIndex, colIndex) => {
        return questions[`${rowIndex}-${colIndex}`] !== undefined;
    };

    const getQuestionCount = () => Object.keys(questions).length;

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
        }}>

            {/* Header */}
            <div style={{
                background: 'linear-gradient(90deg, #eff6ff 0%, #e0e7ff 100%)',
                padding: '16px',
                borderBottom: '1px solid #e5e7eb'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <input
                            type="text"
                            value={tableTitle}
                            onChange={(e) => setTableTitle(e.target.value)}
                            style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: '#1f2937',
                                width: '100%'
                            }}
                            placeholder="Table title..."
                        />
                        <p style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            margin: '4px 0 0 0'
                        }}>
                            {getQuestionCount()} questions • {tableData.length - 1} rows • {tableData[0].length} columns
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setIsPreview(!isPreview)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                background: isPreview ? '#3b82f6' : '#f3f4f6',
                                color: isPreview ? 'white' : '#374151',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            👁️ {isPreview ? 'Edit Mode' : 'Preview'}
                        </button>

                        <button
                            onClick={addRow}
                            style={{
                                padding: '8px 12px',
                                background: '#dcfce7',
                                color: '#166534',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                            title="Add row"
                        >
                            + Row
                        </button>

                        <button
                            onClick={addColumn}
                            style={{
                                padding: '8px 12px',
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                            title="Add column"
                        >
                            + Col
                        </button>
                    </div>
                </div>
            </div>

            {isPreview ? (
                // ✅ Preview Mode
                <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                            {tableTitle}
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>
                            {instructions}
                        </p>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            border: '1px solid #d1d5db'
                        }}>
                            <thead>
                            <tr style={{ background: '#f9fafb' }}>
                                {tableData[0]?.map((header, index) => (
                                    <th key={index} style={{
                                        border: '1px solid #d1d5db',
                                        padding: '12px',
                                        textAlign: 'left',
                                        fontWeight: '600'
                                    }}>
                                        {header}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {tableData.slice(1).map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, colIndex) => (
                                        <td key={colIndex} style={{
                                            border: '1px solid #d1d5db',
                                            padding: '12px'
                                        }}>
                                            {isQuestion(rowIndex + 1, colIndex) ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{
                                                            background: '#3b82f6',
                                                            color: 'white',
                                                            fontSize: '12px',
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {questions[`${rowIndex + 1}-${colIndex}`]?.questionNumber}
                                                        </span>
                                                    <input
                                                        type="text"
                                                        style={{
                                                            flex: 1,
                                                            padding: '8px',
                                                            border: '1px solid #d1d5db',
                                                            borderRadius: '4px'
                                                        }}
                                                        placeholder="Your answer..."
                                                    />
                                                </div>
                                            ) : (
                                                cell
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // ✅ Edit Mode
                <div>
                    {/* Instructions Editor */}
                    <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '8px'
                        }}>
                            Instructions:
                        </label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                resize: 'none',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                            rows={2}
                        />
                    </div>

                    {/* Table Editor */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ background: '#f9fafb' }}>
                                <th style={{ width: '48px', padding: '8px' }}></th>
                                {tableData[0]?.map((_, colIndex) => (
                                    <th key={colIndex} style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                            <span>Col {colIndex + 1}</span>
                                            {tableData[0].length > 2 && (
                                                <button
                                                    onClick={() => removeColumn(colIndex)}
                                                    style={{
                                                        padding: '2px',
                                                        color: '#ef4444',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        borderRadius: '2px'
                                                    }}
                                                    title="Delete column"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                            </thead>

                            <tbody>
                            {tableData.map((row, rowIndex) => (
                                <tr key={rowIndex} style={{
                                    background: rowIndex === 0 ? '#eff6ff' : undefined
                                }}>

                                    {/* Row controls */}
                                    <td style={{
                                        padding: '8px',
                                        background: '#f9fafb',
                                        textAlign: 'center',
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        borderRight: '1px solid #e5e7eb'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <span>{rowIndex === 0 ? 'H' : rowIndex}</span>
                                            {rowIndex > 0 && tableData.length > 2 && (
                                                <button
                                                    onClick={() => removeRow(rowIndex)}
                                                    style={{
                                                        padding: '2px',
                                                        color: '#ef4444',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '10px'
                                                    }}
                                                    title="Delete row"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* Table cells */}
                                    {row.map((cell, colIndex) => (
                                        <td key={colIndex} style={{
                                            padding: '4px',
                                            borderLeft: '1px solid #e5e7eb',
                                            position: 'relative'
                                        }}>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    value={cell}
                                                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        border: '2px solid',
                                                        borderColor: isQuestion(rowIndex, colIndex)
                                                            ? '#fb923c'
                                                            : rowIndex === 0
                                                                ? '#93c5fd'
                                                                : '#d1d5db',
                                                        borderRadius: '8px',
                                                        background: isQuestion(rowIndex, colIndex)
                                                            ? '#fff7ed'
                                                            : rowIndex === 0
                                                                ? '#eff6ff'
                                                                : 'white',
                                                        color: isQuestion(rowIndex, colIndex)
                                                            ? '#ea580c'
                                                            : rowIndex === 0
                                                                ? '#1d4ed8'
                                                                : '#111827',
                                                        fontWeight: isQuestion(rowIndex, colIndex) || rowIndex === 0 ? '500' : 'normal',
                                                        outline: 'none',
                                                        fontSize: '14px'
                                                    }}
                                                    placeholder={rowIndex === 0 ? 'Header...' : 'Data...'}
                                                    disabled={isQuestion(rowIndex, colIndex)}
                                                />

                                                {/* Question toggle button */}
                                                {rowIndex > 0 && (
                                                    <button
                                                        onClick={() => toggleQuestion(rowIndex, colIndex)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '4px',
                                                            right: '4px',
                                                            padding: '4px',
                                                            borderRadius: '4px',
                                                            border: 'none',
                                                            background: isQuestion(rowIndex, colIndex)
                                                                ? '#ea580c'
                                                                : '#9ca3af',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            fontSize: '10px',
                                                            opacity: isQuestion(rowIndex, colIndex) ? 1 : 0,
                                                            transition: 'opacity 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.opacity = 1}
                                                        onMouseLeave={(e) => {
                                                            if (!isQuestion(rowIndex, colIndex)) {
                                                                e.target.style.opacity = 0;
                                                            }
                                                        }}
                                                        title={isQuestion(rowIndex, colIndex) ? 'Remove question' : 'Make this a question'}
                                                    >
                                                        🎯
                                                    </button>
                                                )}

                                                {/* Question number badge */}
                                                {isQuestion(rowIndex, colIndex) && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-8px',
                                                        left: '-8px',
                                                        background: '#ea580c',
                                                        color: 'white',
                                                        fontSize: '12px',
                                                        borderRadius: '50%',
                                                        width: '24px',
                                                        height: '24px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 'bold',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }}>
                                                        {questions[`${rowIndex}-${colIndex}`]?.questionNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Question Details Panel */}
                    {getQuestionCount() > 0 && (
                        <div style={{
                            padding: '16px',
                            borderTop: '1px solid #e5e7eb',
                            background: '#fafafa'
                        }}>
                            <h4 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                marginBottom: '12px',
                                color: '#374151'
                            }}>
                                Questions ({getQuestionCount()})
                            </h4>

                            <div style={{
                                display: 'grid',
                                gap: '12px',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {Object.entries(questions).map(([cellKey, question]) => (
                                    <div key={cellKey} style={{
                                        border: '1px solid #fb923c',
                                        background: '#fff7ed',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '8px'
                                        }}>
                                            <span style={{
                                                fontWeight: '600',
                                                color: '#ea580c'
                                            }}>
                                                Q{question.questionNumber}
                                            </span>
                                            <span style={{
                                                fontSize: '12px',
                                                color: '#ea580c'
                                            }}>
                                                Cell {cellKey}
                                            </span>
                                        </div>

                                        <div style={{ display: 'grid', gap: '8px' }}>
                                            <div>
                                                <label style={{
                                                    fontSize: '12px',
                                                    color: '#6b7280',
                                                    display: 'block',
                                                    marginBottom: '4px'
                                                }}>
                                                    Correct Answer:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={question.correctAnswer}
                                                    onChange={(e) => updateQuestion(cellKey, 'correctAnswer', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '6px 8px',
                                                        fontSize: '14px',
                                                        border: '1px solid #fb923c',
                                                        borderRadius: '4px',
                                                        outline: 'none'
                                                    }}
                                                    placeholder="Enter correct answer..."
                                                />
                                            </div>

                                            <div>
                                                <label style={{
                                                    fontSize: '12px',
                                                    color: '#6b7280',
                                                    display: 'block',
                                                    marginBottom: '4px'
                                                }}>
                                                    Alternatives (optional):
                                                </label>
                                                <input
                                                    type="text"
                                                    value={question.alternatives}
                                                    onChange={(e) => updateQuestion(cellKey, 'alternatives', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '6px 8px',
                                                        fontSize: '14px',
                                                        border: '1px solid #fb923c',
                                                        borderRadius: '4px',
                                                        outline: 'none'
                                                    }}
                                                    placeholder="alt1, alt2, alt3..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div style={{
                padding: '12px 16px',
                background: '#f9fafb',
                borderTop: '1px solid #e5e7eb',
                fontSize: '12px',
                color: '#6b7280',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <span>
                    📊 {tableData.length}×{tableData[0]?.length} table • {getQuestionCount()} questions
                </span>
                <span>
                    Auto-saving...
                </span>
            </div>
        </div>
    );
};

export default TableEditor;