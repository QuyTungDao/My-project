import React, { useState } from 'react';
import './WritingQuestionsTab.css';

const WRITING_TASK_TYPES = [
    {
        id: 'task1_academic',
        name: 'Task 1 - Academic Writing',
        type: 'WRITING_TASK1_ACADEMIC',
        description: 'Describe visual information (charts, graphs, diagrams)',
        timeLimit: 20, // Fixed IELTS standard
        wordLimit: 150, // Fixed IELTS minimum
        defaultPrompt: 'The chart/graph/table shows... Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.'
    },
    {
        id: 'task1_general',
        name: 'Task 1 - General Training',
        type: 'WRITING_TASK1_GENERAL',
        description: 'Write a letter (formal, semi-formal, or informal)',
        timeLimit: 20, // Fixed IELTS standard
        wordLimit: 150, // Fixed IELTS minimum
        defaultPrompt: 'Write a letter to respond to the situation. You should write at least 150 words. You do NOT need to write any addresses.'
    },
    {
        id: 'task2',
        name: 'Task 2 - Essay Writing',
        type: 'WRITING_TASK2',
        description: 'Write an essay in response to a point of view, argument or problem',
        timeLimit: 40, // Fixed IELTS standard
        wordLimit: 250, // Fixed IELTS minimum
        defaultPrompt: 'Write an essay discussing the topic. Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.'
    }
];

