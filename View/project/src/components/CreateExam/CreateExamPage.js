import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import './CreateExamPage.css';
import { useLocation, useNavigate } from "react-router-dom";
import { createTest, getTestForEdit, updateTest } from "../../api";
import EnhancedAudioUploader from "./EnhancedAudioUploader";
import ListeningQuestionsTab from "./ListeningQuestionsTab";
import WritingQuestionsTab from "./WritingQuestionsTab";
import SpeakingQuestionsTab from "./SpeakingQuestionsTab";

// Các loại câu hỏi dựa trên schema từ CSDL
const QUESTION_TYPES = [
    { value: 'MCQ', label: 'Multiple Choice (Trắc nghiệm)' },
    { value: 'MATCHING', label: 'Matching Headings (Nối tiêu đề)' },
    { value: 'FILL_IN_THE_BLANK', label: 'Fill in the Blank (Điền vào chỗ trống)' },
    { value: 'TRUE_FALSE_NOT_GIVEN', label: 'True/False/Not Given (Đúng/Sai/Không có)' },
    { value: 'SHORT_ANSWER', label: 'Short Answer (Trả lời ngắn)' },
    { value: 'ESSAY', label: 'Essay (Viết luận)' },
    { value: 'SPEAKING_TASK', label: 'Speaking Task (Nhiệm vụ nói)' },
];

export default function CreateExamPage() {
    const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
        defaultValues: {
            test_name: '',
            test_type: 'READING',
            description: '',
            instructions: '',
            duration_minutes: 60,
            passing_score: 5.0,
            is_practice: false,
            is_published: false,
            questions: [],
            reading_passages: [],
            listening_audio: []
        }
    });

    // Thêm ngay sau dòng có khai báo useState() cuối cùng
    const [questionSets, setQuestionSets] = useState([]);
    const [expandedQuestionSet, setExpandedQuestionSet] = useState(null);

    const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
        control,
        name: 'questions'
    });

    const { fields: passageFields, append: appendPassage, remove: removePassage } = useFieldArray({
        control,
        name: 'reading_passages'
    });

    const { fields: audioFields, append: appendAudio, remove: removeAudio } = useFieldArray({
        control,
        name: 'listening_audio'
    });

    // Theo dõi loại bài thi để hiển thị các phần tương ứng
    const testType = watch('test_type');

    // Các state cho UI tối ưu
    const [activeTab, setActiveTab] = useState('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [expandedQuestion, setExpandedQuestion] = useState(null);
    const [expandedPassage, setExpandedPassage] = useState(null);
    const [expandedAudio, setExpandedAudio] = useState(null);

    // State để hiển thị hướng dẫn nhanh
    const [showTips, setShowTips] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const testId = queryParams.get('id');
    const isEditMode = !!testId;

    const [initialLoading, setInitialLoading] = useState(isEditMode);

    const validateTokenBeforeSubmit = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('NO_TOKEN');
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = payload.exp - now;

            console.log('=== TOKEN VALIDATION ===');
            console.log('Token expires at:', new Date(payload.exp * 1000));
            console.log('Current time:', new Date());
            console.log('Time left (seconds):', timeLeft);
            console.log('Time left (minutes):', Math.floor(timeLeft / 60));

            if (timeLeft <= 0) {
                throw new Error('TOKEN_EXPIRED');
            }

            if (timeLeft < 300) { // Less than 5 minutes
                console.warn('Token will expire soon!');
                return { valid: true, warning: true, timeLeft };
            }

            return { valid: true, warning: false, timeLeft };
        } catch (e) {
            console.error('Error validating token:', e);
            throw new Error('TOKEN_INVALID');
        }
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

    // Khi thay đổi loại bài thi, cập nhật các fields phù hợp
    useEffect(() => {
        if (isEditMode) {
            const fetchTestData = async () => {
                try {
                    setInitialLoading(true);
                    setError(null);

                    console.log(`Đang tải thông tin bài thi để chỉnh sửa, ID: ${testId}`);
                    const testData = await getTestForEdit(testId);

                    // Reset form với dữ liệu lấy được
                    reset(testData);

                    // Sau reset(testData);
                    // Thay thế phần xử lý sau reset(testData) trong useEffect của CreateExamPage.js
                    if (testData && testData.questions) {
                        console.log('=== PROCESSING LOADED TEST DATA WITH SUBTYPE DETECTION ===');

                        const currentPassages = testData.reading_passages || [];
                        const currentAudio = testData.listening_audio || [];

                        // Enhanced grouping with subType preservation
                        const groupMap = {};

                        testData.questions.forEach(q => {
                            const key = enhancedGroupKey(q, currentPassages, currentAudio);

                            if (!groupMap[key]) {
                                // ✅ Extract and preserve subType
                                const extractedSubType = extractSubTypeFromInstructions(q.question_set_instructions);
                                const cleanInstructions = (q.question_set_instructions || '').replace(/\[SUBTYPE:[^\]]+\]\s*/, '');

                                // UI index mapping
                                let uiPassageId = null;
                                let uiAudioId = null;

                                if (q.passage_id) {
                                    const passageIndex = currentPassages.findIndex(p => p.id === q.passage_id);
                                    uiPassageId = passageIndex !== -1 ? passageIndex + 1 : null;
                                }

                                if (q.audio_id) {
                                    const audioIndex = currentAudio.findIndex(a => a.id === q.audio_id);
                                    uiAudioId = audioIndex !== -1 ? audioIndex + 1 : null;
                                }

                                groupMap[key] = {
                                    id: 'set_' + Math.random(),
                                    type: q.question_type,
                                    subType: extractedSubType || q.question_type, // ✅ Preserve original subType
                                    passageId: uiPassageId,
                                    audioId: uiAudioId,
                                    instructions: cleanInstructions,
                                    context: q.context || '',
                                    questions: []
                                };

                                console.log(`✅ Created group with preserved subType:`, {
                                    type: q.question_type,
                                    subType: extractedSubType,
                                    key: key.substring(0, 50) + '...'
                                });
                            }

                            groupMap[key].questions.push({
                                id: q.question_id,
                                questionText: q.question_text,
                                questionType: q.question_type,
                                options: q.options || [],
                                correctAnswer: q.correct_answer,
                                explanation: q.explanation,
                                orderInTest: q.order_in_test,
                                alternativeAnswers: q.alternative_answers || '',
                                context: q.context || ''
                            });
                        });

                        // ✅ Generate names based on preserved subType
                        const finalQuestionSets = Object.entries(groupMap).map(([key, group], setIndex) => {
                            let setName;
                            const typeCount = Object.values(groupMap)
                                .filter(g => g.subType === group.subType).length;

                            const suffix = typeCount > 1 ? ` ${setIndex + 1}` : '';

                            // ✅ Use preserved subType for naming
                            switch (group.subType) {
                                case 'NOTE_COMPLETION':
                                    setName = `Note Completion${suffix}`;
                                    break;
                                case 'FORM_FILLING':
                                    setName = `Form Filling${suffix}`;
                                    break;
                                case 'TABLE_COMPLETION':
                                    setName = `Table Completion${suffix}`;
                                    break;
                                case 'PLAN_MAP_COMPLETION':
                                    setName = `Plan/Map Completion${suffix}`;
                                    break;
                                case 'MCQ':
                                    setName = `Multiple Choice Questions${suffix}`;
                                    break;
                                case 'MATCHING':
                                    setName = `Matching Headings${suffix}`;
                                    break;
                                case 'SHORT_ANSWER':
                                    setName = `Short Answer Questions${suffix}`;
                                    break;
                                default:
                                    // Fallback với context detection (cho backward compatibility)
                                    if (group.type === 'FILL_IN_THE_BLANK' && group.context) {
                                        if (group.context.includes('Notes') || group.context.includes('notes')) {
                                            setName = `Note Completion${suffix}`;
                                            group.subType = 'NOTE_COMPLETION'; // Update subType
                                        } else if (group.context.includes('Form') || group.context.includes('FORM')) {
                                            setName = `Form Filling${suffix}`;
                                            group.subType = 'FORM_FILLING';
                                        } else if (group.context.includes('Table') || group.context.includes('|')) {
                                            setName = `Table Completion${suffix}`;
                                            group.subType = 'TABLE_COMPLETION';
                                        } else if (group.context.includes('Map') || group.context.includes('Plan')) {
                                            setName = `Plan/Map Completion${suffix}`;
                                            group.subType = 'PLAN_MAP_COMPLETION';
                                        } else {
                                            setName = `Flexible Context${suffix}`;
                                            group.subType = 'FLEXIBLE_CONTEXT';
                                        }
                                    } else {
                                        setName = `${group.type} Questions${suffix}`;
                                    }
                            }

                            return {
                                ...group,
                                name: setName,
                                // ✅ PRESERVE all critical fields
                                context: group.context || '',
                                requiresContext: !!(group.context && group.context.trim()) ||
                                    ['NOTE_COMPLETION', 'FORM_FILLING', 'TABLE_COMPLETION', 'PLAN_MAP_COMPLETION', 'FLEXIBLE_CONTEXT'].includes(group.subType),
                                supportsSimpleEditor: group.subType === 'TABLE_COMPLETION'
                            };
                        });

                        console.log('✅ Final question sets with preserved subTypes:',
                            finalQuestionSets.map(s => ({ name: s.name, subType: s.subType }))
                        );

                        setQuestionSets(finalQuestionSets);
                    }
                } catch (err) {
                    console.error("Lỗi khi tải thông tin bài thi:", err);

                    let errorMessage = "Có lỗi xảy ra khi tải thông tin bài thi: ";

                    if (err.response) {
                        if (err.response.status === 404) {
                            errorMessage = "Không tìm thấy bài thi yêu cầu.";
                        } else if (err.response.status === 401) {
                            errorMessage = "Bạn không có quyền chỉnh sửa bài thi này. Vui lòng đăng nhập lại.";
                        } else {
                            errorMessage += err.response.data || `${err.response.status} - ${err.response.statusText}`;
                        }
                    } else if (err.request) {
                        errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.";
                    } else {
                        errorMessage += err.message || "Lỗi không xác định";
                    }

                    setError(errorMessage);
                    alert(errorMessage);
                } finally {
                    setInitialLoading(false);
                }
            };

            fetchTestData();
        }
    }, [testId, isEditMode, reset]);



    useEffect(() => {
        // ✅ Restore form draft nếu có
        const savedDraft = localStorage.getItem('createExamDraft');
        if (savedDraft && !isEditMode) {
            try {
                const draftData = JSON.parse(savedDraft);
                console.log('📋 Restoring form draft:', draftData);

                // Chỉ restore basic fields, không restore sensitive data
                Object.keys(draftData).forEach(key => {
                    if (draftData[key] !== undefined && draftData[key] !== null) {
                        setValue(key, draftData[key]);
                    }
                });

                // ✅ Show notification
                setTimeout(() => {
                    alert('Đã khôi phục thông tin cơ bản từ lần tạo bài trước đó.');
                }, 500);

                // ✅ Clear draft sau khi restore
                localStorage.removeItem('createExamDraft');

            } catch (draftError) {
                console.warn('Could not restore draft:', draftError);
                localStorage.removeItem('createExamDraft');
            }
        }
    }, [isEditMode, setValue]);

    // Thêm useEffect để debug form submit
    useEffect(() => {
        const formElement = document.querySelector('form');

        const handleFormSubmit = (e) => {
            console.log("Form submit detected!", e);
            console.trace("Form submit stack trace");
            e.preventDefault();
        };

        if (formElement) {
            formElement.addEventListener('submit', handleFormSubmit);
        }

        return () => {
            if (formElement) {
                formElement.removeEventListener('submit', handleFormSubmit);
            }
        };
    }, []);

    // Thêm useEffect để ngăn chặn submit form khi nhấn Enter
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' && e.target.tagName.toLowerCase() !== 'textarea') {
                e.preventDefault();
                console.log('Enter key press prevented in input field');
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Thêm useEffect để khởi tạo nhóm câu hỏi từ dữ liệu có sẵn
    useEffect(() => {
        if (questionFields && questionFields.length > 0 && questionSets.length === 0) {
            console.log('=== INITIALIZING QUESTION SETS WITH INSTRUCTIONS, PASSAGES & CONTEXT ===');

            // Debug: Log tất cả questions từ database
            questionFields.forEach((q, idx) => {
                console.log(`Question ${idx + 1}:`, {
                    id: q.id,
                    type: watch(`questions.${idx}.question_type`),
                    text: watch(`questions.${idx}.question_text`)?.substring(0, 50),
                    passageId: watch(`questions.${idx}.passage_id`),
                    audioId: watch(`questions.${idx}.audio_id`),
                    instructions: watch(`questions.${idx}.question_set_instructions`),
                    context: watch(`questions.${idx}.context`)?.substring(0, 50) + '...',
                    correctAnswer: watch(`questions.${idx}.correct_answer`),
                    explanation: watch(`questions.${idx}.explanation`)
                });
            });

            // Debug: Log các passages hiện có
            const currentPassages = watch('reading_passages') || [];
            console.log('Current passages:', currentPassages.map(p => ({ id: p.id, title: p.title })));

            // Debug: Log các audio hiện có
            const currentAudio = watch('listening_audio') || [];
            console.log('Current audio:', currentAudio.map(a => ({ id: a.id, title: a.title })));

            // Group questions theo: type + passage_id + audio_id + instructions + context
            const questionGroups = {};

            questionFields.forEach((q, questionIndex) => {
                const questionType = watch(`questions.${questionIndex}.question_type`);
                const passageId = watch(`questions.${questionIndex}.passage_id`) || null;
                const audioId = watch(`questions.${questionIndex}.audio_id`) || null;
                const setInstructions = watch(`questions.${questionIndex}.question_set_instructions`) || '';
                // ✅ THÊM: Context từ form data
                const questionContext = watch(`questions.${questionIndex}.context`) || '';

                // ✅ FIX: Chuyển đổi database ID về UI index
                let uiPassageId = null;
                let uiAudioId = null;

                // Tìm index của passage trong mảng passages hiện tại
                if (passageId && currentPassages.length > 0) {
                    const passageIndex = currentPassages.findIndex(p => p.id === passageId);
                    if (passageIndex !== -1) {
                        uiPassageId = passageIndex + 1; // UI sử dụng 1-based index
                        console.log(`Question ${questionIndex + 1}: Found passage DB ID ${passageId} at UI index ${uiPassageId}`);
                    } else {
                        console.warn(`Question ${questionIndex + 1}: Passage DB ID ${passageId} not found in current passages`);
                    }
                }

                // Tìm index của audio trong mảng audio hiện tại
                if (audioId && currentAudio.length > 0) {
                    const audioIndex = currentAudio.findIndex(a => a.id === audioId);
                    if (audioIndex !== -1) {
                        uiAudioId = audioIndex + 1; // UI sử dụng 1-based index
                        console.log(`Question ${questionIndex + 1}: Found audio DB ID ${audioId} at UI index ${uiAudioId}`);
                    } else {
                        console.warn(`Question ${questionIndex + 1}: Audio DB ID ${audioId} not found in current audio`);
                    }
                }

                // Tạo key để group - sử dụng UI index + context
                const groupKey = `${questionType}_${uiPassageId || 'none'}_${uiAudioId || 'none'}_${setInstructions}_${questionContext}`;

                if (!questionGroups[groupKey]) {
                    questionGroups[groupKey] = {
                        type: questionType,
                        passageId: uiPassageId, // ✅ Sử dụng UI index
                        audioId: uiAudioId,     // ✅ Sử dụng UI index
                        instructions: setInstructions,
                        // ✅ THÊM: Context cho question set
                        context: questionContext,
                        questions: []
                    };
                }

                questionGroups[groupKey].questions.push({
                    id: q.id,
                    questionText: watch(`questions.${questionIndex}.question_text`) || '',
                    questionType: questionType,
                    options: watch(`questions.${questionIndex}.options`) || [],
                    correctAnswer: watch(`questions.${questionIndex}.correct_answer`) || (questionType === 'MCQ' ? 'A' : ''),
                    explanation: watch(`questions.${questionIndex}.explanation`) || '',
                    alternativeAnswers: watch(`questions.${questionIndex}.alternative_answers`) || '',
                    orderInTest: watch(`questions.${questionIndex}.order_in_test`) || (questionIndex + 1),
                    // ✅ THÊM: Context cho individual question
                    context: questionContext
                });
            });

            console.log('Question groups created with UI indexes and context:', questionGroups);

            // Convert groups thành question sets
            const sets = Object.entries(questionGroups).map(([key, group], setIndex) => {
                let setName;
                const typeCount = Object.values(questionGroups)
                    .filter(g => g.type === group.type).length;

                const suffix = typeCount > 1 ? ` ${setIndex + 1}` : '';

                // ✅ LISTENING specific naming with context detection
                if (group.type === 'FILL_IN_THE_BLANK' && group.context) {
                    if (group.context.includes('Notes') || group.context.includes('notes')) {
                        setName = `Note Completion${suffix}`;
                    } else if (group.context.includes('Form') || group.context.includes('FORM')) {
                        setName = `Form Filling${suffix}`;
                    } else if (group.context.includes('Table') || group.context.includes('|')) {
                        setName = `Table Completion${suffix}`;
                    } else if (group.context.includes('Map') || group.context.includes('Plan')) {
                        setName = `Plan/Map Completion${suffix}`;
                    } else {
                        setName = `Flexible Context${suffix}`;
                    }
                } else {
                    switch (group.type) {
                        case 'MCQ':
                            setName = `Multiple Choice Questions${suffix}`;
                            break;
                        case 'MATCHING':
                            setName = `Matching Headings${suffix}`;
                            break;
                        case 'FILL_IN_THE_BLANK':
                            setName = `Fill in the Blanks${suffix}`;
                            break;
                        case 'TRUE_FALSE_NOT_GIVEN':
                            setName = `True/False/Not Given${suffix}`;
                            break;
                        case 'SHORT_ANSWER':
                            setName = `Short Answer Questions${suffix}`;
                            break;
                        default:
                            setName = `${group.type} Questions${suffix}`;
                    }
                }

                const questionSet = {
                    id: `set_${Date.now()}_${setIndex}`,
                    name: setName,
                    type: group.type,
                    questions: group.questions,
                    passageId: group.passageId, // ✅ Đã được chuyển thành UI index
                    audioId: group.audioId,     // ✅ Đã được chuyển thành UI index
                    instructions: group.instructions || '',
                    // ✅ THÊM: Context fields
                    context: group.context || '',
                    requiresContext: !!(group.context && group.context.trim()),
                    subType: group.type === 'FILL_IN_THE_BLANK' && group.context ?
                        'FLEXIBLE_CONTEXT' : group.type
                };

                console.log(`✅ Created question set: ${setName}`, {
                    type: group.type,
                    passageId: group.passageId,
                    audioId: group.audioId,
                    instructions: group.instructions?.substring(0, 50) + "...",
                    context: group.context?.substring(0, 50) + "...",
                    requiresContext: questionSet.requiresContext,
                    questionCount: group.questions.length
                });

                return questionSet;
            });

            console.log('✅ Final question sets with UI indexes and context:', sets);
            setQuestionSets(sets);
        }
    }, [questionFields.length, questionSets.length]);

