// =====================================
// UPDATED ListeningQuestionBuilder.js - Integrated với Simple Table Editor
// =====================================

import React, { useState, useEffect, useRef } from 'react';
import TableEditor from './TableEditor'; // ✅ Import new simple component
import './ListeningQuestionBuilder.css';

// ✅ UPDATED Question Types với simple table editor
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
        supportsSimpleEditor: false,
        contextHint: `📝 Example format:

Notes on Adult Education Classes

Number of classes per week: 7
Tuesday:
___1___ 6-7.30 pm
—Limited space: no more than ___2___ participants
Book Club
—Must read ___3___ books
___4___ Group
—Learn about local events last century

💡 TIP: Use ___1___, ___2___, etc. to mark question positions`
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
        supportsSimpleEditor: false,
        contextHint: `📋 Example format:

REGISTRATION FORM

Name: ___1___
Age: ___2___
Occupation: ___3___
Address: ___4___
Phone: ___5___
Email: ___6___
Emergency contact: ___7___
Special requirements: ___8___

💡 TIP: Use ___1___, ___2___, etc. to mark question positions`
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
        supportsSimpleEditor: false,
        contextHint: `🗺️ Example format:

LIBRARY FLOOR PLAN

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
___4___

💡 TIP: Use ___1___, ___2___, etc. to mark question positions`
    },
    {
        id: 'mcq_listening',
        name: 'Multiple Choice',
        description: 'Câu hỏi trắc nghiệm',
        defaultCount: 5,
        type: 'MCQ',
        subType: 'MCQ',
        instructions: 'Choose the correct letter, A, B or C.',
        requiresContext: false,
        supportsSimpleEditor: false
    },
    {
        id: 'matching_listening',
        name: 'Matching',
        description: 'Nối thông tin',
        defaultCount: 6,
        type: 'MATCHING',
        subType: 'MATCHING',
        instructions: 'Match each speaker with the correct statement. Write the correct letter, A-H, next to questions.',
        requiresContext: false,
        supportsSimpleEditor: false
    },
    {
        id: 'short_answer_listening',
        name: 'Short Answer',
        description: 'Câu trả lời ngắn',
        defaultCount: 3,
        type: 'SHORT_ANSWER',
        subType: 'SHORT_ANSWER',
        instructions: 'Answer the questions below. Write NO MORE THAN THREE WORDS for each answer.',
        requiresContext: false,
        supportsSimpleEditor: false
    }
];