export default function WritingQuestionsTab({
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
                // Writing-specific fields
                task_type: set.taskType || '',
                time_limit_minutes: set.timeLimit || 0,
                word_limit: set.wordLimit || 0,
                sample_response: q.sampleResponse || ''
            }));
        });

        setValue('questions', flatQuestions);
    };

    // Add a new writing task set
    const addWritingTaskSet = (taskType) => {
        const newSetId = `writing_set_${Date.now()}`;

        const newQuestion = {
            id: `q_${Date.now()}`,
            questionText: taskType.defaultPrompt,
            questionType: taskType.type,
            correctAnswer: '',
            explanation: '',
            orderInTest: questionSets.length + 1,
            sampleResponse: ''
        };

        const newSet = {
            id: newSetId,
            name: taskType.name,
            type: taskType.type,
            taskType: taskType.type,
            timeLimit: taskType.timeLimit, // Fixed IELTS standard
            wordLimit: taskType.wordLimit, // Fixed IELTS standard
            instructions: `Complete this ${taskType.name} in ${taskType.timeLimit} minutes. Write at least ${taskType.wordLimit} words.`,
            context: '',
            questions: [newQuestion]
        };

        setQuestionSets([...questionSets, newSet]);
        setExpandedTaskSet(newSetId);
        syncQuestionsFromSets([...questionSets, newSet]);
    };

    // Remove a writing task set
    const removeWritingTaskSet = (setId) => {
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

    // Update task prompt
    const updateTaskPrompt = (setId, questionIndex, value) => {
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

    // Update sample response
    const updateSampleResponse = (setId, questionIndex, value) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const updatedQuestions = set.questions.map((q, i) =>
                    i === questionIndex ? { ...q, sampleResponse: value } : q
                );
                return { ...set, questions: updatedQuestions };
            }
            return set;
        });
        setQuestionSets(updatedSets);
        syncQuestionsFromSets(updatedSets);
    };

    const renderWritingTaskContent = (set) => {
        const question = set.questions[0]; // Writing tasks typically have one main question

        return (
            <div className="writing-task-content">
                {/* Task Info Display (Read-only) */}
                <div className="task-info-display">
                    <div className="info-row">
                        <div className="info-item">
                            <label>Task Type</label>
                            <span className="task-type-display">{set.type}</span>
                        </div>
                        <div className="info-item">
                            <label>Time Limit</label>
                            <span className="time-display">{set.timeLimit} minutes (IELTS Standard)</span>
                        </div>
                        <div className="info-item">
                            <label>Word Requirement</label>
                            <span className="word-display">At least {set.wordLimit} words</span>
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
                        These instructions will be displayed to students before they start the task.
                    </small>
                </div>

                {/* Task Prompt */}
                <div className="task-prompt">
                    <label>Writing Task Prompt</label>
                    <textarea
                        placeholder="Enter the specific writing prompt or question..."
                        value={question?.questionText || ''}
                        onChange={(e) => updateTaskPrompt(set.id, 0, e.target.value)}
                        rows={6}
                        className="task-prompt-textarea"
                    />
                    <small className="helper-text">
                        This is the main writing prompt that students will respond to.
                    </small>
                </div>

                {/* Visual Material Upload (for Task 1 Academic) */}
                {set.type === 'WRITING_TASK1_ACADEMIC' && (
                    <div className="visual-material">
                        <label>Visual Material (Chart/Graph/Diagram)</label>
                        <div className="visual-upload-area">
                            <p>📊 Upload visual material for students to describe</p>
                            <input type="file" accept="image/*" />
                            <small>Supported: JPG, PNG, GIF. For practice - students will describe the visual.</small>
                        </div>
                    </div>
                )}

                {/* Assessment Info */}
                <div className="assessment-info">
                    <h4>Assessment Criteria (IELTS Standard)</h4>
                    <div className="criteria-grid">
                        <div className="criteria-item">
                            <span className="criteria-name">Task Achievement/Response</span>
                            <span className="criteria-weight">25%</span>
                        </div>
                        <div className="criteria-item">
                            <span className="criteria-name">Coherence and Cohesion</span>
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
                    </div>
                </div>

                {/* Sample Response */}
                <div className="sample-response">
                    <label>
                        Sample Response / Model Answer
                        <span className="optional">(Optional - for teacher reference)</span>
                    </label>
                    <textarea
                        placeholder="Provide a sample response or model answer for reference..."
                        value={question?.sampleResponse || ''}
                        onChange={(e) => updateSampleResponse(set.id, 0, e.target.value)}
                        rows={8}
                        className="sample-response-textarea"
                    />
                    <div className="word-count">
                        Words: {(question?.sampleResponse || '').split(/\s+/).filter(word => word.length > 0).length}
                    </div>
                </div>

                {/* Task Actions */}
                <div className="task-actions">
                    <button
                        type="button"
                        className="btn-remove-task"
                        onClick={() => removeWritingTaskSet(set.id)}
                    >
                        <i className="icon-trash"></i> Remove Task
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="writing-questions-tab">
            <section className="writing-tasks-section">
                <h2>Writing Tasks</h2>

                {/* Add Writing Task Panel */}
                <div className="add-writing-task-panel">
                    <p>Choose a writing task type to add (IELTS Standard times and word limits):</p>
                    <div className="writing-task-types">
                        {WRITING_TASK_TYPES.map(taskType => (
                            <button
                                key={taskType.id}
                                className="writing-task-type-btn"
                                onClick={() => addWritingTaskSet(taskType)}
                            >
                                <div className="task-type-icon">
                                    {taskType.type.includes('TASK1') ? '📝' : '📄'}
                                </div>
                                <div className="task-type-info">
                                    <span className="task-type-name">{taskType.name}</span>
                                    <span className="task-type-desc">{taskType.description}</span>
                                    <span className="task-type-limits">
                                        {taskType.timeLimit}min • {taskType.wordLimit}+ words (IELTS Standard)
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Writing Tasks List */}
                {questionSets.length > 0 ? (
                    <div className="writing-tasks-list">
                        {questionSets.map(set => (
                            <div
                                key={set.id}
                                className={`writing-task-item ${expandedTaskSet === set.id ? 'expanded' : ''}`}
                            >
                                <div
                                    className="writing-task-header"
                                    onClick={() => toggleExpandTaskSet(set.id)}
                                >
                                    <div className="task-title">
                                        <span className="task-type-badge">{set.type}</span>
                                        <h3>{set.name}</h3>
                                        <div className="task-meta">
                                            <span>{set.timeLimit}min (Standard)</span>
                                            <span>{set.wordLimit}+ words</span>
                                        </div>
                                    </div>
                                    <span className="expand-icon">
                                        {expandedTaskSet === set.id ? '▼' : '▶'}
                                    </span>
                                </div>

                                {expandedTaskSet === set.id && renderWritingTaskContent(set)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state large">
                        <div className="empty-icon">✍️</div>
                        <h3>No Writing Tasks Yet</h3>
                        <p>Choose a writing task type above to start creating your writing test.</p>
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