// ✅ THÊM: useEffect riêng để debug khi passages thay đổi
    useEffect(() => {
        const passages = watch('reading_passages');
        if (passages && passages.length > 0) {
            console.log('=== PASSAGES UPDATED ===');
            passages.forEach((p, idx) => {
                console.log(`Passage ${idx + 1} (UI index ${idx + 1}):`, {
                    id: p.id,
                    title: p.title,
                    uiIndex: idx + 1
                });
            });
        }
    }, [watch('reading_passages')]);

    useEffect(() => {
        console.log('Test type changed to:', testType, 'Current tab:', activeTab);

        // Tự động chuyển tab khi test type thay đổi và tab hiện tại không phù hợp
        if (testType === 'READING' && activeTab === 'audio') {
            console.log('Auto-switching from audio to passages');
            setActiveTab('passages');
        } else if (testType === 'LISTENING' && activeTab === 'passages') {
            console.log('Auto-switching from passages to audio');
            setActiveTab('audio');
        } else if (!['READING', 'LISTENING'].includes(testType) && ['passages', 'audio'].includes(activeTab)) {
            console.log('Auto-switching to questions for test type:', testType);
            setActiveTab('questions');
        }
    }, [testType]);

    // Thay thế hàm handleAudioUploaded trong CreateExamPage.js bằng version này:

    const handleAudioUploaded = (audioInfo, audioIndex) => {
        console.log('=== HANDLE AUDIO UPLOADED FOR UPDATE ===');
        console.log('Received audioInfo:', audioInfo);
        console.log('Received audioIndex:', audioIndex);
        console.log('Is Edit Mode:', isEditMode);

        // ✅ FIX: Xử lý khi audioInfo là null (xóa audio)
        if (audioInfo === null) {
            console.log('Audio được xóa, clearing form values...');

            // ✅ CAREFUL: Don't clear all data, preserve existing if available
            const existingAudio = watch(`listening_audio.${audioIndex}`);
            console.log('Existing audio before clear:', existingAudio);

            // ✅ Only clear new upload data, keep existing file_path if available
            setValue(`listening_audio.${audioIndex}.audio_base64`, null);
            setValue(`listening_audio.${audioIndex}.original_file_name`, null);
            setValue(`listening_audio.${audioIndex}.file_size`, null);
            setValue(`listening_audio.${audioIndex}.duration_seconds`, null);
            setValue(`listening_audio.${audioIndex}.mime_type`, null);

            // ✅ DON'T clear file_path if it exists (preserve existing)
            if (!existingAudio?.file_path) {
                setValue(`listening_audio.${audioIndex}.file_path`, null);
            }

            console.log('✅ Audio data cleared (new upload data only)');
            return;
        }

        // Validate audioInfo
        if (!audioInfo) {
            console.error('❌ audioInfo is null/undefined!');
            return;
        }

        if (!audioInfo.audioBase64) {
            console.error('❌ audioInfo.audioBase64 is missing!');
            console.error('audioInfo keys:', Object.keys(audioInfo));
            return;
        }

        console.log('✅ audioInfo validation passed');

        // ✅ ENHANCED: Set form values with update context
        console.log('Setting form values for update...');

        try {
            // Get existing data to preserve some fields
            const existingAudio = watch(`listening_audio.${audioIndex}`);
            console.log('Existing audio data:', {
                id: existingAudio?.id,
                title: existingAudio?.title,
                section: existingAudio?.section,
                hasExistingBase64: !!existingAudio?.audio_base64,
                hasExistingFilePath: !!existingAudio?.file_path
            });

            // ✅ Set new audio data
            setValue(`listening_audio.${audioIndex}.audio_base64`, audioInfo.audioBase64);
            console.log('✅ Set audio_base64 - Length:', audioInfo.audioBase64.length);

            setValue(`listening_audio.${audioIndex}.original_file_name`, audioInfo.originalFileName);
            console.log('✅ Set original_file_name:', audioInfo.originalFileName);

            setValue(`listening_audio.${audioIndex}.file_size`, audioInfo.fileSize);
            console.log('✅ Set file_size:', audioInfo.fileSize);

            setValue(`listening_audio.${audioIndex}.duration_seconds`, audioInfo.durationSeconds || audioInfo.duration);
            console.log('✅ Set duration_seconds:', audioInfo.durationSeconds || audioInfo.duration);

            setValue(`listening_audio.${audioIndex}.mime_type`, audioInfo.mimeType);
            console.log('✅ Set mime_type:', audioInfo.mimeType);

            // ✅ Clear old file_path when using new base64
            setValue(`listening_audio.${audioIndex}.file_path`, null);
            console.log('✅ Cleared file_path (using new base64)');

            // ✅ PRESERVE: Keep existing metadata if available
            if (existingAudio?.id && !isEditMode) {
                // Keep ID for reference (but only if not in edit mode to avoid conflicts)
                setValue(`listening_audio.${audioIndex}.id`, existingAudio.id);
                console.log('✅ Preserved existing ID:', existingAudio.id);
            }

            // ✅ UPDATE: Trigger form validation
            setTimeout(() => {
                const verifyData = watch(`listening_audio.${audioIndex}`);
                console.log('=== IMMEDIATE VERIFICATION AFTER UPDATE ===');
                console.log(`listening_audio.${audioIndex}:`, {
                    id: verifyData.id,
                    title: verifyData.title,
                    section: verifyData.section,
                    file_type: verifyData.file_type,
                    hasAudioBase64: !!verifyData.audio_base64,
                    audioBase64Length: verifyData.audio_base64?.length,
                    original_file_name: verifyData.original_file_name,
                    file_size: verifyData.file_size,
                    duration_seconds: verifyData.duration_seconds,
                    mime_type: verifyData.mime_type,
                    file_path: verifyData.file_path
                });

                if (!verifyData.audio_base64) {
                    console.error('❌ VERIFICATION FAILED: audio_base64 not set in form!');
                } else {
                    console.log('✅ VERIFICATION PASSED: audio_base64 is in form');
                }
            }, 100);

        } catch (error) {
            console.error('❌ Error setting form values for update:', error);
        }
    };

    const debugAudioDataBeforeSubmit = () => {
        console.log('=== DEBUG AUDIO DATA BEFORE SUBMIT ===');
        const audioData = watch('listening_audio') || [];

        audioData.forEach((audio, index) => {
            console.log(`\nAudio ${index + 1} - Pre-submit check:`);
            console.log('  ID:', audio.id);
            console.log('  Title:', audio.title);
            console.log('  Section:', audio.section);
            console.log('  File Type:', audio.file_type);
            console.log('  Has audio_base64:', !!audio.audio_base64);
            console.log('  Has file_path:', !!audio.file_path);
            console.log('  Original filename:', audio.original_file_name);
            console.log('  File size:', audio.file_size);
            console.log('  Duration:', audio.duration_seconds);
            console.log('  MIME type:', audio.mime_type);

            if (audio.audio_base64) {
                console.log('  Base64 length:', audio.audio_base64.length);
                console.log('  Base64 preview:', audio.audio_base64.substring(0, 50) + '...');
            }

            if (!audio.audio_base64 && !audio.file_path) {
                console.error('  ❌ NO AUDIO DATA - This will cause audio to be deleted!');
            } else {
                console.log('  ✅ Has audio data');
            }
        });

        return audioData.every(audio => audio.audio_base64 || audio.file_path);
    };

    // Toggle mở rộng một đoạn văn
    const togglePassage = (idx) => {
        setExpandedPassage(expandedPassage === idx ? null : idx);
    };

    // Toggle mở rộng một audio
    const toggleAudio = (idx) => {
        setExpandedAudio(expandedAudio === idx ? null : idx);
    };

    // Thêm câu hỏi gắn với đoạn văn
    const addQuestionForPassage = (passageIdx) => {
        appendQuestion({
            question_type: 'MCQ',
            question_text: '',
            options: ['', '', '', ''],
            passage_id: passageIdx + 1, // Passage ID là số thứ tự + 1
            correct_answer: '',
            order_in_test: questionFields.length + 1
        });
        // Tự động chuyển sang tab Câu hỏi
        setActiveTab('questions');
        // Tự động mở rộng câu hỏi vừa thêm
        setTimeout(() => {
            setExpandedQuestion(questionFields.length);
        }, 100);
    };

    // Thêm câu hỏi gắn với audio
    const addQuestionForAudio = (audioIdx) => {
        appendQuestion({
            question_type: 'MCQ',
            question_text: '',
            options: ['', '', '', ''],
            audio_id: audioIdx + 1, // Audio ID là số thứ tự + 1
            correct_answer: '',
            order_in_test: questionFields.length + 1
        });
        // Tự động chuyển sang tab Câu hỏi
        setActiveTab('questions');
        // Tự động mở rộng câu hỏi vừa thêm
        setTimeout(() => {
            setExpandedQuestion(questionFields.length);
        }, 100);
    };

    // Thêm một nhóm câu hỏi mới
    const addQuestionSet = (setType) => {
        const newSetId = `set_${Date.now()}`;

        const questionsInSet = Array(setType.defaultCount).fill(0).map((_, idx) => {
            // Xác định correctAnswer mặc định dựa trên loại câu hỏi
            let defaultCorrectAnswer = '';
            if (setType.type === 'MCQ') {
                defaultCorrectAnswer = 'A';
            } else if (setType.type === 'TRUE_FALSE_NOT_GIVEN') {
                defaultCorrectAnswer = 'TRUE';
            }

            return {
                id: `q_${Date.now()}_${idx}`,
                questionText: '',
                questionType: setType.type,
                options: setType.type === 'MCQ' ? ['', '', '', ''] : [],
                correctAnswer: defaultCorrectAnswer,
                explanation: '',
                orderInTest: questionFields.length + idx + 1
            };
        });

        const newSet = {
            id: newSetId,
            name: setType.name,
            type: setType.type,
            questions: questionsInSet,
            passageId: null,
            audioId: null,
            instructions: ''
        };

        setQuestionSets([...questionSets, newSet]);
        setExpandedQuestionSet(newSetId);

        // Đồng bộ với danh sách câu hỏi hiện tại
        syncQuestionsFromSets([...questionSets, newSet]);
    };

