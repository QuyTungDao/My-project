// =====================================
// UPDATED ListeningQuestionBuilder.js - Integrated với Simple Table Editor
// =====================================

import React, { useState, useEffect, useRef } from 'react';
import SimpleTableEditor from './TableEditor'; // ✅ Import new simple component
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
        id: 'table_completion',
        name: 'Table Completion',
        description: 'Hoàn thành bảng - Simple Visual Editor',
        defaultCount: 5,
        type: 'FILL_IN_THE_BLANK',
        subType: 'TABLE_COMPLETION',
        instructions: 'Complete the table below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.',
        requiresContext: true,
        supportsSimpleEditor: true, // ✅ Enable Simple Table Editor
        contextHint: `📊 Simple Table Editor Features:

🎯 One-Click Question Creation:
- Click any cell to make it a question
- Auto-numbering and validation
- Visual feedback immediately
- No markdown or JSON required

✨ Intuitive Interface:
- Drag to resize (coming soon)
- Add/remove rows & columns easily
- Preview mode for student view
- Auto-save every second

💡 Much easier than before:
- No complex JSON editing
- No markdown syntax needed
- Just click and create!
- Perfect for teachers who want simplicity`
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
        supportsSimpleEditor: false,
        contextHint: `🎯 Paste any IELTS listening context here...

For example:
Notes on Adult Education Classes

Number of classes per week: 7
Tuesday:
___1___ 6-7.30 pm
—Limited space: no more than ___2___ participants

💡 TIP: 
• Use ___1___, ___2___ to mark questions
• Or select text and click "Set as Question"
• Use Auto Detect for **number** patterns`
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

    // ✅ Debug effect to log context loading
    useEffect(() => {
        console.log('=== LISTENING QUESTION BUILDER DEBUG (SIMPLE EDITOR) ===');
        console.log('Question sets count:', questionSets.length);
        questionSets.forEach((set, idx) => {
            console.log(`Set ${idx + 1}:`, {
                id: set.id,
                name: set.name,
                type: set.type,
                subType: set.subType,
                hasContext: !!(set.context),
                contextLength: set.context?.length || 0,
                contextPreview: set.context ? set.context.substring(0, 100) + '...' : 'empty',
                requiresContext: set.requiresContext,
                questionsCount: set.questions?.length || 0,
                supportsSimpleEditor: set.supportsSimpleEditor
            });
        });
    }, [questionSets]);

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
            // ✅ Để trống context, dùng contextHint làm placeholder
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
            subType: setType.subType,
            questions: questionsInSet,
            audioId: null,
            instructions: setType.instructions,
            context: defaultContext,
            contextHint: setType.contextHint || '',
            startQuestionNumber: getNextQuestionNumber(),
            requiresContext: setType.requiresContext || false,
            supportsSimpleEditor: setType.supportsSimpleEditor || false // ✅ Track Simple Editor support
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

        console.log('=== SYNC QUESTIONS WITH CONTEXT TO FORM (SIMPLE EDITOR) ===');
        console.log('Input sets:', sets.length);

        const flatQuestions = sets.flatMap((set, setIndex) => {
            console.log(`\n--- Processing Set ${setIndex + 1}: ${set.name} ---`);
            console.log('Set type:', set.type);
            console.log('Set subType:', set.subType);
            console.log('Set context length:', set.context?.length || 0);
            console.log('Set context preview:', set.context?.substring(0, 100) || 'empty');
            console.log('Set instructions:', set.instructions || 'empty');
            console.log('Set questions count:', set.questions.length);

            return set.questions.map((q, qIndex) => {
                const result = {
                    question_id: q.id,
                    question_text: q.questionText || '',
                    question_type: q.questionType || set.type,
                    correct_answer: q.correctAnswer || '',
                    order_in_test: q.orderInTest || q.questionNumber || (setIndex * 10 + qIndex + 1),
                    explanation: q.explanation || '',
                    alternative_answers: q.alternativeAnswers || '',
                    question_set_instructions: set.instructions || '',

                    // ✅ CRITICAL FIX: Always include context from SET level
                    context: set.context || '', // Use set.context, not q.context

                    // Audio relationships
                    audio_id: set.audioId ? parseInt(set.audioId, 10) : null,
                    passage_id: null, // Listening không có passage

                    // Options for MCQ
                    options: set.type === 'MCQ' ? (Array.isArray(q.options) ? q.options : ['', '', '', '']) : (q.options || [])
                };

                console.log(`  Question ${qIndex + 1}:`, {
                    id: result.question_id,
                    type: result.question_type,
                    hasContext: !!(result.context && result.context.trim()),
                    contextLength: result.context?.length || 0,
                    contextSource: 'set.context', // ✅ Always from set
                    audioId: result.audio_id
                });

                return result;
            });
        });

        console.log('\n=== FINAL QUESTIONS TO SEND TO FORM (SIMPLE EDITOR) ===');
        console.log('Total questions:', flatQuestions.length);

        // ✅ VALIDATION: Check context in final questions
        const questionsWithContext = flatQuestions.filter(q => q.context && q.context.trim());
        const questionsWithoutContext = flatQuestions.filter(q => !q.context || !q.context.trim());

        console.log('Questions WITH context:', questionsWithContext.length);
        console.log('Questions WITHOUT context:', questionsWithoutContext.length);

        if (questionsWithContext.length > 0) {
            console.log('Sample question with context:', {
                id: questionsWithContext[0].question_id,
                contextLength: questionsWithContext[0].context.length,
                contextPreview: questionsWithContext[0].context.substring(0, 100) + '...'
            });
        }

        // ✅ SET TO FORM
        setValue('questions', flatQuestions);
        console.log('✅ Context synced to form successfully (Simple Editor)');
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
                        <SimpleTableEditor
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
            <div className="question-preview-modern">
                <div className="preview-header">
                    <h6 className="preview-title">
                        <span className="preview-icon">❓</span>
                        Question Preview
                    </h6>
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
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                <span className="badge-number">Q{question.questionNumber}</span>
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
                                {/* ✅ Simple Editor Badge */}
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

            {/* Enhanced Help Section */}
            <div className="help-section">
                <details>
                    <summary>💡 Enhanced Guide: Simple Table Editor vs Traditional Methods</summary>
                    <div className="help-content">
                        <h4>✨ Simple Table Editor Benefits:</h4>
                        <div className="help-comparison">
                            <div className="comparison-column">
                                <h5>📊 Simple Editor (NEW)</h5>
                                <ul>
                                    <li>✅ <strong>One-click questions</strong> - just click any cell</li>
                                    <li>✅ <strong>Visual editing</strong> - like Excel/Google Sheets</li>
                                    <li>✅ <strong>Auto-numbering</strong> - no manual counting</li>
                                    <li>✅ <strong>Live preview</strong> - see student view instantly</li>
                                    <li>✅ <strong>Auto-save</strong> - never lose your work</li>
                                    <li>✅ <strong>No syntax</strong> - no markdown or JSON needed</li>
                                </ul>
                            </div>
                            <div className="comparison-column">
                                <h5>📝 Old Methods</h5>
                                <ul>
                                    <li>❌ Manual ___1___ typing</li>
                                    <li>❌ Markdown syntax errors</li>
                                    <li>❌ JSON complexity</li>
                                    <li>❌ No visual feedback</li>
                                    <li>❌ Easy to make mistakes</li>
                                    <li>❌ Technical knowledge required</li>
                                </ul>
                            </div>
                        </div>

                        <h4>🎯 How to use Simple Table Editor:</h4>
                        <ol>
                            <li><strong>Choose "Table Completion"</strong> from question types</li>
                            <li><strong>Edit table data</strong> - type in cells like Excel</li>
                            <li><strong>Click any cell</strong> to convert it to a question</li>
                            <li><strong>Orange cells</strong> are questions with auto-numbers</li>
                            <li><strong>Fill in correct answers</strong> in the right panel</li>
                            <li><strong>Click Preview</strong> to see student view</li>
                            <li><strong>Auto-saves</strong> every second - no manual save needed</li>
                        </ol>

                        <h4>📱 Much Better for Teachers:</h4>
                        <ul>
                            <li>No technical skills required</li>
                            <li>Intuitive like Google Sheets</li>
                            <li>Instant visual feedback</li>
                            <li>Perfect table rendering for students</li>
                            <li>Mobile-friendly editing</li>
                            <li>Zero syntax errors possible</li>
                        </ul>
                    </div>
                </details>
            </div>
        </div>
    );
};

export default ListeningQuestionBuilder;