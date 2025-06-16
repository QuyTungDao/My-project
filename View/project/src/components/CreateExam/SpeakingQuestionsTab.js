import React, { useState } from 'react';
import './SpeakingQuestionsTab.css';

const SPEAKING_TASK_TYPES = [
    {
        id: 'part1',
        name: 'Part 1 - Introduction & Interview',
        type: 'SPEAKING_PART1',
        description: 'General questions about familiar topics',
        timeLimit: 5, // Fixed IELTS standard (4-5 minutes)
        preparationTime: 0, // No preparation time
        defaultPrompts: [
            'Tell me about your hometown.',
            'What do you like to do in your free time?',
            'Do you prefer to study in the morning or evening? Why?',
            'What kind of music do you enjoy listening to?'
        ]
    },
    {
        id: 'part2',
        name: 'Part 2 - Long Turn (Cue Card)',
        type: 'SPEAKING_PART2',
        description: 'Individual long turn with preparation time',
        timeLimit: 2, // Fixed IELTS standard (1-2 minutes speaking)
        preparationTime: 60, // 1 minute preparation
        defaultPrompts: [
            'Describe a place you would like to visit.\n\nYou should say:\n• Where it is\n• How you learned about it\n• What you would do there\n\nAnd explain why you would like to visit this place.'
        ]
    },
    {
        id: 'part3',
        name: 'Part 3 - Discussion',
        type: 'SPEAKING_PART3',
        description: 'Two-way discussion on abstract topics',
        timeLimit: 5, // Fixed IELTS standard (4-5 minutes)
        preparationTime: 0, // No preparation time
        defaultPrompts: [
            'How important is it for people to travel?',
            'What are the benefits of international travel?',
            'Do you think tourism has positive or negative effects on local communities?',
            'How might travel change in the future?'
        ]
    }
];

