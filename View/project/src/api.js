import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Tạo axios instance với baseURL
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000 // Timeout 10 giây
});

// Thêm interceptor để tự động gửi token
api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Check if token is about to expire
                const payload = JSON.parse(atob(token.split('.')[1]));
                const now = Math.floor(Date.now() / 1000);
                const timeLeft = payload.exp - now;

                if (timeLeft <= 0) {
                    // Token expired - clear and redirect
                    console.warn('Token expired during request setup');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return Promise.reject(new Error('Token expired'));
                }

                if (timeLeft < 300) { // Less than 5 minutes
                    console.warn(`Token expires in ${timeLeft} seconds`);

                    // For critical operations, warn user
                    if (config.url.includes('/create') || config.url.includes('/update') || config.url.includes('/attempts')) {
                        const shouldContinue = window.confirm(
                            'Phiên đăng nhập sắp hết hạn. Tiếp tục có thể gây mất dữ liệu. Bạn có muốn tiếp tục?'
                        );

                        if (!shouldContinue) {
                            return Promise.reject(new Error('User cancelled due to token expiry warning'));
                        }
                    }
                }

                config.headers.Authorization = `Bearer ${token}`;
                console.log(`Request to ${config.url}: Token attached (expires in ${Math.floor(timeLeft / 60)}min)`);
            } catch (e) {
                console.error('Error processing token in request interceptor:', e);
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject(new Error('Invalid token'));
            }
        } else {
            console.log(`Request to ${config.url}: No token found`);
        }

        return config;
    },
    error => {
        console.error('Error in request interceptor:', error);
        return Promise.reject(error);
    }
);

// Enhanced response interceptor with context error handling
api.interceptors.response.use(
    response => {
        console.log(`✅ Success response from ${response.config.url}: Status ${response.status}`);
        return response;
    },
    error => {
        console.error(`❌ Error response from ${error.config?.url || 'unknown'}:`, error);

        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);

            // ✅ ENHANCED: Context-specific error handling
            if (error.response.status === 400 && error.response.data?.message?.includes('context')) {
                console.error('🔴 CONTEXT-RELATED ERROR detected in API response');
                console.error('Error details:', error.response.data);
            }

            // ✅ FIX: KHÔNG tự động logout cho tất cả 401 errors
            if (error.response.status === 401) {
                console.warn('Authentication error - token may be invalid or expired');

                const currentUrl = window.location.pathname;
                console.log('Current URL when 401 occurred:', currentUrl);

                // ✅ CHỈ logout tự động cho các GET requests (không phải user actions)
                const isGetRequest = error.config?.method?.toLowerCase() === 'get';
                const isUserAction = error.config?.url?.includes('/create') ||
                    error.config?.url?.includes('/update') ||
                    error.config?.url?.includes('/attempts') ||
                    error.config?.url?.includes('/delete');

                // ✅ KHÔNG logout tự động cho user actions, để form tự xử lý
                if (isGetRequest && !isUserAction) {
                    console.log('Auto-logout for GET request with 401');

                    const errorMessage = typeof error.response.data === 'string'
                        ? error.response.data
                        : (error.response.data?.message || 'Token hết hạn');

                    if (currentUrl !== '/login' && currentUrl !== '/register') {
                        alert(errorMessage || 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');

                        localStorage.removeItem('token');
                        window.dispatchEvent(new Event('storage'));
                        localStorage.setItem('redirectAfterLogin', currentUrl);
                        window.location.href = '/login';
                    }
                } else {
                    // ✅ CHỈ log lỗi, KHÔNG logout tự động cho user actions
                    console.log('401 error for user action - letting form handle it');

                    // ✅ Có thể thêm warning nhẹ nhàng mà không interrupt
                    if (isUserAction) {
                        console.warn('User action failed due to authentication. Form should handle this.');
                    }
                }
            }

            // ✅ XỬ LÝ 403 FORBIDDEN (giữ nguyên)
            else if (error.response.status === 403) {
                console.warn('Authorization error - user does not have permission');

                const errorMessage = typeof error.response.data === 'string'
                    ? error.response.data
                    : (error.response.data?.message || 'Bạn không có quyền thực hiện thao tác này');

                if (error.config?.url?.includes('/create')) {
                    alert('Bạn không có quyền tạo bài thi. Chỉ Teacher và Admin mới có thể tạo bài thi.');
                } else if (error.config?.url?.includes('/update')) {
                    alert('Bạn không có quyền chỉnh sửa bài thi này. Chỉ chủ sở hữu hoặc Admin mới có thể chỉnh sửa.');
                } else if (error.config?.url?.includes('/delete')) {
                    alert('Bạn không có quyền xóa bài thi này. Chỉ chủ sở hữu hoặc Admin mới có thể xóa.');
                } else {
                    alert(errorMessage);
                }

                console.log('403 Forbidden handled, staying on current page');
            }

        } else if (error.request) {
            console.error("No response received from server");
            // ✅ KHÔNG show alert cho network errors trong interceptor
            console.warn('Network error - form should handle this if needed');
        } else {
            console.error("Error configuring request:", error.message);
        }

        // ✅ LUÔN LUÔN reject error để form có thể xử lý
        return Promise.reject(error);
    }
);

console.log('✅ Enhanced response interceptor with context support loaded');

// =====================================
// ENHANCED CREATE TEST FUNCTION WITH CONTEXT SUPPORT
// =====================================

export const createTest = async (testData) => {
    try {
        console.log('=== CREATE TEST REQUEST WITH CONTEXT DEBUG ===');
        console.log('1. Raw testData received:', testData);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại để tạo bài thi.");
        }

        // ✅ ENHANCED: Debug context data before formatting
        console.log('=== CONTEXT DEBUGGING ===');
        if (testData.questions) {
            const questionsWithContext = testData.questions.filter(q => q.context && q.context.trim());
            console.log(`Questions with context: ${questionsWithContext.length}/${testData.questions.length}`);

            questionsWithContext.forEach((q, idx) => {
                console.log(`Context Q${idx + 1}:`, {
                    id: q.question_id,
                    type: q.question_type,
                    contextLength: q.context?.length || 0,
                    contextPreview: q.context?.substring(0, 100) + '...',
                    hasInstructions: !!(q.question_set_instructions && q.question_set_instructions.trim())
                });
            });
        }

        // Format data
        const formattedData = {
            testName: testData.test_name,
            testType: testData.test_type,
            description: testData.description || '',
            instructions: testData.instructions || '',
            durationMinutes: testData.duration_minutes,
            passingScore: testData.passing_score,
            isPractice: testData.is_practice || false,
            isPublished: testData.is_published || false,

            // Format reading passages
            readingPassages: testData.reading_passages?.map((passage, index) => ({
                title: passage.title,
                content: passage.content,
                orderInTest: passage.order_in_test || (index + 1)
            })) || [],

            // Format listening audio
            listeningAudio: testData.listening_audio?.map((audio, index) => {
                console.log(`\n--- Audio ${index + 1} Debug ---`);
                console.log('Raw audio object keys:', Object.keys(audio));
                console.log('Title:', audio.title);
                console.log('Section:', audio.section);
                console.log('FileType:', audio.file_type);
                console.log('OrderInTest:', audio.order_in_test);
                console.log('DurationSeconds:', audio.duration_seconds);
                console.log('Has audio_base64:', !!audio.audio_base64);
                console.log('Has file_path:', !!audio.file_path);

                if (audio.audio_base64) {
                    console.log('Base64 length:', audio.audio_base64.length);
                    console.log('Base64 starts with:', audio.audio_base64.substring(0, 20));
                }

                const formatted = {
                    title: audio.title || `Section ${index + 1}`,
                    section: audio.section || `SECTION${index + 1}`,
                    orderInTest: audio.order_in_test || (index + 1),
                    transcript: audio.transcript || '',
                    fileType: audio.file_type || 'MP3',
                    durationSeconds: audio.duration_seconds,

                    // Base64 data (new approach)
                    audioBase64: audio.audio_base64,
                    originalFileName: audio.original_file_name,
                    fileSize: audio.file_size,
                    mimeType: audio.mime_type,

                    // File path (fallback)
                    filePath: audio.file_path || null
                };

                console.log('Formatted audio result:', {
                    title: formatted.title,
                    section: formatted.section,
                    fileType: formatted.fileType,
                    hasAudioBase64: !!formatted.audioBase64,
                    hasFilePath: !!formatted.filePath
                });

                return formatted;
            }) || [],

            // ✅ ENHANCED: Format questions with context preservation
            questions: testData.questions?.map((question, index) => {
                console.log(`\n--- Question ${index + 1} Debug ---`);
                console.log('Question type:', question.question_type);
                console.log('Question text length:', question.question_text?.length);
                console.log('Passage ID:', question.passage_id);
                console.log('Audio ID:', question.audio_id);
                console.log('Correct answer:', question.correct_answer);
                console.log('Options:', question.options);

                // ✅ CRITICAL: Debug context field
                console.log('Has context:', !!(question.context && question.context.trim()));
                console.log('Context length:', question.context?.length || 0);
                console.log('Context preview:', question.context?.substring(0, 50) || 'empty');
                console.log('Has instructions:', !!(question.question_set_instructions && question.question_set_instructions.trim()));

                // Xử lý options
                let options = '';
                if (question.question_type === 'MCQ') {
                    options = Array.isArray(question.options) ?
                        JSON.stringify(question.options) :
                        JSON.stringify(['', '', '', '']);
                } else if (question.question_type === 'MATCHING') {
                    const pairs = [];
                    if (Array.isArray(question.options)) {
                        for (let i = 0; i < question.options.length; i++) {
                            if (question.options[i]?.left || question.options[i]?.right) {
                                pairs.push({
                                    left: question.options[i]?.left || '',
                                    right: question.options[i]?.right || ''
                                });
                            }
                        }
                    }
                    options = JSON.stringify(pairs);
                } else {
                    options = typeof question.options === 'object'
                        ? JSON.stringify(question.options)
                        : (question.options || '');
                }

                const passageId = question.passage_id ?
                    (typeof question.passage_id === 'string' && question.passage_id.trim() === '' ?
                        null : parseInt(question.passage_id, 10)) :
                    null;

                const audioId = question.audio_id ?
                    (typeof question.audio_id === 'string' && question.audio_id.trim() === '' ?
                        null : parseInt(question.audio_id, 10)) :
                    null;

                const formattedQuestion = {
                    questionText: question.question_text,
                    questionType: question.question_type,
                    options: options,
                    section: question.section || null,
                    orderInTest: question.order_in_test || (index + 1),
                    passageId: passageId,
                    audioId: audioId,
                    correctAnswer: question.correct_answer,
                    explanation: question.explanation || '',
                    alternativeAnswers: question.alternative_answers || '',
                    questionSetInstructions: question.question_set_instructions || '',

                    // ✅ CRITICAL: Include context field
                    context: question.context || ''
                };

                console.log('✅ Formatted question with context:', {
                    questionText: formattedQuestion.questionText?.substring(0, 50) + '...',
                    questionType: formattedQuestion.questionType,
                    hasContext: !!(formattedQuestion.context && formattedQuestion.context.trim()),
                    contextLength: formattedQuestion.context?.length || 0,
                    hasInstructions: !!(formattedQuestion.questionSetInstructions && formattedQuestion.questionSetInstructions.trim()),
                    audioId: formattedQuestion.audioId,
                    passageId: formattedQuestion.passageId
                });

                return formattedQuestion;
            }) || []
        };

        console.log('=== FINAL FORMATTED DATA WITH CONTEXT ===');
        console.log('2. Formatted data summary:');
        console.log('- testName:', formattedData.testName);
        console.log('- testType:', formattedData.testType);
        console.log('- durationMinutes:', formattedData.durationMinutes);
        console.log('- passingScore:', formattedData.passingScore);
        console.log('- readingPassages count:', formattedData.readingPassages.length);
        console.log('- listeningAudio count:', formattedData.listeningAudio.length);
        console.log('- questions count:', formattedData.questions.length);

        // ✅ CONTEXT VALIDATION: Final check
        const finalQuestionsWithContext = formattedData.questions.filter(q => q.context && q.context.trim());
        console.log(`✅ Final questions WITH context: ${finalQuestionsWithContext.length}/${formattedData.questions.length}`);

        if (finalQuestionsWithContext.length > 0) {
            console.log('✅ Sample question with context being sent:', {
                questionType: finalQuestionsWithContext[0].questionType,
                contextLength: finalQuestionsWithContext[0].context.length,
                contextPreview: finalQuestionsWithContext[0].context.substring(0, 100) + '...',
                hasInstructions: !!finalQuestionsWithContext[0].questionSetInstructions
            });
        }

        // ✅ VALIDATION: Check required fields
        const validationErrors = [];
        if (!formattedData.testName) validationErrors.push('Missing testName');
        if (!formattedData.testType) validationErrors.push('Missing testType');
        if (!formattedData.durationMinutes) validationErrors.push('Missing durationMinutes');
        if (formattedData.passingScore === undefined || formattedData.passingScore === null) validationErrors.push('Missing passingScore');

        if (validationErrors.length > 0) {
            console.error('❌ VALIDATION ERRORS:', validationErrors);
            console.error('Formatted data:', formattedData);
            throw new Error('Validation failed: ' + validationErrors.join(', '));
        }

        console.log('3. Request payload size:', JSON.stringify(formattedData).length, 'bytes');

        const response = await api.post('/test/create', formattedData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ Test created successfully with context:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating test:', error);

        // ✅ ENHANCED: Context-specific error handling
        if (error.response) {
            console.error('Server response status:', error.response.status);
            console.error('Server response data:', error.response.data);

            // Check for context-related errors
            if (error.response.data?.message?.includes('context') ||
                error.response.data?.details?.includes('context')) {
                console.error('🔴 CONTEXT-RELATED ERROR in create test');
                console.error('Context error details:', error.response.data);
            }

            if (error.response.status === 400) {
                console.error('=== 400 BAD REQUEST DETAILS ===');
                console.error('Error message:', error.response.data?.message);
                console.error('Error details:', error.response.data?.details);
                console.error('Validation errors:', error.response.data?.errors);
                console.error('Field errors:', error.response.data?.fieldErrors);
            }
        }

        throw error;
    }
};

