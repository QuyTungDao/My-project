import React, {useState, useEffect, useRef} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import axios from 'axios';
import './TestDetail.css';
import { getTestDetail, submitTest } from "../../api";

// ✅ ONLY CHANGE: Import improved component
// Keep other imports the same
import SpeakingTestDisplay from "./SpeakingTestDisplay";
import WritingTestDisplay from "./WritingTestDisplay";
import IELTSListeningTest from './IELTSListeningTest';

export default function TestDetail() {
    // ✅ Keep ALL existing state exactly the same
    const { id } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [passages, setPassages] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(3600);
    const [submitting, setSubmitting] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [highlightContent, setHighlightContent] = useState(false);
    const [markedQuestions, setMarkedQuestions] = useState([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [contentHeight, setContentHeight] = useState(50);
    const dividerRef = useRef(null);
    const [autoSaveInterval, setAutoSaveInterval] = useState(null);
    const [testType, setTestType] = useState('READING');
    const [audioList, setAudioList] = useState([]);

    // ✅ Keep ALL existing useEffect hooks exactly the same
    useEffect(() => {
        const fetchTestDetail = async () => {
            try {
                setLoading(true);
                console.log("🔄 Đang lấy chi tiết bài thi với ID:", id);

                const token = localStorage.getItem('token');
                if (!token) {
                    setError("Bạn cần đăng nhập để xem chi tiết bài thi.");
                    setLoading(false);
                    return;
                }

                const data = await getTestDetail(id);
                console.log("📋 Dữ liệu bài thi nhận được:", data);

                if (data && data.test) {
                    setTest(data.test);
                    setTestType(data.test.testType || 'READING');
                    console.log("✅ Test type:", data.test.testType);

                    if (data.test.durationMinutes) {
                        setTimer(data.test.durationMinutes * 60);
                    }

                    if (data.passages) {
                        console.log("📖 Reading passages found:", data.passages.length);
                        setPassages(data.passages);
                    }

                    if (data.audio) {
                        console.log("🎧 Processing audio data:", data.audio.length, "files");

                        data.audio.forEach((audio, idx) => {
                            console.log(`Audio ${idx + 1}:`, {
                                id: audio.id,
                                title: audio.title,
                                fileType: audio.fileType,
                                hasBase64: !!(audio.audioBase64 || audio.base64Data),
                                base64Length: (audio.audioBase64 || audio.base64Data)?.length || 0,
                                mimeType: audio.mimeType
                            });
                        });

                        const processedAudio = data.audio.map((audio, index) => ({
                            id: audio.id,
                            title: audio.title || `Section ${index + 1}`,
                            section: audio.section || `SECTION${index + 1}`,
                            fileType: audio.fileType || 'MP3',
                            durationSeconds: audio.durationSeconds || 0,
                            transcript: audio.transcript || '',
                            mimeType: audio.mimeType || 'audio/mpeg',

                            audioBase64: audio.audioBase64,
                            base64Data: audio.base64Data,
                            filePath: audio.filePath,

                            fileUrl: audio.audioBase64 ?
                                `data:${audio.mimeType || 'audio/mpeg'};base64,${audio.audioBase64}` :
                                (audio.base64Data ?
                                        `data:${audio.mimeType || 'audio/mpeg'};base64,${audio.base64Data}` :
                                        audio.filePath
                                )
                        }));

                        console.log("✅ Processed audio list:", processedAudio.length, "files ready");
                        setAudioList(processedAudio);
                    } else {
                        console.log("❌ No audio data found in response");
                        setAudioList([]);
                    }

                    if (data.questions) {
                        console.log("❓ Questions found:", data.questions.length);

                        data.questions.forEach((q, idx) => {
                            console.log(`Question ${idx + 1}:`, {
                                id: q.id,
                                type: q.questionType,
                                text: q.questionText?.substring(0, 50) + '...',
                                audioId: q.audioId,
                                passageId: q.passageId,
                                hasContext: !!(q.context && q.context.trim()),
                                contextLength: q.context?.length || 0,
                                hasInstructions: !!(q.questionSetInstructions && q.questionSetInstructions.trim()),
                                orderInTest: q.orderInTest
                            });
                        });

                        const processedQuestions = data.questions.map((q, index) => {
                            let audioId = null;
                            if (q.audioId) {
                                audioId = parseInt(q.audioId, 10);
                            }

                            let options = [];
                            if (q.questionType === 'MCQ') {
                                options = Array.isArray(q.options) ?
                                    q.options.concat(Array(4).fill('')).slice(0, 4) :
                                    ['', '', '', ''];
                            }

                            let processedQuestion = {
                                ...q,
                                testId: parseInt(id),
                                question_id: q.id,
                                question_text: q.questionText,
                                question_type: q.questionType,
                                audio_id: audioId,
                                passage_id: q.passageId,
                                question_set_instructions: q.questionSetInstructions,
                                order_in_test: q.orderInTest,
                                correct_answer: q.correctAnswer || ''
                            };

                            if (typeof q.options === 'string' && q.options.startsWith('[')) {
                                try {
                                    processedQuestion.options = JSON.parse(q.options);
                                } catch (e) {
                                    console.error("❌ Lỗi khi parse options:", e);
                                }
                            }

                            return processedQuestion;
                        });

                        console.log("✅ Processed questions:", processedQuestions.length);
                        setQuestions(processedQuestions);
                    }

                    setError(null);
                } else {
                    console.error("❌ Không tìm thấy thông tin bài thi");
                    setError("Không thể tải thông tin bài thi. Vui lòng thử lại sau.");
                }
            } catch (err) {
                console.error("❌ Lỗi khi lấy chi tiết bài thi:", err);

                if (err.response && err.response.status === 401) {
                    setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                } else {
                    setError("Không thể tải bài thi. Vui lòng thử lại sau.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (id && isLoggedIn) {
            fetchTestDetail();
        }
    }, [id, navigate, isLoggedIn]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);

            try {
                const payload = token.split('.')[1];
                const decodedPayload = JSON.parse(atob(payload));
                const expirationTime = decodedPayload.exp * 1000;
                const currentTime = Date.now();

                if (expirationTime - currentTime < 10 * 60 * 1000) {
                    console.warn("Token sẽ hết hạn trong 10 phút tới!");
                    alert("Phiên đăng nhập của bạn sắp hết hạn. Vui lòng lưu tiến trình và đăng nhập lại để tránh mất dữ liệu.");
                }
            } catch (err) {
                console.error("Không thể giải mã token:", err);
            }
        } else {
            setIsLoggedIn(false);
            setError("Bạn cần đăng nhập để làm bài thi.");
        }

        const savedProgress = localStorage.getItem(`testProgress_${id}`);
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);
                if (progress.testId === id) {
                    const savedTime = new Date(progress.timestamp);
                    const currentTime = new Date();
                    const diffMinutes = Math.floor((currentTime - savedTime) / (1000 * 60));

                    if (diffMinutes < 24 * 60) {
                        const confirmRestore = window.confirm(
                            `Phát hiện tiến trình làm bài đã lưu từ ${diffMinutes} phút trước. Bạn có muốn khôi phục không?`
                        );

                        if (confirmRestore) {
                            setUserAnswers(progress.answers || {});
                            setMarkedQuestions(progress.markedQuestions || []);
                        }
                    }
                }
            } catch (err) {
                console.error("Lỗi khi khôi phục tiến trình:", err);
            }
        }
    }, [id]);

    useEffect(() => {
        if (isLoggedIn && !loading && test) {
            if (autoSaveInterval) {
                clearInterval(autoSaveInterval);
            }

            const intervalId = setInterval(() => {
                const progress = {
                    testId: id,
                    answers: userAnswers,
                    markedQuestions: markedQuestions,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem(`testProgress_${id}`, JSON.stringify(progress));
                console.log('Đã tự động lưu tiến trình làm bài');
            }, 2 * 60 * 1000);

            setAutoSaveInterval(intervalId);

            return () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
            };
        }
    }, [isLoggedIn, loading, test, id, userAnswers, markedQuestions]);

    useEffect(() => {
        if (timer !== null && !loading && test) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            timerRef.current = setInterval(() => {
                setTimer(prevTimer => {
                    if (prevTimer <= 1) {
                        clearInterval(timerRef.current);
                        alert("Hết thời gian làm bài! Bài thi của bạn sẽ được nộp tự động.");
                        handleSubmit();
                        return 0;
                    }
                    return prevTimer - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [timer, loading, test]);

    // ✅ Keep ALL existing helper functions exactly the same
    const formatTime = (seconds) => {
        if (seconds === null) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    const formatTimeLarge = (seconds) => {
        if (seconds === null) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    const handleAnswerChange = (questionId, answer) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handlePassageChange = (passageIndex) => {
        setCurrentPassageIndex(passageIndex);
    };

    const groupQuestionsByTypeAndInstructions = (questions, currentPassage) => {
        const groups = {};

        questions.forEach(question => {
            if (question.passageId === currentPassage?.id) {
                const key = `${question.questionType}_${question.passageId}_${question.questionSetInstructions || 'default'}`;

                if (!groups[key]) {
                    groups[key] = {
                        questionType: question.questionType,
                        passageId: question.passageId,
                        questions: [],
                        instructions: question.questionSetInstructions || getDefaultInstructionsByQuestionType(question.questionType)
                    };
                }

                groups[key].questions.push(question);
            }
        });

        return Object.values(groups);
    };

    const getDefaultInstructionsByQuestionType = (questionType) => {
        const instructionsMap = {
            'MCQ': 'Choose the correct answer A, B, C or D.',
            'MATCHING': 'Choose the correct headings for each section from the list of headings below.',
            'FILL_IN_THE_BLANK': 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage.',
            'TRUE_FALSE_NOT_GIVEN': 'Do the following statements agree with the information given in the passage?\n\nTRUE if the statement agrees with the information\nFALSE if the statement contradicts the information\nNOT GIVEN if there is no information on this',
            'SHORT_ANSWER': 'Answer the questions below. Choose NO MORE THAN THREE WORDS from the passage.',
            'ESSAY': 'Write an essay of at least 250 words on the following topic.',
            'SPEAKING_TASK': 'Speak about the topic for 2-3 minutes.'
        };

        return instructionsMap[questionType] || 'Answer the following questions based on the passage.';
    };

    const handleSubmit = async () => {
        if (submitting) return;

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Bạn cần đăng nhập để nộp bài thi.');
            handleSaveProgress();
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            navigate('/login');
            return;
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        setSubmitting(true);
        try {
            console.log('=== ENHANCED SUBMIT WITH AUDIO SUPPORT ===');
            console.log('Test ID:', id);
            console.log('Test Type:', testType);
            console.log('Total answers:', Object.keys(userAnswers).length);

            const responses = Object.keys(userAnswers).map(questionId => {
                const answer = userAnswers[questionId];
                const questionIdInt = parseInt(questionId);

                const isAudioData = typeof answer === 'string' &&
                    answer.length > 100 &&
                    !answer.includes(' ') &&
                    /^[A-Za-z0-9+/=]+$/.test(answer);

                if (isAudioData) {
                    console.log(`Q${questionIdInt}: Audio response (${Math.round(answer.length * 0.75 / 1024)}KB)`);

                    return {
                        questionId: questionIdInt,
                        responseText: null,
                        audioResponse: answer,
                        audioDuration: 120,
                        audioFileType: 'webm',
                        audioFileSize: Math.round(answer.length * 0.75),
                        audioMimeType: 'audio/webm'
                    };
                } else {
                    console.log(`Q${questionIdInt}: Text response ("${String(answer).substring(0, 30)}...")`);

                    return {
                        questionId: questionIdInt,
                        responseText: String(answer),
                        audioResponse: null,
                        audioDuration: null,
                        audioFileType: null,
                        audioFileSize: null,
                        audioMimeType: null
                    };
                }
            });

            const audioResponses = responses.filter(r => r.audioResponse);
            const textResponses = responses.filter(r => r.responseText);

            console.log('Response summary:', {
                totalResponses: responses.length,
                audioResponses: audioResponses.length,
                textResponses: textResponses.length,
                testType: testType
            });

            if (audioResponses.length > 0) {
                console.log('🎤 AUDIO SUBMISSION DETECTED');
                const totalAudioSize = audioResponses.reduce((sum, r) => sum + (r.audioFileSize || 0), 0);
                console.log(`Total audio size: ${Math.round(totalAudioSize / 1024 / 1024)}MB`);
            }

            const requestData = {
                testId: parseInt(id),
                startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                responses: responses
            };

            console.log('Sending request:', {
                testId: requestData.testId,
                responsesCount: requestData.responses.length,
                payloadSize: JSON.stringify(requestData).length
            });

            const result = await submitTest(requestData.testId, requestData.responses);

            console.log('✅ Submission successful:', result);

            localStorage.removeItem(`testProgress_${id}`);

            if (result.attemptId) {
                alert('Bài thi đã được nộp thành công!');
                navigate(`/test-results/${result.attemptId}`);
            } else if (result.id) {
                alert('Bài thi đã được nộp thành công!');
                navigate(`/test-results/${result.id}`);
            } else {
                alert('Bài thi đã được nộp thành công! Vui lòng kiểm tra kết quả trong "Lịch sử làm bài".');
                navigate('/my-test-results');
            }

        } catch (err) {
            console.error('❌ Submission error:', err);

            let errorMessage = 'Có lỗi xảy ra khi nộp bài.';

            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Data:', err.response.data);

                if (err.response.status === 401) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                    handleSaveProgress();
                    localStorage.setItem('redirectAfterLogin', window.location.pathname);
                    navigate('/login');
                    return;
                } else if (err.response.status === 413) {
                    errorMessage = 'Dữ liệu quá lớn (có thể do file audio). Vui lòng thử ghi âm ngắn hơn.';
                } else if (err.response.status === 408) {
                    errorMessage = 'Timeout khi upload. Vui lòng kiểm tra kết nối và thử lại.';
                } else if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                }
            } else if (err.code === 'ECONNABORTED') {
                errorMessage = 'Timeout khi gửi bài thi. Vui lòng kiểm tra kết nối và thử lại.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            alert(errorMessage + ' Tiến trình làm bài đã được lưu.');
            handleSaveProgress();

        } finally {
            setSubmitting(false);
        }
    };

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMarkQuestion = (questionId) => {
        setMarkedQuestions(prev => {
            if (prev.includes(questionId)) {
                return prev.filter(id => id !== questionId);
            } else {
                return [...prev, questionId];
            }
        });
    };

    const handleSaveProgress = () => {
        const progress = {
            testId: id,
            answers: userAnswers,
            markedQuestions: markedQuestions,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(`testProgress_${id}`, JSON.stringify(progress));
        alert('Đã lưu tiến trình làm bài thành công!');
    };

    const formatPassageContent = (content) => {
        if (!content) return null;

        return content.split("\n\n").map((paragraph, index) => {
            const match = paragraph.match(/^([A-Z])\s(.*)/);
            if (match) {
                return (
                    <p key={index} className={`paragraph ${highlightContent ? 'highlight' : ''}`}>
                        <span className="paragraph-marker">{match[1]}</span> {match[2]}
                    </p>
                );
            }
            return <p key={index} className={`paragraph ${highlightContent ? 'highlight' : ''}`}>{paragraph}</p>;
        });
    };

    const renderMCQOptions = (question) => {
        if (!question || !question.options) return null;

        let options = question.options;

        if (typeof options === 'string') {
            try {
                options = JSON.parse(options);
            } catch (e) {
                console.error("Lỗi khi parse options:", e);
                return <p>Lỗi hiển thị lựa chọn</p>;
            }
        }

        if (Array.isArray(options)) {
            return (
                <div className="mcq-options">
                    {options.map((option, index) => (
                        <div key={index} className="mcq-option">
                            <input
                                type="radio"
                                id={`question-${question.id}-option-${index}`}
                                name={`question-${question.id}`}
                                value={String.fromCharCode(65 + index)}
                                checked={userAnswers[question.id] === String.fromCharCode(65 + index)}
                                onChange={() => handleAnswerChange(question.id, String.fromCharCode(65 + index))}
                            />
                            <label htmlFor={`question-${question.id}-option-${index}`}>
                                {String.fromCharCode(65 + index)}. {option}
                            </label>
                        </div>
                    ))}
                </div>
            );
        }

        return <p>Định dạng lựa chọn không hợp lệ</p>;
    };

    const renderQuestionInput = (question) => {
        if (!question) return null;

        switch (question.questionType) {
            case 'MCQ':
                return renderMCQOptions(question);

            case 'FILL_IN_THE_BLANK':
            case 'SHORT_ANSWER':
                return (
                    <input
                        type="text"
                        className="answer-input"
                        value={userAnswers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="Nhập câu trả lời..."
                    />
                );

            case 'TRUE_FALSE_NOT_GIVEN':
                return (
                    <div className="true-false-options">
                        {['True', 'False', 'Not Given'].map((option) => (
                            <div key={option} className="true-false-option">
                                <input
                                    type="radio"
                                    id={`question-${question.id}-option-${option}`}
                                    name={`question-${question.id}`}
                                    value={option}
                                    checked={userAnswers[question.id] === option}
                                    onChange={() => handleAnswerChange(question.id, option)}
                                />
                                <label htmlFor={`question-${question.id}-option-${option}`}>
                                    {option}
                                </label>
                            </div>
                        ))}
                    </div>
                );

            case 'MATCHING':
                let matchingOptions = [];
                try {
                    if (typeof question.options === 'string') {
                        matchingOptions = JSON.parse(question.options);
                    } else if (Array.isArray(question.options)) {
                        matchingOptions = question.options;
                    }
                } catch (e) {
                    console.error("Lỗi khi parse matching options:", e);
                }

                return (
                    <div className="matching-container">
                        <input
                            type="text"
                            className="answer-input"
                            value={userAnswers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            placeholder="Nhập đáp án theo format: A-3,B-1,C-5,..."
                        />
                        <div className="matching-options">
                            <div className="matching-column">
                                {matchingOptions.map((option, index) => (
                                    <div key={`left-${index}`} className="matching-item">
                                        {String.fromCharCode(65 + index)}. {option.left}
                                    </div>
                                ))}
                            </div>
                            <div className="matching-column">
                                {matchingOptions.map((option, index) => (
                                    <div key={`right-${index}`} className="matching-item">
                                        {index + 1}. {option.right}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'ESSAY':
                return (
                    <textarea
                        className="essay-input"
                        value={userAnswers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="Nhập bài luận của bạn..."
                        rows={6}
                    />
                );

            default:
                return (
                    <input
                        type="text"
                        className="answer-input"
                        value={userAnswers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="Nhập câu trả lời..."
                    />
                );
        }
    };

    const currentPassage = passages[currentPassageIndex];
    const passageQuestions = questions.filter(q => q.passageId === currentPassage?.id);

    // ✅ MAIN RENDER - Only LISTENING component changed
    return (
        <div className="test-detail-page" style={{width: '100vw', maxWidth: 'none', margin: 0, padding: 0}}>
            <Navbar />

            {/* Loading state */}
            {loading && (
                <div className="test-loading">
                    <div className="container mx-auto text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <h2 className="text-2xl mt-4">Đang tải bài thi...</h2>
                    </div>
                </div>
            )}

            {/* Not logged in */}
            {!isLoggedIn && (
                <div className="test-not-found">
                    <div className="container mx-auto text-center py-20">
                        <h2 className="text-2xl text-red-600">Bạn cần đăng nhập để làm bài thi</h2>
                        <p className="mt-2">Tiến trình làm bài đã được lưu và sẽ được khôi phục sau khi đăng nhập lại</p>
                        <button
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => navigate('/login')}
                        >
                            Đăng nhập
                        </button>
                    </div>
                </div>
            )}

            {/* Error state */}
            {(error || !test) && !loading && (
                <div className="test-not-found">
                    <div className="container mx-auto text-center py-20">
                        <h2 className="text-2xl text-red-600">{error || "Không tìm thấy bài thi"}</h2>
                        <button
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => navigate('/online-exam')}
                        >
                            Quay lại danh sách đề thi
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ Keep READING test exactly the same */}
            {!loading && !error && test && testType === 'READING' && (
                <div className="main-content" style={{width: '100%', maxWidth: 'none', margin: 0}}>
                    <div className="test-main-container" style={{width: '100%', maxWidth: 'none', margin: 0}}>
                        <h1 className="test-title">{test.testName}</h1>

                        <div className="top-timer-mobile">
                            <div className="timer-label">Thời gian còn lại:</div>
                            <div className="timer-value">{formatTimeLarge(timer)}</div>
                        </div>

                        <div className="highlight-toggle-container">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={highlightContent}
                                    onChange={() => setHighlightContent(!highlightContent)}
                                />
                                <span className="slider round"></span>
                            </label>
                            <span className="highlight-label">Highlight nội dung</span>
                            <span className="info-icon" title="Làm nổi bật nội dung văn bản để dễ theo dõi">ⓘ</span>
                        </div>

                        <div className="recording-tabs">
                            {passages.map((passage, index) => (
                                <button
                                    key={passage.id}
                                    className={`recording-tab ${currentPassageIndex === index ? 'active' : ''}`}
                                    onClick={() => handlePassageChange(index)}
                                >
                                    {passage.title || `Đoạn văn ${index + 1}`}
                                </button>
                            ))}
                        </div>

                        <div className="unified-content-container" style={{width: '100%', maxWidth: 'none', margin: 0}}>
                            <div className="content-section">
                                <h2 className="section-title">{currentPassage?.title || test.testName}</h2>
                                {formatPassageContent(currentPassage?.content || '')}
                            </div>

                            <div className="questions-section">
                                <h2 className="section-title">Questions</h2>
                                {groupQuestionsByTypeAndInstructions(questions, currentPassage).map((group, groupIndex) => (
                                    <div key={`group-${groupIndex}`} className="question-group">
                                        <div className="question-type-header">
                                            <h3>{group.questionType.replace(/_/g, ' ')}</h3>
                                            <span className="question-count">
                                                Questions {group.questions[0]?.orderInTest} - {group.questions[group.questions.length - 1]?.orderInTest}
                                            </span>
                                        </div>

                                        {group.instructions && (
                                            <div className="instructions">
                                                <p>{group.instructions}</p>
                                            </div>
                                        )}

                                        <div className="questions-list">
                                            {group.questions
                                                .sort((a, b) => a.orderInTest - b.orderInTest)
                                                .map((question, index) => (
                                                    <div key={question.id} className="question-item">
                                                        <div
                                                            className={`question-number ${markedQuestions.includes(question.id) ? 'marked' : ''}`}
                                                            onClick={() => toggleMarkQuestion(question.id)}
                                                            data-order-in-test={question.orderInTest}>
                                                            {question.orderInTest}
                                                        </div>
                                                        <div className="question-content">
                                                            <p className="question-text">{question.questionText}</p>
                                                            {renderQuestionInput(question)}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="test-sidebar">
                                <div className="sidebar-timer">
                                    <h3>Thời gian còn lại:</h3>
                                    <div className="time-display">{formatTimeLarge(timer)}</div>
                                </div>

                                <button className="submit-button" onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? 'ĐANG NỘP...' : 'NỘP BÀI'}
                                </button>

                                <div className="save-progress" onClick={handleSaveProgress}>
                                    <span className="save-icon">↩</span> Khôi phục/lưu bài làm
                                </div>

                                <div className="review-note">
                                    <strong>Chú ý:</strong> bạn có thể click vào số thứ tự câu hỏi trong bài để đánh dấu
                                    review
                                </div>

                                {passages.map((passage, index) => {
                                    const recordingQuestions = questions.filter(q =>
                                        q.passageId === passage.id
                                    );

                                    return (
                                        <div key={passage.id} className="recording-questions">
                                            <h3>{passage.title || `Đoạn văn ${index + 1}`}</h3>
                                            <div className="question-buttons">
                                                {recordingQuestions.map(question => (
                                                    <button
                                                        key={question.id}
                                                        className={`question-button ${markedQuestions.includes(question.id) ? 'marked' : ''} ${userAnswers[question.id] ? 'answered' : ''}`}
                                                        onClick={() => {
                                                            setCurrentPassageIndex(index);
                                                            setTimeout(() => {
                                                                const questionElement = document.querySelector(`.question-number[data-order-in-test="${question.orderInTest}"]`);
                                                                if (questionElement) {
                                                                    questionElement.scrollIntoView({behavior: 'smooth'});
                                                                }
                                                            }, 100);
                                                        }}
                                                    >
                                                        {question.orderInTest}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!loading && !error && test && testType === 'LISTENING' && (
                <IELTSListeningTest
                    test={test}
                    audioList={audioList}
                    questions={questions}
                    userAnswers={userAnswers}
                    onAnswerChange={handleAnswerChange}
                    timer={timer}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />
            )}

            {/* ✅ Keep WRITING test exactly the same */}
            {!loading && !error && test && testType === 'WRITING' && (
                <WritingTestDisplay
                    test={test}
                    questions={questions}
                    userAnswers={userAnswers}
                    onAnswerChange={handleAnswerChange}
                    isSubmitted={submitting}
                    timer={timer}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />
            )}

            {/* ✅ Keep SPEAKING test exactly the same */}
            {!loading && !error && test && testType === 'SPEAKING' && (
                <SpeakingTestDisplay
                    test={test}
                    questions={questions}
                    userAnswers={userAnswers}
                    onAnswerChange={handleAnswerChange}
                    isSubmitted={submitting}
                    timer={timer}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                    markedQuestions={markedQuestions}
                    onToggleMarkQuestion={toggleMarkQuestion}
                    onSaveProgress={handleSaveProgress}
                />
            )}

            {/* ✅ Keep OTHER test types exactly the same */}
            {!loading && !error && test && !['LISTENING', 'READING', 'WRITING', 'SPEAKING'].includes(testType) && (
                <div className="unsupported-test-type">
                    <div className="container mx-auto text-center py-20">
                        <h2 className="text-2xl text-gray-600">Loại bài thi "{testType}" chưa được hỗ trợ</h2>
                        <p className="mt-2">Vui lòng liên hệ admin để được hỗ trợ.</p>
                        <button
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => navigate('/online-exam')}
                        >
                            Quay lại danh sách đề thi
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ Keep all existing elements exactly the same */}
            <div id="token-expiry-warning" className="token-warning" style={{display: 'none'}}>
                <div className="token-warning-content">
                    <h3>Cảnh báo: Phiên làm bài sắp hết hạn</h3>
                    <p>Phiên đăng nhập của bạn sẽ hết hạn trong ít phút tới. Vui lòng lưu tiến trình làm bài và đăng
                        nhập lại để tránh mất dữ liệu.</p>
                    <div className="token-warning-actions">
                        <button onClick={handleSaveProgress}>Lưu tiến trình</button>
                        <button onClick={() => {
                            handleSaveProgress();
                            navigate('/login');
                        }}>Đăng nhập lại
                        </button>
                        <button
                            onClick={() => document.getElementById('token-expiry-warning').style.display = 'none'}>Đóng
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden Audio element */}
            <audio ref={audioRef} src={null} className="hidden"/>
        </div>
    );
}