// =====================================
// Final ListeningQuestionBuilder.js - Context as Hint + Beautiful Design
// =====================================

import React, { useState, useEffect, useRef } from 'react';
import './ListeningQuestionBuilder.css';

const LISTENING_QUESTION_TYPES = [
    {
        id: 'note_completion',
        name: 'Note Completion',
        description: 'Hoàn thành ghi chú',
        defaultCount: 6,
        type: 'FILL_IN_THE_BLANK',
        subType: 'NOTE_COMPLETION',
        instructions: 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        requiresContext: true,
        contextTemplate: `Notes on Adult Education Classes

Number of classes per week: 7
Tuesday:
___1___ 6-7.30 pm
—Limited space: no more than ___2___ participants
Book Club
—Must read ___3___ books
___4___ Group
—Learn about local events last century

Wednesday:
Scrabble Club ___5___
—popular

Thursday:
Chess Night
—serious
___6___
—For special occasions`
    },
    {
        id: 'form_filling',
        name: 'Form Filling',
        description: 'Điền thông tin vào biểu mẫu',
        defaultCount: 8,
        type: 'FILL_IN_THE_BLANK',
        subType: 'FORM_FILLING',
        instructions: 'Complete the form below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.',
        requiresContext: true,
        contextTemplate: `REGISTRATION FORM

Name: ___1___
Age: ___2___
Occupation: ___3___
Address: ___4___
Phone: ___5___
Email: ___6___
Emergency contact: ___7___
Special requirements: ___8___`
    },
    {
        id: 'table_completion',
        name: 'Table Completion',
        description: 'Hoàn thành bảng',
        defaultCount: 5,
        type: 'FILL_IN_THE_BLANK',
        subType: 'TABLE_COMPLETION',
        instructions: 'Complete the table below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.',
        requiresContext: true,
        contextTemplate: `Course Information

| Course Name | Duration | Price | Start Date |
|-------------|----------|-------|------------|
| ___1___ | 6 weeks | ___2___ | March 15 |
| Advanced | ___3___ | $300 | ___4___ |
| Professional | 12 weeks | ___5___ | April 20 |`
    },
    {
        id: 'plan_map_completion',
        name: 'Plan/Map Completion',
        description: 'Hoàn thành sơ đồ/bản đồ',
        defaultCount: 4,
        type: 'FILL_IN_THE_BLANK',
        subType: 'PLAN_MAP_COMPLETION',
        instructions: 'Complete the labels on the plan below. Write NO MORE THAN TWO WORDS for each answer.',
        requiresContext: true,
        contextTemplate: `LIBRARY FLOOR PLAN

Entrance
   ↓
___1___
   ↓
Main Hall
   ↓
___2___ ← Reading Area → ___3___
   ↓
Computer Section
   ↓
___4___`
    },
    {
        id: 'mcq_listening',
        name: 'Multiple Choice',
        description: 'Câu hỏi trắc nghiệm',
        defaultCount: 5,
        type: 'MCQ',
        subType: 'MCQ',
        instructions: 'Choose the correct letter, A, B or C.',
        requiresContext: false
    },
    {
        id: 'matching_listening',
        name: 'Matching',
        description: 'Nối thông tin',
        defaultCount: 6,
        type: 'MATCHING',
        subType: 'MATCHING',
        instructions: 'Match each speaker with the correct statement. Write the correct letter, A-H, next to questions.',
        requiresContext: false
    },
    {
        id: 'short_answer_listening',
        name: 'Short Answer',
        description: 'Câu trả lời ngắn',
        defaultCount: 3,
        type: 'SHORT_ANSWER',
        subType: 'SHORT_ANSWER',
        instructions: 'Answer the questions below. Write NO MORE THAN THREE WORDS for each answer.',
        requiresContext: false
    },
    {
        id: 'flexible_context',
        name: 'Flexible Context',
        description: 'Tự tạo context từ bất kỳ văn bản nào',
        defaultCount: 0,
        type: 'FILL_IN_THE_BLANK',
        subType: 'FLEXIBLE_CONTEXT',
        instructions: 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        requiresContext: true,
        contextTemplate: ''
    }
];