// Xóa một nhóm câu hỏi
    const removeQuestionSet = (setId) => {
        const updatedSets = questionSets.filter(set => set.id !== setId);
        setQuestionSets(updatedSets);
        if (expandedQuestionSet === setId) {
            setExpandedQuestionSet(null);
        }

        // Đồng bộ với danh sách câu hỏi
        syncQuestionsFromSets(updatedSets);
    };

// Toggle mở rộng nhóm câu hỏi
    const toggleExpandSet = (setId) => {
        setExpandedQuestionSet(expandedQuestionSet === setId ? null : setId);
    };

// Thêm câu hỏi vào nhóm
    const addQuestionToSet = (setId) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                // Xác định correctAnswer mặc định dựa trên loại câu hỏi
                let defaultCorrectAnswer = '';
                if (set.type === 'MCQ') {
                    defaultCorrectAnswer = 'A';
                } else if (set.type === 'TRUE_FALSE_NOT_GIVEN') {
                    defaultCorrectAnswer = 'TRUE';
                }

                const newQuestion = {
                    id: `q_${Date.now()}`,
                    questionText: '',
                    questionType: set.type,
                    options: set.type === 'MCQ' ? ['', '', '', ''] : [],
                    correctAnswer: defaultCorrectAnswer,
                    explanation: '',
                    orderInTest: set.questions.length > 0
                        ? Math.max(...set.questions.map(q => q.orderInTest)) + 1
                        : questionFields.length + 1
                };
                return {...set, questions: [...set.questions, newQuestion]};
            }
            return set;
        });

        setQuestionSets(updatedSets);

        // Đồng bộ với danh sách câu hỏi
        syncQuestionsFromSets(updatedSets);
    };

    const renderCurrentTab = () => {
        console.log('Rendering tab:', activeTab, 'for testType:', testType);

        // Kiểm tra xem tab hiện tại có hợp lệ với test type không
        if (activeTab === 'passages' && testType !== 'READING') {
            console.warn('Invalid tab "passages" for test type:', testType);
            // Tự động chuyển về tab phù hợp
            const correctTab = testType === 'LISTENING' ? 'audio' : 'questions';
            setActiveTab(correctTab);
            return tabContent[correctTab];
        }

        if (activeTab === 'audio' && testType !== 'LISTENING') {
            console.warn('Invalid tab "audio" for test type:', testType);
            // Tự động chuyển về tab phù hợp
            const correctTab = testType === 'READING' ? 'passages' : 'questions';
            setActiveTab(correctTab);
            return tabContent[correctTab];
        }

        const content = tabContent[activeTab];
        if (!content) {
            console.error('No content for tab:', activeTab);
            return (
                <div className="error-state">
                    <h3>Tab không tìm thấy</h3>
                    <p>Tab "{activeTab}" không tồn tại hoặc không phù hợp với loại bài thi "{testType}".</p>
                    <button onClick={() => setActiveTab('info')}>Quay về thông tin</button>
                </div>
            );
        }

        return content;
    };

// Xóa câu hỏi khỏi nhóm
    const removeQuestionFromSet = (setId, questionIndex) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const updatedQuestions = [...set.questions];
                updatedQuestions.splice(questionIndex, 1);
                return {...set, questions: updatedQuestions};
            }
            return set;
        });

        setQuestionSets(updatedSets);

        // Đồng bộ với danh sách câu hỏi
        syncQuestionsFromSets(updatedSets);
    };

// Cập nhật trường hướng dẫn của nhóm câu hỏi
    const updateQuestionSetInstructions = (setId, value) => {
        console.log(`Updating instructions for set ${setId} to: ${value}`);

        const updatedSets = questionSets.map(set =>
            set.id === setId ? {...set, instructions: value} : set
        );

        setQuestionSets(updatedSets);

        // QUAN TRỌNG: Đồng bộ ngay với form để lưu instructions
        syncQuestionsFromSets(updatedSets);
    };

// Thay thế hàm updateQuestionSetPassage trong CreateExamPage.js
    const updateQuestionSetPassage = (setId, passageId) => {
        console.log(`Updating passage for set ${setId} to: ${passageId}`);

        const updatedSets = questionSets.map(set =>
            set.id === setId ? {...set, passageId: passageId || null} : set
        );

        setQuestionSets(updatedSets);

        // QUAN TRỌNG: Đồng bộ ngay với form để lưu passage relationship
        syncQuestionsFromSets(updatedSets);
    };

// Thay thế hàm updateQuestionSetAudio trong CreateExamPage.js
    const updateQuestionSetAudio = (setId, audioId) => {
        console.log(`Updating audio for set ${setId} to: ${audioId}`);

        const updatedSets = questionSets.map(set =>
            set.id === setId ? {...set, audioId: audioId || null} : set
        );

        setQuestionSets(updatedSets);

        // QUAN TRỌNG: Đồng bộ ngay với form để lưu audio relationship
        syncQuestionsFromSets(updatedSets);
    };

// Cập nhật nội dung câu hỏi
    const updateQuestionText = (setId, questionIndex, text) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const updatedQuestions = set.questions.map((q, i) =>
                    i === questionIndex ? {...q, questionText: text} : q
                );
                return {...set, questions: updatedQuestions};
            }
            return set;
        });

        setQuestionSets(updatedSets);

        // Đồng bộ với danh sách câu hỏi
        syncQuestionsFromSets(updatedSets);
    };