export default function SpeakingQuestionsTab({
                                                 questionSets,
                                                 setQuestionSets,
                                                 watch,
                                                 setValue,
                                                 setActiveTab,
                                                 testType
                                             }) {
    const [expandedTaskSet, setExpandedTaskSet] = useState(null);

    // Sync question sets to form questions
    const syncQuestionsFromSets = (sets) => {
        if (typeof setValue !== 'function') {
            console.warn('setValue function not available - cannot sync to form');
            return;
        }

        const flatQuestions = sets.flatMap((set, setIndex) => {
            return set.questions.map((q, qIndex) => ({
                question_id: q.id,
                question_text: q.questionText || '',
                question_type: q.questionType || set.type,
                correct_answer: q.correctAnswer || '',
                order_in_test: q.orderInTest || (setIndex * 10 + qIndex + 1),
                explanation: q.explanation || '',
                question_set_instructions: set.instructions || '',
                context: set.context || q.context || '',
                // Speaking-specific fields
                task_type: set.taskType || '',
                time_limit_minutes: set.timeLimit || 0,
                speaking_part: set.speakingPart || null,
                preparation_time_seconds: set.preparationTime || 0,
                speaking_time_seconds: set.timeLimit * 60 || 0, // Convert minutes to seconds
                sample_response: q.sampleResponse || ''
            }));
        });

        setValue('questions', flatQuestions);
    };

    // Add a new speaking task set
    const addSpeakingTaskSet = (taskType) => {
        const newSetId = `speaking_set_${Date.now()}`;

        const newQuestions = taskType.defaultPrompts.map((prompt, index) => ({
            id: `q_${Date.now()}_${index}`,
            questionText: prompt,
            questionType: taskType.type,
            correctAnswer: '',
            explanation: '',
            orderInTest: questionSets.length * 10 + index + 1,
            sampleResponse: ''
        }));

        const newSet = {
            id: newSetId,
            name: taskType.name,
            type: taskType.type,
            taskType: taskType.type,
            timeLimit: taskType.timeLimit, // Fixed IELTS standard
            preparationTime: taskType.preparationTime, // Fixed IELTS standard
            speakingPart: parseInt(taskType.id.replace('part', '')), // Extract part number
            instructions: `IELTS Speaking ${taskType.name} - ${taskType.description}`,
            context: '',
            questions: newQuestions
        };

        setQuestionSets([...questionSets, newSet]);
        setExpandedTaskSet(newSetId);
        syncQuestionsFromSets([...questionSets, newSet]);
    };

    // Remove a speaking task set
    const removeSpeakingTaskSet = (setId) => {
        const updatedSets = questionSets.filter(set => set.id !== setId);
        setQuestionSets(updatedSets);
        if (expandedTaskSet === setId) {
            setExpandedTaskSet(null);
        }
        syncQuestionsFromSets(updatedSets);
    };

    // Toggle expand task set
    const toggleExpandTaskSet = (setId) => {
        setExpandedTaskSet(expandedTaskSet === setId ? null : setId);
    };

    // Update task instructions
    const updateTaskInstructions = (setId, value) => {
        const updatedSets = questionSets.map(set =>
            set.id === setId ? { ...set, instructions: value } : set
        );
        setQuestionSets(updatedSets);
        syncQuestionsFromSets(updatedSets);
    };

    // Update question text
    const updateQuestionText = (setId, questionIndex, value) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const updatedQuestions = set.questions.map((q, i) =>
                    i === questionIndex ? { ...q, questionText: value } : q
                );
                return { ...set, questions: updatedQuestions };
            }
            return set;
        });
        setQuestionSets(updatedSets);
        syncQuestionsFromSets(updatedSets);
    };

    // Add question to set
    const addQuestionToSet = (setId) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const newQuestion = {
                    id: `q_${Date.now()}`,
                    questionText: '',
                    questionType: set.type,
                    correctAnswer: '',
                    explanation: '',
                    orderInTest: set.questions.length + 1,
                    sampleResponse: ''
                };
                return { ...set, questions: [...set.questions, newQuestion] };
            }
            return set;
        });
        setQuestionSets(updatedSets);
        syncQuestionsFromSets(updatedSets);
    };

    // Remove question from set
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
        syncQuestionsFromSets(updatedSets);
    };

    const renderSpeakingTaskContent = (set) => {
        return (
            <div className="speaking-task-content">
                {/* Task Info Display (Read-only) */}
                <div className="task-info-display">
                    <div className="info-row">
                        <div className="info-item">
                            <label>Speaking Part</label>
                            <span className="part-display">Part {set.speakingPart}</span>
                        </div>
                        <div className="info-item">
                            <label>Speaking Time</label>
                            <span className="time-display">{set.timeLimit} minutes (IELTS Standard)</span>
                        </div>
                        <div className="info-item">
                            <label>Preparation Time</label>
                            <span className="prep-display">
                                {set.preparationTime > 0 ? `${set.preparationTime} seconds` : 'No preparation'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Task Instructions */}
                <div className="task-instructions">
                    <label>Instructions for Students</label>
                    <textarea
                        placeholder="Enter instructions that will be shown to students..."
                        value={set.instructions || ''}
                        onChange={(e) => updateTaskInstructions(set.id, e.target.value)}
                        rows={2}
                    />
                    <small className="helper-text">
                        These instructions will be displayed to students before they start speaking.
                    </small>
                </div>

                {/* Questions/Prompts */}
                <div className="questions-section">
                    <h4>Speaking Prompts ({set.questions.length})</h4>

                    {set.questions.map((question, qIdx) => (
                        <div key={question.id} className="question-item">
                            <div className="question-header">
                                <span className="question-number">Q{qIdx + 1}</span>
                                <button
                                    type="button"
                                    className="btn-remove-question"
                                    onClick={() => removeQuestionFromSet(set.id, qIdx)}
                                >
                                    ✕
                                </button>
                            </div>

                            <textarea
                                placeholder={
                                    set.type === 'SPEAKING_PART2'
                                        ? "Enter cue card prompt (include bullet points for guidance)..."
                                        : "Enter speaking question/prompt..."
                                }
                                value={question.questionText || ''}
                                onChange={(e) => updateQuestionText(set.id, qIdx, e.target.value)}
                                rows={set.type === 'SPEAKING_PART2' ? 6 : 3}
                                className="question-textarea"
                            />
                        </div>
                    ))}

                    <button
                        type="button"
                        className="btn-add-question"
                        onClick={() => addQuestionToSet(set.id)}
                    >
                        + Add Question
                    </button>
                </div>

                {/* Assessment Info */}
                <div className="assessment-info">
                    <h4>Assessment Criteria (IELTS Standard)</h4>
                    <div className="criteria-grid">
                        <div className="criteria-item">
                            <span className="criteria-name">Fluency and Coherence</span>
                            <span className="criteria-weight">25%</span>
                        </div>
                        <div className="criteria-item">
                            <span className="criteria-name">Lexical Resource</span>
                            <span className="criteria-weight">25%</span>
                        </div>
                        <div className="criteria-item">
                            <span className="criteria-name">Grammatical Range and Accuracy</span>
                            <span className="criteria-weight">25%</span>
                        </div>
                        <div className="criteria-item">
                            <span className="criteria-name">Pronunciation</span>
                            <span className="criteria-weight">25%</span>
                        </div>
                    </div>
                </div>

                {/* Task Actions */}
                <div className="task-actions">
                    <button
                        type="button"
                        className="btn-remove-task"
                        onClick={() => removeSpeakingTaskSet(set.id)}
                    >
                        <i className="icon-trash"></i> Remove Part
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="speaking-questions-tab">
            <section className="speaking-tasks-section">
                <h2>Speaking Tasks</h2>

                {/* Add Speaking Task Panel */}
                <div className="add-speaking-task-panel">
                    <p>Choose an IELTS Speaking part to add (Standard times and format):</p>
                    <div className="speaking-task-types">
                        {SPEAKING_TASK_TYPES.map(taskType => (
                            <button
                                key={taskType.id}
                                className="speaking-task-type-btn"
                                onClick={() => addSpeakingTaskSet(taskType)}
                            >
                                <div className="task-type-icon">
                                    🎤
                                </div>
                                <div className="task-type-info">
                                    <span className="task-type-name">{taskType.name}</span>
                                    <span className="task-type-desc">{taskType.description}</span>
                                    <span className="task-type-limits">
                                        {taskType.timeLimit}min speaking
                                        {taskType.preparationTime > 0 && ` • ${taskType.preparationTime}s prep`}
                                        <span className="ielts-standard"> (IELTS Standard)</span>
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Speaking Tasks List */}
                {questionSets.length > 0 ? (
                    <div className="speaking-tasks-list">
                        {questionSets.map(set => (
                            <div
                                key={set.id}
                                className={`speaking-task-item ${expandedTaskSet === set.id ? 'expanded' : ''}`}
                            >
                                <div
                                    className="speaking-task-header"
                                    onClick={() => toggleExpandTaskSet(set.id)}
                                >
                                    <div className="task-title">
                                        <span className="task-type-badge">Part {set.speakingPart}</span>
                                        <h3>{set.name}</h3>
                                        <div className="task-meta">
                                            <span>{set.timeLimit}min</span>
                                            <span>{set.questions.length} prompts</span>
                                            {set.preparationTime > 0 && <span>{set.preparationTime}s prep</span>}
                                        </div>
                                    </div>
                                    <span className="expand-icon">
                                        {expandedTaskSet === set.id ? '▼' : '▶'}
                                    </span>
                                </div>

                                {expandedTaskSet === set.id && renderSpeakingTaskContent(set)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state large">
                        <div className="empty-icon">🎤</div>
                        <h3>No Speaking Tasks Yet</h3>
                        <p>Choose an IELTS Speaking part above to start creating your speaking test.</p>
                    </div>
                )}

                {/* Navigation */}
                <div className="action-buttons">
                    <button
                        type="button"
                        className="btn-back"
                        onClick={() => setActiveTab('info')}
                    >
                        ← Back to Information
                    </button>

                    <button
                        type="button"
                        className="btn-next"
                        onClick={() => setActiveTab('preview')}
                        disabled={questionSets.length === 0}
                    >
                        Next: Preview →
                    </button>
                </div>
            </section>
        </div>
    );
}