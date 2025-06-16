import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar';
import './TestResult.css';
import api from '../../api';
// ✅ Import external popup component
import QuestionDetailPopup from './QuestionDetailPopup';

export default function TestResult() {
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [selectedPassage, setSelectedPassage] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const { id } = useParams(); // id là attempt_id
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('passage');

    // ✅ ENHANCED useEffect to fetch test result AND original test details
    useEffect(() => {
        const fetchTestResult = async () => {
            try {
                console.log('=== FETCHING TEST RESULT ===');
                setLoading(true);
                const resultResponse = await api.get(`/test-attempts/${id}`);

                // ✅ DEBUG: Log raw response
                console.log('📥 Raw result response:', resultResponse.data);

                // ✅ FIX: Normalize field names immediately after getting data
                if (resultResponse.data.responses) {
                    resultResponse.data.responses = resultResponse.data.responses.map(response => ({
                        ...response,
                        // ✅ CRITICAL: Ensure consistent field naming
                        orderInTest: response.order_in_test || response.orderInTest || response.questionId,
                        // Keep both for compatibility
                        order_in_test: response.order_in_test || response.orderInTest || response.questionId
                    }));

                    console.log('=== NORMALIZED RESPONSES ===');
                    resultResponse.data.responses.forEach((resp, idx) => {
                        console.log(`Response ${idx + 1}:`, {
                            questionId: resp.questionId,
                            orderInTest: resp.orderInTest,
                            order_in_test: resp.order_in_test,
                            displayNumber: resp.orderInTest // This should be consistent
                        });
                    });
                }

                // Get original test details for missing questions
                console.log('📥 Fetching test details for testId:', resultResponse.data.testId);
                const testDetailResponse = await api.get(`/test/${resultResponse.data.testId}`);

                // ✅ DEBUG: Log test details
                console.log('📥 Raw test detail response:', testDetailResponse.data);
                console.log('🎧 Audio data in test details:', testDetailResponse.data.audio);
                console.log('📖 Passages data in test details:', testDetailResponse.data.passages);

                // ✅ FIX: Normalize originalQuestions field names too
                if (testDetailResponse.data.questions) {
                    testDetailResponse.data.questions = testDetailResponse.data.questions.map(q => ({
                        ...q,
                        // ✅ Ensure consistent naming
                        orderInTest: q.order_in_test || q.orderInTest || q.id,
                        order_in_test: q.order_in_test || q.orderInTest || q.id
                    }));
                }

                // ✅ DETECT TEST TYPE more accurately
                let detectedTestType = 'READING'; // default

                // Method 1: Check test name
                if (resultResponse.data.testName &&
                    resultResponse.data.testName.toLowerCase().includes('listening')) {
                    detectedTestType = 'LISTENING';
                }

                // Method 2: Check if audio data exists
                if (testDetailResponse.data.audio && testDetailResponse.data.audio.length > 0) {
                    detectedTestType = 'LISTENING';
                }

                // Method 3: Check question types
                const questionTypes = testDetailResponse.data.questions?.map(q => q.questionType || q.question_type) || [];
                const hasListeningTypes = questionTypes.some(type =>
                    type && type.toLowerCase().includes('listening')
                );
                if (hasListeningTypes) {
                    detectedTestType = 'LISTENING';
                }

                console.log('🎯 DETECTED TEST TYPE:', detectedTestType);
                console.log('🎯 Detection factors:', {
                    testName: resultResponse.data.testName,
                    hasAudio: testDetailResponse.data.audio?.length > 0,
                    questionTypes: questionTypes,
                    hasListeningTypes
                });

                const enhancedResult = {
                    ...resultResponse.data,
                    testType: detectedTestType, // ✅ Set detected type
                    totalQuestionsInTest: testDetailResponse.data.questions?.length || 0,
                    questionPassageMap: {},
                    passages: testDetailResponse.data.passages || [],
                    audio: testDetailResponse.data.audio || [], // ✅ Include audio data
                    originalQuestions: testDetailResponse.data.questions || []
                };

                console.log('✅ Enhanced result with audio:', {
                    testType: enhancedResult.testType,
                    audioCount: enhancedResult.audio?.length || 0,
                    passageCount: enhancedResult.passages?.length || 0,
                    totalQuestions: enhancedResult.totalQuestionsInTest
                });

                setResult(enhancedResult);
                setLoading(false);
            } catch (err) {
                console.error('❌ Error fetching test result:', err);
                setError('Không thể tải kết quả bài thi');
                setLoading(false);
            }
        };

        if (id) {
            fetchTestResult();
        }
    }, [id, navigate]);

    // ✅ FIXED: Simplified and accurate response checking
    const isResponseSkipped = (responseText) => {
        // Simple check - if response is empty or null/undefined
        return !responseText || responseText.toString().trim() === '';
    };

    // ✅ ENHANCED: Calculate stats using original test total + backend responses
    const calculateComprehensiveStats = () => {
        console.log('=== CALCULATING STATS WITH SKIPPED QUESTIONS ===');

        if (!result) {
            console.log('⚠️ No result data');
            return {
                totalQuestions: 0,
                totalAnswered: 0,
                totalCorrect: 0,
                totalIncorrected: 0,
                totalSkipped: 0,
                accuracy: 0,
                completionRate: 0,
                score: 0,
                questionTypes: {}
            };
        }

        // ✅ Get backend score
        const backendScore = result.totalScore || 0;
        console.log('Backend totalScore:', backendScore);

        // ✅ CRITICAL: Use original test total questions count
        const totalQuestionsInTest = result.totalQuestionsInTest || 0;
        const responsesFromBackend = result.responses || [];
        const totalAnswered = responsesFromBackend.length;
        const totalSkippedFromMissing = totalQuestionsInTest - totalAnswered;

        console.log('=== QUESTION COUNT ANALYSIS ===');
        console.log('Total questions in original test:', totalQuestionsInTest);
        console.log('Responses from backend:', totalAnswered);
        console.log('Questions skipped (not in backend):', totalSkippedFromMissing);

        if (responsesFromBackend.length === 0) {
            console.log('❌ No responses data');
            return {
                totalQuestions: totalQuestionsInTest,
                totalAnswered: 0,
                totalCorrect: 0,
                totalIncorrected: 0,
                totalSkipped: totalQuestionsInTest,
                accuracy: 0,
                completionRate: 0,
                score: backendScore,
                questionTypes: {}
            };
        }

        let totalCorrect = 0;
        let totalIncorrected = 0;
        let totalSkippedInResponses = 0; // Empty responses in backend data
        let questionTypes = {};

        responsesFromBackend.forEach((response, index) => {
            const questionType = response.questionType || 'Unknown';

            if (!questionTypes[questionType]) {
                questionTypes[questionType] = {
                    total: 0,
                    correct: 0,
                    incorrect: 0,
                    skipped: 0,
                    accuracy: 0
                };
            }

            const hasResponse = !isResponseSkipped(response.responseText);
            const isCorrect = response.isCorrect === true;

            console.log(`Response ${index + 1}:`, {
                questionId: response.questionId,
                responseText: response.responseText,
                hasResponse: hasResponse,
                isCorrect: isCorrect
            });

            if (!hasResponse) {
                totalSkippedInResponses++;
                questionTypes[questionType].skipped++;
            } else if (isCorrect) {
                totalCorrect++;
                questionTypes[questionType].correct++;
            } else {
                totalIncorrected++;
                questionTypes[questionType].incorrect++;
            }

            questionTypes[questionType].total++;
        });

        // ✅ ENHANCED: Add skipped questions that are missing from backend
        if (totalSkippedFromMissing > 0) {
            const unknownType = 'Unknown';
            if (!questionTypes[unknownType]) {
                questionTypes[unknownType] = {
                    total: 0,
                    correct: 0,
                    incorrect: 0,
                    skipped: 0,
                    accuracy: 0
                };
            }
            questionTypes[unknownType].total += totalSkippedFromMissing;
            questionTypes[unknownType].skipped += totalSkippedFromMissing;
        }

        // ✅ TOTAL SKIPPED = skipped in responses + missing questions
        const totalSkipped = totalSkippedInResponses + totalSkippedFromMissing;
        const totalQuestionsCalculated = totalCorrect + totalIncorrected + totalSkipped;
        const totalAnsweredCalculated = totalCorrect + totalIncorrected;

        // Calculate accuracy for each question type
        Object.keys(questionTypes).forEach(type => {
            const stats = questionTypes[type];
            const answeredQuestions = stats.correct + stats.incorrect;
            stats.accuracy = answeredQuestions > 0 ? ((stats.correct / answeredQuestions) * 100) : 0;
        });

        const accuracy = totalQuestionsCalculated > 0 ? ((totalCorrect / totalQuestionsCalculated) * 100) : 0;
        const completionRate = totalQuestionsCalculated > 0 ? ((totalAnsweredCalculated / totalQuestionsCalculated) * 100) : 0;

        // ✅ FIXED: Score handling
        let score = backendScore;

        console.log('=== SCORE DECISION ===');
        console.log(`Backend score: ${backendScore}`);
        console.log(`Total correct answers: ${totalCorrect}`);
        console.log(`Is backend score reasonable (0-9)?`, backendScore >= 0 && backendScore <= 9);

        // ✅ Only convert if backend score seems wrong (> 9 suggests it's count, not IELTS score)
        if (backendScore > 9) {
            console.warn('🚨 Backend score > 9, converting from count to IELTS score');
            score = convertCorrectCountToIELTS(totalCorrect);
            console.log('🔧 Converted score:', score);
        } else if (backendScore === 0 && totalCorrect > 0) {
            console.warn('⚠️ Backend score is 0 but has correct answers, recalculating');
            score = convertCorrectCountToIELTS(totalCorrect);
            console.log('🔧 Recalculated score:', score);
        } else {
            console.log('✅ Using backend score as-is:', score);
        }

        const finalStats = {
            totalQuestions: totalQuestionsCalculated,
            totalAnswered: totalAnsweredCalculated,
            totalCorrect,
            totalIncorrected,
            totalSkipped,
            accuracy: Math.round(accuracy * 100) / 100, // Overall accuracy
            completionRate: Math.round(completionRate * 100) / 100,
            score: parseFloat(score),
            questionTypes,
            // Aliases for backward compatibility
            total: totalQuestionsCalculated,
            correct: totalCorrect,
            incorrect: totalIncorrected,
            skipped: totalSkipped
        };

        console.log('=== FINAL CALCULATED STATS WITH SKIPPED ===');
        console.log('Total questions:', totalQuestionsCalculated);
        console.log('Total answered:', totalAnsweredCalculated);
        console.log('Total correct:', totalCorrect);
        console.log('Total incorrect:', totalIncorrected);
        console.log('Total skipped:', totalSkipped);
        console.log('  - Skipped in responses:', totalSkippedInResponses);
        console.log('  - Missing from backend:', totalSkippedFromMissing);
        console.log('Final score:', finalStats.score);

        return finalStats;
    };

    const convertCorrectCountToIELTS = (correctCount) => {
        if (correctCount >= 39) return 9.0;
        if (correctCount >= 37) return 8.5;
        if (correctCount >= 35) return 8.0;
        if (correctCount >= 33) return 7.5;
        if (correctCount >= 30) return 7.0;
        if (correctCount >= 27) return 6.5;
        if (correctCount >= 23) return 6.0;
        if (correctCount >= 19) return 5.5;
        if (correctCount >= 15) return 5.0;
        if (correctCount >= 13) return 4.5;
        if (correctCount >= 10) return 4.0;
        if (correctCount >= 8) return 3.5;
        if (correctCount >= 6) return 3.0;
        if (correctCount >= 4) return 2.5;
        if (correctCount >= 2) return 2.0;
        if (correctCount >= 1) return 1.0;
        return 0.0;
    };

    // ✅ ENHANCED: Group questions including skipped ones
    const groupQuestionsByType = () => {
        console.log('=== GROUPING WITH CONSISTENT orderInTest ===');

        if (!result) return [];

        const responsesFromBackend = result.responses || [];
        const { originalQuestions = [] } = result;

        const groups = {};

        // ✅ Process backend responses with normalized orderInTest
        responsesFromBackend.forEach((response, index) => {
            let questionType = response.questionType || 'Unknown';

            if (!groups[questionType]) {
                groups[questionType] = {
                    type: questionType,
                    questions: [],
                    correct: 0,
                    incorrect: 0,
                    skipped: 0,
                    total: 0
                };
            }

            const hasResponse = !isResponseSkipped(response.responseText);
            const isCorrect = response.isCorrect === true;

            // ✅ CRITICAL: Use normalized orderInTest consistently
            const questionNumber = response.orderInTest; // Already normalized above

            console.log(`Processing Q${response.questionId}: orderInTest=${questionNumber}`);

            const origQ = originalQuestions.find(q => q.id === response.questionId) || {};
            const questionData = {
                number: questionNumber,
                questionId: response.questionId,
                isCorrect: isCorrect,
                responseText: response.responseText || '',
                correctAnswer: response.correctAnswer || '',
                questionText: response.questionText || `Question ${questionNumber}`,
                hasResponse: hasResponse,
                isFromBackend: true,
                orderInTest: questionNumber, // Consistent field
                passageId: response.passageId,
                audioId: response.audioId // ← Add audioId for listening
            };

            groups[questionType].questions.push(questionData);
            groups[questionType].total++;

            if (!hasResponse) {
                groups[questionType].skipped++;
            } else if (isCorrect) {
                groups[questionType].correct++;
            } else {
                groups[questionType].incorrect++;
            }
        });

        // ✅ Add missing questions using normalized orderInTest
        if (originalQuestions.length > 0) {
            const respondedQuestionIds = new Set(responsesFromBackend.map(r => r.questionId));
            const missingQuestions = originalQuestions.filter(q => !respondedQuestionIds.has(q.id));

            missingQuestions.forEach(missingQ => {
                console.log(`Adding missing Q${missingQ.id}: orderInTest=${missingQ.orderInTest}`);

                const questionType = missingQ.questionType || 'Unknown';

                if (!groups[questionType]) {
                    groups[questionType] = {
                        type: questionType,
                        questions: [],
                        correct: 0,
                        incorrect: 0,
                        skipped: 0,
                        total: 0
                    };
                }

                const skippedQuestionData = {
                    number: missingQ.orderInTest, // Already normalized
                    questionId: missingQ.id,
                    isCorrect: false,
                    responseText: '',
                    correctAnswer: missingQ.correctAnswer || '',
                    questionText: missingQ.questionText || `Question ${missingQ.orderInTest}`,
                    hasResponse: false,
                    isFromBackend: false,
                    isSkipped: true,
                    orderInTest: missingQ.orderInTest, // Consistent field
                    passageId: missingQ.passageId,
                    audioId: missingQ.audioId // ← Add audioId for listening
                };

                groups[questionType].questions.push(skippedQuestionData);
                groups[questionType].total++;
                groups[questionType].skipped++;
            });
        }

        // ✅ Sort questions by normalized orderInTest
        Object.values(groups).forEach(group => {
            group.questions.sort((a, b) => {
                const orderA = a.orderInTest || a.questionId;
                const orderB = b.orderInTest || b.questionId;
                return orderA - orderB;
            });
        });

        return Object.values(groups);
    };

    // Format question type name
    const formatQuestionType = (type) => {
        const typeMap = {
            'FILL_IN_THE_BLANK': '[Reading] Diagram Label Completion',
            'MATCHING': '[Reading] Matching Information to Paragraphs',
            'MCQ': '[Reading] Multiple Choice',
            'SHORT_ANSWER': '[Reading] Short Answer',
            'TRUE_FALSE_NOT_GIVEN': '[Reading] True/False/Not Given'
        };
        return typeMap[type] || `[Reading] ${type.replace(/_/g, ' ')}`;
    };

    // ✅ REPLACE renderAnswerDetails() - Chỉ fix thứ tự, giữ nguyên UI

    const renderAnswerDetails = () => {
        if (!result) {
            return (
                <div className="answer-details">
                    <div className="answer-tip">
                        <span className="tip-icon">💡</span>
                        <div className="tip-text">
                            <strong>Tips:</strong> Khi xem chi tiết đáp án, bạn có thể tạo và lưu highlight từ vựng, keywords và tạo note để học và tra cứu khi có nhu cầu ôn lại đề thi này trong tương lai.
                        </div>
                    </div>
                    <div className="no-data-message">
                        <p>❌ Không có dữ liệu câu trả lời để hiển thị</p>
                    </div>
                </div>
            );
        }

        const responsesFromBackend = result.responses || [];
        const { originalQuestions = [] } = result;
        const testType = result.testType || 'READING';

        console.log('=== RENDER ANSWER DETAILS - FIX ORDER ONLY ===');
        console.log('Test type detected:', testType);

        // ✅ STEP 1: Create complete question list
        const allQuestions = [];

        // Add answered questions
        responsesFromBackend.forEach((response) => {
            allQuestions.push({
                ...response,
                displayNumber: response.orderInTest || response.questionId,
                orderInTest: response.orderInTest || response.questionId,
                isFromBackend: true,
                questionType: response.questionType || response.question_type
            });
        });

        // Add skipped questions
        const respondedQuestionIds = new Set(responsesFromBackend.map(r => r.questionId));
        originalQuestions
            .filter(q => !respondedQuestionIds.has(q.id))
            .forEach((q) => {
                allQuestions.push({
                    questionId: q.id,
                    displayNumber: q.orderInTest || q.id,
                    orderInTest: q.orderInTest || q.id,
                    responseText: '',
                    isCorrect: false,
                    correctAnswer: q.correctAnswer || '',
                    questionText: q.questionText,
                    isSkipped: true,
                    passageId: q.passageId,
                    audioId: q.audioId,
                    isFromBackend: false,
                    questionType: q.questionType || q.question_type || 'MCQ'
                });
            });

        // ✅ STEP 2: Sort ALL questions by orderInTest FIRST
        allQuestions.sort((a, b) => {
            const orderA = parseInt(a.orderInTest || a.questionId);
            const orderB = parseInt(b.orderInTest || b.questionId);
            console.log(`Sorting: Q${orderA} vs Q${orderB} = ${orderA - orderB}`);
            return orderA - orderB;
        });

        console.log('✅ Final sorted questions:');
        allQuestions.forEach((q, idx) => {
            console.log(`Position ${idx + 1}: Question ${q.orderInTest} (ID: ${q.questionId})`);
        });

        // ✅ STEP 3: Group by content type - BOTH Reading and Listening group by their content
        if (testType === 'LISTENING') {
            console.log('📻 Grouping listening questions by AUDIO - but keep sorted order');

            const audioGroups = {};

            // Group questions by audio but questions are ALREADY SORTED
            allQuestions.forEach(question => {
                let audioId = question.audioId || 'unknown';

                if (!audioGroups[audioId]) {
                    audioGroups[audioId] = [];
                }
                audioGroups[audioId].push(question);
            });

            // ✅ Sort audio IDs for consistent display
            const uniqueAudioIds = Object.keys(audioGroups)
                .filter(id => id !== 'unknown')
                .sort((a, b) => parseInt(a) - parseInt(b));

            return (
                <div className="answer-details">
                    <div className="answer-tip">
                        <span className="tip-icon">💡</span>
                        <div className="tip-text">
                            <strong>Tips:</strong> Khi xem chi tiết đáp án, bạn có thể nghe lại audio và xem transcript để hiểu rõ hơn về câu hỏi.
                        </div>
                    </div>

                    {/* Render audio sections with correctly ordered questions */}
                    {uniqueAudioIds.map((audioId, index) => {
                        const questions = audioGroups[audioId] || [];
                        const displayNumber = index + 1;

                        console.log(`Rendering Audio ${displayNumber}:`, questions.map(q => q.orderInTest));

                        return (
                            <div key={audioId} className="passage-section">
                                <h4 className="passage-title">
                                    🎧 Audio Section {displayNumber}
                                </h4>
                                {renderResponseList(questions, 0)}
                            </div>
                        );
                    })}

                    {/* Render unknown audio if any */}
                    {audioGroups['unknown'] && audioGroups['unknown'].length > 0 && (
                        <div key="unknown" className="passage-section">
                            <h4 className="passage-title">🎧 Unknown Audio</h4>
                            {renderResponseList(audioGroups['unknown'], 0)}
                        </div>
                    )}

                    <div className="redo-warning">
                        <strong>Chú ý:</strong> Khi làm lại các câu sai, điểm trung bình của bạn sẽ KHÔNG bị ảnh hưởng.
                    </div>
                </div>
            );
        } else {
            // ✅ READING: Group by passage BUT preserve sorted order within each group
            console.log('📖 Grouping by PASSAGES - but keep sorted order');

            const passageGroups = {};

            // Group questions by passage but questions are ALREADY SORTED
            allQuestions.forEach(question => {
                let passageId = question.passageId || 'unknown';

                if (!passageGroups[passageId]) {
                    passageGroups[passageId] = [];
                }
                passageGroups[passageId].push(question);
            });

            // ✅ Sort passage IDs for consistent display
            const uniquePassageIds = Object.keys(passageGroups)
                .filter(id => id !== 'unknown')
                .sort((a, b) => parseInt(a) - parseInt(b));

            // ✅ CRITICAL: Each group's questions are ALREADY in correct order (from allQuestions sort)
            // So we DON'T need to sort again within groups

            return (
                <div className="answer-details">
                    <div className="answer-tip">
                        <span className="tip-icon">💡</span>
                        <div className="tip-text">
                            <strong>Tips:</strong> Khi xem chi tiết đáp án, bạn có thể tạo và lưu highlight từ vựng, keywords và tạo note để học và tra cứu khi có nhu cầu ôn lại đề thi này trong tương lai.
                        </div>
                    </div>

                    {/* Render passages with correctly ordered questions */}
                    {uniquePassageIds.map((passageId, index) => {
                        const questions = passageGroups[passageId] || [];
                        const displayNumber = index + 1;

                        console.log(`Rendering Passage ${displayNumber}:`, questions.map(q => q.orderInTest));

                        return (
                            <div key={passageId} className="passage-section">
                                <h4 className="passage-title">
                                    📖 Passage {displayNumber}
                                </h4>
                                {renderResponseList(questions, 0)}
                            </div>
                        );
                    })}

                    {/* Render unknown passage if any */}
                    {passageGroups['unknown'] && passageGroups['unknown'].length > 0 && (
                        <div key="unknown" className="passage-section">
                            <h4 className="passage-title">📖 Unknown Passage</h4>
                            {renderResponseList(passageGroups['unknown'], 0)}
                        </div>
                    )}

                    <div className="redo-warning">
                        <strong>Chú ý:</strong> Khi làm lại các câu sai, điểm trung bình của bạn sẽ KHÔNG bị ảnh hưởng.
                    </div>
                </div>
            );
        }
    };

    // ✅ Update renderResponseList function
    const renderResponseList = (questions, startIndex) => {
        return questions.map((question, index) => {
            // ✅ Use normalized orderInTest consistently
            const questionNumber = question.displayNumber || question.orderInTest || question.questionId;
            const responseText = question.responseText;
            const hasResponse = !isResponseSkipped(responseText);
            const isCorrect = question.isCorrect === true;
            const isSkippedQuestion = question.isSkipped === true;

            let status = 'skipped';
            if (hasResponse) {
                status = isCorrect ? 'correct' : 'incorrect';
            } else if (isSkippedQuestion) {
                status = 'skipped';
            }

            return (
                <div key={`${startIndex}-${index}`} className={`answer-item ${status}`}>
                    <div className={`answer-number ${status}`}>
                        {questionNumber}
                    </div>
                    <div className="answer-content">
                        <div className="answer-given">
                            {isCorrect ? (
                                <>
                                    <strong>ĐÚNG:</strong> {responseText || question.correctAnswer} —
                                </>
                            ) : hasResponse ? (
                                <>
                                    <strong>SAI:</strong> {responseText} —
                                </>
                            ) : (
                                <>
                                    <strong>BỎ QUA:</strong> Chưa trả lời —
                                </>
                            )}
                            <button
                                onClick={() => handleQuestionDetailClick(question)}
                                className="answer-detail-link"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#007bff',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    fontSize: 'inherit'
                                }}
                            >
                                [Chi tiết]
                            </button>
                        </div>
                        {!isCorrect && (
                            <div className="answer-correct">
                                {question.correctAnswer ? (
                                    <>Đáp án đúng: {question.correctAnswer}</>
                                ) : (
                                    <em>Chưa có đáp án đúng</em>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        });
    };

    // ✅ ENHANCED handleQuestionDetailClick with debug audio
    // ✅ ENHANCED handleQuestionDetailClick with proper context extraction
    const handleQuestionDetailClick = async (question) => {
        console.log('=== HANDLING QUESTION DETAIL CLICK ===');
        console.log('Question object:', {
            questionId: question.questionId,
            displayNumber: question.displayNumber,
            passageId: question.passageId,
            audioId: question.audioId,
            orderInTest: question.orderInTest,
            isSkipped: question.isSkipped,
            questionType: question.questionType,
            isFromBackend: question.isFromBackend,
            questionText: question.questionText
        });

        // ✅ Determine test type
        const testType = result.testType || 'READING';
        console.log('🎯 Test type for popup:', testType);

        let questionWithType = { ...question };

        // ✅ CRITICAL: Get full question details from originalQuestions
        let originalQuestion = null;
        if (result?.originalQuestions) {
            originalQuestion = result.originalQuestions.find(oq => oq.id === question.questionId);
            console.log('📋 Found original question:', originalQuestion);
        }

        // Fix missing questionType
        if (!questionWithType.questionType && originalQuestion) {
            questionWithType.questionType = originalQuestion.questionType || originalQuestion.question_type;
        } else if (!questionWithType.questionType) {
            questionWithType.questionType = testType === 'LISTENING' ? 'NOTE_COMPLETION' : 'MCQ';
        }

        // ✅ ENHANCED: Add missing context from original question
        if (originalQuestion) {
            questionWithType = {
                ...questionWithType,
                // Preserve response data

                // Add missing context from original question
                context: originalQuestion.context || originalQuestion.questionText || questionWithType.questionText,
                questionSetInstructions: originalQuestion.questionSetInstructions || originalQuestion.question_set_instructions,
                options: originalQuestion.options,

                // Merge other properties
                ...originalQuestion,

                // Keep the response-specific data that shouldn't be overwritten
                questionId: question.questionId,
                responseText: question.responseText,
                isCorrect: question.isCorrect,
                displayNumber: question.displayNumber || question.orderInTest,
                orderInTest: question.orderInTest,
                isFromBackend: question.isFromBackend,
                isSkipped: question.isSkipped
            };

            console.log('✅ Enhanced question with original data:', {
                hasContext: !!(questionWithType.context && questionWithType.context.trim()),
                contextLength: questionWithType.context?.length || 0,
                hasInstructions: !!(questionWithType.questionSetInstructions && questionWithType.questionSetInstructions.trim()),
                questionType: questionWithType.questionType
            });
        }

        console.log('🔧 Question with type and context fixed:', {
            questionType: questionWithType.questionType,
            hasContext: !!(questionWithType.context && questionWithType.context.trim()),
            hasInstructions: !!(questionWithType.questionSetInstructions && questionWithType.questionSetInstructions.trim())
        });

        // ✅ FIND CONTENT BASED ON TEST TYPE
        let relatedContent = null;

        if (testType === 'LISTENING') {
            console.log('🎧 Looking for audio content...');
            console.log('🎧 Available audio:', result?.audio);
            console.log('🎧 Question audioId:', question.audioId);

            if (question.audioId && result?.audio && result.audio.length > 0) {
                relatedContent = result.audio.find(a => a.id === question.audioId);
                if (relatedContent) {
                    console.log('✅ Found matching audio:', relatedContent.title);
                    relatedContent.contentType = 'audio';
                }
            }

            // If no specific audio found, use first available audio
            if (!relatedContent && result?.audio && result.audio.length > 0) {
                relatedContent = result.audio[0];
                relatedContent.contentType = 'audio';
                console.log('📻 Using first available audio:', relatedContent.title);
            }

            // ✅ ENHANCED: Create better mock content using question context
            if (!relatedContent) {
                console.log('⚠️ No audio found, creating enhanced mock with context');

                // ✅ Use the enhanced question context for better mock data
                const questionText = questionWithType.context || questionWithType.questionText || '';
                const instructions = questionWithType.questionSetInstructions || '';
                const containsTable = questionText.includes('|') || questionText.includes('$');
                const containsBlank = questionText.includes('___') || questionText.includes('……');

                // ✅ Create more realistic transcript based on question context
                let mockTranscript = '';
                if (instructions.toLowerCase().includes('notes')) {
                    mockTranscript = `[Mock Audio for Note Completion]\n\n` +
                        `Welcome to today's session. I'll be going through some important information that you'll need to complete your notes.\n\n` +
                        `${questionText.includes('bus') ? 'Let me start with the bus timetable information...' : 'Here are the key details you need to know...'}\n\n` +
                        `[The actual audio would contain the specific information needed to answer the questions]\n\n` +
                        `Remember to listen carefully for the exact details mentioned.`;
                } else if (containsTable) {
                    mockTranscript = `[Mock Audio for Table/Form Completion]\n\n` +
                        `I'll now go through the details you need to fill in the form/table.\n\n` +
                        `[The actual audio would contain specific information like times, prices, names, etc.]\n\n` +
                        `Please make sure you write exactly what you hear.`;
                } else {
                    mockTranscript = `[Mock Audio Content]\n\n` +
                        `This is where the actual audio transcript would appear.\n\n` +
                        `The speaker would provide the information needed to answer: "${questionWithType.questionText}"\n\n` +
                        `[Full transcript would be available in the actual test]`;
                }

                relatedContent = {
                    id: question.audioId || 'mock-audio',
                    title: instructions.includes('Section') ? instructions.split('\n')[0] : 'Listening Section Audio',
                    section: containsTable ? 'Part 1 - Form Completion' : 'Part 2 - Note Completion',
                    transcript: mockTranscript,
                    contentType: 'audio',
                    durationSeconds: 180,
                    fileUrl: null, // No actual audio file
                    questionContext: {
                        hasTable: containsTable,
                        hasBlank: containsBlank,
                        questionText: questionText,
                        instructions: instructions,
                        fullContext: questionWithType.context
                    }
                };
            }
        } else {
            // Reading logic (existing)
            console.log('📖 Looking for passage content...');
            if (result?.passages && result.passages.length > 0 && question.passageId) {
                relatedContent = result.passages.find(p => p.id === question.passageId);
                if (relatedContent) {
                    relatedContent.contentType = 'passage';
                }
            }

            if (!relatedContent) {
                relatedContent = {
                    id: question.passageId || 'unknown',
                    title: 'Passage Content',
                    contentType: 'passage',
                    content: `Passage content not available.`
                };
            }
        }

        console.log('=== FINAL SELECTION ===');
        console.log('Question with type:', questionWithType.questionType);
        console.log('Question context length:', questionWithType.context?.length || 0);
        console.log('Question instructions:', questionWithType.questionSetInstructions ? 'Present' : 'Missing');
        console.log('Related content type:', relatedContent.contentType);
        console.log('Content title:', relatedContent.title);

        setSelectedQuestion(questionWithType);
        setSelectedPassage(relatedContent);
        setIsPopupOpen(true);
    };

    const closePopup = () => {
        setIsPopupOpen(false);
        setSelectedQuestion(null);
        setSelectedPassage(null);
    };

    // ✅ Calculate stats and groups
    const stats = calculateComprehensiveStats();
    const questionGroups = groupQuestionsByType();

    // ✅ ENHANCED debug commands
    if (typeof window !== 'undefined') {
        window.debugListeningData = () => {
            console.log('=== LISTENING DATA DEBUG ===');
            if (!result) {
                console.log('❌ No result data');
                return;
            }

            console.log('📊 Test Overview:', {
                testId: result.testId,
                testName: result.testName,
                testType: result.testType,
                totalQuestions: result.totalQuestionsInTest,
                responses: result.responses?.length || 0
            });

            console.log('🎧 Audio Data:', {
                count: result.audio?.length || 0,
                audio: result.audio
            });

            console.log('📖 Passage Data:', {
                count: result.passages?.length || 0,
                passages: result.passages
            });

            console.log('❓ Questions Sample:', {
                total: result.originalQuestions?.length || 0,
                first3: result.originalQuestions?.slice(0, 3).map(q => ({
                    id: q.id,
                    questionType: q.questionType,
                    audioId: q.audioId,
                    passageId: q.passageId,
                    questionText: q.questionText?.substring(0, 100) + '...'
                }))
            });

            console.log('📝 Responses Sample:', {
                total: result.responses?.length || 0,
                first3: result.responses?.slice(0, 3).map(r => ({
                    questionId: r.questionId,
                    responseText: r.responseText,
                    isCorrect: r.isCorrect,
                    questionText: r.questionText?.substring(0, 100) + '...'
                }))
            });
        };

        window.debugQuestionFormat = () => {
            console.log('=== QUESTION FORMAT DEBUG ===');
            if (!result?.responses) {
                console.log('❌ No responses');
                return;
            }

            result.responses.forEach((resp, idx) => {
                console.log(`Q${idx + 1} (ID: ${resp.questionId}):`, {
                    questionText: resp.questionText,
                    hasTable: resp.questionText?.includes('|'),
                    hasBlank: resp.questionText?.includes('___'),
                    hasDollar: resp.questionText?.includes('$'),
                    responseText: resp.responseText,
                    correctAnswer: resp.correctAnswer
                });
            });
        };
    }

    if (loading) {
        return (
            <div className="test-result-loading">
                <Navbar />
                <div className="container mx-auto text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <h2 className="text-2xl mt-4">Đang tải kết quả...</h2>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="test-result-error">
                <Navbar />
                <div className="container mx-auto text-center py-20">
                    <h2 className="text-2xl text-red-600">{error || "Không tìm thấy kết quả bài thi"}</h2>
                    <button
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => navigate('/online-exam')}
                    >
                        Quay lại danh sách đề thi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="test-result">
            <Navbar />
            <div className="result-container">
                {/* Info Alert */}
                <div className="info-alert">
                    <div className="info-icon">i</div>
                    <div className="info-text">
                        <strong>Chú ý:</strong> Bạn có thể tạo flashcards từ highlights (bao gồm các highlights các bạn đã tạo trước đây) trong trang chi tiết kết quả bài thi. <a href="#" className="info-link">Xem hướng dẫn.</a>
                    </div>
                </div>

                {/* Header */}
                <h1 className="result-title">Kết quả thi: {result.testName || 'IELTS Simulation Reading test'}</h1>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button className="btn btn-primary">Xem đáp án</button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/online-exam')}
                    >
                        Quay về trang đề thi
                    </button>
                </div>

                {/* ✅ FIXED: Summary Section with accurate stats */}
                <div className="result-summary">
                    <div className="summary-grid">
                        <div className="summary-meta">
                            <h3>✓ Kết quả làm bài</h3>
                            <p className="accuracy-info">Độ chính xác (#đúng/#tổng): {stats.accuracy}%</p>
                            <p className="time-info">Thời gian hoàn thành: {result.completionTime || '0:00:06'}</p>
                        </div>

                        <div className="summary-item">
                            <div className="summary-label">
                                <span className="summary-icon check-icon">✓</span>
                                Trả lời đúng
                            </div>
                            <div className="summary-value">{stats.totalCorrect}</div>
                            <div>câu hỏi</div>
                        </div>

                        <div className="summary-item">
                            <div className="summary-label">
                                <span className="summary-icon close-icon">✗</span>
                                Trả lời sai
                            </div>
                            <div className="summary-value">{stats.totalIncorrected}</div>
                            <div>câu hỏi</div>
                        </div>

                        <div className="summary-item">
                            <div className="summary-label">
                                <span className="summary-icon minus-icon">−</span>
                                Bỏ qua
                            </div>
                            <div className="summary-value">{stats.totalSkipped}</div>
                            <div>câu hỏi</div>
                        </div>

                        <div className="summary-item">
                            <div className="summary-label">
                                <span className="summary-icon flag-icon">🏁</span>
                                Điểm
                            </div>
                            <div className="summary-value score">{stats.score}</div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="result-tabs">
                    <div className="tab-buttons">
                        <button
                            className={`tab-button ${activeTab === 'passage' ? 'active' : ''}`}
                            onClick={() => setActiveTab('passage')}
                        >
                            Passage
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Tổng quát
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'passage' && (
                            <div className="passage-content">
                                <h3>Phân tích chi tiết</h3>

                                {questionGroups.length === 0 ? (
                                    <div className="no-data-message">
                                        <p>❌ Không có dữ liệu câu hỏi để phân tích</p>
                                    </div>
                                ) : (
                                    <table className="analysis-table">
                                        <thead>
                                        <tr>
                                            <th>Phần loại câu hỏi</th>
                                            <th>Số câu đúng</th>
                                            <th>Số câu sai</th>
                                            <th>Số câu bỏ qua</th>
                                            <th>Độ chính xác</th>
                                            <th>Danh sách câu hỏi</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {questionGroups.map((group, index) => (
                                            <tr key={index}>
                                                <td className="question-type">{formatQuestionType(group.type)}</td>
                                                <td>{group.correct}</td>
                                                <td>{group.incorrect}</td>
                                                <td>{group.skipped}</td>
                                                <td>
                                                    {(() => {
                                                        const answeredQuestions = group.correct + group.incorrect;
                                                        if (answeredQuestions === 0) return '0.00%';
                                                        const accuracy = (group.correct / answeredQuestions) * 100;
                                                        return accuracy.toFixed(2) + '%';
                                                    })()}
                                                </td>
                                                <td>
                                                    <div className="question-numbers">
                                                        {group.questions.map((q, qIndex) => (
                                                            <span
                                                                key={qIndex}
                                                                className={`question-number ${
                                                                    q.isCorrect ? 'correct' :
                                                                        q.hasResponse ? 'incorrect' : 'skipped'
                                                                }`}
                                                            >
                                                                {q.orderInTest || q.number || q.questionId}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr style={{fontWeight: 'bold', backgroundColor: '#f8f9fa'}}>
                                            <td>Total</td>
                                            <td>{stats.totalCorrect}</td>
                                            <td>{stats.totalIncorrected}</td>
                                            <td>{stats.totalSkipped}</td>
                                            <td>{stats.accuracy.toFixed(2)}%</td>
                                            <td>{stats.totalQuestions} questions</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                )}

                                {/* Answer Details */}
                                {renderAnswerDetails()}
                            </div>
                        )}

                        {activeTab === 'overview' && (
                            <div className="overview-content">
                                <h3>Tổng quan kết quả</h3>
                                <div className="overview-stats">
                                    <p>Tổng số câu hỏi: {stats.totalQuestions}</p>
                                    <p>Số câu trả lời đúng: {stats.totalCorrect}</p>
                                    <p>Số câu trả lời sai: {stats.totalIncorrected}</p>
                                    <p>Số câu bỏ qua: {stats.totalSkipped}</p>
                                    <p>Độ chính xác: {stats.accuracy}%</p>
                                    <p>Điểm số IELTS: {stats.score}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ✅ Use external popup component */}
            <QuestionDetailPopup
                question={selectedQuestion}
                passage={selectedPassage}
                isOpen={isPopupOpen}
                onClose={closePopup}
                testName={result?.testName || 'IELTS Simulation Reading test'}
            />
        </div>
    );
}