// =====================================
// ENHANCED UPDATE TEST FUNCTION WITH CONTEXT SUPPORT
// =====================================

export const updateTest = async (testId, testData) => {
    try {
        console.log(`=== UPDATE TEST WITH CONTEXT DEBUG ===`);
        console.log(`Test ID: ${testId}`);
        console.log(`Raw testData:`, testData);

        // ✅ ENHANCED: Debug context data before processing
        console.log('=== CONTEXT UPDATE DEBUGGING ===');
        if (testData.questions) {
            const questionsWithContext = testData.questions.filter(q => q.context && q.context.trim());
            console.log(`Questions with context in UPDATE: ${questionsWithContext.length}/${testData.questions.length}`);

            questionsWithContext.forEach((q, idx) => {
                console.log(`Context Q${idx + 1} for UPDATE:`, {
                    id: q.question_id,
                    type: q.question_type,
                    contextLength: q.context?.length || 0,
                    contextPreview: q.context?.substring(0, 100) + '...',
                    hasInstructions: !!(q.question_set_instructions && q.question_set_instructions.trim())
                });
            });
        }

        // Kiểm tra token trước khi gọi API
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("Không tìm thấy token đăng nhập");
            throw new Error("Bạn cần đăng nhập để cập nhật bài thi. Vui lòng đăng nhập lại.");
        }

        // Format dữ liệu giống như khi tạo mới nhưng với context preservation
        const formattedData = {
            testName: testData.test_name,
            testType: testData.test_type,
            description: testData.description || '',
            instructions: testData.instructions || '',
            durationMinutes: testData.duration_minutes,
            passingScore: testData.passing_score,
            isPractice: testData.is_practice || false,
            isPublished: testData.is_published || false,

            // Format reading passages (unchanged)
            readingPassages: testData.reading_passages?.map((passage, index) => ({
                id: passage.id, // Giữ lại id nếu có
                title: passage.title,
                content: passage.content,
                orderInTest: passage.order_in_test || (index + 1)
            })) || [],

            // Format listening audio với FULL DATA
            listeningAudio: (() => {
                console.log('=== FORMATTING AUDIO FOR UPDATE ===');

                if (!testData.listening_audio || testData.listening_audio.length === 0) {
                    console.log('No listening audio data in update');
                    return [];
                }

                return testData.listening_audio.map((audio, index) => {
                    console.log(`--- Formatting Audio ${index + 1} for Update ---`);

                    const hasBase64 = audio.audio_base64 && audio.audio_base64.trim() !== '';
                    const hasFilePath = audio.file_path && audio.file_path.trim() !== '';

                    console.log(`Audio ${index + 1} data check:`, {
                        hasBase64,
                        hasFilePath,
                        base64Length: audio.audio_base64?.length,
                        filePath: audio.file_path
                    });

                    if (!hasBase64 && !hasFilePath) {
                        console.warn(`⚠️ Audio ${index + 1} has no base64 and no file_path - may be deleted!`);
                    }

                    const formatted = {
                        id: audio.id || null,
                        title: audio.title || `Section ${index + 1}`,
                        section: audio.section || `SECTION${index + 1}`,
                        orderInTest: audio.order_in_test || (index + 1),
                        transcript: audio.transcript || '',
                        fileType: audio.file_type || 'MP3',
                        durationSeconds: audio.duration_seconds || null,

                        audioBase64: audio.audio_base64 || null,
                        originalFileName: audio.original_file_name || null,
                        fileSize: audio.file_size || null,
                        mimeType: audio.mime_type || null,

                        filePath: audio.file_path || null
                    };

                    console.log(`✅ Formatted audio ${index + 1} result:`, {
                        id: formatted.id,
                        title: formatted.title,
                        section: formatted.section,
                        fileType: formatted.fileType,
                        hasAudioBase64: !!formatted.audioBase64,
                        audioBase64Length: formatted.audioBase64?.length,
                        hasFilePath: !!formatted.filePath,
                        originalFileName: formatted.originalFileName,
                        fileSize: formatted.fileSize,
                        mimeType: formatted.mimeType
                    });

                    return formatted;
                });
            })(),

            // ✅ ENHANCED: Format questions with context preservation for UPDATE
            questions: testData.questions?.map((question, index) => {
                console.log(`\n--- Question ${index + 1} UPDATE Debug ---`);
                console.log('Question type:', question.question_type);
                console.log('Question text length:', question.question_text?.length);
                console.log('Passage ID:', question.passage_id);
                console.log('Audio ID:', question.audio_id);
                console.log('Correct answer:', question.correct_answer);

                // ✅ CRITICAL: Debug context field for UPDATE
                console.log('Has context for UPDATE:', !!(question.context && question.context.trim()));
                console.log('Context length for UPDATE:', question.context?.length || 0);
                console.log('Context preview for UPDATE:', question.context?.substring(0, 50) || 'empty');
                console.log('Has instructions for UPDATE:', !!(question.question_set_instructions && question.question_set_instructions.trim()));

                // Xử lý options
                let options = '';
                if (question.question_type === 'MCQ') {
                    if (Array.isArray(question.options)) {
                        options = JSON.stringify(question.options);
                    } else {
                        options = JSON.stringify(['', '', '', '']);
                    }
                } else if (question.question_type === 'MATCHING') {
                    const pairs = [];
                    if (Array.isArray(question.options)) {
                        for (let i = 0; i < question.options.length; i++) {
                            if (question.options[i]?.left || question.options[i]?.right) {
                                pairs.push({
                                    left: question.options[i]?.left || '',
                                    right: question.options[i]?.right || ''
                                });
                            }
                        }
                    }
                    options = JSON.stringify(pairs);
                } else {
                    options = typeof question.options === 'object'
                        ? JSON.stringify(question.options)
                        : (question.options || '');
                }

                const passageId = question.passage_id ?
                    (typeof question.passage_id === 'string' && question.passage_id.trim() === '' ?
                        null : parseInt(question.passage_id, 10)) :
                    null;

                const audioId = question.audio_id ?
                    (typeof question.audio_id === 'string' && question.audio_id.trim() === '' ?
                        null : parseInt(question.audio_id, 10)) :
                    null;

                const formattedQuestion = {
                    id: question.question_id, // Giữ lại id nếu có
                    questionText: question.question_text,
                    questionType: question.question_type,
                    options: options,
                    section: question.section || null,
                    orderInTest: question.order_in_test || (index + 1),
                    passageId: passageId,
                    audioId: audioId,
                    questionSetInstructions: question.question_set_instructions || '',
                    correctAnswer: question.correct_answer,
                    explanation: question.explanation || '',
                    alternativeAnswers: question.alternative_answers || '',

                    // ✅ CRITICAL: Include context field for UPDATE
                    context: question.context || ''
                };

                console.log(`✅ Formatted question for UPDATE:`, {
                    id: formattedQuestion.id,
                    questionType: formattedQuestion.questionType,
                    hasContext: !!(formattedQuestion.context && formattedQuestion.context.trim()),
                    contextLength: formattedQuestion.context?.length || 0,
                    hasInstructions: !!(formattedQuestion.questionSetInstructions && formattedQuestion.questionSetInstructions.trim()),
                    audioId: formattedQuestion.audioId,
                    passageId: formattedQuestion.passageId
                });

                return formattedQuestion;
            }) || []
        };

        console.log('=== FINAL FORMATTED DATA FOR UPDATE WITH CONTEXT ===');
        console.log('Basic info:', {
            testName: formattedData.testName,
            testType: formattedData.testType,
            readingPassagesCount: formattedData.readingPassages.length,
            listeningAudioCount: formattedData.listeningAudio.length,
            questionsCount: formattedData.questions.length
        });

        // ✅ CONTEXT VALIDATION for UPDATE: Final check
        const finalQuestionsWithContext = formattedData.questions.filter(q => q.context && q.context.trim());
        console.log(`✅ Final UPDATE questions WITH context: ${finalQuestionsWithContext.length}/${formattedData.questions.length}`);

        if (finalQuestionsWithContext.length > 0) {
            console.log('✅ Sample UPDATE question with context being sent:', {
                id: finalQuestionsWithContext[0].id,
                questionType: finalQuestionsWithContext[0].questionType,
                contextLength: finalQuestionsWithContext[0].context.length,
                contextPreview: finalQuestionsWithContext[0].context.substring(0, 100) + '...',
                hasInstructions: !!finalQuestionsWithContext[0].questionSetInstructions
            });
        }

        // ✅ VALIDATION: Check if we're about to lose context data
        const originalQuestionsWithContext = testData.questions?.filter(q => q.context && q.context.trim()).length || 0;
        const formattedQuestionsWithContext = finalQuestionsWithContext.length;

        if (originalQuestionsWithContext > formattedQuestionsWithContext) {
            console.error(`❌ CONTEXT LOSS WARNING in UPDATE: ${originalQuestionsWithContext} → ${formattedQuestionsWithContext}`);
        }

        // Gửi request
        const response = await api.post(`/test/${testId}/update`, formattedData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 seconds for large audio data
        });

        console.log('✅ Test updated successfully with context:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error updating test:', error);

        // ✅ ENHANCED: Context-specific error handling for UPDATE
        if (error.response) {
            console.error('Server response status:', error.response.status);
            console.error('Server response data:', error.response.data);

            // Check for context-related errors in UPDATE
            if (error.response.data?.message?.includes('context') ||
                error.response.data?.details?.includes('context')) {
                console.error('🔴 CONTEXT-RELATED ERROR in update test');
                console.error('Context error details:', error.response.data);
            }

            if (error.response.status === 413) {
                throw new Error('Dữ liệu quá lớn (audio files). Vui lòng giảm kích thước file audio.');
            } else if (error.response.status === 408) {
                throw new Error('Timeout - Dữ liệu quá lớn hoặc kết nối chậm. Vui lòng thử lại.');
            }
        }

        throw error;
    }
};

