import React, {useState, useEffect, useRef} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import axios from 'axios';
import './TestDetail.css';
import { getTestDetail, submitTest } from "../../api";
import ListeningTestDisplay from "./ListeningTestDisplay";
import SpeakingTestDisplay from "./SpeakingTestDisplay";
import WritingTestDisplay from "./WritingTestDisplay"; // Thêm submitTest từ api

export default function TestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [passages, setPassages] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(3600); // 60 phút mặc định
    const [submitting, setSubmitting] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false); // State để kiểm tra đăng nhập
    const [highlightContent, setHighlightContent] = useState(false);
    const [markedQuestions, setMarkedQuestions] = useState([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [contentHeight, setContentHeight] = useState(50); // Phần trăm chiều cao
    const dividerRef = useRef(null);
    const [autoSaveInterval, setAutoSaveInterval] = useState(null);
    const [testType, setTestType] = useState('READING'); // Mặc định READING
    const [audioList, setAudioList] = useState([]); // Danh sách audio cho listening

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

                    // ✅ ENHANCED: Xử lý passages cho READING
                    if (data.passages) {
                        console.log("📖 Reading passages found:", data.passages.length);
                        setPassages(data.passages);
                    }

                    // ✅ ENHANCED: Xử lý audio cho LISTENING với debug chi tiết
                    // ✅ ENHANCED: Xử lý audio cho LISTENING với debug chi tiết
                    // ✅ ENHANCED: Xử lý audio cho LISTENING (REMOVED SPAM LOGS)
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

                            // ✅ CRITICAL: Preserve ALL base64 fields from backend
                            audioBase64: audio.audioBase64,
                            base64Data: audio.base64Data,
                            filePath: audio.filePath,

                            // ✅ Create fileUrl from base64 if available
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

                    // ✅ ENHANCED: Xử lý questions với debug chi tiết
                    if (data.questions) {
                        console.log("❓ Questions found:", data.questions.length);

                        // Debug questions trước khi xử lý
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
                            let processedQuestion = {
                                ...q,
                                testId: parseInt(id),
                                // ✅ Normalize field names for component compatibility
                                question_id: q.id,
                                question_text: q.questionText,
                                question_type: q.questionType,
                                audio_id: q.audioId,
                                passage_id: q.passageId,
                                question_set_instructions: q.questionSetInstructions,
                                order_in_test: q.orderInTest,
                                correct_answer: q.correctAnswer || ''
                            };

                            // Parse options nếu là chuỗi JSON
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
                    // ... existing error handling
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


    // Kiểm tra trạng thái đăng nhập khi component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);

            // Kiểm tra xem token có gần hết hạn không
            try {
                // Giải mã phần payload của JWT token (phần thứ 2 sau dấu .)
                const payload = token.split('.')[1];
                const decodedPayload = JSON.parse(atob(payload));
                const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
                const currentTime = Date.now();

                // Nếu token sẽ hết hạn trong 10 phút tới
                if (expirationTime - currentTime < 10 * 60 * 1000) {
                    console.warn("Token sẽ hết hạn trong 10 phút tới!");
                    // Hiển thị thông báo cho người dùng
                    alert("Phiên đăng nhập của bạn sắp hết hạn. Vui lòng lưu tiến trình và đăng nhập lại để tránh mất dữ liệu.");
                }
            } catch (err) {
                console.error("Không thể giải mã token:", err);
            }
        } else {
            setIsLoggedIn(false);
            setError("Bạn cần đăng nhập để làm bài thi.");
        }

        // Kiểm tra và khôi phục tiến trình làm bài
        const savedProgress = localStorage.getItem(`testProgress_${id}`);
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);
                if (progress.testId === id) {
                    const savedTime = new Date(progress.timestamp);
                    const currentTime = new Date();
                    const diffMinutes = Math.floor((currentTime - savedTime) / (1000 * 60));

                    // Chỉ khôi phục nếu tiến trình được lưu trong vòng 1 ngày
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

    // Thiết lập auto-save mỗi 2 phút
    useEffect(() => {
        if (isLoggedIn && !loading && test) {
            // Xóa interval cũ nếu có
            if (autoSaveInterval) {
                clearInterval(autoSaveInterval);
            }

            // Thiết lập interval mới
            const intervalId = setInterval(() => {
                // Lưu trạng thái hiện tại vào localStorage
                const progress = {
                    testId: id,
                    answers: userAnswers,
                    markedQuestions: markedQuestions,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem(`testProgress_${id}`, JSON.stringify(progress));
                console.log('Đã tự động lưu tiến trình làm bài');
            }, 2 * 60 * 1000); // 2 phút

            setAutoSaveInterval(intervalId);

            // Cleanup khi component unmount
            return () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
            };
        }
    }, [isLoggedIn, loading, test, id, userAnswers, markedQuestions]);

    useEffect(() => {
        const fetchTestDetail = async () => {
            try {
                setLoading(true);
                console.log("Đang lấy chi tiết bài thi với ID:", id);

                // Kiểm tra đăng nhập trước khi lấy chi tiết bài thi
                const token = localStorage.getItem('token');
                if (!token) {
                    setError("Bạn cần đăng nhập để xem chi tiết bài thi.");
                    setLoading(false);
                    return;
                }

                // Đảm bảo sử dụng đúng hàm API
                const data = await getTestDetail(id);
                console.log("Dữ liệu bài thi:", data);

                if (data && data.test) {
                    setTest(data.test);

                    // Thiết lập thời gian làm bài từ dữ liệu bài thi
                    if (data.test.durationMinutes) {
                        setTimer(data.test.durationMinutes * 60); // Chuyển phút thành giây
                    }

                    if (data.passages) {
                        setPassages(data.passages);
                    }

                    if (data.questions) {
                        // Xử lý options cho mỗi câu hỏi nếu cần
                        const processedQuestions = data.questions.map(q => {
                            let processedQuestion = {...q, testId: parseInt(id)};

                            // Parse options nếu là chuỗi JSON
                            if (typeof q.options === 'string' && q.options.startsWith('[')) {
                                try {
                                    processedQuestion.options = JSON.parse(q.options);
                                } catch (e) {
                                    console.error("Lỗi khi parse options:", e);
                                }
                            }

                            return processedQuestion;
                        });

                        setQuestions(processedQuestions);
                    }

                    setError(null);
                } else {
                    console.error("Không tìm thấy thông tin bài thi");
                    setError("Không thể tải thông tin bài thi. Vui lòng thử lại sau.");
                }
            } catch (err) {
                console.error("Lỗi khi lấy chi tiết bài thi:", err);

                if (err.response && err.response.status === 401) {
                    setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

                    // Lưu lại tiến trình hiện tại trước khi chuyển trang
                    const progress = {
                        testId: id,
                        answers: userAnswers,
                        markedQuestions: markedQuestions,
                        timestamp: new Date().toISOString()
                    };
                    localStorage.setItem(`testProgress_${id}`, JSON.stringify(progress));

                    // Lưu URL hiện tại để sau khi đăng nhập lại có thể quay lại
                    localStorage.setItem('redirectAfterLogin', window.location.pathname);

                    setIsLoggedIn(false);
                } else {
                    setError("Không thể tải bài thi. Vui lòng thử lại sau.");
                }
            } finally {
                setLoading(false);
            }
        };

        // Chỉ gọi API nếu đã đăng nhập
        if (id && isLoggedIn) {
            fetchTestDetail();
        }
    }, [id, navigate, isLoggedIn]);

    // Xử lý đồng hồ đếm ngược
    useEffect(() => {
        // Chỉ bắt đầu đồng hồ khi timer đã được thiết lập và không đang loading
        if (timer !== null && !loading && test) {
            // Xóa bất kỳ interval đang chạy
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            // Thiết lập interval mới để đếm ngược
            timerRef.current = setInterval(() => {
                setTimer(prevTimer => {
                    // Nếu hết thời gian
                    if (prevTimer <= 1) {
                        clearInterval(timerRef.current);
                        alert("Hết thời gian làm bài! Bài thi của bạn sẽ được nộp tự động.");
                        handleSubmit(); // Tự động nộp bài
                        return 0;
                    }
                    return prevTimer - 1;
                });
            }, 1000);
        }

        // Cleanup khi component unmount hoặc dependencies thay đổi
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [timer, loading, test]); // Phụ thuộc vào timer, loading và test

    // Format thời gian từ giây sang mm:ss
    const formatTime = (seconds) => {
        if (seconds === null) return "00:00";

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    // Format thời gian từ giây sang mm:ss như trong hình (59:37)
    const formatTimeLarge = (seconds) => {
        if (seconds === null) return "00:00";

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Xử lý khi người dùng chọn câu trả lời
    const handleAnswerChange = (questionId, answer) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    // Xử lý khi người dùng chuyển đoạn văn
    const handlePassageChange = (passageIndex) => {
        setCurrentPassageIndex(passageIndex);
    };

    const groupQuestionsByTypeAndInstructions = (questions, currentPassage) => {
        const groups = {};

        questions.forEach(question => {
            if (question.passageId === currentPassage?.id) {
                // Tạo key dựa trên questionType, passageId và instructions
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

// Fallback instructions nếu database chưa có
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

    // Xử lý khi người dùng nộp bài
    const handleSubmit = async () => {
        if (submitting) return;

        // Kiểm tra đăng nhập trước khi nộp bài
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Bạn cần đăng nhập để nộp bài thi.');

            // Lưu tiến trình hiện tại
            handleSaveProgress();

            // Lưu URL hiện tại để sau khi đăng nhập lại có thể quay lại
            localStorage.setItem('redirectAfterLogin', window.location.pathname);

            navigate('/login');
            return;
        }

        // Dừng đồng hồ đếm ngược
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        setSubmitting(true);
        try {
            // Chuẩn bị dữ liệu để gửi
            const responses = Object.keys(userAnswers).map(questionId => ({
                questionId: parseInt(questionId),
                responseText: userAnswers[questionId]
            }));

            console.log("Đang nộp bài thi với ID:", id);
            console.log("Số lượng câu trả lời:", responses.length);

            // Sử dụng hàm submitTest từ api.js thay vì axios trực tiếp
            const result = await submitTest(id, responses);
            console.log('Kết quả nộp bài thi:', result);

            // Xóa tiến trình đã lưu sau khi nộp bài thành công
            localStorage.removeItem(`testProgress_${id}`);

            // Chuyển hướng đến trang kết quả
            alert('Bài thi đã được nộp thành công!');
            navigate(`/test-results/${result.attemptId}`);
        } catch (err) {
            console.error('Lỗi khi nộp bài:', err);

            if (err.response) {
                console.error("Status:", err.response.status);
                console.error("Data:", err.response.data);

                if (err.response.status === 401) {
                    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. Tiến trình làm bài đã được lưu.');

                    // Lưu tiến trình làm bài trước khi chuyển hướng
                    handleSaveProgress();

                    // Lưu URL hiện tại
                    localStorage.setItem('redirectAfterLogin', window.location.pathname);

                    navigate('/login');
                } else {
                    alert(`Có lỗi xảy ra khi nộp bài: ${err.response.data || 'Vui lòng thử lại.'}`);
                }
            } else {
                alert('Có lỗi xảy ra khi nộp bài. Tiến trình làm bài đã được lưu. Vui lòng thử lại.');
                handleSaveProgress();
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Xử lý phát/dừng audio
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

    // Xử lý đánh dấu câu hỏi
    const toggleMarkQuestion = (questionId) => {
        setMarkedQuestions(prev => {
            if (prev.includes(questionId)) {
                return prev.filter(id => id !== questionId);
            } else {
                return [...prev, questionId];
            }
        });
    };

    // Xử lý khôi phục/lưu bài làm
    const handleSaveProgress = () => {
        // Lưu trạng thái hiện tại vào localStorage
        const progress = {
            testId: id,
            answers: userAnswers,
            markedQuestions: markedQuestions,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(`testProgress_${id}`, JSON.stringify(progress));
        alert('Đã lưu tiến trình làm bài thành công!');
    };

    // Định dạng nội dung đoạn văn với các đánh dấu đoạn (A, B, C...)
    const formatPassageContent = (content) => {
        if (!content) return null;

        return content.split("\n\n").map((paragraph, index) => {
            // Phát hiện đoạn văn có ký tự đánh dấu (A, B, C, ...)
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

    // Hiển thị các lựa chọn cho câu hỏi trắc nghiệm (MCQ)
    const renderMCQOptions = (question) => {
        if (!question || !question.options) return null;

        let options = question.options;

        // Nếu options là chuỗi, thử parse nó
        if (typeof options === 'string') {
            try {
                options = JSON.parse(options);
            } catch (e) {
                console.error("Lỗi khi parse options:", e);
                return <p>Lỗi hiển thị lựa chọn</p>;
            }
        }

        // Nếu options là mảng
        if (Array.isArray(options)) {
            return (
                <div className="mcq-options">
                    {options.map((option, index) => (
                        <div key={index} className="mcq-option">
                            <input
                                type="radio"
                                id={`question-${question.id}-option-${index}`}
                                name={`question-${question.id}`}
                                value={String.fromCharCode(65 + index)} // A, B, C, D
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

    // Hiển thị UI đăng nhập nếu chưa đăng nhập
    if (!isLoggedIn) {
        return (
            <div className="test-not-found">
                <Navbar />
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
        );
    }

    if (loading) {
        return (
            <div className="test-loading">
                <Navbar />
                <div className="container mx-auto text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <h2 className="text-2xl mt-4">Đang tải bài thi...</h2>
                </div>
            </div>
        );
    }

    if (error || !test) {
        return (
            <div className="test-not-found">
                <Navbar />
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
        );
    }

    const currentPassage = passages[currentPassageIndex];

    const passageQuestions = questions.filter(q =>
        q.passageId === currentPassage?.id
    );

    // Phương thức render câu hỏi dựa trên loại
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
                // Render UI cho câu hỏi matching
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

    const handleMouseDown = (e) => {
        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        const container = document.querySelector('.unified-content-container');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const mouseX = e.clientX - containerRect.left;

        // Calculate percentage (between 20% and 80%)
        const contentWidth = Math.min(Math.max((mouseX / containerWidth) * 100, 20), 80);

        // Apply widths
        const contentSection = document.querySelector('.content-section');
        const questionsSection = document.querySelector('.questions-section');

        if (contentSection && questionsSection) {
            contentSection.style.width = `${contentWidth}%`;
            questionsSection.style.width = `${100 - contentWidth - 1}%`; // 1% for divider
        }
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="test-detail-page">
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

            {/* ✅ LISTENING TEST - Sử dụng component mới */}
            {!loading && !error && test && testType === 'LISTENING' && (
                <ListeningTestDisplay
                    test={test}
                    audioList={audioList}
                    questions={questions}
                    userAnswers={userAnswers}
                    onAnswerChange={handleAnswerChange}
                    isSubmitted={submitting}
                    timer={timer}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />
            )}

            {/* ✅ READING TEST - Giữ nguyên giao diện cũ */}
            {!loading && !error && test && testType === 'READING' && (
                <div className="main-content">
                    <div className="test-main-container">
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

                        <div className="unified-content-container">
                            <div className="content-section">
                                <h2 className="section-title">{currentPassage?.title || test.testName}</h2>
                                {formatPassageContent(currentPassage?.content || '')}
                            </div>

                            <div className="section-divider"
                                 ref={dividerRef}
                                 onMouseDown={handleMouseDown}></div>

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
                        </div>
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
                            <strong>Chú ý:</strong> bạn có thể click vào số thứ tự câu hỏi trong bài để đánh dấu review
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
                                                            questionElement.scrollIntoView({ behavior: 'smooth' });
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
            )}

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

            {/* ✅ SPEAKING TEST - Component mới */}
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
                />
            )}

            {/* ✅ OTHER TEST TYPES - Có thể thêm sau */}
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

            {/* Token expiry warning - giữ nguyên */}
            <div id="token-expiry-warning" className="token-warning" style={{display: 'none'}}>
                <div className="token-warning-content">
                    <h3>Cảnh báo: Phiên làm bài sắp hết hạn</h3>
                    <p>Phiên đăng nhập của bạn sẽ hết hạn trong ít phút tới. Vui lòng lưu tiến trình làm bài và đăng nhập lại để tránh mất dữ liệu.</p>
                    <div className="token-warning-actions">
                        <button onClick={handleSaveProgress}>Lưu tiến trình</button>
                        <button onClick={() => {
                            handleSaveProgress();
                            navigate('/login');
                        }}>Đăng nhập lại</button>
                        <button onClick={() => document.getElementById('token-expiry-warning').style.display = 'none'}>Đóng</button>
                    </div>
                </div>
            </div>

            {/* Hidden Audio element - giữ nguyên */}
            <audio ref={audioRef} src={null} className="hidden"/>
        </div>
    );
}