// Cập nhật lựa chọn cho câu hỏi MCQ
    const updateQuestionOption = (setId, questionIndex, optionIndex, value) => {
        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const updatedQuestions = set.questions.map((q, i) => {
                    if (i === questionIndex) {
                        const newOptions = [...(q.options || [])];
                        newOptions[optionIndex] = value;
                        return {...q, options: newOptions};
                    }
                    return q;
                });
                return {...set, questions: updatedQuestions};
            }
            return set;
        });

        setQuestionSets(updatedSets);

        // Đồng bộ với danh sách câu hỏi
        syncQuestionsFromSets(updatedSets);
    };

// Cập nhật đáp án đúng
    const updateQuestionCorrectAnswer = (setId, questionIndex, value) => {
        console.log(`Updating correct answer for set ${setId}, question ${questionIndex} to: ${value}`);

        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const updatedQuestions = set.questions.map((q, i) =>
                    i === questionIndex ? {...q, correctAnswer: value} : q
                );
                return {...set, questions: updatedQuestions};
            }
            return set;
        });

        setQuestionSets(updatedSets);

        // Đồng bộ với danh sách câu hỏi
        syncQuestionsFromSets(updatedSets);
    };

// Render các trường theo loại câu hỏi
    // Thêm function updateQuestionExplanation vào đầu file (sau các function update khác)
    const updateQuestionExplanation = (setId, questionIndex, value) => {
        console.log(`Updating explanation for set ${setId}, question ${questionIndex} to: ${value}`);

        const updatedSets = questionSets.map(set => {
            if (set.id === setId) {
                const updatedQuestions = set.questions.map((q, i) =>
                    i === questionIndex ? {...q, explanation: value} : q
                );
                return {...set, questions: updatedQuestions};
            }
            return set;
        });

        setQuestionSets(updatedSets);
        syncQuestionsFromSets(updatedSets);
    };

// Thêm function renderQuestionTypeFields (đây là function bị thiếu)
    const renderQuestionTypeFields = (set, question, qIdx) => {
        const commonExplanationField = (
            <div className="explanation-field">
                <label>Giải thích đáp án:</label>
                <textarea
                    placeholder="Nhập giải thích tại sao đây là đáp án đúng..."
                    value={question.explanation || ''}
                    onChange={(e) => updateQuestionExplanation(set.id, qIdx, e.target.value)}
                    rows={3}
                    className="explanation-textarea"
                />
            </div>
        );

        switch(set.type) {
            case 'MCQ':
                const mcqCorrectAnswer = question.correctAnswer || 'A';

                return (
                    <div className="mcq-options">
                        {/* Options Input */}
                        {['A', 'B', 'C', 'D'].map((option, optIdx) => (
                            <div key={optIdx} className="mcq-option">
                                <label>{option}:</label>
                                <input
                                    type="text"
                                    placeholder={`Lựa chọn ${option}...`}
                                    value={question.options[optIdx] || ''}
                                    onChange={(e) => updateQuestionOption(set.id, qIdx, optIdx, e.target.value)}
                                />
                            </div>
                        ))}

                        {/* ✅ COPY từ ListeningQuestionBuilder.js */}
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
                                value={mcqCorrectAnswer}
                                onChange={(e) => updateQuestionCorrectAnswer(set.id, qIdx, e.target.value)}
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
                                Đáp án hiện tại: <strong style={{ color: '#007bff' }}>{mcqCorrectAnswer}</strong>
                            </div>
                        </div>

                        {commonExplanationField}
                    </div>
                );

            case 'TRUE_FALSE_NOT_GIVEN':
                return (
                    <div className="tf-options">
                        <div className="correct-answer">
                            <label>Đáp án đúng:</label>
                            <select
                                value={question.correctAnswer || 'TRUE'}
                                onChange={(e) => {
                                    console.log(`TRUE_FALSE_NOT_GIVEN answer changed to: ${e.target.value}`);
                                    updateQuestionCorrectAnswer(set.id, qIdx, e.target.value);
                                }}
                            >
                                <option value="TRUE">True</option>
                                <option value="FALSE">False</option>
                                <option value="NOT_GIVEN">Not Given</option>
                            </select>
                        </div>

                        {commonExplanationField}
                    </div>
                );

            case 'MATCHING':
                return (
                    <div className="matching-options">
                        <div className="generic-answer">
                            <label>Đáp án đúng:</label>
                            <input
                                type="text"
                                placeholder="Nhập đáp án đúng (ví dụ: A, B, C hoặc 1, 2, 3)..."
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuestionCorrectAnswer(set.id, qIdx, e.target.value)}
                            />
                        </div>

                        {commonExplanationField}
                    </div>
                );

            case 'FILL_IN_THE_BLANK':
                return (
                    <div className="fill-blank-options">
                        <div className="generic-answer">
                            <label>Đáp án đúng:</label>
                            <input
                                type="text"
                                placeholder="Nhập từ/cụm từ cần điền..."
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuestionCorrectAnswer(set.id, qIdx, e.target.value)}
                            />
                        </div>

                        {commonExplanationField}
                    </div>
                );

            case 'SHORT_ANSWER':
                return (
                    <div className="short-answer-options">
                        <div className="generic-answer">
                            <label>Đáp án mẫu:</label>
                            <textarea
                                placeholder="Nhập đáp án mẫu (có thể nhiều dòng)..."
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuestionCorrectAnswer(set.id, qIdx, e.target.value)}
                                rows={3}
                            />
                        </div>

                        {commonExplanationField}
                    </div>
                );

            case 'ESSAY':
                return (
                    <div className="essay-options">
                        <div className="generic-answer">
                            <label>Tiêu chí chấm điểm:</label>
                            <textarea
                                placeholder="Nhập tiêu chí chấm điểm cho bài luận..."
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuestionCorrectAnswer(set.id, qIdx, e.target.value)}
                                rows={4}
                            />
                        </div>

                        {commonExplanationField}
                    </div>
                );

            case 'SPEAKING_TASK':
                return (
                    <div className="speaking-task-options">
                        <div className="generic-answer">
                            <label>Tiêu chí đánh giá:</label>
                            <textarea
                                placeholder="Nhập tiêu chí đánh giá cho bài nói..."
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuestionCorrectAnswer(set.id, qIdx, e.target.value)}
                                rows={4}
                            />
                        </div>

                        {commonExplanationField}
                    </div>
                );

            // Loại câu hỏi khác
            default:
                return (
                    <div className="generic-options">
                        <div className="generic-answer">
                            <label>Đáp án đúng:</label>
                            <input
                                type="text"
                                placeholder="Nhập đáp án đúng..."
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuestionCorrectAnswer(set.id, qIdx, e.target.value)}
                            />
                        </div>

                        {commonExplanationField}
                    </div>
                );
        }
    };