// =====================================
// ENHANCED GET TEST FOR EDIT WITH CONTEXT SUPPORT
// =====================================

export const getTestForEdit = async (testId) => {
    try {
        console.log(`=== LOADING TEST FOR EDIT WITH CONTEXT ===`);
        console.log(`Test ID: ${testId}`);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để chỉnh sửa bài thi. Vui lòng đăng nhập lại.");
        }

        const response = await api.get(`/test/${testId}`);
        console.log("=== RAW API RESPONSE FOR EDIT WITH CONTEXT ===");
        console.log("Full response.data:", JSON.stringify(response.data, null, 2));

        const testDetail = response.data;

        // ✅ DEBUG: Kiểm tra audio data có tồn tại không
        if (testDetail.audio && testDetail.audio.length > 0) {
            console.log("=== AUDIO DATA FOUND FOR EDIT ===");
            testDetail.audio.forEach((audio, idx) => {
                console.log(`Audio ${idx + 1}:`, {
                    id: audio.id,
                    title: audio.title,
                    section: audio.section,
                    fileType: audio.fileType,
                    storageType: audio.storageType,
                    hasBase64Data: !!audio.base64Data || !!audio.audioBase64,
                    hasFilePath: !!audio.filePath,
                    fileSize: audio.fileSize,
                    originalFileName: audio.originalFileName,
                    mimeType: audio.mimeType,
                    durationSeconds: audio.durationSeconds
                });
            });
        } else {
            console.log("❌ NO AUDIO DATA FOUND in API response for edit");
        }

        const formattedData = {
            test_name: testDetail.test?.testName || '',
            test_type: testDetail.test?.testType || 'READING',
            description: testDetail.test?.description || '',
            instructions: testDetail.test?.instructions || '',
            duration_minutes: testDetail.test?.durationMinutes || 60,
            passing_score: testDetail.test?.passingScore || 5.0,
            is_practice: testDetail.test?.isPractice || false,
            is_published: testDetail.test?.isPublished || false,

            // Reading passages mapping (unchanged)
            reading_passages: testDetail.passages?.map((passage, index) => {
                console.log(`Mapping passage ${index + 1}:`, passage);
                return {
                    id: passage.id,
                    title: passage.title || '',
                    content: passage.content || '',
                    order_in_test: passage.orderInTest || (index + 1)
                };
            }) || [],

            // ENHANCED: Listening audio mapping với full data
            listening_audio: testDetail.audio?.map((audio, index) => {
                console.log(`=== MAPPING AUDIO ${index + 1} FOR EDIT ===`);
                console.log('Raw audio data:', audio);

                const mappedAudio = {
                    id: audio.id,
                    title: audio.title || `Section ${index + 1}`,
                    section: audio.section || `SECTION${index + 1}`,
                    file_type: audio.fileType || 'MP3',
                    transcript: audio.transcript || '',
                    order_in_test: audio.orderInTest || (index + 1),
                    duration_seconds: audio.durationSeconds || 0,

                    // QUAN TRỌNG: Map full audio data để component có thể sử dụng
                    audio_base64: audio.base64Data || audio.audioBase64 || null,
                    original_file_name: audio.originalFileName || null,
                    file_size: audio.fileSize || null,
                    mime_type: audio.mimeType || null,

                    // Fallback to file path if no base64
                    file_path: audio.filePath || null
                };

                console.log('✅ Mapped audio result:', {
                    id: mappedAudio.id,
                    title: mappedAudio.title,
                    section: mappedAudio.section,
                    file_type: mappedAudio.file_type,
                    hasAudioBase64: !!mappedAudio.audio_base64,
                    hasFilePath: !!mappedAudio.file_path,
                    fileSize: mappedAudio.file_size,
                    originalFileName: mappedAudio.original_file_name
                });

                return mappedAudio;
            }) || [],

            // ✅ ENHANCED: Questions mapping với context preservation
            questions: []
        };

        // ✅ ENHANCED: Load questions with context preservation
        if (testDetail.questions && testDetail.questions.length > 0) {
            console.log("=== LOADING QUESTIONS WITH CONTEXT FOR EDIT ===");

            for (let i = 0; i < testDetail.questions.length; i++) {
                const question = testDetail.questions[i];

                // ✅ DEBUG: Log context data from database
                console.log(`Question ${i + 1} context from DB:`, {
                    id: question.id,
                    type: question.questionType,
                    hasContext: !!(question.context && question.context.trim()),
                    contextLength: question.context?.length || 0,
                    contextPreview: question.context?.substring(0, 100) || 'empty',
                    hasInstructions: !!(question.questionSetInstructions && question.questionSetInstructions.trim())
                });

                let formattedOptions = question.options;
                try {
                    if (typeof question.options === 'string' && question.options.startsWith('[')) {
                        formattedOptions = JSON.parse(question.options);
                    }
                } catch (e) {
                    console.error('Lỗi khi parse options:', e);
                    formattedOptions = question.options;
                }

                const questionData = {
                    question_id: question.id,
                    question_text: question.questionText || '',
                    question_type: question.questionType || 'MCQ',
                    options: formattedOptions,
                    section: question.section || '',
                    order_in_test: question.orderInTest || (i + 1),
                    passage_id: question.passageId || null,
                    audio_id: question.audioId || null,
                    question_set_instructions: question.questionSetInstructions || '',

                    // ✅ CRITICAL: Include context from database
                    context: question.context || '',

                    correct_answer: '',
                    explanation: '',
                    alternative_answers: ''
                };

                // Load correct answer từ API riêng
                try {
                    console.log(`Loading correct answer for question ID: ${question.id}`);
                    const correctAnswerResponse = await api.get(`/test/correct-answer/${question.id}`);

                    if (correctAnswerResponse.data) {
                        questionData.correct_answer = correctAnswerResponse.data.correctAnswerText || '';
                        questionData.explanation = correctAnswerResponse.data.explanation || '';
                        questionData.alternative_answers = correctAnswerResponse.data.alternativeAnswers || '';
                    }
                } catch (correctAnswerError) {
                    console.warn(`⚠️ Không thể load correct answer cho question ${question.id}:`, correctAnswerError.message);
                }

                // ✅ DEBUG: Log final question data with context
                console.log(`✅ Final question ${i + 1} data:`, {
                    id: questionData.question_id,
                    type: questionData.question_type,
                    hasContext: !!(questionData.context && questionData.context.trim()),
                    contextLength: questionData.context?.length || 0,
                    hasInstructions: !!(questionData.question_set_instructions && questionData.question_set_instructions.trim()),
                    audioId: questionData.audio_id,
                    passageId: questionData.passage_id
                });

                formattedData.questions.push(questionData);
            }
        }

        console.log("=== FINAL FORMATTED DATA FOR EDIT WITH CONTEXT ===");
        console.log("reading_passages count:", formattedData.reading_passages.length);
        console.log("listening_audio count:", formattedData.listening_audio.length);
        console.log("questions count:", formattedData.questions.length);

        // ✅ CONTEXT VALIDATION: Check loaded context data
        const questionsWithContext = formattedData.questions.filter(q => q.context && q.context.trim());
        console.log(`✅ Questions WITH context loaded: ${questionsWithContext.length}/${formattedData.questions.length}`);

        if (questionsWithContext.length > 0) {
            console.log('✅ Sample question with context loaded:', {
                id: questionsWithContext[0].question_id,
                type: questionsWithContext[0].question_type,
                contextLength: questionsWithContext[0].context.length,
                contextPreview: questionsWithContext[0].context.substring(0, 100) + '...',
                hasInstructions: !!questionsWithContext[0].question_set_instructions
            });
        }

        // ✅ DEBUG: Log sample audio data
        if (formattedData.listening_audio.length > 0) {
            console.log("Sample audio data:", {
                id: formattedData.listening_audio[0].id,
                title: formattedData.listening_audio[0].title,
                hasBase64: !!formattedData.listening_audio[0].audio_base64,
                hasFilePath: !!formattedData.listening_audio[0].file_path,
                fileSize: formattedData.listening_audio[0].file_size
            });
        }

        return formattedData;
    } catch (error) {
        console.error('❌ Error loading test for edit with context:', error);

        // ✅ ENHANCED: Context-specific error handling for getTestForEdit
        if (error.response?.data?.message?.includes('context')) {
            console.error('🔴 CONTEXT-RELATED ERROR in getTestForEdit');
            console.error('Context error details:', error.response.data);
        }

        throw error;
    }
};