const ListeningQuestionBuilder = ({
                                      questionSets,
                                      setQuestionSets,
                                      audioFields,
                                      watch,
                                      setValue,
                                      expandedQuestionSet,
                                      setExpandedQuestionSet
                                  }) => {
    const [selectedText, setSelectedText] = useState({});
    const [selectionRange, setSelectionRange] = useState({});
    const textareaRefs = useRef({});
    const [editingQuestion, setEditingQuestion] = useState(null); // Track which question is being edited

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
        // For JSON context, try to parse it first
        try {
            const parsed = JSON.parse(context);
            if (parsed.type === 'ielts_table_completion') {
                // Extract question from table structure
                const question = parsed.questions.find(q => q.questionNumber === questionNumber);
                if (question) {
                    const pos = question.position;
                    return `Complete the table - ${parsed.title} (Row ${pos.row + 1}, Column ${pos.col + 1})`;
                }
                return `Table completion question ${questionNumber}`;
            }
        } catch (e) {
            // Not JSON, proceed with text parsing
        }

        // Original text-based parsing
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
        // ✅ Enhanced: Handle JSON table structure
        try {
            const parsed = JSON.parse(contextText);
            if (parsed.type === 'ielts_table_completion' && parsed.questions) {
                console.log('✅ Extracting questions from JSON table structure (Simple Editor)');

                const extractedQuestions = parsed.questions.map(tableQ => ({
                    id: `q_${setId}_${tableQ.questionNumber}`,
                    questionNumber: tableQ.questionNumber,
                    questionText: `Complete the table - ${parsed.title || 'Table'} (Row ${tableQ.position.row + 1}, Col ${tableQ.position.col + 1})`,
                    questionType: 'FILL_IN_THE_BLANK',
                    options: [],
                    correctAnswer: tableQ.correctAnswer || '',
                    explanation: '',
                    alternativeAnswers: tableQ.alternativeAnswers || '',
                    context: contextText
                }));

                console.log('✅ Extracted', extractedQuestions.length, 'questions from JSON table (Simple Editor)');
                return extractedQuestions.sort((a, b) => a.questionNumber - b.questionNumber);
            }
        } catch (e) {
            // Not JSON, proceed with text parsing
            console.log('Context is not JSON table, using text parsing (Simple Editor)');
        }

        // Original text-based parsing for non-JSON contexts
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

        // Pattern 1: **number** (như **7**, **8**)
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

        // Pattern 2: __number__ (như __7__, __8__)
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

        // Pattern 3: Consecutive spaces, dashes, underscores
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
            defaultContext = '';
            questionsInSet = [];
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
            subType: setType.subType || setType.type, // ✅ ENSURE subType is set
            questions: questionsInSet,
            audioId: null,
            instructions: setType.instructions,
            context: defaultContext,
            contextHint: setType.contextHint || '',
            startQuestionNumber: getNextQuestionNumber(),
            requiresContext: setType.requiresContext || false,
            supportsSimpleEditor: setType.supportsSimpleEditor || false
        };

        console.log('✅ Created new question set with subType:', {
            name: setType.name,
            type: setType.type,
            subType: setType.subType
        });

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

        // ✅ COPY: Giữ nguyên text gốc và thêm placeholder
        const newContext =
            set.context.substring(0, range.start) +
            selection.trim() + ' ' + placeholder +
            set.context.substring(range.end);

        // ✅ Tạo question text từ context xung quanh
        const beforeText = set.context.substring(Math.max(0, range.start - 50), range.start).trim();
        const afterText = set.context.substring(range.end, range.end + 50).trim();

        let questionText = '';
        if (beforeText) {
            questionText = beforeText.split('\n').pop() + ' ___' + nextNumber + '___';
        } else {
            questionText = `Question ${nextNumber}: Complete the gap`;
        }

        if (afterText) {
            questionText += ' ' + afterText.split('\n')[0];
        }

        const newQuestion = {
            id: `q_${setId}_${nextNumber}`,
            questionNumber: nextNumber,
            questionText: questionText.trim(),
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

    // ✅ CUT function
    const cutToQuestion = (setId) => {
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

        // ✅ CUT: Thay thế text bằng placeholder
        const newContext =
            set.context.substring(0, range.start) +
            placeholder +
            set.context.substring(range.end);

        const newQuestion = {
            id: `q_${setId}_${nextNumber}`,
            questionNumber: nextNumber,
            questionText: extractQuestionTextFromContext(newContext, nextNumber, selection.trim()),
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
        console.log(`=== UPDATE CONTEXT DEBUG (SIMPLE EDITOR) ===`);
        console.log(`Set ID: ${setId}`);
        console.log(`New context length: ${context?.length || 0}`);
        console.log(`New context preview: ${context?.substring(0, 100) || 'empty'}`);

        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                console.log(`Updating set: ${set.name}`);
                console.log(`Old context length: ${set.context?.length || 0}`);
                console.log(`New context length: ${context?.length || 0}`);

                // ✅ Extract questions from context if context has placeholders
                const extracted = extractQuestionsFromContext(context, setId);

                // ✅ IMPORTANT: Preserve existing questions if context doesn't have placeholders
                const finalQuestions = extracted.length > 0 ? extracted : set.questions;

                const updatedSet = {
                    ...set,
                    context: context || '', // ✅ ENSURE context is always string
                    questions: finalQuestions,
                    requiresContext: !!(context && context.trim()) ||
                        ['NOTE_COMPLETION', 'FORM_FILLING', 'TABLE_COMPLETION', 'PLAN_MAP_COMPLETION', 'FLEXIBLE_CONTEXT'].includes(set.subType)
                };

                console.log(`Updated set context length: ${updatedSet.context?.length || 0}`);
                console.log(`Updated set requiresContext: ${updatedSet.requiresContext}`);

                return updatedSet;
            }
            return set;
        });

        setQuestionSets(updatedSets);

        // ✅ CRITICAL: Sync back to form immediately with proper context
        console.log('Syncing to form after context update (Simple Editor)...');
        syncQuestionsFromSetsWithContext(updatedSets);
    };

    const syncQuestionsFromSetsWithContext = (sets) => {
        if (typeof setValue !== 'function') {
            console.warn('setValue function not available - cannot sync to form');
            return;
        }

        console.log('=== SYNC QUESTIONS WITH SUBTYPE PRESERVATION ===');

        const flatQuestions = sets.flatMap((set, setIndex) => {
            console.log(`\n--- Processing Set ${setIndex + 1}: ${set.name} ---`);
            console.log('Set type:', set.type);
            console.log('Set subType:', set.subType); // ✅ Log subType

            return set.questions.map((q, qIndex) => {
                // ✅ ENCODE subType trong instructions để preserve
                const originalInstructions = set.instructions || '';
                const subTypeMarker = `[SUBTYPE:${set.subType || set.type}]`;

                // Chỉ thêm marker nếu chưa có
                const instructionsWithSubType = originalInstructions.includes('[SUBTYPE:')
                    ? originalInstructions
                    : `${subTypeMarker} ${originalInstructions}`.trim();

                const result = {
                    question_id: q.id,
                    question_text: q.questionText || '',
                    question_type: q.questionType || set.type,
                    correct_answer: q.correctAnswer || '',
                    order_in_test: q.orderInTest || q.questionNumber || (setIndex * 10 + qIndex + 1),
                    explanation: q.explanation || '',
                    alternative_answers: q.alternativeAnswers || '',

                    // ✅ CRITICAL: Encode subType trong instructions
                    question_set_instructions: instructionsWithSubType,

                    context: set.context || q.context || '',
                    audio_id: set.audioId ? parseInt(set.audioId, 10) : null,
                    passage_id: set.passageId ? parseInt(set.passageId, 10) : null,
                    options: set.type === 'MCQ' ? (Array.isArray(q.options) ? q.options : ['', '', '', '']) : (q.options || [])
                };

                console.log(`Question ${qIndex + 1} subType encoded:`, {
                    originalType: set.type,
                    subType: set.subType,
                    encodedInstructions: instructionsWithSubType.substring(0, 50) + '...'
                });

                return result;
            });
        });

        setValue('questions', flatQuestions);
        console.log('✅ SubType preservation completed');
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

    const extractSubTypeFromInstructions = (instructions) => {
        if (!instructions) return null;

        const match = instructions.match(/\[SUBTYPE:([^\]]+)\]/);
        return match ? match[1] : null;
    };

