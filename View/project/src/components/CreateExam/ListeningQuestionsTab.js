// =====================================
// ListeningQuestionsTab.js - Tab riêng cho câu hỏi Listening trong CreateExamPage
// =====================================

import React, { useState, useEffect } from 'react';
import ListeningQuestionBuilder from './ListeningQuestionBuilder';
import EnhancedListeningTestRenderer from './EnhancedListeningTestRenderer';
import './ListeningQuestionsTab.css';

const ListeningQuestionsTab = ({
                                   questionSets,
                                   setQuestionSets,
                                   audioFields,
                                   watch,
                                   setValue,
                                   setActiveTab,
                                   testType
                               }) => {
    const [expandedQuestionSet, setExpandedQuestionSet] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [mockUserAnswers, setMockUserAnswers] = useState({});

    // Sync questionSets to form data
    useEffect(() => {
        syncQuestionsToForm();
    }, [questionSets]);

    const syncQuestionsToForm = () => {
        const flatQuestions = questionSets.flatMap((set, setIndex) => {
            return set.questions.map((q, qIndex) => {
                // Convert UI-based data to form format
                let audioId = null;
                if (set.audioId) {
                    audioId = parseInt(set.audioId, 10);
                }

                // Ensure options are properly formatted
                let options = [];
                if (set.type === 'MCQ') {
                    options = Array.isArray(q.options) ?
                        q.options.concat(Array(4).fill('')).slice(0, 4) :
                        ['', '', '', ''];
                }

                return {
                    question_id: q.id,
                    question_text: q.questionText || '',
                    question_type: q.questionType || set.type,
                    options: options,
                    audio_id: audioId,
                    correct_answer: q.correctAnswer || '',
                    order_in_test: q.questionNumber || (setIndex * 10 + qIndex + 1),
                    explanation: q.explanation || '',
                    alternative_answers: q.alternativeAnswers || '',
                    question_set_instructions: set.instructions || '',
                    word_limit: q.wordLimit || '',
                    context: set.context || '',
                    question_set_type: set.subType || set.type
                };
            });
        });

        console.log('Syncing listening questions to form:', flatQuestions.length, 'questions');
        setValue('questions', flatQuestions);
    };

    const handleMockAnswerChange = (questionId, answer) => {
        setMockUserAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const getTotalQuestions = () => {
        return questionSets.reduce((total, set) => total + set.questions.length, 0);
    };

    const getAnsweredQuestions = () => {
        return Object.keys(mockUserAnswers).filter(key => mockUserAnswers[key]?.trim()).length;
    };

    // Convert questionSets to audioList format for preview
    const getAudioListForPreview = () => {
        return audioFields.map((field, index) => ({
            id: index + 1,
            title: watch(`listening_audio.${index}.title`) || `Section ${index + 1}`,
            section: watch(`listening_audio.${index}.section`) || `SECTION${index + 1}`,
            fileUrl: '#', // Not needed for preview
        }));
    };

    return (
        <div className="listening-questions-tab">

            {/* Content Area */}
            <div className="tab-content-area">
                {!previewMode ? (
                    // Build Mode
                    <div className="build-mode">
                        <ListeningQuestionBuilder
                            questionSets={questionSets}
                            setQuestionSets={setQuestionSets}
                            audioFields={audioFields}
                            watch={watch}
                            setValue={setValue}
                            expandedQuestionSet={expandedQuestionSet}
                            setExpandedQuestionSet={setExpandedQuestionSet}
                        />
                    </div>
                ) : (
                    // Preview Mode
                    <div className="preview-mode">
                        <div className="preview-header">
                            <h3>Preview: How Students Will See This Test</h3>
                            <div className="preview-controls">
                                <button
                                    type="button"
                                    className="clear-answers-btn"
                                    onClick={() => setMockUserAnswers({})}
                                    disabled={Object.keys(mockUserAnswers).length === 0}
                                >
                                    Clear Answers
                                </button>
                                <div className="preview-stats">
                                    {getAnsweredQuestions()}/{getTotalQuestions()} answered
                                </div>
                            </div>
                        </div>

                        <div className="preview-container">
                            <EnhancedListeningTestRenderer
                                test={{
                                    testName: watch('test_name') || 'Untitled Listening Test',
                                    instructions: watch('instructions') || ''
                                }}
                                audioList={getAudioListForPreview()}
                                questionSets={questionSets}
                                userAnswers={mockUserAnswers}
                                onAnswerChange={handleMockAnswerChange}
                                isSubmitted={false}
                                currentAudioIndex={0}
                                setCurrentAudioIndex={() => {}}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button
                    type="button"
                    className="btn-back"
                    onClick={() => setActiveTab('audio')}
                >
                    ← Back to Audio
                </button>

                <div className="nav-info">
                    {questionSets.length === 0 ? (
                        <span className="warning-text">⚠️ Add some questions before proceeding</span>
                    ) : (
                        <span className="success-text">✓ {getTotalQuestions()} questions ready</span>
                    )}
                </div>

                <button
                    type="button"
                    className="btn-next"
                    onClick={() => setActiveTab('preview')}
                    disabled={questionSets.length === 0}
                >
                    Next: Preview →
                </button>
            </div>
        </div>
    );
};

export default ListeningQuestionsTab;