// Đồng bộ câu hỏi từ các nhóm với danh sách câu hỏi của form
    // Thay thế hoàn toàn hàm syncQuestionsFromSets trong CreateExamPage.js
    const syncQuestionsFromSets = (sets) => {
        if (typeof setValue !== 'function') {
            console.warn('setValue function not available - cannot sync to form');
            return;
        }

        console.log('=== SYNC QUESTIONS WITH CONTEXT DEBUG ===');
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

                    // ✅ CRITICAL FIX: Ensure context is always included from SET
                    context: set.context || q.context || '',

                    // Audio/Passage relationships
                    audio_id: set.audioId ? parseInt(set.audioId, 10) : null,
                    passage_id: set.passageId ? parseInt(set.passageId, 10) : null,

                    // Options for MCQ
                    options: set.type === 'MCQ' ? (Array.isArray(q.options) ? q.options : ['', '', '', '']) : (q.options || [])
                };

                // ✅ DEBUG: Log each question mapping
                console.log(`  Question ${qIndex + 1}:`, {
                    id: result.question_id,
                    type: result.question_type,
                    hasContext: !!(result.context && result.context.trim()),
                    contextLength: result.context?.length || 0,
                    contextPreview: result.context?.substring(0, 50) || 'empty',
                    hasInstructions: !!(result.question_set_instructions && result.question_set_instructions.trim()),
                    audioId: result.audio_id,
                    passageId: result.passage_id
                });

                return result;
            });
        });

        console.log('\n=== FINAL QUESTIONS TO SEND ===');
        console.log('Total questions:', flatQuestions.length);

        // ✅ VALIDATION: Check context in final questions
        const questionsWithContext = flatQuestions.filter(q => q.context && q.context.trim());
        const questionsWithoutContext = flatQuestions.filter(q => !q.context || !q.context.trim());

        console.log('Questions WITH context:', questionsWithContext.length);
        console.log('Questions WITHOUT context:', questionsWithoutContext.length);

        flatQuestions.forEach((q, idx) => {
            console.log(`Question ${idx + 1}:`, {
                id: q.question_id,
                type: q.question_type,
                hasContext: !!(q.context && q.context.trim()),
                contextLength: q.context?.length || 0,
                hasInstructions: !!(q.question_set_instructions && q.question_set_instructions.trim()),
                audioId: q.audio_id,
                passageId: q.passage_id
            });
        });
        console.log('===============================');

        setValue('questions', flatQuestions);
    };

    // Hàm format đáp án để hiển thị trong preview
    const formatAnswerForDisplay = (questionType, correctAnswer) => {
        if (questionType === 'TRUE_FALSE_NOT_GIVEN') {
            switch(correctAnswer) {
                case 'TRUE':
                    return 'True';
                case 'FALSE':
                    return 'False';
                case 'NOT_GIVEN':
                    return 'Not Given';
                default:
                    return correctAnswer || 'Chưa chọn';
            }
        }
        return correctAnswer || 'Chưa có đáp án';
    };

    // Hàm onSubmit xử lý khi form được submit
    const onSubmit = async (formData) => {
        try {
            console.log('=== FORM SUBMISSION START ===');
            setIsSubmitting(true);
            setError(null);

            // ✅ STEP 0: Debug form data with context BEFORE processing
            console.log('=== FORM DATA DEBUG BEFORE SUBMIT ===');
            console.log('Questions count:', formData.questions?.length || 0);

            if (formData.questions) {
                formData.questions.forEach((q, idx) => {
                    console.log(`Question ${idx + 1}:`, {
                        id: q.question_id,
                        type: q.question_type,
                        hasContext: !!(q.context && q.context.trim()),
                        contextLength: q.context?.length || 0,
                        contextPreview: q.context?.substring(0, 50) || 'empty',
                        hasInstructions: !!(q.question_set_instructions && q.question_set_instructions.trim()),
                        instructionsLength: q.question_set_instructions?.length || 0,
                        audioId: q.audio_id,
                        passageId: q.passage_id
                    });
                });

                // Count stats
                const withContext = formData.questions.filter(q => q.context && q.context.trim());
                const withoutContext = formData.questions.filter(q => !q.context || !q.context.trim());

                console.log(`Summary: ${withContext.length} questions WITH context, ${withoutContext.length} questions WITHOUT context`);

                if (withoutContext.length > 0) {
                    console.warn('Questions WITHOUT context:', withoutContext.map(q => q.question_id));
                }
            }
            console.log('==========================================');

            const hasValidAudioData = debugAudioDataBeforeSubmit();

            if (!hasValidAudioData && isEditMode) {
                const confirmed = window.confirm(
                    'CẢNH BÁO: Một số audio không có dữ liệu và có thể bị xóa khi cập nhật. ' +
                    'Bạn có chắc chắn muốn tiếp tục không?'
                );

                if (!confirmed) {
                    setIsSubmitting(false);
                    return;
                }
            }

            // ✅ STEP 1: Validate token before submit
            try {
                const tokenValidation = validateTokenBeforeSubmit();

                if (tokenValidation.warning) {
                    const confirmed = window.confirm(
                        `Phiên đăng nhập sẽ hết hạn trong ${Math.floor(tokenValidation.timeLeft / 60)} phút. ` +
                        'Bạn có muốn tiếp tục không? (Nên đăng nhập lại để đảm bảo không bị gián đoạn)'
                    );

                    if (!confirmed) {
                        setIsSubmitting(false);
                        return;
                    }
                }
            } catch (tokenError) {
                let errorMessage;
                switch (tokenError.message) {
                    case 'NO_TOKEN':
                        errorMessage = 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.';
                        break;
                    case 'TOKEN_EXPIRED':
                        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                        break;
                    case 'TOKEN_INVALID':
                        errorMessage = 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.';
                        break;
                    default:
                        errorMessage = 'Có lỗi với phiên đăng nhập. Vui lòng đăng nhập lại.';
                }

                alert(errorMessage);
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }

            // ✅ STEP 2: Check data size for large requests
            const dataSize = JSON.stringify(formData).length;
            console.log('Request data size:', (dataSize / 1024).toFixed(2), 'KB');

            if (dataSize > 50 * 1024 * 1024) { // 50MB limit
                alert('Dữ liệu bài thi quá lớn (> 50MB). Vui lòng giảm kích thước audio hoặc nội dung.');
                setIsSubmitting(false);
                return;
            }

            // ✅ STEP 3: Sync questions with context preservation and process data
            console.log('=== SYNCING QUESTIONS WITH CONTEXT PRESERVATION ===');
            syncQuestionsFromSets(questionSets);

            const processedData = { ...formData };

            if (processedData.questions) {
                console.log('=== PROCESSING QUESTIONS WITH CONTEXT ===');
                processedData.questions = processedData.questions.map((q, idx) => {
                    const processedQuestion = { ...q };

                    // ✅ CRITICAL: Ensure context is preserved during processing
                    if (!processedQuestion.context) {
                        processedQuestion.context = '';
                    }

                    console.log(`Processing Q${idx + 1}:`, {
                        id: processedQuestion.question_id,
                        type: processedQuestion.question_type,
                        hasContextBefore: !!(q.context && q.context.trim()),
                        hasContextAfter: !!(processedQuestion.context && processedQuestion.context.trim()),
                        contextLength: processedQuestion.context?.length || 0
                    });

                    if (q.question_type === 'MCQ' && Array.isArray(q.options)) {
                        processedQuestion.options = q.options.length ? q.options : ['', '', '', ''];
                    }

                    if (q.question_type === 'TRUE_FALSE_NOT_GIVEN' && !q.correct_answer) {
                        processedQuestion.correct_answer = 'TRUE';
                    }

                    if (processedQuestion.passage_id && typeof processedQuestion.passage_id === 'string') {
                        processedQuestion.passage_id = parseInt(processedQuestion.passage_id, 10);
                    }

                    if (processedQuestion.audio_id && typeof processedQuestion.audio_id === 'string') {
                        processedQuestion.audio_id = parseInt(processedQuestion.audio_id, 10);
                    }

                    return processedQuestion;
                });

                // ✅ FINAL VALIDATION: Check context in processed data
                const finalQuestionsWithContext = processedData.questions.filter(q => q.context && q.context.trim());
                console.log(`✅ Final processed questions WITH context: ${finalQuestionsWithContext.length}/${processedData.questions.length}`);

                if (finalQuestionsWithContext.length > 0) {
                    console.log('Sample processed question with context:', {
                        id: finalQuestionsWithContext[0].question_id,
                        contextLength: finalQuestionsWithContext[0].context.length,
                        contextPreview: finalQuestionsWithContext[0].context.substring(0, 100) + '...'
                    });
                }

                // ✅ WARNING: Alert if context was lost during processing
                const originalWithContext = formData.questions?.filter(q => q.context && q.context.trim()).length || 0;
                const processedWithContext = finalQuestionsWithContext.length;

                if (originalWithContext > processedWithContext) {
                    console.warn(`⚠️ CONTEXT LOST: Original ${originalWithContext} → Processed ${processedWithContext}`);

                    const lostContextQuestions = formData.questions?.filter(q => {
                        const processed = processedData.questions.find(pq => pq.question_id === q.question_id);
                        return (q.context && q.context.trim()) && (!processed?.context || !processed.context.trim());
                    }) || [];

                    console.warn('Questions that lost context:', lostContextQuestions.map(q => q.question_id));

                    // Ask user if they want to continue
                    const continueWithoutContext = window.confirm(
                        `CẢNH BÁO: ${lostContextQuestions.length} câu hỏi bị mất context template. ` +
                        'Bạn có muốn tiếp tục không? (Nên kiểm tra lại dữ liệu trước khi lưu)'
                    );

                    if (!continueWithoutContext) {
                        setIsSubmitting(false);
                        return;
                    }
                }
            }

            // ✅ STEP 4: Submit with enhanced error handling and context tracking
            console.log('=== SUBMITTING TO SERVER ===');
            let response;

            if (isEditMode) {
                console.log(`Updating test ID: ${testId} with context data`);

                // Log context data being sent for update
                if (processedData.questions) {
                    const contextQuestions = processedData.questions.filter(q => q.context && q.context.trim());
                    console.log(`Sending ${contextQuestions.length} questions with context for update`);
                }

                response = await updateTest(testId, processedData);
            } else {
                console.log('Creating new test with context data');

                // Log context data being sent for create
                if (processedData.questions) {
                    const contextQuestions = processedData.questions.filter(q => q.context && q.context.trim());
                    console.log(`Sending ${contextQuestions.length} questions with context for creation`);
                }

                response = await createTest(processedData);
            }

            console.log('Response received:', response);

            // ✅ SUCCESS: Context submission completed
            const successMessage = isEditMode ?
                'Bài thi đã được cập nhật thành công!' :
                'Bài thi đã được tạo thành công!';

            console.log('✅ Context submission completed successfully');
            alert(successMessage);

            if (response && response.id) {
                // ✅ Optional: Verify context was saved by checking the saved test
                if (process.env.NODE_ENV === 'development') {
                    console.log('🔍 Verifying context was saved...');
                    setTimeout(async () => {
                        try {
                            const verifyResponse = await fetch(`/api/tests/${response.id}/context-debug`, {
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            });
                            if (verifyResponse.ok) {
                                const verifyData = await verifyResponse.json();
                                console.log('✅ Context verification:', verifyData);
                            }
                        } catch (verifyError) {
                            console.warn('Could not verify context save:', verifyError);
                        }
                    }, 1000);
                }

                navigate(`/test-detail/${response.id}`);
            } else {
                console.warn('Response lacks ID field:', response);
                setError('Không thể chuyển hướng - thiếu ID bài thi trong phản hồi.');
            }

        } catch (err) {
            console.error('=== FORM SUBMISSION ERROR ===');
            console.error('Error type:', err.constructor.name);
            console.error('Error message:', err.message);
            console.error('Error response:', err.response);

            // ✅ CONTEXT ERROR LOGGING: Log if error might be related to context
            if (err.message?.includes('context') || err.response?.data?.includes('context')) {
                console.error('🔴 CONTEXT-RELATED ERROR DETECTED');
                console.error('This error might be related to context template processing');

                // Log current context state for debugging
                if (questionSets && questionSets.length > 0) {
                    const setsWithContext = questionSets.filter(s => s.context && s.context.trim());
                    console.error('Current question sets with context:', setsWithContext.length);
                    setsWithContext.forEach((set, idx) => {
                        console.error(`Set ${idx + 1}:`, {
                            name: set.name,
                            type: set.type,
                            contextLength: set.context?.length || 0,
                            questionsCount: set.questions?.length || 0
                        });
                    });
                }
            }

            let errorMessage = 'Có lỗi không xác định khi xử lý bài thi: ';

            // ✅ Enhanced 401 handling - Form tự xử lý thay vì để interceptor làm
            if (err.response?.status === 401) {
                console.warn('🔐 401 Unauthorized - Handling in form');

                // ✅ Kiểm tra chi tiết lỗi 401
                const serverMessage = err.response.data?.message ||
                    (typeof err.response.data === 'string' ? err.response.data : '');

                if (serverMessage.includes('expired') || serverMessage.includes('hết hạn')) {
                    errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.";
                } else if (serverMessage.includes('invalid') || serverMessage.includes('không hợp lệ')) {
                    errorMessage = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.";
                } else {
                    errorMessage = "Có lỗi xác thực. Vui lòng đăng nhập lại để tạo bài thi.";
                }

                console.log('401 Error details:', {
                    serverMessage,
                    finalMessage: errorMessage
                });

                // ✅ Hiển thị thông báo rõ ràng cho user
                alert(errorMessage);

                // ✅ Clean up và redirect sau khi user đã đọc thông báo
                localStorage.removeItem('token');

                // ✅ Lưu current work để có thể restore sau khi login (INCLUDING context)
                const currentFormData = {
                    test_name: watch('test_name'),
                    test_type: watch('test_type'),
                    description: watch('description'),
                    instructions: watch('instructions'),
                    duration_minutes: watch('duration_minutes'),
                    passing_score: watch('passing_score'),
                    is_practice: watch('is_practice'),
                    is_published: watch('is_published')
                };

                // ✅ ENHANCED: Save question sets with context for recovery
                if (questionSets && questionSets.length > 0) {
                    try {
                        const contextRecoveryData = {
                            basicFormData: currentFormData,
                            questionSetsCount: questionSets.length,
                            questionSetsWithContext: questionSets.filter(s => s.context && s.context.trim()).length,
                            hasContextData: true,
                            timestamp: new Date().toISOString()
                        };

                        localStorage.setItem('createExamDraftWithContext', JSON.stringify(contextRecoveryData));
                        console.log('💾 Saved form draft with context info for recovery');
                    } catch (contextDraftError) {
                        console.warn('Could not save context draft:', contextDraftError);
                    }
                }

                // ✅ Lưu draft (không lưu sensitive data như questions)
                try {
                    localStorage.setItem('createExamDraft', JSON.stringify(currentFormData));
                    console.log('💾 Saved form draft for recovery');
                } catch (draftError) {
                    console.warn('Could not save draft:', draftError);
                }

                // ✅ Set redirect path
                localStorage.setItem('redirectAfterLogin', '/create-exam');

                // ✅ Trigger auth state update
                window.dispatchEvent(new Event('storage'));

                // ✅ Navigate to login với thông báo
                setTimeout(() => {
                    navigate('/login', {
                        state: {
                            message: 'Vui lòng đăng nhập lại để tiếp tục tạo bài thi. Thông tin cơ bản đã được lưu tạm.',
                            returnUrl: '/create-exam'
                        }
                    });
                }, 1000);

                return; // ✅ Early return để không hiển thị error message khác
            }
            // ✅ Xử lý các lỗi khác
            else if (err.response?.status === 403) {
                errorMessage = "Bạn không có quyền thực hiện thao tác này. Chỉ Teacher và Admin mới có thể tạo bài thi.";
            } else if (err.response?.status === 413) {
                errorMessage = "Dữ liệu quá lớn (> 50MB). Vui lòng giảm kích thước file audio hoặc nội dung.";
            } else if (err.response?.status === 408 || err.code === 'ECONNABORTED') {
                errorMessage = "Timeout - Dữ liệu quá lớn hoặc kết nối chậm. Vui lòng thử lại hoặc giảm kích thước dữ liệu.";
            } else if (err.response?.status === 500) {
                errorMessage = "Lỗi server. Vui lòng thử lại sau hoặc liên hệ admin nếu lỗi tiếp tục.";
            } else if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage += err.response.data;
                } else if (err.response.data?.message) {
                    errorMessage += err.response.data.message;
                } else {
                    errorMessage += JSON.stringify(err.response.data);
                }
            } else if (err.message) {
                if (err.message.includes('Network Error')) {
                    errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.";
                } else {
                    errorMessage += err.message;
                }
            }

            console.error('Final error message:', errorMessage);
            setError(errorMessage);
            alert(errorMessage);

            // ✅ CONTEXT ERROR RECOVERY: Provide additional guidance for context-related errors
            if (err.message?.includes('context') || errorMessage.includes('context')) {
                setTimeout(() => {
                    alert(
                        'Lỗi có thể liên quan đến Context Template. Các bước khắc phục:\n\n' +
                        '1. Kiểm tra Context Template có định dạng đúng không\n' +
                        '2. Đảm bảo sử dụng ___1___, ___2___ cho placeholders\n' +
                        '3. Kiểm tra kết nối mạng và thử lại\n' +
                        '4. Nếu vẫn lỗi, hãy liên hệ admin'
                    );
                }, 2000);
            }

        } finally {
            setIsSubmitting(false);
            console.log('=== FORM SUBMISSION END ===');
        }
    };

    // Component debug để kiểm tra dữ liệu question sets
    const QuestionSetDebugInfo = ({ set, index }) => {
        return (
            <div style={{
                background: '#f0f0f0',
                padding: '10px',
                margin: '5px 0',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
            }}>
                <strong>Set {index + 1} Debug Info:</strong><br/>
                - Type: {set.type}<br/>
                - PassageId: {set.passageId || 'null'}<br/>
                - AudioId: {set.audioId || 'null'}<br/>
                - Instructions: "{set.instructions || 'EMPTY'}"<br/>
                - Questions: {set.questions.length}
            </div>
        );
    };