const ListeningQuestionBuilder = ({
                                      questionSets,
                                      setQuestionSets,
                                      audioFields,
                                      watch,
                                      expandedQuestionSet,
                                      setExpandedQuestionSet
                                  }) => {
    const [selectedText, setSelectedText] = useState({});
    const [selectionRange, setSelectionRange] = useState({});
    const textareaRefs = useRef({});

    const getNextQuestionNumber = () => {
        let maxNumber = 0;
        questionSets.forEach(set => {
            set.questions.forEach(q => {
                if (q.questionNumber > maxNumber) {
                    maxNumber = q.questionNumber;
                }
            });
        });
        return maxNumber + 1;
    };

    const extractQuestionTextFromContext = (context, questionNumber, selectedText) => {
        const parts = context.split(/___(\d+)___/);
        let questionText = '';

        for (let i = 0; i < parts.length; i += 2) {
            if (i + 1 < parts.length) {
                const number = parseInt(parts[i + 1]);
                if (number === questionNumber) {
                    const beforeText = parts[i].trim();
                    const beforeLines = beforeText.split('\n');
                    const lastLine = beforeLines[beforeLines.length - 1] || beforeLines[beforeLines.length - 2] || '';
                    const afterText = parts[i + 2] ? parts[i + 2].trim().split('\n')[0] : '';

                    if (lastLine.length > 0) {
                        questionText = lastLine.slice(-80) + ' ___' + questionNumber + '___';
                        if (afterText.length > 0) {
                            questionText += ' ' + afterText.slice(0, 30);
                        }
                    } else {
                        questionText = `Question ${questionNumber}: Complete the gap with "${selectedText}"`;
                    }
                    break;
                }
            }
        }

        return questionText.trim();
    };

    const extractQuestionsFromContext = (contextText, setId) => {
        const questionMatches = contextText.match(/___(\d+)___/g) || [];
        const extractedQuestions = questionMatches.map(match => {
            const number = parseInt(match.replace(/___/g, ''));
            const questionText = extractQuestionTextFromContext(contextText, number, `[Answer ${number}]`);

            return {
                id: `q_${setId}_${number}`,
                questionNumber: number,
                questionText: questionText,
                questionType: 'FILL_IN_THE_BLANK',
                options: [],
                correctAnswer: '',
                explanation: '',
                alternativeAnswers: '',
                context: contextText
            };
        });

        return extractedQuestions.sort((a, b) => a.questionNumber - b.questionNumber);
    };

    const autoDetectQuestions = (setId, context) => {
        let newContext = context;
        let questionCounter = 1;
        const detectedQuestions = [];

        newContext = newContext.replace(/\*\*(\d+)\*\*/g, (match, number) => {
            detectedQuestions.push({
                id: `q_${setId}_${questionCounter}`,
                questionNumber: questionCounter,
                questionText: '',
                questionType: 'FILL_IN_THE_BLANK',
                options: [],
                correctAnswer: '',
                explanation: '',
                alternativeAnswers: '',
                context: newContext
            });
            return `___${questionCounter++}___`;
        });

        newContext = newContext.replace(/__(\d+)__/g, (match, number) => {
            detectedQuestions.push({
                id: `q_${setId}_${questionCounter}`,
                questionNumber: questionCounter,
                questionText: '',
                questionType: 'FILL_IN_THE_BLANK',
                options: [],
                correctAnswer: '',
                explanation: '',
                alternativeAnswers: '',
                context: newContext
            });
            return `___${questionCounter++}___`;
        });

        newContext = newContext.replace(/_{3,}|\.{3,}|-{3,}/g, () => {
            detectedQuestions.push({
                id: `q_${setId}_${questionCounter}`,
                questionNumber: questionCounter,
                questionText: '',
                questionType: 'FILL_IN_THE_BLANK',
                options: [],
                correctAnswer: '',
                explanation: '',
                alternativeAnswers: '',
                context: newContext
            });
            return `___${questionCounter++}___`;
        });

        return { newContext, detectedQuestions };
    };

    const addQuestionSet = (setType) => {
        const newSetId = `set_${Date.now()}`;
        let questionsInSet = [];
        let defaultContext = '';

        if (setType.requiresContext) {
            if (setType.contextTemplate) {
                defaultContext = setType.contextTemplate;
                questionsInSet = extractQuestionsFromContext(setType.contextTemplate, newSetId);
            } else {
                defaultContext = '';
                questionsInSet = [];
            }
        } else {
            questionsInSet = Array(setType.defaultCount).fill(0).map((_, idx) => ({
                id: `q_${newSetId}_${idx}`,
                questionNumber: idx + 1,
                questionText: '',
                questionType: setType.type,
                options: setType.type === 'MCQ' ? ['', '', '', ''] : [],
                correctAnswer: setType.type === 'MCQ' ? 'A' : '',
                explanation: '',
                alternativeAnswers: '',
                context: ''
            }));
        }

        const newSet = {
            id: newSetId,
            name: setType.name,
            type: setType.type,
            subType: setType.subType,
            questions: questionsInSet,
            audioId: null,
            instructions: setType.instructions,
            context: defaultContext,
            startQuestionNumber: getNextQuestionNumber(),
            requiresContext: setType.requiresContext || false
        };

        setQuestionSets([...questionSets, newSet]);
        setExpandedQuestionSet(newSetId);
    };

    const handleTextSelection = (setId) => {
        const textarea = textareaRefs.current[setId];
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const set = questionSets.find(s => s.id === setId);
        if (!set) return;

        const selectedTextValue = set.context.substring(start, end);

        if (selectedTextValue.trim() && start !== end) {
            setSelectedText(prev => ({ ...prev, [setId]: selectedTextValue }));
            setSelectionRange(prev => ({ ...prev, [setId]: { start, end } }));
        } else {
            setSelectedText(prev => ({ ...prev, [setId]: '' }));
        }
    };

    const convertToQuestion = (setId) => {
        const set = questionSets.find(s => s.id === setId);
        const selection = selectedText[setId];
        const range = selectionRange[setId];

        if (!set || !selection?.trim() || !range) {
            alert('Vui lòng chọn text để chuyển thành câu hỏi!');
            return;
        }

        const existingNumbers = (set.context.match(/___(\d+)___/g) || [])
            .map(match => parseInt(match.replace(/___/g, '')))
            .sort((a, b) => a - b);

        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        const placeholder = `___${nextNumber}___`;

        const newContext =
            set.context.substring(0, range.start) +
            placeholder +
            set.context.substring(range.end);

        const questionText = extractQuestionTextFromContext(newContext, nextNumber, selection.trim());

        const newQuestion = {
            id: `q_${setId}_${nextNumber}`,
            questionNumber: nextNumber,
            questionText: questionText,
            questionType: 'FILL_IN_THE_BLANK',
            options: [],
            correctAnswer: selection.trim(),
            explanation: '',
            alternativeAnswers: '',
            context: newContext
        };

        const updatedSets = questionSets.map(s => {
            if (s.id === setId) {
                return {
                    ...s,
                    context: newContext,
                    questions: [...s.questions, newQuestion].sort((a, b) => a.questionNumber - b.questionNumber)
                };
            }
            return s;
        });

        setQuestionSets(updatedSets);
        setSelectedText(prev => ({ ...prev, [setId]: '' }));
        setSelectionRange(prev => ({ ...prev, [setId]: { start: 0, end: 0 } }));
    };

    const addQuestionPlaceholder = (setId) => {
        const textarea = textareaRefs.current[setId];
        const set = questionSets.find(s => s.id === setId);
        if (!textarea || !set) return;

        const start = textarea.selectionStart;
        const existingNumbers = (set.context.match(/___(\d+)___/g) || [])
            .map(match => parseInt(match.replace(/___/g, '')))
            .sort((a, b) => a - b);

        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        const placeholder = `___${nextNumber}___`;

        const newContext = set.context.substring(0, start) + placeholder + set.context.substring(start);

        const newQuestion = {
            id: `q_${setId}_${nextNumber}`,
            questionNumber: nextNumber,
            questionText: '',
            questionType: 'FILL_IN_THE_BLANK',
            options: [],
            correctAnswer: '',
            explanation: '',
            alternativeAnswers: '',
            context: newContext
        };

        const updatedSets = questionSets.map(s => {
            if (s.id === setId) {
                return {
                    ...s,
                    context: newContext,
                    questions: [...s.questions, newQuestion].sort((a, b) => a.questionNumber - b.questionNumber)
                };
            }
            return s;
        });

        setQuestionSets(updatedSets);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
        }, 10);
    };

    // Các hàm CRUD khác
    const removeQuestionSet = (setId) => {
        const updatedSets = questionSets.filter(set => set.id !== setId);
        setQuestionSets(updatedSets);
        if (expandedQuestionSet === setId) {
            setExpandedQuestionSet(null);
        }
    };

    const toggleExpandSet = (setId) => {
        setExpandedQuestionSet(expandedQuestionSet === setId ? null : setId);
    };

    const updateQuestionSetContext = (setId, context) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const extracted = extractQuestionsFromContext(context, setId);
                return {
                    ...set,
                    context,
                    questions: extracted.length > 0 ? extracted : set.questions
                };
            }
            return set;
        });
        setQuestionSets(updatedSets);
    };

    const updateQuestionSetInstructions = (setId, instructions) => {
        const updatedSets = questionSets.map(set =>
            set.id === setId ? { ...set, instructions } : set
        );
        setQuestionSets(updatedSets);
    };

    const updateQuestionSetAudio = (setId, audioId) => {
        const updatedSets = questionSets.map(set =>
            set.id === setId ? { ...set, audioId: audioId || null } : set
        );
        setQuestionSets(updatedSets);
    };

    const addQuestionToSet = (setId) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const newQuestion = {
                    id: `q_${Date.now()}`,
                    questionNumber: getNextQuestionNumber(),
                    questionText: '',
                    questionType: set.type,
                    options: set.type === 'MCQ' ? ['', '', '', ''] : [],
                    correctAnswer: set.type === 'MCQ' ? 'A' : '',
                    explanation: '',
                    context: ''
                };
                return { ...set, questions: [...set.questions, newQuestion] };
            }
            return set;
        });
        setQuestionSets(updatedSets);
    };

    const removeQuestionFromSet = (setId, questionIndex) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const updatedQuestions = [...set.questions];
                updatedQuestions.splice(questionIndex, 1);
                return { ...set, questions: updatedQuestions };
            }
            return set;
        });
        setQuestionSets(updatedSets);
    };

    const updateQuestion = (setId, questionIndex, field, value) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const updatedQuestions = set.questions.map((q, i) =>
                    i === questionIndex ? { ...q, [field]: value } : q
                );
                return { ...set, questions: updatedQuestions };
            }
            return set;
        });
        setQuestionSets(updatedSets);
    };

    const updateQuestionOption = (setId, questionIndex, optionIndex, value) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const updatedQuestions = set.questions.map((q, i) => {
                    if (i === questionIndex) {
                        const newOptions = [...(q.options || [])];
                        newOptions[optionIndex] = value;
                        return { ...q, options: newOptions };
                    }
                    return q;
                });
                return { ...set, questions: updatedQuestions };
            }
            return set;
        });
        setQuestionSets(updatedSets);
    };

    // ✅ CONTEXT EDITOR với HINT styling
    const renderContextEditor = (set) => {
        const selection = selectedText[set.id];

        if (!set.requiresContext) return null;

        return (
            <div className="context-editor-modern">
                <div className="context-header-modern">
                    <div className="header-left">
                        <span className="context-icon">📝</span>
                        <h6 className="context-title">Context Template</h6>
                    </div>
                    <div className="context-actions">
                        {selection && (
                            <button
                                type="button"
                                className="action-btn convert-btn"
                                onClick={() => convertToQuestion(set.id)}
                            >
                                <span className="btn-icon">✨</span>
                                Set as Question
                            </button>
                        )}

                        <button
                            type="button"
                            className="action-btn add-btn"
                            onClick={() => addQuestionPlaceholder(set.id)}
                        >
                            <span className="btn-icon">➕</span>
                            Add Placeholder
                        </button>

                        {set.subType === 'FLEXIBLE_CONTEXT' && (
                            <button
                                type="button"
                                className="action-btn auto-btn"
                                onClick={() => {
                                    const result = autoDetectQuestions(set.id, set.context);
                                    updateQuestionSetContext(set.id, result.newContext);
                                }}
                            >
                                <span className="btn-icon">🪄</span>
                                Auto Detect
                            </button>
                        )}
                    </div>
                </div>

                {selection && (
                    <div className="selection-banner">
                        <div className="banner-left">
                            <span className="selection-icon">🎯</span>
                            <span className="selection-text">Selected: "{selection}"</span>
                        </div>
                        <button
                            className="banner-btn"
                            onClick={() => convertToQuestion(set.id)}
                        >
                            Create Question
                        </button>
                    </div>
                )}

                <div className="context-input-wrapper">
                    <textarea
                        ref={el => textareaRefs.current[set.id] = el}
                        className="context-input-modern"
                        placeholder={set.subType === 'FLEXIBLE_CONTEXT'
                            ? `📋 Paste your IELTS listening context here...

Example:
Notes on Adult Education Classes

Number of classes per week: 7
Tuesday:
___1___ 6-7.30 pm
—Limited space: no more than ___2___ participants

💡 Quick Tips:
• Select text and click "Set as Question"
• Or use ___1___, ___2___ format
• Try Auto Detect for **patterns**`
                            : `📋 Enter your context template...

Use ___1___, ___2___, etc. to mark question positions

Example:
Name: ___1___
Email: ___2___`
                        }
                        value={set.context || ''}
                        onChange={(e) => updateQuestionSetContext(set.id, e.target.value)}
                        onSelect={() => handleTextSelection(set.id)}
                        onMouseUp={() => handleTextSelection(set.id)}
                        onKeyUp={() => handleTextSelection(set.id)}
                        rows={10}
                    />
                </div>

                <div className="context-hint">
                    <span className="hint-icon">💡</span>
                    <span className="hint-text">
                        {set.subType === 'FLEXIBLE_CONTEXT'
                            ? "Paste any IELTS context → Select text for answers → Click 'Set as Question'"
                            : "Use ___1___, ___2___, etc. to mark question positions"
                        }
                    </span>
                </div>
            </div>
        );
    };

    // ✅ QUESTION FIELDS
    const renderQuestionFields = (set, question, qIdx) => {
        switch (set.subType) {
            case 'MCQ':
                return (
                    <div className="mcq-fields">
                        {['A', 'B', 'C', 'D'].map((option, optIdx) => (
                            <div key={optIdx} className="mcq-option">
                                <label>{option}:</label>
                                <input
                                    type="text"
                                    placeholder={`Option ${option}...`}
                                    value={question.options[optIdx] || ''}
                                    onChange={(e) => updateQuestionOption(set.id, qIdx, optIdx, e.target.value)}
                                />
                            </div>
                        ))}
                        <div className="correct-answer">
                            <label>Correct Answer:</label>
                            <select
                                value={question.correctAnswer || 'A'}
                                onChange={(e) => updateQuestion(set.id, qIdx, 'correctAnswer', e.target.value)}
                            >
                                {['A', 'B', 'C', 'D'].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );

            case 'NOTE_COMPLETION':
            case 'FORM_FILLING':
            case 'TABLE_COMPLETION':
            case 'PLAN_MAP_COMPLETION':
            case 'FLEXIBLE_CONTEXT':
                return (
                    <div className="completion-fields-modern">
                        <div className="field-group">
                            <label className="field-label">
                                <span className="label-icon">✅</span>
                                Correct Answer
                            </label>
                            <input
                                type="text"
                                className="field-input primary"
                                placeholder="Enter the correct answer..."
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuestion(set.id, qIdx, 'correctAnswer', e.target.value)}
                            />
                        </div>
                        <div className="field-group">
                            <label className="field-label">
                                <span className="label-icon">📝</span>
                                Alternative Answers (optional)
                            </label>
                            <input
                                type="text"
                                className="field-input secondary"
                                placeholder="Alternative answers separated by commas..."
                                value={question.alternativeAnswers || ''}
                                onChange={(e) => updateQuestion(set.id, qIdx, 'alternativeAnswers', e.target.value)}
                            />
                        </div>
                    </div>
                );

            case 'MATCHING':
                return (
                    <div className="completion-fields-modern">
                        <div className="field-group">
                            <label className="field-label">
                                <span className="label-icon">🔤</span>
                                Correct Answer (Letter)
                            </label>
                            <input
                                type="text"
                                className="field-input primary"
                                placeholder="Enter letter (A, B, C, etc.)..."
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuestion(set.id, qIdx, 'correctAnswer', e.target.value)}
                            />
                        </div>
                    </div>
                );

            case 'SHORT_ANSWER':
                return (
                    <div className="completion-fields-modern">
                        <div className="field-group">
                            <label className="field-label">
                                <span className="label-icon">✏️</span>
                                Sample Answer
                            </label>
                            <input
                                type="text"
                                className="field-input primary"
                                placeholder="Enter sample answer..."
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuestion(set.id, qIdx, 'correctAnswer', e.target.value)}
                            />
                        </div>
                        <div className="field-group">
                            <label className="field-label">
                                <span className="label-icon">📝</span>
                                Alternative Answers (optional)
                            </label>
                            <input
                                type="text"
                                className="field-input secondary"
                                placeholder="Alternative answers separated by commas..."
                                value={question.alternativeAnswers || ''}
                                onChange={(e) => updateQuestion(set.id, qIdx, 'alternativeAnswers', e.target.value)}
                            />
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="completion-fields-modern">
                        <div className="field-group">
                            <label className="field-label">
                                <span className="label-icon">✅</span>
                                Correct Answer
                            </label>
                            <input
                                type="text"
                                className="field-input primary"
                                placeholder="Enter the correct answer..."
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuestion(set.id, qIdx, 'correctAnswer', e.target.value)}
                            />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="listening-question-builder">
            <div className="question-types-panel">
                <h3>Add Question Types</h3>
                <div className="question-type-grid">
                    {LISTENING_QUESTION_TYPES.map(type => (
                        <button
                            key={type.id}
                            className="question-type-card"
                            onClick={() => addQuestionSet(type)}
                        >
                            <div className="type-icon">
                                {type.subType === 'MCQ' ? '🔤' :
                                    type.subType === 'NOTE_COMPLETION' ? '📝' :
                                        type.subType === 'FORM_FILLING' ? '📋' :
                                            type.subType === 'TABLE_COMPLETION' ? '📊' :
                                                type.subType === 'PLAN_MAP_COMPLETION' ? '🗺️' :
                                                    type.subType === 'SHORT_ANSWER' ? '✏️' :
                                                        type.subType === 'FLEXIBLE_CONTEXT' ? '🎯' : '🔗'}
                            </div>
                            <div className="type-info">
                                <h4>{type.name}</h4>
                                <p>{type.description}</p>
                                <span className="question-count">
                                    {type.subType === 'FLEXIBLE_CONTEXT' ? 'Flexible' : `${type.defaultCount} questions`}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Question Sets List */}
            {questionSets.length > 0 ? (
                <div className="question-sets-list">
                    <h3>Question Sets ({questionSets.length})</h3>
                    {questionSets.map(set => (
                        <div
                            key={set.id}
                            className={`question-set-card ${expandedQuestionSet === set.id ? 'expanded' : ''}`}
                        >
                            <div className="question-set-header" onClick={() => toggleExpandSet(set.id)}>
                                <div className="set-title">
                                    <span className="set-type-badge">{set.subType}</span>
                                    <h4>{set.name}</h4>
                                    <span className="question-count">{set.questions.length} questions</span>
                                </div>
                                <div className="set-actions">
                                    <button
                                        className="btn-add-question"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addQuestionToSet(set.id);
                                        }}
                                    >
                                        + Add Question
                                    </button>
                                    <span className="expand-icon">
                                        {expandedQuestionSet === set.id ? '▼' : '▶'}
                                    </span>
                                </div>
                            </div>

                            {expandedQuestionSet === set.id && (
                                <div className="question-set-content">
                                    {/* Instructions */}
                                    <div className="instructions-editor">
                                        <label>Instructions:</label>
                                        <textarea
                                            placeholder="Enter instructions for this question set..."
                                            value={set.instructions || ''}
                                            onChange={(e) => updateQuestionSetInstructions(set.id, e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    {/* Audio Selection */}
                                    <div className="audio-selection">
                                        <label>Related Audio:</label>
                                        <select
                                            value={set.audioId || ''}
                                            onChange={(e) => updateQuestionSetAudio(set.id, e.target.value)}
                                        >
                                            <option value="">-- Select Audio --</option>
                                            {audioFields.map((audio, audioIdx) => (
                                                <option key={audio.id} value={audioIdx + 1}>
                                                    {watch(`listening_audio.${audioIdx}.title`) || `Section ${audioIdx + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* ✅ Context Editor với design mới */}
                                    {renderContextEditor(set)}

                                    {/* ✅ Questions với thiết kế mới */}
                                    <div className="questions-container-modern">
                                        <div className="questions-header">
                                            <h5 className="questions-title">
                                                <span className="title-icon">📝</span>
                                                Questions ({set.questions.length})
                                            </h5>
                                        </div>

                                        {set.questions.map((question, qIdx) => (
                                            <div key={question.id} className="question-card-modern">
                                                <div className="question-card-header-modern">
                                                    <div className="question-badge-modern">
                                                        <span className="badge-number">Q{question.questionNumber}</span>
                                                        <span className={`badge-status ${getQuestionStatus(question).toLowerCase()}`}>
                                                            {getQuestionStatus(question)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        className="remove-btn-modern"
                                                        onClick={() => removeQuestionFromSet(set.id, qIdx)}
                                                        title="Remove this question"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <line x1="18" y1="6" x2="6" y2="18"/>
                                                            <line x1="6" y1="6" x2="18" y2="18"/>
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="question-card-body">
                                                    {/* ✅ Question Text Preview */}
                                                    <div className="question-preview-modern">
                                                        <div className="preview-header">
                                                            <div className="preview-title">
                                                                <span className="preview-icon">❓</span>
                                                                <span>Question Preview</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="edit-btn-modern"
                                                                onClick={() => {
                                                                    const newText = prompt('Edit question text:', question.questionText);
                                                                    if (newText !== null) {
                                                                        updateQuestion(set.id, qIdx, 'questionText', newText);
                                                                    }
                                                                }}
                                                                title="Edit question text"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                                </svg>
                                                                Edit
                                                            </button>
                                                        </div>
                                                        <div className="preview-content">
                                                            {question.questionText || `Question ${question.questionNumber} - Auto-generated from context`}
                                                        </div>
                                                    </div>

                                                    {/* ✅ Answer Section */}
                                                    <div className="answer-section-modern">
                                                        <div className="section-title-modern">
                                                            <span className="section-icon">✅</span>
                                                            <span>Answer Details</span>
                                                        </div>
                                                        {renderQuestionFields(set, question, qIdx)}
                                                    </div>

                                                    {/* ✅ Explanation Section */}
                                                    <div className="explanation-section-modern">
                                                        <div className="section-title-modern">
                                                            <span className="section-icon">💡</span>
                                                            <span>Explanation (Optional)</span>
                                                        </div>
                                                        <textarea
                                                            className="explanation-input-modern"
                                                            placeholder="💭 Explain why this answer is correct..."
                                                            value={question.explanation || ''}
                                                            onChange={(e) => updateQuestion(set.id, qIdx, 'explanation', e.target.value)}
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="set-actions-bottom">
                                        <button
                                            className="btn-add-question-large"
                                            onClick={() => addQuestionToSet(set.id)}
                                        >
                                            + Add Another Question
                                        </button>
                                        <button
                                            className="btn-remove-set"
                                            onClick={() => removeQuestionSet(set.id)}
                                        >
                                            🗑️ Remove This Set
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">🎧</div>
                    <h3>No Question Sets Yet</h3>
                    <p>Choose a question type above to start building your listening test.</p>
                </div>
            )}
        </div>
    );

    // ✅ Helper functions
    const getQuestionStatus = (question) => {
        if (question.correctAnswer && question.correctAnswer.trim()) {
            if (question.explanation && question.explanation.trim()) {
                return 'complete';
            }
            return 'partial';
        }
        return 'empty';
    };
};

export default ListeningQuestionBuilder;