// =====================================
// NEW CONTEXT-SPECIFIC API FUNCTIONS
// =====================================

// Get context debug information for a test
export const getTestContextDebug = async (testId) => {
    try {
        console.log(`=== GETTING CONTEXT DEBUG INFO FOR TEST ${testId} ===`);

        const response = await api.get(`/tests/${testId}/context-debug`);

        console.log('Context debug response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting context debug info:', error);
        throw error;
    }
};

// Get context statistics for a test
export const getTestContextStatistics = async (testId) => {
    try {
        const response = await api.get(`/tests/${testId}/context-statistics`);
        return response.data;
    } catch (error) {
        console.error('Error getting context statistics:', error);
        throw error;
    }
};

// Validate context template format
export const validateContextTemplate = async (contextData) => {
    try {
        console.log('Validating context template:', contextData);

        const response = await api.post('/tests/validate-context', {
            context: contextData.context,
            questionType: contextData.questionType,
            questionCount: contextData.questionCount
        });

        return response.data;
    } catch (error) {
        console.error('Error validating context template:', error);
        throw error;
    }
};

// =====================================
// REMAINING ORIGINAL FUNCTIONS (with minor enhancements)
// =====================================

export const getAllUsers = async () => {
    try {
        console.log('Fetching all users...');
        const response = await api.get('/users');
        return response.data;
    } catch (error) {
        console.error('Error getting users:', error);
        throw error;
    }
};

export const createUser = async (user) => {
    try {
        console.log('Creating user...');
        const response = await api.post('/users', user);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

export const register = async (user) => {
    try {
        console.log("Registering user:", user.email);
        const response = await api.post('/auth/signup', user);
        console.log("Register response:", response.status);
        return response.data;
    } catch (error) {
        console.error('Error registering:', error);
        throw error;
    }
};

export const login = async (creds) => {
    try {
        console.log("Attempting login for:", creds.email);

        if (!creds.email || !creds.password) {
            throw new Error("Email và mật khẩu không được để trống");
        }

        const response = await api.post('/auth/signin', creds);
        console.log("Login successful:", response);

        if (response.data && (response.data.token || response.data.accessToken)) {
            const token = response.data.token || response.data.accessToken;
            localStorage.setItem('token', token);
            window.dispatchEvent(new Event('storage'));
            console.log("Token đã được lưu và sự kiện storage đã kích hoạt");
        } else {
            console.warn("Không tìm thấy token trong response:", response.data);
        }

        return response.data;
    } catch (error) {
        console.error('Error logging in:', error);

        if (error.response && error.response.data) {
            if (typeof error.response.data === 'string') {
                throw new Error(error.response.data);
            } else if (error.response.data.message) {
                throw new Error(error.response.data.message);
            }
        }

        throw new Error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.");
    }
};

export const getAllTests = async () => {
    try {
        console.log("Fetching tests from server...");

        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("No token found in localStorage");
        } else {
            console.log(`Token found (${token.length} characters)`);
        }

        const response = await api.get('/test');
        console.log(`Received ${response.data.length} tests from API`);

        return response.data;
    } catch (error) {
        console.error('Error fetching tests:');

        if (error.response) {
            console.error(`Server responded with status: ${error.response.status}`);
            console.error("Error data:", error.response.data);

            if (error.response.status === 401) {
                console.error("Authentication error - token may be invalid or expired");
            }
        } else if (error.request) {
            console.error("No response received from server");
        } else {
            console.error("Error configuring request:", error.message);
        }

        throw error;
    }
};

export const getTestDetail = async (testId) => {
    try {
        console.log(`Fetching details for test ID: ${testId}`);
        const response = await api.get(`/test/${testId}`);
        console.log("Test details received");
        return response.data;
    } catch (error) {
        console.error(`Error fetching test details for ID ${testId}:`, error);
        throw error;
    }
};

export const logout = () => {
    console.log("Logging out - removing token");
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('storage'));
    return true;
};

export const checkPassword = async (credentials) => {
    try {
        console.log(`Kiểm tra mật khẩu cho email: ${credentials.email}`);
        const response = await api.post('/auth/check-password', credentials);
        return response.data;
    } catch (error) {
        console.error('Lỗi kiểm tra mật khẩu:', error);
        throw error;
    }
};

export const uploadAudioFile = async (file) => {
    try {
        console.log('Uploading audio file:', file.name);

        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/test/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Upload progress: ${percentCompleted}%`);
            }
        });

        console.log('Upload successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error uploading audio file:', error);
        throw error;
    }
};

export const deleteTest = async (testId) => {
    try {
        console.log(`Đang xóa bài thi với ID: ${testId}`);

        const token = localStorage.getItem('token');
        if (!token) {
            console.error("Không tìm thấy token đăng nhập");
            throw new Error("Bạn cần đăng nhập để xóa bài thi. Vui lòng đăng nhập lại.");
        }

        const response = await api.post(`/test/${testId}/delete`);

        console.log("Bài thi đã được xóa thành công:", response.data);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi xóa bài thi:', error);

        if (error.response && error.response.status === 404) {
            console.log("Bài thi không tồn tại, có thể đã bị xóa trước đó");
            return {
                status: 404,
                message: "Bài thi không tồn tại hoặc đã bị xóa trước đó"
            };
        }

        throw error;
    }
};

export const debugTestStructure = async (testId) => {
    try {
        const response = await api.get(`/test/${testId}`);
        console.log('=== DEBUG TEST STRUCTURE ===');
        console.log('Full response:', response.data);

        if (response.data.questions && response.data.questions.length > 0) {
            console.log('Sample question structure:');
            const sampleQuestion = response.data.questions[0];
            console.log('Sample question fields:', Object.keys(sampleQuestion));
            console.log('questionSetInstructions value:', sampleQuestion.questionSetInstructions);
            console.log('context value:', sampleQuestion.context); // ✅ ADDED
            console.log('passageId value:', sampleQuestion.passageId);
            console.log('audioId value:', sampleQuestion.audioId);
        }

        return response.data;
    } catch (error) {
        console.error('Debug failed:', error);
        throw error;
    }
};

export const checkTokenExpiration = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        const expirationTime = decodedPayload.exp * 1000;
        const currentTime = Date.now();

        const minutesRemaining = Math.floor((expirationTime - currentTime) / (1000 * 60));

        if (minutesRemaining < 10 && minutesRemaining > 0) {
            console.warn(`Token sẽ hết hạn trong ${minutesRemaining} phút!`);

            if (window.location.pathname.includes('/test/')) {
                const warningBox = document.getElementById('token-expiry-warning');
                if (warningBox) {
                    warningBox.style.display = 'block';
                }
            } else {
                alert(`Phiên đăng nhập của bạn sắp hết hạn trong ${minutesRemaining} phút. Vui lòng đăng nhập lại để tiếp tục sử dụng.`);
            }

            return true;
        }

        if (minutesRemaining <= 0) {
            console.warn("Token đã hết hạn!");
            localStorage.removeItem('token');
            window.dispatchEvent(new Event('storage'));
            localStorage.setItem('redirectAfterLogin', window.location.pathname);

            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                window.location.href = '/login';
            }

            return false;
        }

        return true;
    } catch (err) {
        console.error("Không thể giải mã token:", err);
        return false;
    }
};

export const setupTokenExpirationChecker = () => {
    checkTokenExpiration();
    return setInterval(() => {
        checkTokenExpiration();
    }, 60 * 1000);
};

// =====================================
// ENHANCED LISTENING TEST FUNCTIONS WITH CONTEXT SUPPORT
// =====================================

export const uploadAudioFileWithProgress = async (file, onProgress) => {
    try {
        console.log('Uploading audio file with progress:', file.name);

        const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Chỉ hỗ trợ file audio: MP3, WAV, OGG, M4A');
        }

        if (file.size > 50 * 1024 * 1024) {
            throw new Error('File audio không được vượt quá 50MB');
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/test/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Upload progress: ${percentCompleted}%`);
                onProgress?.(percentCompleted);
            }
        });

        console.log('Upload successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error uploading audio file:', error);
        throw error;
    }
};

export const getListeningTestDetail = async (testId) => {
    try {
        console.log(`Fetching listening test details for ID: ${testId}`);
        const response = await api.get(`/test/${testId}`);

        const testDetail = response.data;

        if (testDetail.test?.testType === 'LISTENING') {
            if (testDetail.audio && testDetail.audio.length > 0) {
                testDetail.audio = testDetail.audio.map(audio => ({
                    ...audio,
                    fileUrl: getAudioFileUrl(audio.filePath)
                }));

                console.log(`Processed ${testDetail.audio.length} audio files for listening test`);
            }

            if (testDetail.questions && testDetail.questions.length > 0) {
                testDetail.questions.sort((a, b) => {
                    if (a.audioId !== b.audioId) {
                        return (a.audioId || 0) - (b.audioId || 0);
                    }
                    return (a.orderInTest || 0) - (b.orderInTest || 0);
                });

                console.log(`Sorted ${testDetail.questions.length} questions for listening test`);
            }
        }

        console.log("Listening test details processed:", testDetail);
        return testDetail;
    } catch (error) {
        console.error(`Error fetching listening test details for ID ${testId}:`, error);
        throw error;
    }
};