// SỬA LẠI renderQuestionSetContent với debug info
    const renderQuestionSetContent = (set, showDebug = false) => {
        return (
            <div className="question-set-content">
                {/* THÊM DEBUG INFO - tạm thời để kiểm tra */}
                {showDebug && <QuestionSetDebugInfo set={set} index={questionSets.indexOf(set)} />}

                {/* Instructions cho question set */}
                <div className="question-set-instructions">
                    <label>
                        Hướng dẫn cho dạng bài này:
                        <textarea
                            placeholder="Ví dụ: Đọc đoạn văn và chọn tiêu đề phù hợp nhất..."
                            value={set.instructions || ''}
                            onChange={(e) => {
                                console.log(`Instructions changed for set ${set.id}:`, e.target.value);
                                updateQuestionSetInstructions(set.id, e.target.value);
                            }}
                            rows={2}
                            style={{ minHeight: '60px' }}
                        />
                    </label>
                    {/*<small style={{ color: '#666', fontSize: '12px' }}>*/}
                    {/*    Current value: "{set.instructions || 'EMPTY'}"*/}
                    {/*</small>*/}
                </div>

                {/* Passage selection cho READING */}
                {testType === 'READING' && (
                    <div className="set-passage-selection">
                        <label>
                            Đoạn văn liên quan:
                            <select
                                value={set.passageId || ''}
                                onChange={(e) => {
                                    console.log(`Passage changed for set ${set.id}:`, e.target.value);
                                    updateQuestionSetPassage(set.id, e.target.value);
                                }}
                            >
                                <option value="">-- Chọn đoạn văn --</option>
                                {passageFields.map((passage, passageIdx) => {
                                    // ✅ FIX: Hiển thị option với UI index nhưng kiểm tra theo cả UI index và DB ID
                                    const uiIndex = passageIdx + 1;
                                    const dbId = watch(`reading_passages.${passageIdx}.id`);

                                    return (
                                        <option key={passage.id} value={uiIndex}>
                                            Đoạn {uiIndex}: {watch(`reading_passages.${passageIdx}.title`) || 'Chưa có tiêu đề'}
                                        </option>
                                    );
                                })}
                            </select>
                        </label>
                        {/*<small style={{ color: '#666', fontSize: '12px' }}>*/}
                        {/*    Current passage ID: {set.passageId || 'NONE'}*/}
                        {/*    /!* ✅ THÊM: Debug info để hiển thị mapping *!/*/}
                        {/*    {set.passageId && (*/}
                        {/*        <div style={{ marginTop: '5px', fontSize: '11px', color: '#999' }}>*/}
                        {/*            Debug: UI Index = {set.passageId}*/}
                        {/*            {passageFields[parseInt(set.passageId) - 1] && (*/}
                        {/*                `, DB ID = ${watch(`reading_passages.${parseInt(set.passageId) - 1}.id`)}`*/}
                        {/*            )}*/}
                        {/*        </div>*/}
                        {/*    )}*/}
                        {/*</small>*/}
                    </div>
                )}

                {/* Audio selection cho LISTENING */}
                {testType === 'LISTENING' && (
                    <div className="set-audio-selection">
                        <label>
                            Audio liên quan:
                            <select
                                value={set.audioId || ''}
                                onChange={(e) => {
                                    console.log(`Audio changed for set ${set.id}:`, e.target.value);
                                    updateQuestionSetAudio(set.id, e.target.value);
                                }}
                            >
                                <option value="">-- Chọn audio --</option>
                                {audioFields.map((audio, audioIdx) => (
                                    <option key={audio.id} value={audioIdx + 1}>
                                        {watch(`listening_audio.${audioIdx}.title`) || `Section ${audioIdx + 1}`}
                                    </option>
                                ))}
                            </select>
                        </label>


                        <small style={{ color: '#666', fontSize: '12px' }}>
                            Current audio ID: {set.audioId || 'NONE'}
                        </small>
                    </div>
                )}

                {/* Danh sách câu hỏi trong set */}
                <div className="questions-in-set">
                    {set.questions.map((question, qIdx) => (
                        <div key={question.id} className="question-in-set">
                            <div className="question-header">
                                <div className="question-number">{qIdx + 1}</div>
                                <div className="question-order">Thứ tự: {question.orderInTest}</div>
                            </div>

                            <div className="question-content">
                            <textarea
                                placeholder="Nội dung câu hỏi..."
                                value={question.questionText || ''}
                                onChange={(e) => updateQuestionText(set.id, qIdx, e.target.value)}
                                rows={2}
                            />

                                {/* Render question type fields */}
                                {renderQuestionTypeFields(set, question, qIdx)}

                                {/* Nút xóa câu hỏi */}
                                <button
                                    className="remove-btn-modern"
                                    onClick={() => removeQuestionFromSet(set.id, qIdx)}
                                    title="Remove this question"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="question-set-actions-bottom">
                    <button
                        className="btn-add-wide"
                        onClick={() => addQuestionToSet(set.id)}
                    >
                        <i className="icon-plus"></i> Thêm câu hỏi vào dạng bài này
                    </button>

                    <button
                        className="btn-remove-set"
                        onClick={() => removeQuestionSet(set.id)}
                    >
                        <i className="icon-trash"></i> Xóa dạng bài này
                    </button>
                </div>
            </div>
        );
    };

// Thêm function để force refresh question sets từ form data
    const refreshQuestionSetsFromForm = () => {
        console.log('=== FORCE REFRESH QUESTION SETS ===');
        setQuestionSets([]); // Clear current sets

        setTimeout(() => {
            console.log('Question sets cleared, should trigger useEffect...');
        }, 100);
    };

    // Nội dung các tab
    // ✅ TAB CONTENT HOÀN CHỈNH - ĐÃ SỬA LỖI
    const tabContent = {
        info: (
            <div className="tab-content">
                <section className="test-meta">
                    <div className="form-row">
                        <label>
                            Tên bài thi
                            <input
                                type="text"
                                {...register('test_name', { required: 'Vui lòng nhập tên bài thi' })}
                            />
                            {errors.test_name && <span className="error">{errors.test_name.message}</span>}
                        </label>
                        <label>
                            Loại bài thi
                            <select {...register('test_type')}>
                                <option value="READING">IELTS Reading</option>
                                <option value="LISTENING">IELTS Listening</option>
                                <option value="SPEAKING">IELTS Speaking</option>
                                <option value="WRITING">IELTS Writing</option>
                            </select>
                        </label>
                    </div>
                    <div className="form-row">
                        <label>
                            Thời gian (phút)
                            <input
                                type="number"
                                {...register('duration_minutes', {
                                    required: 'Vui lòng nhập thời gian',
                                    min: { value: 1, message: 'Thời gian phải lớn hơn 0' }
                                })}
                            />
                            {errors.duration_minutes && <span className="error">{errors.duration_minutes.message}</span>}
                        </label>
                    </div>
                </section>

                <section className="test-description">
                    <div className="test-options">
                        <label className="checkbox-label">
                            <input type="checkbox" {...register('is_practice')} />
                            Bài thi luyện tập
                        </label>
                        <label className="checkbox-label">
                            <input type="checkbox" {...register('is_published')} />
                            Xuất bản ngay
                        </label>
                    </div>
                </section>

                <div className="action-buttons">
                    <button
                        type="button"
                        className="btn-next"
                        onClick={() => setActiveTab(testType === 'READING' ? 'passages' : (testType === 'LISTENING' ? 'audio' : 'questions'))}
                    >
                        Tiếp theo: {testType === 'READING' ? 'Đoạn văn' : (testType === 'LISTENING' ? 'Audio' : 'Câu hỏi')} &rarr;
                    </button>
                </div>
            </div>
        ),

        passages: (
            <div className="tab-content">
                <section className="reading-passages">
                    <h2>Đoạn văn Reading
                        <button
                            type="button"
                            className="btn-add circle-add"
                            onClick={() => appendPassage({
                                title: '',
                                content: '',
                                order_in_test: passageFields.length + 1
                            })}
                        >+</button>
                    </h2>

                    {passageFields.length === 0 ? (
                        <div className="empty-state">
                            <p>Chưa có đoạn văn nào. Nhấp vào nút "+" để thêm đoạn văn.</p>
                        </div>
                    ) : (
                        <div className="accordion-list">
                            {passageFields.map((field, index) => (
                                <div key={field.id} className={`accordion-item ${expandedPassage === index ? 'expanded' : ''}`}>
                                    <div
                                        className="accordion-header"
                                        onClick={() => togglePassage(index)}
                                    >
                                        <span>Đoạn văn {index + 1}: {watch(`reading_passages.${index}.title`) || 'Chưa có tiêu đề'}</span>
                                        <div className="accordion-actions">
                                            <button
                                                type="button"
                                                className="btn-add-question"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addQuestionForPassage(index);
                                                }}
                                                title="Thêm câu hỏi cho đoạn văn này"
                                            >
                                                <i className="icon-plus"></i> Câu hỏi
                                            </button>
                                            <span className="expand-icon">{expandedPassage === index ? '▼' : '▶'}</span>
                                        </div>
                                    </div>
                                    {expandedPassage === index && (
                                        <div className="accordion-content">
                                            <div className="passage-block">
                                                <div className="form-row">
                                                    <label>
                                                        Tiêu đề
                                                        <input
                                                            type="text"
                                                            {...register(`reading_passages.${index}.title`, {
                                                                required: 'Vui lòng nhập tiêu đề đoạn văn'
                                                            })}
                                                        />
                                                    </label>
                                                    <label>
                                                        Thứ tự trong bài thi
                                                        <input
                                                            type="number"
                                                            {...register(`reading_passages.${index}.order_in_test`)}
                                                            defaultValue={index + 1}
                                                        />
                                                    </label>
                                                </div>
                                                <label>
                                                    Nội dung đoạn văn
                                                    <textarea
                                                        {...register(`reading_passages.${index}.content`, {
                                                            required: 'Vui lòng nhập nội dung đoạn văn'
                                                        })}
                                                        rows={8}
                                                    />
                                                </label>
                                                <div className="action-row">
                                                    <button
                                                        type="button"
                                                        className="btn-remove"
                                                        onClick={() => removePassage(index)}
                                                    >
                                                        Xóa đoạn văn này
                                                    </button>

                                                    <div>
                                                        <button
                                                            type="button"
                                                            className="btn-primary"
                                                            onClick={() => addQuestionForPassage(index)}
                                                        >
                                                            Thêm câu hỏi cho đoạn văn này
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Hiển thị các câu hỏi liên quan đến đoạn văn này */}
                                                {questionFields.filter(q =>
                                                    watch(`questions.${questionFields.indexOf(q)}.passage_id`) === (index + 1).toString()
                                                ).length > 0 && (
                                                    <div className="related-items">
                                                        <h4>Câu hỏi liên quan đến đoạn văn này:</h4>
                                                        <ul>
                                                            {questionFields.map((q, qIdx) => {
                                                                if (watch(`questions.${qIdx}.passage_id`) === (index + 1).toString()) {
                                                                    return (
                                                                        <li key={q.id}>
                                                                            <span>Câu {qIdx + 1}: {watch(`questions.${qIdx}.question_text`).substring(0, 30) || 'Chưa có nội dung'}</span>
                                                                            <button
                                                                                type="button"
                                                                                className="btn-link"
                                                                                onClick={() => {
                                                                                    setActiveTab('questions');
                                                                                    setTimeout(() => setExpandedQuestion(qIdx), 100);
                                                                                }}
                                                                            >
                                                                                Xem
                                                                            </button>
                                                                        </li>
                                                                    );
                                                                }
                                                                return null;
                                                            })}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="action-buttons">
                        <button type="button" className="btn-back" onClick={() => setActiveTab('info')}>
                            &larr; Quay lại thông tin
                        </button>

                        <button
                            type="button"
                            className="btn-add-large"
                            onClick={() => appendPassage({
                                title: '',
                                content: '',
                                order_in_test: passageFields.length + 1
                            })}
                        >
                            + Thêm đoạn văn mới
                        </button>

                        <button type="button" className="btn-next" onClick={() => setActiveTab('questions')}>
                            Tiếp theo: Câu hỏi &rarr;
                        </button>
                    </div>
                </section>
            </div>
        ),

        audio: (
            <div className="tab-content">
                <section className="listening-audio">
                    <h2>Audio Listening
                        <button
                            type="button"
                            className="btn-add circle-add"
                            onClick={() => appendAudio({
                                title: `Section ${audioFields.length + 1}`,
                                file_path: '',
                                file_type: 'MP3',
                                section: `SECTION${audioFields.length + 1}`,
                                order_in_test: audioFields.length + 1,
                                transcript: ''
                            })}
                        >+</button>
                    </h2>

                    {audioFields.length === 0 ? (
                        <div className="empty-state">
                            <p>Chưa có audio nào. Nhấp vào nút "+" để thêm audio.</p>
                        </div>
                    ) : (
                        <div className="accordion-list">
                            {audioFields.map((field, index) => (
                                <div key={field.id} className={`accordion-item ${expandedAudio === index ? 'expanded' : ''}`}>
                                    <div
                                        className="accordion-header"
                                        onClick={() => toggleAudio(index)}
                                    >
                                        <span>Audio {index + 1}: {watch(`listening_audio.${index}.title`) || `Section ${index + 1}`}</span>
                                        <div className="accordion-actions">
                                            <button
                                                type="button"
                                                className="btn-add-question"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addQuestionForAudio(index);
                                                }}
                                                title="Thêm câu hỏi cho audio này"
                                            >
                                                <i className="icon-plus"></i> Câu hỏi
                                            </button>
                                            <span className="expand-icon">{expandedAudio === index ? '▼' : '▶'}</span>
                                        </div>
                                    </div>
                                    {expandedAudio === index && (
                                        <div className="accordion-content">
                                            <div className="audio-block">
                                                <div className="form-row">
                                                    <label>
                                                        Tiêu đề
                                                        <input
                                                            type="text"
                                                            {...register(`listening_audio.${index}.title`, {
                                                                required: 'Vui lòng nhập tiêu đề audio'
                                                            })}
                                                        />
                                                    </label>
                                                    <label>
                                                        Section
                                                        <select {...register(`listening_audio.${index}.section`)}>
                                                            <option value="SECTION1">Section 1</option>
                                                            <option value="SECTION2">Section 2</option>
                                                            <option value="SECTION3">Section 3</option>
                                                            <option value="SECTION4">Section 4</option>
                                                        </select>
                                                    </label>
                                                </div>

                                                <div className="form-row">
                                                    <div className="audio-upload-container">
                                                        <label>File audio</label>
                                                        <EnhancedAudioUploader
                                                            onAudioUploaded={(audioInfo) => handleAudioUploaded(audioInfo, index)}
                                                            existingAudio={watch(`listening_audio.${index}.file_path`) ? {
                                                                fileName: watch(`listening_audio.${index}.original_file_name`) || watch(`listening_audio.${index}.file_path`),
                                                                filePath: watch(`listening_audio.${index}.file_path`),
                                                                fileSize: watch(`listening_audio.${index}.file_size`) || 0,
                                                                duration: watch(`listening_audio.${index}.duration_seconds`) || 0,
                                                                originalFileName: watch(`listening_audio.${index}.original_file_name`)
                                                            } : null}
                                                            audioIndex={index}
                                                            formData={{
                                                                audio_base64: watch(`listening_audio.${index}.audio_base64`),
                                                                original_file_name: watch(`listening_audio.${index}.original_file_name`),
                                                                file_size: watch(`listening_audio.${index}.file_size`),
                                                                duration_seconds: watch(`listening_audio.${index}.duration_seconds`),
                                                                mime_type: watch(`listening_audio.${index}.mime_type`),
                                                                title: watch(`listening_audio.${index}.title`)
                                                            }}
                                                        />
                                                    </div>
                                                    <label>
                                                        Loại file
                                                        <select {...register(`listening_audio.${index}.file_type`)}>
                                                            <option value="MP3">MP3</option>
                                                            <option value="WAV">WAV</option>
                                                            <option value="OGG">OGG</option>
                                                            <option value="M4A">M4A</option>
                                                        </select>
                                                    </label>
                                                </div>

                                                <label>
                                                    Transcript (nội dung)
                                                    <textarea
                                                        {...register(`listening_audio.${index}.transcript`)}
                                                        rows={5}
                                                        placeholder="Nhập nội dung transcript của audio..."
                                                    />
                                                </label>

                                                <label>
                                                    Thứ tự trong bài thi
                                                    <input
                                                        type="number"
                                                        {...register(`listening_audio.${index}.order_in_test`)}
                                                        defaultValue={index + 1}
                                                    />
                                                </label>

                                                <div className="action-row">
                                                    <button
                                                        type="button"
                                                        className="btn-remove"
                                                        onClick={() => removeAudio(index)}
                                                    >
                                                        Xóa audio này
                                                    </button>

                                                    <div>
                                                        <button
                                                            type="button"
                                                            className="btn-primary"
                                                            onClick={() => addQuestionForAudio(index)}
                                                        >
                                                            Thêm câu hỏi cho audio này
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Hiển thị các câu hỏi liên quan đến audio này */}
                                                {questionFields.filter(q =>
                                                    watch(`questions.${questionFields.indexOf(q)}.audio_id`) === (index + 1).toString()
                                                ).length > 0 && (
                                                    <div className="related-items">
                                                        <h4>Câu hỏi liên quan đến audio này:</h4>
                                                        <ul>
                                                            {questionFields.map((q, qIdx) => {
                                                                if (watch(`questions.${qIdx}.audio_id`) === (index + 1).toString()) {
                                                                    return (
                                                                        <li key={q.id}>
                                                                            <span>Câu {qIdx + 1}: {watch(`questions.${qIdx}.question_text`).substring(0, 30) || 'Chưa có nội dung'}</span>
                                                                            <button
                                                                                type="button"
                                                                                className="btn-link"
                                                                                onClick={() => {
                                                                                    setActiveTab('questions');
                                                                                    setTimeout(() => setExpandedQuestion(qIdx), 100);
                                                                                }}
                                                                            >
                                                                                Xem
                                                                            </button>
                                                                        </li>
                                                                    );
                                                                }
                                                                return null;
                                                            })}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="action-buttons">
                        <button type="button" className="btn-back" onClick={() => setActiveTab('info')}>
                            &larr; Quay lại thông tin
                        </button>

                        <button
                            type="button"
                            className="btn-add-large"
                            onClick={() => appendAudio({
                                title: `Section ${audioFields.length + 1}`,
                                file_path: '',
                                file_type: 'MP3',
                                section: `SECTION${audioFields.length + 1}`,
                                order_in_test: audioFields.length + 1,
                                transcript: ''
                            })}
                        >
                            + Thêm audio mới
                        </button>

                        <button type="button" className="btn-next" onClick={() => setActiveTab('questions')}>
                            Tiếp theo: Câu hỏi &rarr;
                        </button>
                    </div>
                </section>
            </div>
        ),

        questions: (() => {
            if (testType === 'LISTENING') {
                return (
                    <ListeningQuestionsTab
                        questionSets={questionSets}
                        setQuestionSets={setQuestionSets}
                        audioFields={audioFields}
                        watch={watch}
                        setValue={setValue}
                        setActiveTab={setActiveTab}
                        testType={testType}
                    />
                );
            } else if (testType === 'WRITING') {
                return (
                    <WritingQuestionsTab
                        questionSets={questionSets}
                        setQuestionSets={setQuestionSets}
                        watch={watch}
                        setValue={setValue}
                        setActiveTab={setActiveTab}
                        testType={testType}
                    />
                );
            } else if (testType === 'SPEAKING') {
                return (
                    <SpeakingQuestionsTab
                        questionSets={questionSets}
                        setQuestionSets={setQuestionSets}
                        watch={watch}
                        setValue={setValue}
                        setActiveTab={setActiveTab}
                        testType={testType}
                    />
                );
            } else {
                // Default Reading questions tab
                return (
                    <div className="tab-content">
                        <section className="questions-list">
                            <h2>Dạng bài thi</h2>

                            {/* Panel chọn thêm dạng bài mới */}
                            <div className="add-question-set-panel">
                                <p>Chọn dạng bài để thêm vào:</p>
                                <div className="question-set-types">
                                    {[
                                        {id: 'mcq_set', name: 'Multiple Choice Questions', defaultCount: 4, type: 'MCQ'},
                                        {id: 'matching_headings', name: 'Matching Headings', defaultCount: 5, type: 'MATCHING'},
                                        {id: 'fill_blanks', name: 'Fill in the Blanks', defaultCount: 6, type: 'FILL_IN_THE_BLANK'},
                                        {id: 'tf_ng', name: 'True/False/Not Given', defaultCount: 7, type: 'TRUE_FALSE_NOT_GIVEN'},
                                        {id: 'short_answer', name: 'Short Answer Questions', defaultCount: 3, type: 'SHORT_ANSWER'}
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            className="question-set-type-btn"
                                            onClick={() => addQuestionSet(type)}
                                        >
                                            <div className="set-type-icon">{type.id.charAt(0).toUpperCase()}</div>
                                            <div className="set-type-info">
                                                <span className="set-type-name">{type.name}</span>
                                                <span className="set-type-count">{type.defaultCount} câu hỏi</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Danh sách các nhóm câu hỏi đã thêm */}
                            {questionSets.length > 0 ? (
                                <div className="question-sets-list">
                                    {questionSets.map(set => (
                                        <div
                                            key={set.id}
                                            className={`question-set-item ${expandedQuestionSet === set.id ? 'expanded' : ''}`}
                                        >
                                            <div className="question-set-header" onClick={() => toggleExpandSet(set.id)}>
                                                <div className="question-set-title">
                                                    <span className="question-type-badge">{set.type}</span>
                                                    <h3>{set.name}</h3>
                                                    <span className="question-count">{set.questions.length} câu hỏi</span>
                                                </div>
                                                <div className="question-set-actions">
                                                    <button
                                                        className="btn-add-question"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addQuestionToSet(set.id);
                                                        }}
                                                    >
                                                        + Thêm câu
                                                    </button>
                                                    <span className="expand-icon">{expandedQuestionSet === set.id ? '▼' : '▶'}</span>
                                                </div>
                                            </div>

                                            {expandedQuestionSet === set.id && renderQuestionSetContent(set)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state large">
                                    <div className="empty-icon">📝</div>
                                    <h3>Chưa có dạng bài nào</h3>
                                    <p>Chọn một dạng bài từ danh sách trên để bắt đầu thêm câu hỏi vào bài thi.</p>
                                </div>
                            )}

                            <div className="action-buttons">
                                <button type="button" className="btn-back" onClick={() => setActiveTab(testType === 'READING' ? 'passages' : (testType === 'LISTENING' ? 'audio' : 'info'))}>
                                    &larr; Quay lại {testType === 'READING' ? 'đoạn văn' : (testType === 'LISTENING' ? 'audio' : 'thông tin')}
                                </button>

                                <button type="button" className="btn-next" onClick={() => setActiveTab('preview')}>
                                    Tiếp theo: Xem trước &rarr;
                                </button>
                            </div>
                        </section>
                    </div>
                );
            }
        })(),

        preview: (
            <div className="tab-content">
                <section className="preview-section">
                    <h2>Xem trước bài thi</h2>

                    <div className="preview-content">
                        <div className="preview-block">
                            <h3>Thông tin chung</h3>
                            <div className="info-table">
                                <div className="info-row">
                                    <div className="info-label">Tên bài thi:</div>
                                    <div className="info-value">{watch('test_name')}</div>
                                </div>
                                <div className="info-row">
                                    <div className="info-label">Loại bài thi:</div>
                                    <div className="info-value">{watch('test_type')}</div>
                                </div>
                                <div className="info-row">
                                    <div className="info-label">Thời gian:</div>
                                    <div className="info-value">{watch('duration_minutes')} phút</div>
                                </div>
                                <div className="info-row">
                                    <div className="info-label">Trạng thái:</div>
                                    <div className="info-value">
                                        {watch('is_published') ? 'Xuất bản' : 'Bản nháp'},
                                        {watch('is_practice') ? ' Bài luyện tập' : ' Bài thi thật'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {testType === 'READING' && passageFields.length > 0 && (
                            <div className="preview-block">
                                <h3>Đoạn văn ({passageFields.length})</h3>
                                <div className="passages-summary">
                                    {passageFields.map((field, idx) => (
                                        <div key={field.id} className="preview-item">
                                            <div className="preview-item-header">
                                                <span>Đoạn {idx + 1}: {watch(`reading_passages.${idx}.title`)}</span>
                                                <button
                                                    type="button"
                                                    className="btn-link"
                                                    onClick={() => {
                                                        setActiveTab('passages');
                                                        setTimeout(() => setExpandedPassage(idx), 100);
                                                    }}
                                                >
                                                    Chỉnh sửa
                                                </button>
                                            </div>
                                            <div className="preview-item-body">
                                                <p className="truncated-text">
                                                    {watch(`reading_passages.${idx}.content`)?.substring(0, 100) || ''}
                                                    {(watch(`reading_passages.${idx}.content`)?.length || 0) > 100 ? '...' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {testType === 'LISTENING' && audioFields.length > 0 && (
                            <div className="preview-block">
                                <h3>Audio ({audioFields.length})</h3>
                                <div className="audio-summary">
                                    {audioFields.map((field, idx) => (
                                        <div key={field.id} className="preview-item">
                                            <div className="preview-item-header">
                                                <span>Audio {idx + 1}: {watch(`listening_audio.${idx}.title`)}</span>
                                                <button
                                                    type="button"
                                                    className="btn-link"
                                                    onClick={() => {
                                                        setActiveTab('audio');
                                                        setTimeout(() => setExpandedAudio(idx), 100);
                                                    }}
                                                >
                                                    Chỉnh sửa
                                                </button>
                                            </div>
                                            <div className="preview-item-body">
                                                <p className="truncated-text">
                                                    Section: {watch(`listening_audio.${idx}.section`)}<br/>
                                                    {watch(`listening_audio.${idx}.transcript`)?.substring(0, 100) || 'Chưa có transcript'}
                                                    {(watch(`listening_audio.${idx}.transcript`)?.length || 0) > 100 ? '...' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {questionFields.length > 0 && (
                            <div className="preview-block">
                                <h3>Câu hỏi ({questionFields.length})</h3>
                                <div className="questions-summary">
                                    {questionFields.map((field, idx) => (
                                        <div key={field.id} className="preview-item">
                                            <div className="preview-item-header">
                                            <span>
                                                Câu {idx + 1}: {watch(`questions.${idx}.question_type`)}
                                                {testType === 'READING' && watch(`questions.${idx}.passage_id`) &&
                                                    ` - Đoạn ${watch(`questions.${idx}.passage_id`)}`
                                                }
                                                {testType === 'LISTENING' && watch(`questions.${idx}.audio_id`) &&
                                                    ` - Audio ${watch(`questions.${idx}.audio_id`)}`
                                                }
                                            </span>

                                                <button
                                                    type="button"
                                                    className="btn-link"
                                                    onClick={() => {
                                                        setActiveTab('questions');
                                                        setTimeout(() => setExpandedQuestion(idx), 100);
                                                    }}
                                                >
                                                    Chỉnh sửa
                                                </button>
                                            </div>
                                            <div className="preview-item-body">
                                                <p className="truncated-text">
                                                    {(watch(`questions.${idx}.question_text`) || '').substring(0, 100)}
                                                    {(watch(`questions.${idx}.question_text`) || '').length > 100 ? '...' : ''}
                                                </p>
                                                <div className="question-answer">
                                                <span>Đáp án: {formatAnswerForDisplay(
                                                    watch(`questions.${idx}.question_type`),
                                                    watch(`questions.${idx}.correct_answer`)
                                                )}</span>
                                                </div>

                                                {/* Hiển thị explanation nếu có */}
                                                {watch(`questions.${idx}.explanation`) && (
                                                    <div className="preview-explanation">
                                                        <strong>Giải thích:</strong>
                                                        {(watch(`questions.${idx}.explanation`) || '').substring(0, 150)}
                                                        {(watch(`questions.${idx}.explanation`) || '').length > 150 ? '...' : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="action-buttons">
                        <button type="button" className="btn-back" onClick={() => setActiveTab('questions')}>
                            &larr; Quay lại câu hỏi
                        </button>

                        {/* Hiển thị lỗi */}
                        {error && (
                            <div className="error-message-container">
                                {error}
                            </div>
                        )}

                        {/* Nút submit với type="button" thay vì type="submit" */}
                        <button
                            type="button"
                            className="btn-submit"
                            disabled={isSubmitting || initialLoading}
                            onClick={() => {
                                try {
                                    // Đồng bộ dữ liệu từ questionSets vào questions
                                    syncQuestionsFromSets(questionSets);

                                    // Lấy dữ liệu mới nhất
                                    const formData = {
                                        test_name: watch('test_name'),
                                        test_type: watch('test_type'),
                                        duration_minutes: watch('duration_minutes'),
                                        passing_score: watch('passing_score'),
                                        is_practice: watch('is_practice'),
                                        is_published: watch('is_published'),
                                        questions: watch('questions'),
                                        reading_passages: watch('reading_passages'),
                                        listening_audio: watch('listening_audio')
                                    };

                                    console.log('Preparing to submit form with data:', formData);

                                    // Kiểm tra dữ liệu hợp lệ
                                    if (!formData.test_name) {
                                        setError("Vui lòng nhập tên bài thi");
                                        return;
                                    }

                                    if (!formData.questions || formData.questions.length === 0) {
                                        setError("Bài thi cần có ít nhất một câu hỏi");
                                        return;
                                    }

                                    // Gọi hàm onSubmit trực tiếp với dữ liệu đã chuẩn bị
                                    onSubmit(formData);
                                } catch (err) {
                                    console.error("Error preparing form submission:", err);
                                    setError(`Lỗi chuẩn bị dữ liệu: ${err.message}`);
                                }
                            }}
                        >
                            {isSubmitting ? 'Đang xử lý...' : (isEditMode ? 'Cập nhật & Lưu' : 'Lưu & Xuất bản')}
                        </button>
                    </div>
                </section>
            </div>
        )
    };

    return (
        <div className="create-exam-container optimized">
            <h1>{isEditMode ? 'Chỉnh Sửa Bài Thi IELTS' : 'Thêm Bài Thi IELTS'}</h1>

            {initialLoading ? (
                <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p>Đang tải thông tin bài thi...</p>
                </div>
            ) : (
                <>
                    <div className="tabs-navigation">
                        <button
                            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            <span className="number">1</span> Information
                        </button>

                        {testType === 'READING' && (
                            <button
                                className={`tab ${activeTab === 'passages' ? 'active' : ''}`}
                                onClick={() => setActiveTab('passages')}
                            >
                                <span className="number">2</span> Passages
                                {passageFields.length > 0 && <span className="count">{passageFields.length}</span>}
                            </button>
                        )}

                        {testType === 'LISTENING' && (
                            <button
                                className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
                                onClick={() => setActiveTab('audio')}
                            >
                                <span className="number">2</span> Audio
                                {audioFields.length > 0 && <span className="count">{audioFields.length}</span>}
                            </button>
                        )}

                        <button
                            className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('questions')}
                        >
                            <span className="number">{['READING', 'LISTENING'].includes(testType) ? '3' : '2'}</span>
                            {testType === 'WRITING' ? 'Tasks' : testType === 'SPEAKING' ? 'Parts' : 'Questions'}
                            {questionFields.length > 0 && <span className="count">{questionFields.length}</span>}
                        </button>

                        <button
                            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('preview')}
                        >
                            <span className="number">{['READING', 'LISTENING'].includes(testType) ? '4' : '3'}</span> Preview
                        </button>

                        <div className="help-button" onClick={() => setShowTips(!showTips)}>
                            <span>?</span>
                        </div>
                    </div>

                    {showTips && (
                        <div className="tips-panel">
                            <h3>Hướng dẫn nhanh</h3>
                            <ul>
                                <li>Di chuyển qua các bước sử dụng thanh điều hướng phía trên</li>
                                <li>Nhấp vào "+" để thêm đoạn văn, audio hoặc câu hỏi mới</li>
                                <li>Nhấp vào tiêu đề của đoạn văn, audio hoặc câu hỏi để mở rộng/thu gọn</li>
                                <li>Bạn có thể thêm câu hỏi trực tiếp từ đoạn văn hoặc audio</li>
                                <li>Xem trước bài thi trước khi lưu để kiểm tra lại</li>
                            </ul>
                            <button className="btn-close" onClick={() => setShowTips(false)}>Đóng</button>
                        </div>
                    )}

                    {/* ✅ SỬ DỤNG renderCurrentTab() THAY VÌ tabContent[activeTab] */}
                    {activeTab !== 'preview' ? (
                        <form onSubmit={(e) => e.preventDefault()}>
                            {renderCurrentTab()}
                        </form>
                    ) : (
                        renderCurrentTab()
                    )}
                </>
            )}
        </div>
    );
}