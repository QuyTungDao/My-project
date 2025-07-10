import {useEffect, useState} from "react";
import {canCreateExam, getUserFromToken} from "../utlis/authUtils";
import {
    getMyTestsWithGradingInfo,
    getTestSubmissions,
    getAttemptForGrading,
    gradeResponse,
    handleGradingError,
    validateScore,
    formatScore,
    formatSubmissionDate,
    calculateCompletionPercentage,
    getMyTests,
    getMyTestsWithGradingInfoEnhanced,
    getMyTestsQuickFix
} from "../api";
import './MyTestPage.css';
// ✅ ADD: Import GradingModal
import GradingModal from './GradingModal';

const MyTestsPage = () => {
    const [user, setUser] = useState(null);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTest, setSelectedTest] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [view, setView] = useState('tests'); // 'tests', 'submissions' (removed 'grading')
    const [gradingProgress, setGradingProgress] = useState({});

    // ✅ ADD: Modal state variables
    const [showGradingModal, setShowGradingModal] = useState(false);
    const [selectedAttemptId, setSelectedAttemptId] = useState(null);

    useEffect(() => {
        const currentUser = getUserFromToken();
        setUser(currentUser);
        fetchMyTests();
    }, []);

    const fetchMyTests = async () => {
        try {
            setLoading(true);
            setError('');

            // 🔍 DEBUG: Kiểm tra user trước khi gọi API
            const currentUser = getUserFromToken();
            console.log('🔍 Current user:', currentUser);

            if (!currentUser || (!currentUser.id && !currentUser.user_id)) {
                setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
                return;
            }

            console.log('🔍 User role:', currentUser.role);
            console.log('🔍 Can create exam:', canCreateExam());

            // 🔍 DEBUG: Log trước khi gọi API
            console.log('🔍 Calling API for user:', currentUser.id || currentUser.user_id);

            // ✅ TRY MULTIPLE API METHODS WITH FALLBACKS
            let testsData = null;
            let apiUsed = '';

            try {
                // Try enhanced endpoint first (with grading info)
                console.log('🎯 Trying getMyTestsWithGradingInfoEnhanced...');
                testsData = await getMyTestsWithGradingInfoEnhanced();
                apiUsed = 'getMyTestsWithGradingInfoEnhanced';
                console.log('✅ SUCCESS with enhanced API');
            } catch (enhancedError) {
                console.warn('⚠️ Enhanced API failed:', enhancedError.message);

                try {
                    // Try original enhanced endpoint
                    console.log('🔄 Trying original getMyTestsWithGradingInfo...');
                    testsData = await getMyTestsWithGradingInfo();
                    apiUsed = 'getMyTestsWithGradingInfo';
                    console.log('✅ SUCCESS with original enhanced API');
                } catch (originalError) {
                    console.warn('⚠️ Original enhanced API failed:', originalError.message);

                    try {
                        // Try basic endpoint
                        console.log('🔄 Trying basic getMyTests...');
                        testsData = await getMyTests();
                        apiUsed = 'getMyTests';
                        console.log('✅ SUCCESS with basic API');
                    } catch (basicError) {
                        console.warn('⚠️ Basic API failed:', basicError.message);

                        try {
                            // Final fallback: Quick fix
                            console.log('🔄 Trying quick fix...');
                            testsData = await getMyTestsQuickFix();
                            apiUsed = 'getMyTestsQuickFix';
                            console.log('✅ SUCCESS with quick fix');
                        } catch (quickFixError) {
                            console.error('❌ ALL APIs failed');
                            console.error('Enhanced error:', enhancedError);
                            console.error('Original error:', originalError);
                            console.error('Basic error:', basicError);
                            console.error('Quick fix error:', quickFixError);
                            throw enhancedError; // Throw most relevant error
                        }
                    }
                }
            }

            // 🔍 DEBUG: Log response chi tiết
            console.log('🔍 API Used:', apiUsed);
            console.log('🔍 Raw API Response:', testsData);
            console.log('🔍 Response type:', typeof testsData);
            console.log('🔍 Is Array:', Array.isArray(testsData));
            console.log('🔍 Response length:', testsData?.length);

            // ✅ ENHANCED: Handle different response formats
            if (!testsData) {
                console.warn('⚠️ API returned null/undefined');
                setTests([]);
                return;
            }

            // Handle error response format
            if (testsData.error === true) {
                console.error('❌ API returned error:', testsData.message);
                setError(testsData.message || 'Có lỗi xảy ra khi tải danh sách bài thi');
                setTests([]);
                return;
            }

            if (!Array.isArray(testsData)) {
                console.warn('⚠️ API response is not an array:', testsData);
                // Có thể API trả về { tests: [...] } hoặc { data: [...] }
                if (testsData.tests && Array.isArray(testsData.tests)) {
                    setTests(testsData.tests);
                    console.log('✅ Using testsData.tests');
                } else if (testsData.data && Array.isArray(testsData.data)) {
                    setTests(testsData.data);
                    console.log('✅ Using testsData.data');
                } else {
                    console.warn('⚠️ No recognizable data structure, setting empty array');
                    setTests([]);
                }
                return;
            }

            // ✅ VALIDATE: Check if tests have required fields AND filter for Writing/Speaking only
            const validTests = testsData.filter(test => {
                const isValid = test && test.id && (test.testName || test.test_name);
                if (!isValid) {
                    console.warn('⚠️ Invalid test object:', test);
                    return false;
                }

                // ✅ FILTER: Only show Writing and Speaking tests
                const testType = test.testType || test.test_type || '';
                const isWritingOrSpeaking = testType.toUpperCase() === 'WRITING' ||
                    testType.toUpperCase() === 'SPEAKING';

                if (!isWritingOrSpeaking) {
                    console.log(`🚫 Filtered out ${testType} test: ${test.testName || test.test_name}`);
                }

                return isWritingOrSpeaking;
            });

            if (validTests.length !== testsData.length) {
                const filteredCount = testsData.length - validTests.length;
                console.warn(`⚠️ Filtered out ${filteredCount} tests (${filteredCount - (testsData.length - testsData.filter(test => test && test.id).length)} non-Writing/Speaking tests)`);
            }

            setTests(validTests);
            console.log('✅ Successfully set tests:', validTests.length, 'items');

            // 🔍 DEBUG: Log sample test data structure
            if (validTests.length > 0) {
                const sample = validTests[0];
                console.log('📝 Sample test:', sample);
                console.log('📝 Test structure keys:', Object.keys(sample));
                console.log('📝 Test type:', sample.testType || sample.test_type);
                console.log('📝 Has grading info:', !!(sample.totalSubmissions !== undefined || sample.pendingSubmissions !== undefined));
            }

            // 🔍 SUCCESS MESSAGE
            if (validTests.length === 0) {
                setError('Bạn chưa tạo bài thi Writing hoặc Speaking nào. Hãy tạo bài thi đầu tiên!');
            }

        } catch (err) {
            console.error('❌ Error fetching tests:', err);
            console.error('❌ Error details:', {
                message: err.message,
                stack: err.stack,
                response: err.response?.data,
                status: err.response?.status
            });

            // ✅ BETTER ERROR HANDLING
            let errorMessage = 'Có lỗi xảy ra khi tải danh sách bài thi';

            if (err.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
            } else if (err.response?.status === 403) {
                errorMessage = 'Bạn không có quyền xem danh sách bài thi. Chỉ Teacher và Admin mới có thể tạo và quản lý bài thi.';
            } else if (err.response?.status === 500) {
                errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setTests([]); // ✅ Đảm bảo set empty array khi lỗi
        } finally {
            setLoading(false);
        }
    };

    const handleViewSubmissions = async (test) => {
        try {
            setSelectedTest(test);
            setLoading(true);
            setError('');

            // ✅ USE REAL API
            const submissionsData = await getTestSubmissions(test.id);
            setSubmissions(submissionsData);
            setView('submissions');

            console.log('✅ Loaded real submissions for test:', test.testName);
        } catch (err) {
            console.error('❌ Error fetching submissions:', err);
            const errorMessage = handleGradingError(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED: Use modal instead of inline grading
    const handleGradeSubmission = async (submission) => {
        try {
            setLoading(true);
            setError('');

            console.log('✅ Opening grading modal for submission:', submission.id);

            // Set the attemptId and open modal
            setSelectedAttemptId(submission.id);
            setShowGradingModal(true);

        } catch (err) {
            console.error('❌ Error opening grading modal:', err);
            const errorMessage = handleGradingError(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const refreshSubmissions = async () => {
        if (!selectedTest) return;

        try {
            setLoading(true);
            const submissionsData = await getTestSubmissions(selectedTest.id);
            setSubmissions(submissionsData);
        } catch (err) {
            console.error('❌ Error refreshing submissions:', err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ ADD: Handle grading completion
    const handleGradingComplete = () => {
        console.log('✅ Grading completed, refreshing submissions...');
        refreshSubmissions();
        setShowGradingModal(false);
        setSelectedAttemptId(null);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p style={{marginTop: '16px', color: '#6b7280'}}>
                    {view === 'tests' && 'Đang tải danh sách bài thi...'}
                    {view === 'submissions' && 'Đang tải danh sách bài làm...'}
                </p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">
                    {view === 'tests' && 'Bài thi của tôi'}
                    {view === 'submissions' && `Bài làm - ${selectedTest?.testName}`}
                </h1>

                {/* Breadcrumb */}
                <nav className="breadcrumb">
                    <button
                        onClick={() => setView('tests')}
                        className={view === 'tests' ? 'active' : ''}
                    >
                        Bài thi của tôi
                    </button>
                    {view !== 'tests' && (
                        <>
                            <span className="breadcrumb-separator">/</span>
                            <button
                                onClick={() => setView('submissions')}
                                className={view === 'submissions' ? 'active' : ''}
                            >
                                Bài làm
                            </button>
                        </>
                    )}
                </nav>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    {view === 'submissions' && (
                        <button
                            onClick={refreshSubmissions}
                            className="btn-secondary"
                            style={{marginLeft: '12px'}}
                        >
                            Thử lại
                        </button>
                    )}
                </div>
            )}

            {/* Tests List View */}
            {view === 'tests' && (
                <TestsList
                    tests={tests}
                    onViewSubmissions={handleViewSubmissions}
                    onRefresh={fetchMyTests}
                    user={user}
                />
            )}

            {/* Submissions List View */}
            {view === 'submissions' && (
                <SubmissionsList
                    test={selectedTest}
                    submissions={submissions}
                    onGradeSubmission={handleGradeSubmission}
                    onBack={() => setView('tests')}
                    onRefresh={refreshSubmissions}
                />
            )}

            {/* ✅ ADD: Grading Modal */}
            <GradingModal
                isOpen={showGradingModal}
                onClose={() => {
                    setShowGradingModal(false);
                    setSelectedAttemptId(null);
                }}
                attemptId={selectedAttemptId}
                testType={selectedTest?.testType}
                onGradingComplete={handleGradingComplete}
            />
        </div>
    );
};

// ✅ TESTS LIST COMPONENT WITH REAL DATA
const TestsList = ({ tests, onViewSubmissions, onRefresh, user }) => {
    return (
        <div className="tests-list-container">
            <div className="tests-header">
                <div className="user-info">
                    <p className="welcome-text">
                        Chào mừng, <span className="user-name">{user?.fullName || user?.email}</span>
                    </p>
                    <p className="tests-count">
                        Bạn có {tests.length} bài thi
                        {tests.some(t => t.pendingSubmissions > 0) && (
                            <span className="pending-grading-indicator">
                                • {tests.reduce((sum, t) => sum + (t.pendingSubmissions || 0), 0)} bài cần chấm
                            </span>
                        )}
                    </p>
                </div>
                <div className="header-actions">
                    <button
                        onClick={onRefresh}
                        className="btn-secondary refresh-btn"
                        title="Làm mới"
                    >
                        🔄 Làm mới
                    </button>
                    <a
                        href="/create-exam"
                        className="btn-primary create-test-btn"
                    >
                        + Tạo bài thi mới
                    </a>
                </div>
            </div>

            <div className="tests-grid">
                {tests.map(test => (
                    <div key={test.id} className="test-card">
                        <div className="test-card-content">
                            <div className="test-card-header">
                                <h3 className="test-title line-clamp-2">
                                    {test.testName}
                                </h3>
                                <span className={`test-type-badge test-type-${test.testType?.toLowerCase()}`}>
                                    {test.testType}
                                </span>
                            </div>

                            <p className="test-description line-clamp-2">
                                {test.description || 'Không có mô tả'}
                            </p>

                            <div className="test-details">
                                <div className="detail-row">
                                    <span>Thời gian:</span>
                                    <span>{test.durationMinutes} phút</span>
                                </div>
                                <div className="detail-row">
                                    <span>Điểm qua:</span>
                                    <span>{test.passingScore}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Trạng thái:</span>
                                    <span className={test.isPublished ? 'status-published' : 'status-draft'}>
                                        {test.isPublished ? 'Đã xuất bản' : 'Nháp'}
                                    </span>
                                </div>

                                {/* ✅ REAL SUBMISSION DATA */}
                                <div className="detail-row">
                                    <span>Bài làm:</span>
                                    <span>
                                        {test.totalSubmissions || 0}
                                        {test.pendingSubmissions > 0 && (
                                            <span className="pending-count">
                                                ({test.pendingSubmissions} cần chấm)
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {test.createdAt && (
                                    <div className="detail-row">
                                        <span>Tạo lúc:</span>
                                        <span>{new Date(test.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="test-card-actions">
                            <button
                                onClick={() => onViewSubmissions(test)}
                                className="view-submissions-btn"
                            >
                                Xem bài làm
                                {test.pendingSubmissions > 0 && (
                                    <span className="notification-badge">
                                        {test.pendingSubmissions}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => window.location.href = `/test/${test.id}/edit`}
                                className="btn-secondary settings-btn"
                                title="Chỉnh sửa"
                            >
                                ✏️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {tests.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <div className="empty-state-text">Bạn chưa có bài thi nào</div>
                    <a
                        href="/create-exam"
                        className="create-first-test-btn"
                    >
                        Tạo bài thi đầu tiên
                    </a>
                </div>
            )}
        </div>
    );
};

// ✅ SUBMISSIONS LIST COMPONENT WITH REAL DATA
const SubmissionsList = ({ test, submissions, onGradeSubmission, onBack, onRefresh }) => {
    return (
        <div className="submissions-container">
            <div className="submissions-header">
                <div className="submissions-info">
                    <h2 className="submissions-title">{test.testName}</h2>
                    <p className="submissions-summary">
                        {submissions.length} bài làm • {test.testType}
                        {submissions.filter(s => s.requiresManualGrading).length > 0 && (
                            <span className="manual-grading-count">
                                • {submissions.filter(s => s.requiresManualGrading).length} cần chấm thủ công
                            </span>
                        )}
                    </p>
                </div>
                <div className="submissions-actions">
                    <button
                        onClick={onRefresh}
                        className="btn-secondary refresh-btn"
                        title="Làm mới"
                    >
                        🔄
                    </button>
                    <button
                        onClick={onBack}
                        className="back-button"
                    >
                        ← Quay lại
                    </button>
                </div>
            </div>

            <div className="submissions-table-container">
                <table className="submissions-table">
                    <thead>
                    <tr>
                        <th>Học sinh</th>
                        <th>Điểm số</th>
                        <th>Trạng thái</th>
                        <th>Nộp lúc</th>
                        <th>Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {submissions.map(submission => (
                        <tr key={submission.id}>
                            <td>
                                <div className="student-info">
                                    <div className="student-name">
                                        {submission.studentName}
                                    </div>
                                    <div className="student-email">
                                        {submission.studentEmail}
                                    </div>
                                </div>
                            </td>
                            <td>
                                {submission.totalScore !== null ? (
                                    <div className="score-display-container">
                                            <span className="score-display">
                                                {formatScore(submission.totalScore)}/9.0
                                            </span>
                                        {/* ✅ SHOW INDIVIDUAL SKILL SCORES */}
                                        {(submission.listeningScore || submission.readingScore ||
                                            submission.writingScore || submission.speakingScore) && (
                                            <div className="skill-scores">
                                                {submission.listeningScore && `L: ${formatScore(submission.listeningScore)}`}
                                                {submission.readingScore && ` R: ${formatScore(submission.readingScore)}`}
                                                {submission.writingScore && ` W: ${formatScore(submission.writingScore)}`}
                                                {submission.speakingScore && ` S: ${formatScore(submission.speakingScore)}`}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="score-pending">Chưa chấm</span>
                                )}
                            </td>
                            <td>
                                    <span className={`status-badge ${
                                        submission.status === 'completed'
                                            ? 'status-completed'
                                            : 'status-pending'
                                    }`}>
                                        {submission.status === 'completed' ? 'Hoàn thành' : 'Cần chấm điểm'}
                                    </span>
                            </td>
                            <td className="submitted-time">
                                    <span title={new Date(submission.submittedAt).toLocaleString('vi-VN')}>
                                        {formatSubmissionDate(submission.submittedAt)}
                                    </span>
                            </td>
                            <td>
                                <button
                                    onClick={() => onGradeSubmission(submission)}
                                    className={`action-button ${
                                        submission.requiresManualGrading
                                            ? 'action-grade'
                                            : 'action-view'
                                    }`}
                                >
                                    {submission.requiresManualGrading ? 'Chấm điểm' : 'Xem chi tiết'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {submissions.length === 0 && (
                <div className="empty-state submissions-empty">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-text">Chưa có bài làm nào</div>
                </div>
            )}
        </div>
    );
};

export default MyTestsPage;