export const submitListeningTest = async (testId, responses, timingData = {}) => {
    try {
        console.log(`Submitting listening test ID: ${testId} with ${responses.length} responses`);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để nộp bài. Vui lòng đăng nhập lại.");
        }

        const submissionData = {
            testId: testId,
            responses: responses,
            timingData: {
                totalTimeSpent: timingData.totalTimeSpent || 0,
                audioPlayTime: timingData.audioPlayTime || 0,
                pauseCount: timingData.pauseCount || 0,
                replayCount: timingData.replayCount || 0,
                sectionTimes: timingData.sectionTimes || {},
                submittedAt: new Date().toISOString()
            }
        };

        const response = await api.post('/test/attempts', submissionData);

        console.log("Listening test submission result:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error submitting listening test:', error);
        throw error;
    }
};

export const getAudioFileUrl = (filePath) => {
    if (!filePath) return '';
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    return `${API_URL}/${cleanPath}`;
};

export const getAudioDuration = (file) => {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.preload = 'metadata';

        audio.onloadedmetadata = () => {
            resolve(audio.duration);
        };

        audio.onerror = () => {
            reject(new Error('Cannot read audio duration'));
        };

        const url = URL.createObjectURL(file);
        audio.src = url;

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    });
};

export const getListeningTestStats = async (testId) => {
    try {
        const response = await api.get(`/test/${testId}/listening-stats`);
        return response.data;
    } catch (error) {
        console.error('Error getting listening test stats:', error);
        return null;
    }
};

export const checkAudioAccess = async (testId) => {
    try {
        const response = await api.get(`/test/${testId}/audio-access`);
        return response.data.hasAccess;
    } catch (error) {
        console.error('Error checking audio access:', error);
        return true;
    }
};

export const getUserListeningAttempts = async (userId) => {
    try {
        const response = await api.get(`/user/${userId}/listening-attempts`);
        return response.data;
    } catch (error) {
        console.error('Error getting user listening attempts:', error);
        throw error;
    }
};

// ✅ ENHANCED: Enhanced createTest function để handle listening audio với context
export const createListeningTest = async (testData) => {
    try {
        console.log('Creating listening test with enhanced audio handling and context:', testData);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại để tạo bài thi.");
        }

        // Enhanced formatting cho listening tests với context support
        const formattedData = {
            testName: testData.test_name,
            testType: 'LISTENING',
            description: testData.description || '',
            instructions: testData.instructions || '',
            durationMinutes: testData.duration_minutes || 30,
            passingScore: testData.passing_score || 5.0,
            isPractice: testData.is_practice || false,
            isPublished: testData.is_published || false,

            listeningAudio: testData.listening_audio?.map((audio, index) => ({
                title: audio.title || `Section ${index + 1}`,
                filePath: audio.file_path,
                fileType: audio.file_type || 'MP3',
                transcript: audio.transcript || '',
                section: audio.section || `SECTION${index + 1}`,
                orderInTest: audio.order_in_test || (index + 1),
                // ✅ ENHANCED: Add audio base64 support
                audioBase64: audio.audio_base64,
                originalFileName: audio.original_file_name,
                fileSize: audio.file_size,
                mimeType: audio.mime_type,
                durationSeconds: audio.duration_seconds
            })) || [],

            // ✅ ENHANCED: Questions formatting với context relationships
            questions: testData.questions?.map((question, index) => {
                console.log(`Formatting listening question ${index + 1} with context:`, {
                    type: question.question_type,
                    hasContext: !!(question.context && question.context.trim()),
                    contextLength: question.context?.length || 0,
                    hasInstructions: !!(question.question_set_instructions && question.question_set_instructions.trim())
                });

                let options = '';

                if (question.question_type === 'MCQ') {
                    options = Array.isArray(question.options)
                        ? JSON.stringify(question.options)
                        : JSON.stringify(['', '', '', '']);
                } else if (question.question_type === 'MATCHING') {
                    const pairs = Array.isArray(question.options)
                        ? question.options.filter(opt => opt?.left || opt?.right)
                        : [];
                    options = JSON.stringify(pairs);
                } else {
                    options = typeof question.options === 'object'
                        ? JSON.stringify(question.options)
                        : (question.options || '');
                }

                const audioId = question.audio_id ?
                    (typeof question.audio_id === 'string' && question.audio_id.trim() === '' ?
                        null : parseInt(question.audio_id, 10)) :
                    null;

                const formattedQuestion = {
                    questionText: question.question_text || '',
                    questionType: question.question_type || 'MCQ',
                    options: options,
                    section: question.section || null,
                    orderInTest: question.order_in_test || (index + 1),
                    passageId: null, // Listening tests don't have passages
                    audioId: audioId,
                    correctAnswer: question.correct_answer || '',
                    explanation: question.explanation || '',
                    alternativeAnswers: question.alternative_answers || '',
                    questionSetInstructions: question.question_set_instructions || '',

                    // ✅ CRITICAL: Include context for listening questions
                    context: question.context || ''
                };

                console.log(`✅ Formatted listening question ${index + 1}:`, {
                    questionType: formattedQuestion.questionType,
                    hasContext: !!(formattedQuestion.context && formattedQuestion.context.trim()),
                    contextLength: formattedQuestion.context?.length || 0,
                    audioId: formattedQuestion.audioId
                });

                return formattedQuestion;
            }) || []
        };

        // ✅ CONTEXT VALIDATION for listening test
        const questionsWithContext = formattedData.questions.filter(q => q.context && q.context.trim());
        console.log(`✅ Listening test questions WITH context: ${questionsWithContext.length}/${formattedData.questions.length}`);

        console.log('Enhanced listening test data with context:', formattedData);

        const response = await api.post('/test/create', formattedData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('Listening test created successfully with context:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating listening test with context:', error);

        // ✅ ENHANCED: Context-specific error handling for listening tests
        if (error.response?.data?.message?.includes('context')) {
            console.error('🔴 CONTEXT-RELATED ERROR in createListeningTest');
            console.error('Context error details:', error.response.data);
        }

        throw error;
    }
};

// =====================================
// CONTEXT TEMPLATE UTILITY FUNCTIONS
// =====================================

// Validate context template format
export const validateContextFormat = (context, questionType) => {
    const errors = [];
    const warnings = [];

    if (!context || !context.trim()) {
        errors.push('Context template không được để trống');
        return { isValid: false, errors, warnings };
    }

    // Check for question placeholders
    const placeholderPattern = /___(\d+)___/g;
    const placeholders = context.match(placeholderPattern) || [];

    if (placeholders.length === 0) {
        if (questionType === 'FILL_IN_THE_BLANK') {
            errors.push('Context template phải có ít nhất một placeholder (___1___, ___2___, ...)');
        } else {
            warnings.push('Context template không có placeholder. Đây có phải là dạng bài Fill in the Blank?');
        }
    } else {
        // Check placeholder numbering
        const numbers = placeholders.map(p => parseInt(p.match(/\d+/)[0])).sort((a, b) => a - b);

        // Check for gaps in numbering
        for (let i = 0; i < numbers.length; i++) {
            if (numbers[i] !== i + 1) {
                errors.push(`Placeholder numbering có gaps. Expected ___${i + 1}___ but found ___${numbers[i]}___`);
                break;
            }
        }

        // Check for duplicates
        const uniqueNumbers = [...new Set(numbers)];
        if (uniqueNumbers.length !== numbers.length) {
            errors.push('Context template có placeholder trùng lặp');
        }
    }

    // Check context length
    if (context.length > 10000) {
        warnings.push('Context template rất dài (> 10,000 chars). Có thể gây chậm khi load.');
    }

    // Check for common formatting issues
    if (context.includes('___') && !placeholderPattern.test(context)) {
        warnings.push('Tìm thấy "___" nhưng không đúng format. Sử dụng ___1___, ___2___, etc.');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        placeholderCount: placeholders.length,
        placeholders: placeholders
    };
};

// Extract questions from context template
export const extractQuestionsFromContext = (context, questionType = 'FILL_IN_THE_BLANK') => {
    const validation = validateContextFormat(context, questionType);

    if (!validation.isValid) {
        throw new Error('Invalid context format: ' + validation.errors.join(', '));
    }

    const questions = [];
    const placeholderPattern = /___(\d+)___/g;
    let match;

    while ((match = placeholderPattern.exec(context)) !== null) {
        const questionNumber = parseInt(match[1]);
        const placeholder = match[0];
        const startIndex = match.index;

        // Extract context around the placeholder for question text
        const beforeText = context.substring(Math.max(0, startIndex - 100), startIndex).trim();
        const afterText = context.substring(startIndex + placeholder.length, startIndex + placeholder.length + 100).trim();

        let questionText = '';
        if (beforeText) {
            const beforeLines = beforeText.split('\n');
            questionText = beforeLines[beforeLines.length - 1] + ' ' + placeholder;
        } else {
            questionText = placeholder;
        }

        if (afterText) {
            const afterLines = afterText.split('\n');
            questionText += ' ' + afterLines[0];
        }

        questions.push({
            questionNumber,
            questionText: questionText.trim(),
            questionType,
            placeholder,
            contextPosition: startIndex,
            correctAnswer: '', // To be filled by user
            explanation: ''
        });
    }

    return questions.sort((a, b) => a.questionNumber - b.questionNumber);
};

