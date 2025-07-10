import React from 'react';
import './SpeakingWritingResultPage.css';

const SpeakingWritingResultPage = ({ result, onViewDetailedResult }) => {
    // Determine if this is speaking or writing test
    const isSpeakingTest = () => {
        return result?.testType === 'SPEAKING' ||
            result?.testType?.toUpperCase().includes('SPEAKING');
    };

    // ✅ UPDATED: Check if test has been graded by teacher
    const isGradedByTeacher = () => {
        console.log('=== CHECKING GRADED STATUS ===');
        console.log('gradingStatus:', result?.gradingStatus);
        console.log('overallScore:', result?.overallScore);
        console.log('finalScore:', result?.finalScore);
        console.log('graderId:', result?.graderId);
        console.log('gradedAt:', result?.gradedAt);

        // ✅ Primary check: grading status is completed
        if (result?.gradingStatus === 'COMPLETED') {
            console.log('✅ Graded: Status is COMPLETED');
            return true;
        }

        // ✅ Fallback check: has overall score and grader info
        if (result?.overallScore !== null &&
            result?.overallScore !== undefined &&
            result?.graderId !== null &&
            result?.gradedAt !== null) {
            console.log('✅ Graded: Has overall score + grader info');
            return true;
        }

        // ✅ Alternative fallback: check finalScore (computed field)
        if (result?.finalScore !== null &&
            result?.finalScore !== undefined &&
            result?.finalScore > 0 &&
            result?.graderId !== null) {
            console.log('✅ Graded: Has final score + grader');
            return true;
        }

        console.log('❌ Not graded yet');
        return false;
    };

    // Get grading status
    const getGradingStatus = () => {
        if (isGradedByTeacher()) {
            return {
                status: 'completed',
                text: 'Đã chấm điểm',
                color: '#22c55e',
                icon: '✅'
            };
        } else {
            return {
                status: 'pending',
                text: 'Đợi giáo viên chấm',
                color: '#f59e0b',
                icon: '⏳'
            };
        }
    };

    // ✅ UPDATED: Calculate basic stats with proper score handling
    const calculateStats = () => {
        const responses = result?.responses || [];
        const totalQuestions = responses.length;
        const completedResponses = responses.filter(r =>
            r.responseText?.trim() || r.audioResponse?.trim() || r.audioBase64?.trim()
        ).length;

        return {
            totalQuestions,
            completedResponses,
            score: isGradedByTeacher() ? (result.finalScore || result.overallScore || result.totalScore) : null,
            completionRate: totalQuestions > 0 ? Math.round((completedResponses / totalQuestions) * 100) : 0
        };
    };

    const stats = calculateStats();
    const gradingStatus = getGradingStatus();

    return (
        <div className="speaking-writing-result-page">
            {/* Info Alert */}
            <div className="info-alert speaking-writing-info">
                <div className="info-icon">🎤</div>
                <div className="info-text">
                    <strong>Bài thi {result.testType}:</strong> Kết quả được chấm điểm theo tiêu chí IELTS bởi giáo viên.
                    {!isGradedByTeacher() && ' Vui lòng chờ giáo viên hoàn tất việc chấm điểm.'}
                </div>
            </div>

            {/* Header */}
            <h1 className="result-title">
                {isSpeakingTest() ? '🎤 ' : '✍️ '}
                Kết quả {isSpeakingTest() ? 'Speaking' : 'Writing'}: {result.testName || 'IELTS Test'}
            </h1>

            {/* Action Buttons */}
            <div className="action-buttons">
                {isGradedByTeacher() ? (
                    <button
                        className="btn btn-primary"
                        onClick={onViewDetailedResult}
                    >
                        📊 Xem kết quả chi tiết
                    </button>
                ) : (
                    <button
                        className="btn btn-secondary disabled"
                        disabled
                    >
                        ⏳ Đợi giáo viên chấm điểm
                    </button>
                )}
                <button
                    className="btn btn-secondary"
                    onClick={() => window.location.href = '/online-exam'}
                >
                    🔙 Quay về danh sách đề thi
                </button>
            </div>

            {/* Summary Section */}
            <div className="result-summary speaking-writing-summary">
                <div className="summary-grid">
                    <div className="summary-meta">
                        <h3>📋 Thông tin bài thi</h3>
                        <p className="test-type-info">
                            Loại: {isSpeakingTest() ? 'IELTS Speaking Test' : 'IELTS Writing Test'}
                        </p>
                        <p className="submission-info">
                            Nộp bài: {result.submittedAt || result.endTime ?
                            new Date(result.submittedAt || result.endTime).toLocaleString('vi-VN') : 'N/A'}
                        </p>
                        {/* ✅ UPDATED: Show grading info if available */}
                        {result.gradedAt && (
                            <p className="grading-info">
                                Chấm điểm: {new Date(result.gradedAt).toLocaleString('vi-VN')}
                            </p>
                        )}
                        {/* ✅ NEW: Show grader info if available */}
                        {result.graderName && (
                            <p className="grader-info">
                                Giáo viên: {result.graderName}
                            </p>
                        )}
                    </div>

                    <div className="summary-item">
                        <div className="summary-label">
                            <span className="summary-icon">📝</span>
                            Tổng số câu
                        </div>
                        <div className="summary-value">{stats.totalQuestions}</div>
                        <div>câu hỏi</div>
                    </div>

                    <div className="summary-item">
                        <div className="summary-label">
                            <span className="summary-icon">✅</span>
                            Đã hoàn thành
                        </div>
                        <div className="summary-value">{stats.completedResponses}</div>
                        <div>câu hỏi</div>
                    </div>

                    <div className="summary-item">
                        <div className="summary-label">
                            <span className="summary-icon">📊</span>
                            Tỷ lệ hoàn thành
                        </div>
                        <div className="summary-value">{stats.completionRate}%</div>
                        <div>hoàn thành</div>
                    </div>

                    <div className="summary-item">
                        <div className="summary-label">
                            <span className="summary-icon">🎯</span>
                            Trạng thái
                        </div>
                        <div
                            className="summary-value status"
                            style={{ color: gradingStatus.color }}
                        >
                            {gradingStatus.icon} {gradingStatus.text}
                        </div>
                    </div>

                    <div className="summary-item score-item">
                        <div className="summary-label">
                            <span className="summary-icon">🏆</span>
                            Band Score
                        </div>
                        <div className="summary-value score">
                            {/* ✅ UPDATED: Safer score display */}
                            {isGradedByTeacher() && stats.score !== null ?
                                Number(stats.score).toFixed(1) :
                                <span style={{ color: gradingStatus.color }}>Pending</span>
                            }
                        </div>
                        <div>{isGradedByTeacher() && stats.score !== null ? '/9.0' : ''}</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="result-tabs">
                <div className="tab-buttons">
                    <button className="tab-button active">
                        📋 Chi tiết bài làm
                    </button>
                    {isGradedByTeacher() && (
                        <button
                            className="tab-button"
                            onClick={onViewDetailedResult}
                        >
                            📊 Kết quả chấm điểm
                        </button>
                    )}
                </div>

                <div className="tab-content">
                    <div className="speaking-writing-content">
                        {/* Grading Status Section */}
                        <div className="grading-status-section">
                            <h3>🎯 Trạng thái chấm điểm</h3>
                            <div className={`status-card ${gradingStatus.status}`}>
                                <div className="status-icon" style={{ color: gradingStatus.color }}>
                                    {gradingStatus.icon}
                                </div>
                                <div className="status-info">
                                    <h4 style={{ color: gradingStatus.color }}>
                                        {gradingStatus.text}
                                    </h4>
                                    <p>
                                        {isGradedByTeacher() ? (
                                            <>
                                                Bài thi của bạn đã được giáo viên chấm điểm.
                                                Click "Xem kết quả chi tiết" để xem feedback và điểm từng tiêu chí.
                                                {/* ✅ NEW: Show overall feedback if available */}
                                                {result.overallFeedback && (
                                                    <div style={{ marginTop: '10px', fontStyle: 'italic', fontSize: '0.9em' }}>
                                                        <strong>Nhận xét:</strong> {result.overallFeedback}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                Bài thi của bạn đang được giáo viên đánh giá theo {' '}
                                                {isSpeakingTest() ? '4 tiêu chí Speaking' : '4 tiêu chí Writing'} của IELTS.
                                                Thời gian chấm điểm thường từ 1-3 ngày làm việc.
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Response Summary */}
                        <div className="responses-summary-section">
                            <h3>📝 Tóm tắt bài làm của bạn</h3>
                            <div className="responses-grid">
                                {result.responses && result.responses.map((response, index) => (
                                    <div key={response.id || index} className="response-card">
                                        <div className="response-header">
                                            <span className="response-number">Câu {index + 1}</span>
                                            <span className={`response-status ${
                                                response.responseText || response.audioResponse || response.audioBase64
                                                    ? 'completed' : 'incomplete'
                                            }`}>
                                                {response.responseText || response.audioResponse || response.audioBase64
                                                    ? '✅ Hoàn thành' : '❌ Chưa hoàn thành'
                                                }
                                            </span>
                                        </div>

                                        <div className="response-content">
                                            {/* Question */}
                                            <div className="question-text">
                                                <strong>Câu hỏi:</strong> {response.questionText}
                                            </div>

                                            {/* Response Preview */}
                                            <div className="response-preview">
                                                {response.responseText && (
                                                    <div className="text-response-preview">
                                                        <span className="response-label">✍️ Bài viết của bạn:</span>
                                                        <div className="response-text">
                                                            {response.responseText.length > 150
                                                                ? response.responseText.substring(0, 150) + '...'
                                                                : response.responseText
                                                            }
                                                        </div>
                                                        <div className="word-count">
                                                            Số từ: {response.responseText.split(/\s+/).filter(w => w.length > 0).length}
                                                        </div>
                                                    </div>
                                                )}

                                                {(response.audioResponse || response.audioBase64) && (
                                                    <div className="audio-response-preview">
                                                        <span className="response-label">🎤 Bài nói của bạn:</span>
                                                        <div className="audio-info">
                                                            <span className="audio-indicator">🔊 Đã ghi âm thành công</span>
                                                            {response.audioDuration && (
                                                                <span className="audio-duration">
                                                                    Thời lượng: {Math.round(response.audioDuration)}s
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ✅ UPDATED: Individual Score display (if graded) */}
                                            {isGradedByTeacher() && response.manualScore && (
                                                <div className="individual-score">
                                                    <span className="score-label">Điểm:</span>
                                                    <span className="score-value">
                                                        {Number(response.manualScore).toFixed(1)}/9.0
                                                    </span>
                                                </div>
                                            )}

                                            {/* ✅ NEW: Individual Feedback (if available) */}
                                            {isGradedByTeacher() && response.feedback && (
                                                <div className="individual-feedback">
                                                    <span className="feedback-label">💬 Nhận xét:</span>
                                                    <div className="feedback-text">
                                                        {response.feedback}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Criteria Information */}
                        <div className="criteria-info-section">
                            <h3>🎯 Tiêu chí chấm điểm IELTS</h3>
                            <div className="criteria-explanation">
                                <p>
                                    Bài thi {isSpeakingTest() ? 'Speaking' : 'Writing'} của bạn sẽ được đánh giá theo 4 tiêu chí chính:
                                </p>
                            </div>

                            <div className="criteria-grid">
                                {isSpeakingTest() ? (
                                    <>
                                        <div className="criterion-card">
                                            <div className="criterion-icon">🗣️</div>
                                            <div className="criterion-info">
                                                <h4>Fluency and Coherence</h4>
                                                <p>Khả năng nói trôi chảy, mạch lạc và liên kết ý tưởng một cách tự nhiên</p>
                                            </div>
                                        </div>
                                        <div className="criterion-card">
                                            <div className="criterion-icon">📚</div>
                                            <div className="criterion-info">
                                                <h4>Lexical Resource</h4>
                                                <p>Vốn từ vựng phong phú, chính xác và sử dụng phù hợp với ngữ cảnh</p>
                                            </div>
                                        </div>
                                        <div className="criterion-card">
                                            <div className="criterion-icon">📝</div>
                                            <div className="criterion-info">
                                                <h4>Grammatical Range and Accuracy</h4>
                                                <p>Sử dụng đa dạng cấu trúc ngữ pháp và độ chính xác cao</p>
                                            </div>
                                        </div>
                                        <div className="criterion-card">
                                            <div className="criterion-icon">🔊</div>
                                            <div className="criterion-info">
                                                <h4>Pronunciation</h4>
                                                <p>Phát âm rõ ràng, trọng âm chính xác và intonation tự nhiên</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="criterion-card">
                                            <div className="criterion-icon">🎯</div>
                                            <div className="criterion-info">
                                                <h4>Task Achievement</h4>
                                                <p>Hoàn thành đầy đủ yêu cầu đề bài và trả lời đúng trọng tâm</p>
                                            </div>
                                        </div>
                                        <div className="criterion-card">
                                            <div className="criterion-icon">🔗</div>
                                            <div className="criterion-info">
                                                <h4>Coherence and Cohesion</h4>
                                                <p>Tổ chức ý tưởng mạch lạc và sử dụng từ nối hiệu quả</p>
                                            </div>
                                        </div>
                                        <div className="criterion-card">
                                            <div className="criterion-icon">📚</div>
                                            <div className="criterion-info">
                                                <h4>Lexical Resource</h4>
                                                <p>Vốn từ vựng phong phú, chính xác và phù hợp với văn phong học thuật</p>
                                            </div>
                                        </div>
                                        <div className="criterion-card">
                                            <div className="criterion-icon">📝</div>
                                            <div className="criterion-info">
                                                <h4>Grammatical Range and Accuracy</h4>
                                                <p>Đa dạng cấu trúc câu và sử dụng ngữ pháp chính xác</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Next Steps */}
                        <div className="next-steps-section">
                            <h3>📈 Bước tiếp theo</h3>
                            <div className="next-steps-grid">
                                {!isGradedByTeacher() ? (
                                    <>
                                        <div className="step-card">
                                            <div className="step-icon">⏳</div>
                                            <div className="step-content">
                                                <h4>Chờ kết quả</h4>
                                                <p>Giáo viên đang chấm bài của bạn. Thời gian chờ thường 1-3 ngày làm việc.</p>
                                            </div>
                                        </div>
                                        <div className="step-card">
                                            <div className="step-icon">📚</div>
                                            <div className="step-content">
                                                <h4>Tiếp tục luyện tập</h4>
                                                <p>Trong lúc chờ, bạn có thể làm thêm các bài test khác để cải thiện kỹ năng.</p>
                                            </div>
                                        </div>
                                        <div className="step-card">
                                            <div className="step-icon">💡</div>
                                            <div className="step-content">
                                                <h4>Học từ vựng</h4>
                                                <p>Sử dụng flashcards để mở rộng vốn từ vựng cho bài thi tiếp theo.</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="step-card">
                                            <div className="step-icon">📊</div>
                                            <div className="step-content">
                                                <h4>Xem feedback chi tiết</h4>
                                                <p>Đọc kỹ nhận xét của giáo viên để hiểu điểm mạnh và điểm cần cải thiện.</p>
                                            </div>
                                        </div>
                                        <div className="step-card">
                                            <div className="step-icon">🎯</div>
                                            <div className="step-content">
                                                <h4>Luyện tập focused</h4>
                                                <p>Tập trung vào tiêu chí có điểm thấp nhất để cải thiện.</p>
                                            </div>
                                        </div>
                                        <div className="step-card">
                                            <div className="step-icon">🔄</div>
                                            <div className="step-content">
                                                <h4>Thực hành thêm</h4>
                                                <p>Làm thêm các bài test tương tự để áp dụng feedback.</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/*/!* ✅ DEBUG SECTION - Remove in production *!/*/}
            {/*{process.env.NODE_ENV === 'development' && (*/}
            {/*    <div style={{*/}
            {/*        margin: '20px 0',*/}
            {/*        padding: '10px',*/}
            {/*        backgroundColor: '#f5f5f5',*/}
            {/*        border: '1px solid #ccc',*/}
            {/*        fontSize: '12px',*/}
            {/*        fontFamily: 'monospace'*/}
            {/*    }}>*/}
            {/*        <strong>🐛 Debug Info (Development Only):</strong>*/}
            {/*        <pre>{JSON.stringify({*/}
            {/*            gradingStatus: result?.gradingStatus,*/}
            {/*            overallScore: result?.overallScore,*/}
            {/*            finalScore: result?.finalScore,*/}
            {/*            graderId: result?.graderId,*/}
            {/*            gradedAt: result?.gradedAt,*/}
            {/*            isGraded: isGradedByTeacher()*/}
            {/*        }, null, 2)}</pre>*/}
            {/*    </div>*/}
            {/*)}*/}
        </div>
    );
};

export default SpeakingWritingResultPage;