// ✅ Enhanced grouping logic with subType detection
    const enhancedGroupKey = (q, currentPassages, currentAudio) => {
        // Extract subType from instructions
        const extractedSubType = extractSubTypeFromInstructions(q.question_set_instructions);

        // UI index mapping (existing logic)
        let uiPassageId = 'none';
        let uiAudioId = 'none';

        if (q.passage_id) {
            const passageIndex = currentPassages.findIndex(p => p.id === q.passage_id);
            uiPassageId = passageIndex !== -1 ? (passageIndex + 1).toString() : 'none';
        }

        if (q.audio_id) {
            const audioIndex = currentAudio.findIndex(a => a.id === q.audio_id);
            uiAudioId = audioIndex !== -1 ? (audioIndex + 1).toString() : 'none';
        }

        // ✅ INCLUDE subType trong grouping key
        const cleanInstructions = (q.question_set_instructions || '').replace(/\[SUBTYPE:[^\]]+\]\s*/, '');

        return [
            q.question_type,
            extractedSubType || q.question_type, // ✅ Use extracted subType
            uiPassageId,
            uiAudioId,
            cleanInstructions,
            q.context || ''
        ].join('_');
    };

    const removeQuestionFromSet = (setId, questionIndex) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const updatedQuestions = [...set.questions];
                updatedQuestions.splice(questionIndex, 1);

                // ✅ Reorder questionNumber after removal
                const reorderedQuestions = updatedQuestions.map((q, idx) => ({
                    ...q,
                    questionNumber: idx + 1
                }));

                return { ...set, questions: reorderedQuestions };
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

    // ✅ UPDATED: renderContextEditor with Simple Table Editor integration
    const renderContextEditor = (set) => {
        const selection = selectedText[set.id];

        // ✅ FIXED: Show context editor for all context-based question types
        const shouldShowContext = set.requiresContext ||
            ['NOTE_COMPLETION', 'FORM_FILLING', 'TABLE_COMPLETION', 'PLAN_MAP_COMPLETION', 'FLEXIBLE_CONTEXT'].includes(set.subType) ||
            (set.type === 'FILL_IN_THE_BLANK' && (set.context || set.contextHint));

        console.log(`Context editor check for set ${set.id}:`, {
            shouldShowContext,
            requiresContext: set.requiresContext,
            subType: set.subType,
            hasContext: !!(set.context),
            hasContextHint: !!(set.contextHint),
            type: set.type,
            supportsSimpleEditor: set.supportsSimpleEditor
        });

        if (!shouldShowContext) {
            console.log(`Not showing context editor for set ${set.id}`);
            return null;
        }

        return (
            <div className="context-editor-modern">
                <div className="context-header-modern">
                    <div className="header-left">
                        <span className="context-icon">📝</span>
                        <h6 className="context-title">Context Template</h6>
                        {/* ✅ DEBUG INFO */}
                        <small style={{color: '#666', fontSize: '11px', marginLeft: '10px'}}>
                            {set.context ? `(${set.context.length} chars)` : '(empty)'}
                        </small>
                    </div>

                    <div className="context-actions">
                        {/* ✅ Simple Editor Badge for Table Completion */}
                        {set.supportsSimpleEditor && (
                            <div style={{ display: 'flex', gap: '5px', marginRight: '10px' }}>
                                <span style={{
                                    padding: '4px 8px',
                                    background: '#10b981',
                                    color: 'white',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: 'bold'
                                }}>
                                    ✨ Simple Editor
                                </span>
                            </div>
                        )}

                        {/* Text Editor Actions (for non-table types) */}
                        {!set.supportsSimpleEditor && (
                            <>
                                {selection && (
                                    <>
                                        <button
                                            type="button"
                                            className="action-btn convert-btn"
                                            onClick={() => convertToQuestion(set.id)}
                                            title="Copy text and create question (keeps original text)"
                                        >
                                            <span className="btn-icon">📋</span>
                                            Copy as Question
                                        </button>

                                        <button
                                            type="button"
                                            className="action-btn cut-btn"
                                            onClick={() => cutToQuestion(set.id)}
                                            title="Cut text and replace with placeholder"
                                        >
                                            <span className="btn-icon">✂️</span>
                                            Cut as Question
                                        </button>
                                    </>
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
                            </>
                        )}
                    </div>
                </div>

                {!set.supportsSimpleEditor && selection && (
                    <div className="selection-banner">
                        <div className="banner-left">
                            <span className="selection-icon">🎯</span>
                            <span className="selection-text">Selected: "{selection}"</span>
                        </div>
                        <button
                            className="banner-btn"
                            onClick={() => convertToQuestion(set.id)}
                            title="Copy text and create question"
                        >
                            📋 Copy as Question
                        </button>
                        <button
                            className="banner-btn cut-btn"
                            onClick={() => cutToQuestion(set.id)}
                            title="Cut text and replace with placeholder"
                        >
                            ✂️ Cut as Question
                        </button>
                    </div>
                )}

                <div className="context-input-wrapper">
                    {/* ✅ Simple Table Editor for Table Completion */}
                    {set.supportsSimpleEditor ? (
                        <TableEditor
                            context={set.context || ''}
                            onContextChange={(newContext) => updateQuestionSetContext(set.id, newContext)}
                            questionCounter={getNextQuestionNumber()}
                            setQuestionCounter={(fn) => {
                                // Update global question counter if needed
                                if (typeof fn === 'function') {
                                    const currentMax = getNextQuestionNumber();
                                    const newValue = fn(currentMax - 1);
                                    // Don't need to set anything as it's calculated dynamically
                                }
                            }}
                        />
                    ) : (
                        // ✅ Text Editor (default)
                        <textarea
                            ref={el => textareaRefs.current[set.id] = el}
                            className="context-input-modern"
                            placeholder={set.contextHint || "Enter your context here..."}
                            // ✅ CRITICAL: Use set.context directly, not empty string
                            value={set.context || ''}
                            onChange={(e) => {
                                console.log(`Context changed for set ${set.id}:`, e.target.value);
                                updateQuestionSetContext(set.id, e.target.value);
                            }}
                            onSelect={() => handleTextSelection(set.id)}
                            onMouseUp={() => handleTextSelection(set.id)}
                            onKeyUp={() => handleTextSelection(set.id)}
                            rows={12}
                        />
                    )}
                </div>

                <div className="context-hint">
                    <span className="hint-icon">💡</span>
                    <span className="hint-text">
                        {set.supportsSimpleEditor
                            ? "Simple Table Editor - Click any cell to make it a question. Much easier than before!"
                            : set.subType === 'FLEXIBLE_CONTEXT'
                                ? "Paste any IELTS context → Select text for answers → Click 'Set as Question'"
                                : "Use ___1___, ___2___, etc. to mark question positions"
                        }
                    </span>
                </div>
            </div>
        );
    };

    const renderQuestionTextDisplay = (set, question, qIdx) => {
        return (
            <div className="question-text-input-section">
                <label className="question-text-label">
                    <span className="label-icon">❓</span>
                    Question Text
                </label>
                <textarea
                    className="question-text-input"
                    placeholder={`Enter question ${qIdx + 1} text here... (or it will be auto-generated from context)`}
                    value={question.questionText || ''}
                    onChange={(e) => updateQuestion(set.id, qIdx, 'questionText', e.target.value)}
                    rows={2}
                />
            </div>
        );
    };

    const renderQuestionsContainer = (set) => {
        return (
            <div className="questions-container-modern">
                <div className="questions-header">
                    <h5 className="questions-title">
                        <span className="title-icon">📝</span>
                        Questions ({set.questions.length})
                        {set.supportsSimpleEditor && (
                            <span className="simple-badge">Simple Editor</span>
                        )}
                    </h5>
                </div>

                {set.questions.map((question, qIdx) => (
                    <div key={question.id} className={`question-card-modern ${getQuestionStatus(question) === '✅ Complete' ? 'completed' : ''}`}>
                        <div className="question-card-header-modern">
                            <div className="question-badge-modern">
                                <span className="badge-number">Q{qIdx + 1}</span>
                                <span className={`badge-status ${getStatusClass(question)}`}>
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
                            {renderQuestionTextDisplay(set, question, qIdx)}

                            <div className="answer-section-modern">
                                <div className="section-title-modern">
                                    <span className="section-icon">✅</span>
                                    Answer Details
                                </div>
                                <div className="completion-fields-modern">
                                    {renderQuestionFields(set, question, qIdx)}
                                </div>
                            </div>

                            <div className="explanation-section-modern">
                                <div className="section-title-modern">
                                    <span className="section-icon">💡</span>
                                    Explanation (Optional)
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
                {!set.supportsSimpleEditor && (
                    <button
                        className="btn-add-question-large"
                        onClick={() => addQuestionToSet(set.id)}
                    >
                        + Add Another Question
                    </button>
                )}

                {/* CHO TABLE COMPLETION */}
                {set.supportsSimpleEditor && (
                    <div className="table-completion-help">
                        💡 Click any cell in the table above to create questions
                    </div>
                )}
            </div>
        );
    };

    const getQuestionStatus = (question) => {
        if (question.correctAnswer && question.correctAnswer.trim()) {
            if (question.explanation && question.explanation.trim()) {
                return '✅ Complete';
            }
            return '⚠️ Partial';
        }
        return '❌ Empty';
    };

    const getStatusClass = (question) => {
        const status = getQuestionStatus(question);
        if (status.includes('Complete')) return 'complete';
        if (status.includes('Partial')) return 'partial';
        return 'empty';
    };

    const renderQuestionFields = (set, question, qIdx) => {
        switch (set.subType) {
            case 'MCQ':
                return (
                    <div className="mcq-fields">
                        {/* Options Input */}
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

                        {/* ✅ FIX: ENSURE Correct Answer Selection is ALWAYS VISIBLE */}
                        <div className="correct-answer-selection" style={{
                            marginTop: '15px',
                            padding: '10px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '5px',
                            border: '2px solid #007bff'
                        }}>
                            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                🎯 Đáp án đúng:
                            </label>
                            <select
                                value={question.correctAnswer || 'A'}
                                onChange={(e) => updateQuestion(set.id, qIdx, 'correctAnswer', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    fontSize: '16px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                            >
                                {['A', 'B', 'C', 'D'].map(opt => (
                                    <option key={opt} value={opt}>
                                        {opt} {question.options && question.options[['A', 'B', 'C', 'D'].indexOf(opt)]
                                        ? `- ${question.options[['A', 'B', 'C', 'D'].indexOf(opt)].substring(0, 30)}${question.options[['A', 'B', 'C', 'D'].indexOf(opt)].length > 30 ? '...' : ''}`
                                        : '(chưa nhập nội dung)'}
                                    </option>
                                ))}
                            </select>

                            {/* Visual feedback */}
                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#6c757d' }}>
                                Đáp án hiện tại: <strong style={{ color: '#007bff' }}>{question.correctAnswer || 'A'}</strong>
                            </div>
                        </div>
                    </div>
                );

            case 'NOTE_COMPLETION':
            case 'FORM_FILLING':
            case 'TABLE_COMPLETION':
            case 'PLAN_MAP_COMPLETION':
            case 'FLEXIBLE_CONTEXT':
                return (
                    <>
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
                                <span className="label-icon">🔄</span>
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
                    </>
                );

            case 'MATCHING':
                return (
                    <div className="field-group">
                        <label className="field-label">
                            <span className="label-icon">🎯</span>
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
                );

            case 'SHORT_ANSWER':
                return (
                    <>
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
                                <span className="label-icon">🔄</span>
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
                    </>
                );

            default:
                return (
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
                            data-type={type.id}
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
                                {type.supportsSimpleEditor && (
                                    <span className="simple-editor-badge">✨ Simple Editor</span>
                                )}
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
                            data-type={set.subType}
                        >
                            <div className="question-set-header" onClick={() => toggleExpandSet(set.id)}>
                                <div className="set-title">
                                    <span className="set-type-badge">{set.subType}</span>
                                    <h4>{set.name}</h4>
                                    <span className="question-count">{set.questions.length} questions</span>
                                    {/* ✅ Simple Editor Indicator */}
                                    {set.supportsSimpleEditor && (
                                        <span className="simple-indicator">✨ Simple</span>
                                    )}
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

                                    {/* Context Editor with Simple Table Editor */}
                                    {renderContextEditor(set)}

                                    {/* Questions Container */}
                                    {set.questions.length > 0 && renderQuestionsContainer(set)}

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
};

export default ListeningQuestionBuilder;