// Generate context template for specific question types
export const generateContextTemplate = (questionType, questionCount = 5) => {
    const templates = {
        'NOTE_COMPLETION': `Notes on Academic Course

Course: Advanced English Studies
Duration: ___1___ weeks
Number of students: ___2___
Meeting time: ___3___ pm
Location: Room ___4___
Requirements: Must have ___5___ certificate`,

        'FORM_FILLING': `REGISTRATION FORM

Name: ___1___
Age: ___2___
Occupation: ___3___
Address: ___4___
Phone: ___5___
Email: ___6___
Emergency contact: ___7___
Special requirements: ___8___`,

        'TABLE_COMPLETION': `Course Information

| Course Name | Duration | Price | Start Date |
|-------------|----------|-------|------------|
| ___1___ | 6 weeks | ___2___ | March 15 |
| Advanced | ___3___ | $300 | ___4___ |
| Professional | 12 weeks | ___5___ | April 20 |`,

        'PLAN_MAP_COMPLETION': `LIBRARY FLOOR PLAN

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
___4___`,

        'FLEXIBLE_CONTEXT': `Custom Context Template

Add your own context here with placeholders:
- Item 1: ___1___
- Item 2: ___2___
- Item 3: ___3___

Use ___N___ format for question positions.`
    };

    let template = templates[questionType] || templates['FLEXIBLE_CONTEXT'];

    // Adjust placeholder count if needed
    if (questionCount !== 5) {
        const placeholderPattern = /___(\d+)___/g;
        const currentPlaceholders = (template.match(placeholderPattern) || []).length;

        if (questionCount > currentPlaceholders) {
            // Add more placeholders
            for (let i = currentPlaceholders + 1; i <= questionCount; i++) {
                template += `\nAdditional item: ___${i}___`;
            }
        } else if (questionCount < currentPlaceholders) {
            // Remove excess placeholders
            for (let i = currentPlaceholders; i > questionCount; i--) {
                template = template.replace(new RegExp(`___${i}___`, 'g'), '(removed)');
            }
        }
    }

    return template;
};

// Convert context with answers to display format
export const formatContextWithAnswers = (context, answers = {}) => {
    let formatted = context;

    Object.keys(answers).forEach(questionNumber => {
        const placeholder = `___${questionNumber}___`;
        const answer = answers[questionNumber] || '[Not answered]';
        formatted = formatted.replace(new RegExp(placeholder, 'g'), `[${answer}]`);
    });

    return formatted;
};

// Get context statistics
export const getContextStatistics = (context) => {
    const validation = validateContextFormat(context);
    const wordCount = context.split(/\s+/).length;
    const lineCount = context.split('\n').length;
    const charCount = context.length;

    return {
        wordCount,
        lineCount,
        charCount,
        placeholderCount: validation.placeholderCount || 0,
        complexity: charCount > 5000 ? 'High' : charCount > 2000 ? 'Medium' : 'Low',
        readabilityScore: Math.max(0, Math.min(100, 100 - (charCount / 100))), // Simple readability score
        ...validation
    };
};

// =====================================
// ENHANCED ERROR HANDLING FOR CONTEXT
// =====================================

// Handle context-specific API errors
export const handleContextError = (error) => {
    if (error.response?.data?.message?.includes('context')) {
        const contextError = {
            type: 'CONTEXT_ERROR',
            message: error.response.data.message,
            details: error.response.data.details || '',
            suggestions: []
        };

        // Add specific suggestions based on error message
        if (contextError.message.includes('placeholder')) {
            contextError.suggestions.push('Check placeholder format: use ___1___, ___2___, etc.');
        }

        if (contextError.message.includes('length')) {
            contextError.suggestions.push('Context template may be too long. Try reducing content.');
        }

        if (contextError.message.includes('format')) {
            contextError.suggestions.push('Verify context template follows IELTS listening format guidelines.');
        }

        return contextError;
    }

    return null;
};

export const submitTestWithAudio = async (testId, responses) => {
    try {
        console.log('=== SUBMIT TEST WITH AUDIO SUPPORT ===');
        console.log(`Test ID: ${testId}`);
        console.log(`Total responses: ${responses.length}`);

        // ✅ DEBUG: Log audio responses
        const audioResponses = responses.filter(r => r.audioResponse && r.audioResponse.trim());
        const textResponses = responses.filter(r => r.responseText && r.responseText.trim());

        console.log(`Audio responses: ${audioResponses.length}`);
        console.log(`Text responses: ${textResponses.length}`);

        // ✅ LOG: Sample audio response info
        if (audioResponses.length > 0) {
            const sample = audioResponses[0];
            console.log('Sample audio response:', {
                questionId: sample.questionId,
                audioLength: sample.audioResponse?.length || 0,
                duration: sample.audioDuration,
                fileType: sample.audioFileType,
                fileSize: sample.audioFileSize
            });
        }

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để nộp bài. Vui lòng đăng nhập lại.");
        }

        const requestData = {
            testId: testId,
            responses: responses
        };

        console.log('Request summary:', {
            testId: requestData.testId,
            totalResponses: requestData.responses.length,
            audioResponses: audioResponses.length,
            estimatedPayloadSize: JSON.stringify(requestData).length
        });

        // ✅ ENHANCED: Use longer timeout for audio data
        const response = await api.post('/test/attempts', requestData, {
            timeout: 60000, // 60 seconds for audio upload
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('=== AUDIO SUBMISSION SUCCESS ===');
        console.log('Response:', response.data);

        // ✅ DEBUG: Check if audio was processed
        if (response.data.audioResponses) {
            console.log(`✅ Audio responses processed: ${response.data.audioResponses}`);
        }

        if (response.data.requiresManualGrading) {
            console.log('✅ Test marked for manual grading (likely speaking/writing)');
        }

        return response.data;
    } catch (error) {
        console.error('❌ Audio submission error:', error);

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);

            // ✅ SPECIFIC ERROR HANDLING for audio submissions
            if (error.response.status === 413) {
                throw new Error('Audio data quá lớn. Vui lòng giảm chất lượng audio hoặc thời lượng.');
            } else if (error.response.status === 408) {
                throw new Error('Timeout khi upload audio. Vui lòng kiểm tra kết nối và thử lại.');
            } else if (error.response.data?.message?.includes('audio')) {
                throw new Error(`Lỗi xử lý audio: ${error.response.data.message}`);
            }
        }

        throw error;
    }
};

/**
 * Validate audio data before submission
 */
export const validateAudioResponse = async (audioResponseData) => {
    try {
        console.log('=== VALIDATING AUDIO RESPONSE ===');
        console.log('Question ID:', audioResponseData.questionId);
        console.log('Audio data length:', audioResponseData.audioResponse?.length || 0);

        const response = await api.post('/test/validate-audio-response', {
            questionId: audioResponseData.questionId,
            audioResponse: audioResponseData.audioResponse,
            audioDuration: audioResponseData.audioDuration,
            audioFileType: audioResponseData.audioFileType,
            audioFileSize: audioResponseData.audioFileSize
        });

        console.log('✅ Audio validation result:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Audio validation error:', error);
        throw error;
    }
};

/**
 * Get audio statistics for a test attempt
 */
export const getAudioStatistics = async (attemptId) => {
    try {
        console.log(`Getting audio statistics for attempt: ${attemptId}`);

        const response = await api.get(`/test/attempts/${attemptId}/audio-stats`);

        console.log('Audio statistics:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting audio statistics:', error);
        return null; // Non-critical, return null instead of throwing
    }
};

/**
 * Convert audio file to base64 for submission
 */
export const convertAudioToBase64 = (audioBlob) => {
    return new Promise((resolve, reject) => {
        try {
            console.log('Converting audio blob to base64...');
            console.log('Blob size:', audioBlob.size);
            console.log('Blob type:', audioBlob.type);

            const reader = new FileReader();

            reader.onload = () => {
                const base64 = reader.result;
                console.log('✅ Audio converted to base64');
                console.log('Base64 length:', base64.length);

                // Remove data URL prefix for clean base64
                const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;

                resolve({
                    base64: cleanBase64,
                    originalSize: audioBlob.size,
                    mimeType: audioBlob.type,
                    encodedSize: base64.length
                });
            };

            reader.onerror = (error) => {
                console.error('❌ Error converting audio to base64:', error);
                reject(new Error('Failed to convert audio to base64'));
            };

            reader.readAsDataURL(audioBlob);
        } catch (error) {
            console.error('❌ Error in convertAudioToBase64:', error);
            reject(error);
        }
    });
};

/**
 * Validate audio file before recording/upload
 */
export const validateAudioFile = (audioBlob, constraints = {}) => {
    const {
        maxSize = 50 * 1024 * 1024, // 50MB default
        minDuration = 2, // 2 seconds minimum
        maxDuration = 600, // 10 minutes maximum
        allowedTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg']
    } = constraints;

    const errors = [];
    const warnings = [];

    // Check file size
    if (audioBlob.size > maxSize) {
        errors.push(`Audio file quá lớn (${formatFileSize(audioBlob.size)}). Tối đa: ${formatFileSize(maxSize)}`);
    }

    if (audioBlob.size < 1000) { // Less than 1KB
        errors.push('Audio file quá nhỏ. Có thể bị lỗi trong quá trình recording.');
    }

    // Check MIME type
    if (!allowedTypes.includes(audioBlob.type)) {
        warnings.push(`Audio type "${audioBlob.type}" có thể không được hỗ trợ. Được khuyến nghị: ${allowedTypes.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        fileSize: audioBlob.size,
        mimeType: audioBlob.type,
        formattedSize: formatFileSize(audioBlob.size)
    };
};

/**
 * Create speaking test response object
 */
export const createSpeakingResponse = (questionId, audioBlob, duration, additionalData = {}) => {
    return convertAudioToBase64(audioBlob).then(audioData => {
        const response = {
            questionId: questionId,
            audioResponse: audioData.base64,
            audioDuration: Math.round(duration), // Duration in seconds
            audioFileType: getFileTypeFromMime(audioBlob.type),
            audioFileSize: audioBlob.size,
            audioMimeType: audioBlob.type,
            submittedAt: new Date().toISOString(),
            ...additionalData
        };

        console.log('✅ Created speaking response:', {
            questionId: response.questionId,
            duration: response.audioDuration,
            fileType: response.audioFileType,
            fileSize: response.audioFileSize,
            base64Length: response.audioResponse.length
        });

        return response;
    });
};

/**
 * Batch process multiple audio responses
 */
export const processBatchAudioResponses = async (audioRecordings) => {
    try {
        console.log(`=== PROCESSING ${audioRecordings.length} AUDIO RESPONSES ===`);

        const processedResponses = [];
        const errors = [];

        for (let i = 0; i < audioRecordings.length; i++) {
            const recording = audioRecordings[i];

            try {
                console.log(`Processing audio ${i + 1}/${audioRecordings.length}...`);

                // Validate audio
                const validation = validateAudioFile(recording.audioBlob);
                if (!validation.isValid) {
                    errors.push({
                        questionId: recording.questionId,
                        errors: validation.errors
                    });
                    continue;
                }

                // Convert to response format
                const response = await createSpeakingResponse(
                    recording.questionId,
                    recording.audioBlob,
                    recording.duration,
                    recording.additionalData
                );

                processedResponses.push(response);
                console.log(`✅ Processed audio for Q${recording.questionId}`);

            } catch (error) {
                console.error(`❌ Error processing audio for Q${recording.questionId}:`, error);
                errors.push({
                    questionId: recording.questionId,
                    error: error.message
                });
            }
        }

        console.log(`=== BATCH PROCESSING COMPLETE ===`);
        console.log(`Success: ${processedResponses.length}/${audioRecordings.length}`);
        console.log(`Errors: ${errors.length}`);

        return {
            success: processedResponses,
            errors,
            totalProcessed: audioRecordings.length,
            successCount: processedResponses.length,
            errorCount: errors.length
        };
    } catch (error) {
        console.error('❌ Batch processing failed:', error);
        throw error;
    }
};

/**
 * Get test attempt with audio responses
 */
export const getTestAttemptWithAudio = async (attemptId) => {
    try {
        console.log(`=== GETTING TEST ATTEMPT WITH AUDIO: ${attemptId} ===`);

        const response = await api.get(`/test-attempts/${attemptId}`);
        const attemptData = response.data;

        console.log('Attempt data received:', {
            id: attemptData.id,
            testType: attemptData.testType,
            totalResponses: attemptData.responses?.length || 0
        });

        // ✅ DEBUG: Count audio responses
        if (attemptData.responses) {
            const audioResponses = attemptData.responses.filter(r => r.audioResponse && r.audioResponse.trim());
            const textResponses = attemptData.responses.filter(r => r.responseText && r.responseText.trim());

            console.log(`Audio responses found: ${audioResponses.length}`);
            console.log(`Text responses found: ${textResponses.length}`);

            // Log sample audio response
            if (audioResponses.length > 0) {
                const sample = audioResponses[0];
                console.log('Sample audio response:', {
                    questionId: sample.questionId,
                    audioLength: sample.audioResponse?.length || 0,
                    duration: sample.audioDuration,
                    fileType: sample.audioFileType
                });
            }
        }

        // Get audio statistics if available
        try {
            const audioStats = await getAudioStatistics(attemptId);
            if (audioStats) {
                attemptData.audioStatistics = audioStats;
                console.log('✅ Audio statistics attached:', audioStats);
            }
        } catch (error) {
            console.warn('Could not get audio statistics:', error.message);
        }

        return attemptData;
    } catch (error) {
        console.error('❌ Error getting test attempt with audio:', error);
        throw error;
    }
};

/**
 * Debug audio data in test attempt
 */
export const debugAudioData = async (attemptId) => {
    try {
        console.log(`=== DEBUGGING AUDIO DATA FOR ATTEMPT ${attemptId} ===`);

        const response = await api.get(`/debug/audio/attempt/${attemptId}`);

        console.log('Audio debug info:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error debugging audio data:', error);
        return null;
    }
};

/**
 * Test audio validation endpoint
 */
export const testAudioValidation = async (audioBase64) => {
    try {
        console.log('=== TESTING AUDIO VALIDATION ===');
        console.log('Audio data length:', audioBase64.length);

        const response = await api.post('/debug/audio/validate', {
            audioData: audioBase64
        });

        console.log('Validation result:', response.data);
        return response.data;
    } catch (error) {
        console.error('Audio validation test failed:', error);
        throw error;
    }
};

// =====================================
// HELPER FUNCTIONS FOR AUDIO SUPPORT
// =====================================

/**
 * Format file size for display
 */
const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Get file extension from MIME type
 */
const getFileTypeFromMime = (mimeType) => {
    const mimeMap = {
        'audio/webm': 'webm',
        'audio/mp3': 'mp3',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'audio/mp4': 'mp4',
        'audio/m4a': 'm4a'
    };

    return mimeMap[mimeType] || 'webm'; // Default to webm
};

/**
 * Check if browser supports audio recording
 */
export const checkAudioSupport = () => {
    const support = {
        mediaRecorder: typeof MediaRecorder !== 'undefined',
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        audioContext: !!(window.AudioContext || window.webkitAudioContext),
        fileReader: typeof FileReader !== 'undefined'
    };

    support.isSupported = Object.values(support).every(Boolean);

    console.log('Audio support check:', support);
    return support;
};

/**
 * Get recommended audio settings for recording
 */
export const getAudioRecordingSettings = (testType = 'SPEAKING') => {
    const settings = {
        SPEAKING: {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 64000, // 64kbps for speaking
            maxDuration: 300, // 5 minutes max per response
            maxFileSize: 10 * 1024 * 1024 // 10MB max
        },
        WRITING: {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 32000, // Lower quality for notes
            maxDuration: 120, // 2 minutes max
            maxFileSize: 5 * 1024 * 1024 // 5MB max
        }
    };

    return settings[testType] || settings.SPEAKING;
};

// =====================================
// ENHANCED SUBMIT TEST FUNCTION (REPLACE EXISTING)
// =====================================

/**
 * Enhanced submitTest with automatic audio detection
 */
// ✅ REPLACE the existing submitTest function in your api.js with this enhanced version:

export const submitTest = async (testId, responses) => {
    try {
        console.log('=== ENHANCED SUBMIT TEST WITH AUDIO SUPPORT ===');
        console.log(`Submitting test ID: ${testId}`);
        console.log(`Number of responses: ${responses.length}`);

        // ✅ ENHANCED: Auto-detect response types
        const audioResponses = responses.filter(r => r.audioResponse && r.audioResponse.trim());
        const textResponses = responses.filter(r => r.responseText && r.responseText.trim());
        const hasAudioData = audioResponses.length > 0;

        console.log('Response analysis:', {
            totalResponses: responses.length,
            audioResponses: audioResponses.length,
            textResponses: textResponses.length,
            hasAudioData
        });

        // ✅ DEBUG: Log sample responses with audio detection
        responses.slice(0, 3).forEach((resp, idx) => {
            const hasAudio = resp.audioResponse && resp.audioResponse.trim();
            const hasText = resp.responseText && resp.responseText.trim();

            console.log(`Sample Response ${idx + 1}: Q${resp.questionId}`, {
                hasText,
                hasAudio,
                audioLength: hasAudio ? resp.audioResponse.length : 0,
                textPreview: hasText ? resp.responseText.substring(0, 30) + '...' : 'empty'
            });
        });

        const token = localStorage.getItem('token');
        if (!token) {
            console.error("No token found");
            throw new Error("Bạn cần đăng nhập để nộp bài. Vui lòng đăng nhập lại.");
        }

        const requestData = {
            testId: testId,
            responses: responses
        };

        // ✅ ENHANCED: Use appropriate timeout based on content
        const timeoutMs = hasAudioData ? 90000 : 30000; // 90s for audio, 30s for text-only

        console.log(`Using ${timeoutMs/1000}s timeout (${hasAudioData ? 'audio' : 'text'} submission)`);

        if (hasAudioData) {
            console.log('🎤 AUDIO SUBMISSION DETECTED - Processing audio data...');

            // Log audio statistics
            const totalAudioSize = audioResponses.reduce((sum, r) => sum + (r.audioResponse?.length || 0), 0);
            const totalDuration = audioResponses.reduce((sum, r) => sum + (r.audioDuration || 0), 0);

            console.log('Audio statistics:', {
                audioResponseCount: audioResponses.length,
                totalAudioDataSize: totalAudioSize,
                totalDurationSeconds: totalDuration,
                estimatedPayloadSize: JSON.stringify(requestData).length
            });

            // ✅ VALIDATE audio responses before sending
            for (const audioResp of audioResponses) {
                if (!audioResp.audioResponse || audioResp.audioResponse.length < 1000) {
                    console.error(`❌ Invalid audio for Q${audioResp.questionId}: too small`);
                    throw new Error(`Audio response for question ${audioResp.questionId} is invalid or too small`);
                }

                if (audioResp.audioResponse.length > 50_000_000) { // ~37MB after base64 decode
                    console.error(`❌ Invalid audio for Q${audioResp.questionId}: too large`);
                    throw new Error(`Audio response for question ${audioResp.questionId} is too large`);
                }
            }

            console.log('✅ Audio validation passed');
        }

        // ✅ ENHANCED: Try multiple endpoints for submission
        let response;
        try {
            // ✅ PRIMARY: Try new enhanced endpoint
            console.log('🎯 Trying enhanced submission endpoint...');
            response = await api.post('/test/attempts', requestData, {
                timeout: timeoutMs,
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log('✅ SUCCESS with enhanced endpoint!');

        } catch (primaryError) {
            console.warn('⚠️ Enhanced endpoint failed:', primaryError.message);

            // ✅ FALLBACK: Try user-specific endpoint
            const userId = getUserId();
            if (userId) {
                console.log('🔄 Trying user-specific endpoint...');
                try {
                    response = await api.post(`/test-attempts/submit/${userId}`, requestData, {
                        timeout: timeoutMs
                    });
                    console.log('✅ SUCCESS with user-specific endpoint!');
                } catch (fallbackError) {
                    console.error('❌ Both endpoints failed');
                    throw primaryError; // Throw original error
                }
            } else {
                throw primaryError;
            }
        }

        console.log('=== ENHANCED SUBMIT RESPONSE DEBUG ===');
        console.log('Status:', response.status);
        console.log('Response data keys:', Object.keys(response.data));

        // ✅ ENHANCED: Validate response data
        if (!response.data.attemptId) {
            console.error('❌ No attemptId in response!');
            console.error('Available fields:', Object.keys(response.data));

            // Try to find attempt ID in different fields
            const possibleAttemptId = response.data.id || response.data.attempt_id || response.data.testAttemptId;
            if (possibleAttemptId) {
                console.log('✅ Found attempt ID in alternative field:', possibleAttemptId);
                response.data.attemptId = possibleAttemptId;
            }
        }

        // ✅ ENHANCED: Debug scores with audio-specific handling
        if (response.data.scores) {
            console.log('🎯 SCORES RECEIVED:', response.data.scores);

            Object.entries(response.data.scores).forEach(([skill, score]) => {
                console.log(`  ${skill}: ${score}`);

                if (typeof score === 'number' && score > 9) {
                    console.error(`🚨 ERROR: ${skill} score > 9.0! Backend returned: ${score}`);
                } else if (score === null && hasAudioData) {
                    console.log(`ℹ️ ${skill} score is null - likely requires manual grading (audio)`);
                }
            });
        }

        // ✅ ENHANCED: Audio-specific response handling
        if (hasAudioData) {
            if (response.data.requiresManualGrading) {
                console.log('🎤 Audio submission requires manual grading');
                response.data.message = response.data.message ||
                    'Bài thi speaking đã được nộp thành công. Điểm số sẽ được cập nhật sau khi giáo viên chấm bài.';
            }

            if (response.data.audioResponses) {
                console.log(`✅ Audio responses processed: ${response.data.audioResponses}`);
            }

            if (response.data.audioStatistics) {
                console.log('📊 Audio statistics:', response.data.audioStatistics);
            }
        }

        // ✅ ENHANCED: Success logging
        console.log('=== SUBMISSION SUCCESS ===');
        console.log('Attempt ID:', response.data.attemptId);
        console.log('Submission type:', hasAudioData ? 'audio' : 'text');
        console.log('Total score:', response.data.scores?.total || 'pending');
        console.log('Requires manual grading:', response.data.requiresManualGrading || false);

        return response.data;

    } catch (error) {
        console.error('=== ENHANCED SUBMIT ERROR ===');
        console.error('Error submitting test:', error);

        if (error.response) {
            console.error('Error status:', error.response.status);
            console.error('Error data:', error.response.data);

            // ✅ ENHANCED: Audio-specific error handling
            const errorMessage = error.response.data?.message || error.response.data || 'Unknown error';

            if (error.response.status === 413) {
                throw new Error('Dữ liệu quá lớn (có thể do audio files). Vui lòng thử ghi âm ngắn hơn hoặc giảm chất lượng.');
            } else if (error.response.status === 408) {
                throw new Error('Timeout khi upload. Vui lòng kiểm tra kết nối internet và thử lại.');
            } else if (errorMessage.includes('audio')) {
                throw new Error(`Lỗi xử lý audio: ${errorMessage}`);
            } else if (errorMessage.includes('base64')) {
                throw new Error('Lỗi định dạng audio. Vui lòng thử ghi lại.');
            }
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('Timeout khi gửi bài thi. Vui lòng kiểm tra kết nối và thử lại.');
        }

        throw error;
    }
};

// ✅ Helper function to get user ID from token (if not already exists)
const getUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.userId || payload.id;
    } catch (e) {
        console.error('Error parsing user ID from token:', e);
        return null;
    }
};

/**
 * Text-only submission (existing logic)
 */
const submitTestTextOnly = async (testId, responses) => {
    try {
        console.log('=== TEXT-ONLY SUBMISSION ===');

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để nộp bài. Vui lòng đăng nhập lại.");
        }

        const requestData = {
            testId: testId,
            responses: responses
        };

        const response = await api.post('/test/attempts', requestData);

        console.log('✅ Text-only submission successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Text-only submission error:', error);
        throw error;
    }
};

// =====================================
// FLASHCARD API FUNCTIONS
// =====================================

/**
 * Get all flashcard sets (PUBLIC)
 */
export const getAllFlashcardSets = async () => {
    try {
        console.log('=== GETTING ALL FLASHCARD SETS ===');
        console.log('Full URL will be:', `${API_URL}/flashcards/sets`);

        const response = await api.get('/flashcards/sets', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Flashcard sets received:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching flashcard sets:', error);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            console.error('Response data type:', typeof error.response.data);
            console.error('Response data preview:',
                typeof error.response.data === 'string'
                    ? error.response.data.substring(0, 200) + '...'
                    : error.response.data
            );
        }

        throw error;
    }
};

/**
 * Get flashcards by set name (PUBLIC)
 */
export const getFlashcardsBySet = async (setName) => {
    try {
        console.log('=== GETTING FLASHCARDS BY SET ===');
        console.log('Set name:', setName);

        const response = await api.get(`/flashcards/sets/${encodeURIComponent(setName)}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Flashcards received for set:', setName, response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching flashcards by set:', error);
        throw error;
    }
};

/**
 * Get public flashcards (PUBLIC)
 */
export const getPublicFlashcards = async () => {
    try {
        console.log('=== GETTING PUBLIC FLASHCARDS ===');

        const response = await api.get('/flashcards/public', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Public flashcards received:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching public flashcards:', error);
        throw error;
    }
};

/**
 * Get today's study cards (AUTHENTICATED)
 */
export const getTodayStudyCards = async () => {
    try {
        console.log('=== GETTING TODAY STUDY CARDS ===');

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để xem thẻ học hôm nay.");
        }

        const response = await api.get('/flashcards/study/today');

        console.log('✅ Today study cards received:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching today study cards:', error);
        throw error;
    }
};

/**
 * Rate a flashcard (AUTHENTICATED)
 */
export const rateFlashcard = async (flashcardId, rating) => {
    try {
        console.log('=== RATING FLASHCARD ===');
        console.log('Flashcard ID:', flashcardId);
        console.log('Rating:', rating);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để đánh giá thẻ.");
        }

        const response = await api.post('/flashcards/rate', {
            flashcardId: flashcardId,
            rating: rating
        });

        console.log('✅ Flashcard rated successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error rating flashcard:', error);
        throw error;
    }
};

/**
 * Get flashcard statistics (AUTHENTICATED)
 */
export const getFlashcardStatistics = async () => {
    try {
        console.log('=== GETTING FLASHCARD STATISTICS ===');

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để xem thống kê.");
        }

        const response = await api.get('/flashcards/statistics');

        console.log('✅ Flashcard statistics received:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching flashcard statistics:', error);
        throw error;
    }
};

/**
 * Create new flashcard (TEACHER/ADMIN)
 */
export const createFlashcard = async (flashcardData) => {
    try {
        console.log('=== CREATING FLASHCARD ===');
        console.log('Flashcard data:', flashcardData);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để tạo thẻ.");
        }

        const response = await api.post('/flashcards/create', flashcardData);

        console.log('✅ Flashcard created successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating flashcard:', error);
        throw error;
    }
};

/**
 * Update flashcard (TEACHER/ADMIN)
 */
export const updateFlashcard = async (flashcardId, flashcardData) => {
    try {
        console.log('=== UPDATING FLASHCARD ===');
        console.log('Flashcard ID:', flashcardId);
        console.log('Flashcard data:', flashcardData);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để cập nhật thẻ.");
        }

        const response = await api.put(`/flashcards/${flashcardId}`, flashcardData);

        console.log('✅ Flashcard updated successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error updating flashcard:', error);
        throw error;
    }
};

/**
 * Delete flashcard (TEACHER/ADMIN)
 */
export const deleteFlashcard = async (flashcardId) => {
    try {
        console.log('=== DELETING FLASHCARD ===');
        console.log('Flashcard ID:', flashcardId);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để xóa thẻ.");
        }

        const response = await api.delete(`/flashcards/${flashcardId}`);

        console.log('✅ Flashcard deleted successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error deleting flashcard:', error);
        throw error;
    }
};

/**
 * Search flashcards (PUBLIC)
 */
export const searchFlashcards = async (keyword) => {
    try {
        console.log('=== SEARCHING FLASHCARDS ===');
        console.log('Keyword:', keyword);

        const response = await api.get('/flashcards/search', {
            params: { keyword }
        });

        console.log('✅ Search results received:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error searching flashcards:', error);
        throw error;
    }
};

/**
 * Get my flashcards (AUTHENTICATED)
 */
export const getMyFlashcards = async () => {
    try {
        console.log('=== GETTING MY FLASHCARDS ===');

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để xem thẻ của mình.");
        }

        const response = await api.get('/flashcards/my-cards');

        console.log('✅ My flashcards received:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching my flashcards:', error);
        throw error;
    }
};

/**
 * Test flashcard API connection (DEBUG)
 */
export const testFlashcardConnection = async () => {
    try {
        console.log('=== TESTING FLASHCARD API CONNECTION ===');
        console.log('API_URL:', API_URL);
        console.log('Testing endpoint:', `${API_URL}/flashcards/sets`);

        // Test with direct fetch
        const directResponse = await fetch(`${API_URL}/flashcards/sets`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('Direct fetch status:', directResponse.status);
        console.log('Direct fetch headers:', directResponse.headers);
        console.log('Direct fetch content-type:', directResponse.headers.get('content-type'));

        const responseText = await directResponse.text();
        console.log('Direct fetch response (first 500 chars):', responseText.substring(0, 500));

        let responseData;
        try {
            responseData = JSON.parse(responseText);
            console.log('✅ Direct fetch JSON parse successful:', responseData);
        } catch (e) {
            console.error('❌ Direct fetch JSON parse failed:', e);
            console.error('Raw response:', responseText);
        }

        return {
            status: directResponse.status,
            contentType: directResponse.headers.get('content-type'),
            isJson: directResponse.headers.get('content-type')?.includes('application/json'),
            responsePreview: responseText.substring(0, 200),
            data: responseData
        };

    } catch (error) {
        console.error('❌ Flashcard connection test failed:', error);
        throw error;
    }
};

export const getUserProfile = async () => {
    try {
        console.log('=== GETTING USER PROFILE ===');

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để xem profile.");
        }

        const response = await api.get('/users/profile');

        console.log('✅ User profile received:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error getting user profile:', error);
        throw error;
    }
};

/**
 * Get user statistics (tests + flashcards)
 */
export const getUserStatistics = async () => {
    try {
        console.log('=== GETTING USER STATISTICS ===');

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để xem thống kê.");
        }

        const response = await api.get('/users/profile/stats');

        console.log('✅ User statistics received:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error getting user statistics:', error);
        throw error;
    }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData) => {
    try {
        console.log('=== UPDATING USER PROFILE ===');
        console.log('Profile data:', profileData);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để cập nhật profile.");
        }

        const response = await api.put('/users/profile', profileData);

        console.log('✅ Profile updated successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        throw error;
    }
};

/**
 * Update last login time
 */
export const updateLastLogin = async () => {
    try {
        console.log('=== UPDATING LAST LOGIN ===');

        const token = localStorage.getItem('token');
        if (!token) {
            return; // Silent fail if no token
        }

        await api.post('/users/update-last-login');

        console.log('✅ Last login updated');
    } catch (error) {
        console.error('❌ Error updating last login:', error);
        // Don't throw - this is not critical
    }
};

/**
 * Get user by ID (admin function)
 */
export const getUserById = async (userId) => {
    try {
        console.log(`=== GETTING USER BY ID: ${userId} ===`);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error("Bạn cần đăng nhập để xem thông tin user.");
        }

        const response = await api.get(`/users/${userId}`);

        console.log('✅ User data received:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error getting user by ID:', error);
        throw error;
    }
};
export default api;