import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../utlis/authUtils';
import './Profile.css';

export default function Profile() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [userInfo, setUserInfo] = useState(null);
    const [testHistory, setTestHistory] = useState([]);
    const [flashcardStats, setFlashcardStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Get current user from token
    const currentUser = getUserFromToken();

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);

                if (!currentUser) {
                    navigate('/login');
                    return;
                }

                console.log('🔍 Fetching profile data for user:', currentUser.id);

                // ✅ Fetch data concurrently
                const [testHistoryData, flashcardStatsData] = await Promise.allSettled([
                    fetchTestHistory(currentUser.id),
                    fetchFlashcardStatistics()
                ]);

                // ✅ Handle test history
                if (testHistoryData.status === 'fulfilled') {
                    setTestHistory(testHistoryData.value);
                } else {
                    console.error('Failed to fetch test history:', testHistoryData.reason);
                }

                // ✅ Handle flashcard stats
                if (flashcardStatsData.status === 'fulfilled') {
                    setFlashcardStats(flashcardStatsData.value);
                } else {
                    console.error('Failed to fetch flashcard stats:', flashcardStatsData.reason);
                    setFlashcardStats(null); // Set to null on error
                }

                // ✅ Set user info from token
                setUserInfo({
                    id: currentUser.id,
                    fullName: currentUser.fullName,
                    email: currentUser.email,
                    role: currentUser.role,
                    // Calculate stats from test history
                    studyStats: calculateStudyStats(testHistoryData.status === 'fulfilled' ? testHistoryData.value : [])
                });

            } catch (err) {
                console.error('❌ Error fetching profile data:', err);
                setError('Không thể tải thông tin profile. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [currentUser?.id, navigate]);

    // ✅ Fetch test history from API
    // ✅ FIXED fetchTestHistory function - Replace in Profile.js

    const fetchTestHistory = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/test-attempts/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Test history received:', data);

            // ✅ Transform data to expected format with FIXED score logic
            return data.map(attempt => {
                // ✅ FIX: Get appropriate score based on test type
                const getDisplayScore = (attempt) => {
                    const testType = attempt.testType || 'READING';

                    // For Speaking/Writing: prioritize overallScore
                    if (testType === 'SPEAKING' || testType === 'WRITING') {
                        const overallScore = attempt.overallScore !== null ? attempt.overallScore : attempt.totalScore;
                        console.log(`Score for ${testType} attempt ${attempt.id}:`, {
                            overallScore: attempt.overallScore,
                            totalScore: attempt.totalScore,
                            displayScore: overallScore
                        });
                        return overallScore || 0;
                    }

                    // For other types: use totalScore
                    return attempt.totalScore || 0;
                };

                // ✅ Check if test is properly graded
                const isProperlyGraded = (attempt) => {
                    const testType = attempt.testType || 'READING';

                    if (testType === 'SPEAKING' || testType === 'WRITING') {
                        // For Speaking/Writing: must have valid overallScore
                        return attempt.overallScore !== null && attempt.overallScore !== undefined && attempt.overallScore > 0;
                    } else {
                        // For other types: check totalScore
                        return attempt.totalScore !== null && attempt.totalScore !== undefined;
                    }
                };

                const displayScore = getDisplayScore(attempt);
                const isGraded = isProperlyGraded(attempt);

                return {
                    id: attempt.id,
                    testName: attempt.testName || 'Unknown Test',
                    testType: attempt.testType || 'READING',
                    score: displayScore,

                    // ✅ ADD: Additional score info for debugging
                    originalTotalScore: attempt.totalScore,
                    originalOverallScore: attempt.overallScore,
                    isGraded: isGraded,
                    gradingStatus: attempt.gradingStatus,

                    totalQuestions: attempt.responses?.length || 0,
                    correctAnswers: attempt.responses?.filter(r => r.isCorrect === true).length || 0,
                    completionTime: calculateCompletionTime(attempt.startTime, attempt.endTime),
                    completedAt: attempt.endTime || attempt.startTime,
                    accuracy: calculateAccuracy(attempt.responses || [])
                };
            });

        } catch (error) {
            console.error('❌ Error fetching test history:', error);
            throw error;
        }
    };

    // ✅ Fetch flashcard statistics from API
    const fetchFlashcardStatistics = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/flashcards/statistics', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404 || response.status === 500) {
                    // No flashcard data available
                    return null;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Flashcard statistics received:', data);
            return data;

        } catch (error) {
            console.error('❌ Error fetching flashcard statistics:', error);
            // Don't throw, return null instead
            return null;
        }
    };

    // ✅ Helper functions
    const calculateCompletionTime = (startTime, endTime) => {
        if (!startTime || !endTime) return 'N/A';

        try {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const diffMs = end - start;
            const diffMinutes = Math.floor(diffMs / 60000);
            const diffSeconds = Math.floor((diffMs % 60000) / 1000);
            return `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
        } catch (error) {
            return 'N/A';
        }
    };

    const calculateAccuracy = (responses) => {
        if (!responses || responses.length === 0) return 0;
        const correctCount = responses.filter(r => r.isCorrect === true).length;
        return Math.round((correctCount / responses.length) * 100);
    };

    const calculateStudyStats = (testHistory) => {
        if (!testHistory || testHistory.length === 0) {
            return {
                totalTests: 0,
                averageScore: 0,
                strongestSkill: 'N/A',
                weakestSkill: 'N/A',
                studyStreak: 0,
                totalStudyHours: 0
            };
        }

        const totalTests = testHistory.length;
        const averageScore = testHistory.reduce((sum, test) => sum + test.score, 0) / totalTests;

        // Group by test type to find strongest/weakest
        const skillGroups = testHistory.reduce((groups, test) => {
            const skill = test.testType || 'READING';
            if (!groups[skill]) {
                groups[skill] = { total: 0, sum: 0 };
            }
            groups[skill].total++;
            groups[skill].sum += test.score;
            return groups;
        }, {});

        const skillAverages = Object.entries(skillGroups).map(([skill, data]) => ({
            skill,
            average: data.sum / data.total
        }));

        const strongestSkill = skillAverages.length > 0
            ? skillAverages.reduce((max, current) => current.average > max.average ? current : max).skill
            : 'N/A';

        const weakestSkill = skillAverages.length > 0
            ? skillAverages.reduce((min, current) => current.average < min.average ? current : min).skill
            : 'N/A';

        // Calculate study streak (consecutive days)
        const sortedTests = testHistory.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        let streak = 0;
        let lastDate = null;

        for (const test of sortedTests) {
            const testDate = new Date(test.completedAt).toDateString();
            if (!lastDate) {
                streak = 1;
                lastDate = testDate;
            } else {
                const lastDateTime = new Date(lastDate).getTime();
                const testDateTime = new Date(testDate).getTime();
                const dayDiff = Math.floor((lastDateTime - testDateTime) / (1000 * 60 * 60 * 24));

                if (dayDiff === 1) {
                    streak++;
                    lastDate = testDate;
                } else if (dayDiff === 0) {
                    // Same day, continue
                    lastDate = testDate;
                } else {
                    break;
                }
            }
        }

        return {
            totalTests,
            averageScore: Math.round(averageScore * 10) / 10,
            strongestSkill,
            weakestSkill,
            studyStreak: streak,
            totalStudyHours: Math.round(totalTests * 1.2) // Estimate 1.2 hours per test
        };
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'N/A';
        }
    };

    const getScoreColor = (score) => {
        if (score >= 7) return '#22c55e'; // Green
        if (score >= 5.5) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    };

    const getTestTypeIcon = (testType) => {
        const icons = {
            'READING': '📖',
            'LISTENING': '🎧',
            'WRITING': '✍️',
            'SPEAKING': '🗣️'
        };
        return icons[testType] || '📝';
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ width: '48px', height: '48px', margin: '0 auto 16px' }}></div>
                    <h2 style={{ fontSize: '1.25rem', color: '#6b7280' }}>Đang tải thông tin profile...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                    <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                    <h2 style={{ fontSize: '1.25rem', color: '#dc2626', marginBottom: '16px' }}>{error}</h2>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary"
                        style={{ padding: '8px 24px', color: 'white', borderRadius: '6px' }}
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div id="profile-main-container" className="profile-container" style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <div id="profile-header-section" className="profile-header" style={{ boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', borderBottom: '1px solid #e5e7eb' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
                        <div id="profile-user-avatar" className="profile-avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {userInfo?.fullName?.charAt(0).toUpperCase() || userInfo?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', margin: '0 0 4px 0' }}>
                                {userInfo?.fullName || 'Unknown User'}
                            </h1>
                            <p style={{ color: 'rgba(219, 234, 254, 0.8)', margin: '0 0 8px 0' }}>{userInfo?.email}</p>
                            <span id="profile-user-role-badge" className={`role-badge ${
                                userInfo?.role === 'TEACHER' || userInfo?.role === 'ROLE_TEACHER'
                                    ? 'teacher-role'
                                    : userInfo?.role === 'ADMIN' || userInfo?.role === 'ROLE_ADMIN'
                                        ? 'admin-role'
                                        : 'student-role'
                            }`} style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                backgroundColor: userInfo?.role === 'TEACHER' || userInfo?.role === 'ROLE_TEACHER'
                                    ? 'rgba(220, 252, 231, 0.9)'
                                    : userInfo?.role === 'ADMIN' || userInfo?.role === 'ROLE_ADMIN'
                                        ? 'rgba(243, 232, 255, 0.9)'
                                        : 'rgba(219, 234, 254, 0.9)',
                                color: userInfo?.role === 'TEACHER' || userInfo?.role === 'ROLE_TEACHER'
                                    ? '#065f46'
                                    : userInfo?.role === 'ADMIN' || userInfo?.role === 'ROLE_ADMIN'
                                        ? '#581c87'
                                        : '#1e40af'
                            }}>
                                {userInfo?.role === 'TEACHER' || userInfo?.role === 'ROLE_TEACHER' ? '👨‍🏫 Teacher' :
                                    userInfo?.role === 'ADMIN' || userInfo?.role === 'ROLE_ADMIN' ? '👑 Admin' :
                                        '🎓 Student'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
                {/* Quick Stats Cards */}
                <div id="profile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    <div id="total-tests-card" className="stats-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div id="total-tests-icon" className="stats-icon" style={{ padding: '8px', borderRadius: '8px' }}>
                                <span style={{ fontSize: '1.5rem' }}>📊</span>
                            </div>
                            <div style={{ marginLeft: '16px' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>Tổng số bài thi</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0' }}>{userInfo?.studyStats.totalTests}</p>
                            </div>
                        </div>
                    </div>

                    <div id="average-score-card" className="stats-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div id="average-score-icon" className="stats-icon" style={{ padding: '8px', borderRadius: '8px' }}>
                                <span style={{ fontSize: '1.5rem' }}>🎯</span>
                            </div>
                            <div style={{ marginLeft: '16px' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>Điểm trung bình</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0' }}>{userInfo?.studyStats.averageScore}/9.0</p>
                            </div>
                        </div>
                    </div>

                    {/*<div id="current-streak-card" className="stats-card" style={{ padding: '24px' }}>*/}
                    {/*    <div style={{ display: 'flex', alignItems: 'center' }}>*/}
                    {/*        <div id="current-streak-icon" className="stats-icon" style={{ padding: '8px', borderRadius: '8px' }}>*/}
                    {/*            <span style={{ fontSize: '1.5rem' }}>🔥</span>*/}
                    {/*        </div>*/}
                    {/*        /!*<div style={{ marginLeft: '16px' }}>*!/*/}
                    {/*        /!*    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>Streak hiện tại</p>*!/*/}
                    {/*        /!*    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0' }}>{userInfo?.studyStats.studyStreak} ngày</p>*!/*/}
                    {/*        /!*</div>*!/*/}
                    {/*    </div>*/}
                    {/*</div>*/}

                    {/*<div id="study-hours-card" className="stats-card" style={{ padding: '24px' }}>*/}
                    {/*    <div style={{ display: 'flex', alignItems: 'center' }}>*/}
                    {/*        <div id="study-hours-icon" className="stats-icon" style={{ padding: '8px', borderRadius: '8px' }}>*/}
                    {/*            <span style={{ fontSize: '1.5rem' }}>⏱️</span>*/}
                    {/*        </div>*/}
                    {/*        <div style={{ marginLeft: '16px' }}>*/}
                    {/*            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>Tổng thời gian học</p>*/}
                    {/*            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0' }}>{userInfo?.studyStats.totalStudyHours}h</p>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>

                {/* Tabs */}
                <div id="profile-tabs-container" className="profile-tabs">
                    <div id="profile-tab-navigation" className="tab-nav" style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <nav style={{ display: 'flex', gap: '32px', padding: '0 24px' }}>
                            <button
                                id="overview-tab-btn"
                                onClick={() => setActiveTab('overview')}
                                className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                                // Thay vì sử dụng cả border và borderBottomColor:
                                style={{
                                    padding: '16px 4px',
                                    borderBottom: activeTab === 'overview' ? '2px solid #3b82f6' : '2px solid transparent',
                                    // Bỏ dòng borderBottomColor
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: activeTab === 'overview' ? '#2563eb' : '#6b7280',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                📊 Tổng quan
                            </button>
                            <button
                                id="tests-tab-btn"
                                onClick={() => setActiveTab('tests')}
                                className={`tab-button ${activeTab === 'tests' ? 'active' : ''}`}
                                style={{
                                    padding: '16px 4px',
                                    borderBottom: '2px solid',
                                    borderBottomColor: activeTab === 'tests' ? '#3b82f6' : 'transparent',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: activeTab === 'tests' ? '#2563eb' : '#6b7280',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                📝 Lịch sử làm bài ({testHistory.length})
                            </button>
                            <button
                                id="flashcards-tab-btn"
                                onClick={() => setActiveTab('flashcards')}
                                className={`tab-button ${activeTab === 'flashcards' ? 'active' : ''}`}
                                style={{
                                    padding: '16px 4px',
                                    borderBottom: '2px solid',
                                    borderBottomColor: activeTab === 'flashcards' ? '#3b82f6' : 'transparent',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: activeTab === 'flashcards' ? '#2563eb' : '#6b7280',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                📚 Flashcards
                            </button>
                        </nav>
                    </div>

                    <div id="profile-tab-content" className="tab-content" style={{ padding: '24px' }}>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                                    {/* Skills Overview */}
                                    <div id="skills-analysis-card" className="overview-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>📈 Phân tích kỹ năng</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div id="strongest-skill-item" className="skill-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Kỹ năng mạnh nhất:</span>
                                                <span style={{ fontWeight: '500', color: '#059669' }}>
                                                    {getTestTypeIcon(userInfo?.studyStats.strongestSkill)} {userInfo?.studyStats.strongestSkill}
                                                </span>
                                            </div>
                                            <div id="weakest-skill-item" className="skill-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Cần cải thiện:</span>
                                                <span style={{ fontWeight: '500', color: '#d97706' }}>
                                                    {getTestTypeIcon(userInfo?.studyStats.weakestSkill)} {userInfo?.studyStats.weakestSkill}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div id="recent-activity-card" className="overview-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>⚡ Hoạt động gần đây</h3>
                                        {testHistory.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {testHistory.slice(0, 3).map((test, index) => (
                                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                                                        <span style={{ color: '#6b7280' }}>
                                                            {getTestTypeIcon(test.testType)} {test.testName.length > 30 ?
                                                            test.testName.substring(0, 30) + '...' : test.testName}
                                                        </span>
                                                        <span style={{ fontWeight: '500', color: getScoreColor(test.score) }}>
                                                            {test.score}/9.0
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '0' }}>Chưa có hoạt động nào.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Recommendations */}
                                <div id="recommendations-section" className="recommendations" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e3a8a', margin: '0 0 16px 0' }}>💡 Gợi ý cho bạn</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                                        <div id="today-practice-card" className="recommendation-card" style={{ padding: '16px' }}>
                                            <h4 style={{ fontWeight: '500', color: '#111827', margin: '0 0 8px 0' }}>🎯 Luyện tập hôm nay</h4>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 12px 0' }}>
                                                Học flashcards và làm bài thi mới để duy trì streak {userInfo?.studyStats.studyStreak} ngày!
                                            </p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <button
                                                    id="flashcards-study-btn"
                                                    onClick={() => navigate('/flashcards/study')}
                                                    className="btn-primary"
                                                    style={{ width: '100%', padding: '8px 16px', color: 'white', fontSize: '0.875rem' }}
                                                >
                                                    📚 Học Flashcards hôm nay
                                                </button>
                                                <button
                                                    id="new-test-btn"
                                                    onClick={() => navigate('/online-exam')}
                                                    className="btn-secondary"
                                                    style={{ width: '100%', padding: '8px 16px', color: 'white', fontSize: '0.875rem' }}
                                                >
                                                    📝 Làm bài thi mới
                                                </button>
                                            </div>
                                        </div>

                                        <div id="improve-score-card" className="recommendation-card" style={{ padding: '16px' }}>
                                            <h4 style={{ fontWeight: '500', color: '#111827', margin: '0 0 8px 0' }}>📈 Cải thiện điểm số</h4>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 12px 0' }}>
                                                Tập trung vào {userInfo?.studyStats.weakestSkill} để nâng cao điểm tổng thể.
                                            </p>
                                            <button
                                                id="program-btn"
                                                onClick={() => navigate('/program')}
                                                className="btn-accent"
                                                style={{ width: '100%', padding: '8px 16px', color: 'white', fontSize: '0.875rem' }}
                                            >
                                                🎓 Xem chương trình học
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Test History Tab */}
                        {activeTab === 'tests' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>📝 Lịch sử làm bài thi</h3>
                                    <button
                                        id="test-history-new-test-btn"
                                        onClick={() => navigate('/online-exam')}
                                        className="btn-primary"
                                        style={{ padding: '8px 16px', color: 'white' }}
                                    >
                                        ➕ Làm bài thi mới
                                    </button>
                                </div>

                                {testHistory.length === 0 ? (
                                    <div className="empty-state" style={{ textAlign: 'center', padding: '48px 0' }}>
                                        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📝</div>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827', margin: '0 0 8px 0' }}>Chưa có lịch sử làm bài</h3>
                                        <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>Bắt đầu làm bài thi đầu tiên để theo dõi tiến độ của bạn!</p>
                                        <button
                                            id="start-first-test-btn"
                                            onClick={() => navigate('/online-exam')}
                                            className="btn-primary"
                                            style={{ padding: '12px 24px', color: 'white' }}
                                        >
                                            🚀 Bắt đầu làm bài thi
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table id="test-history-table" className="test-history-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                                            <thead>
                                            <tr>
                                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Bài thi
                                                </th>
                                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Điểm số
                                                </th>
                                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Độ chính xác
                                                </th>
                                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Thời gian
                                                </th>
                                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Ngày làm
                                                </th>
                                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Hành động
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody style={{ backgroundColor: 'white' }}>
                                            {testHistory.map((test) => (
                                                <tr key={test.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '1.25rem', marginRight: '12px' }}>{getTestTypeIcon(test.testType)}</span>
                                                            <div>
                                                                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                                                                    {test.testName}
                                                                </div>
                                                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                                    {test.testType} • {test.totalQuestions} câu
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getScoreColor(test.score) }}>
                                                            {test.score}
                                                        </span>
                                                        <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '4px' }}>/9.0</span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                                            <div className="progress-bar" style={{ width: '64px', height: '8px', marginRight: '12px' }}>
                                                                <div
                                                                    className="progress-fill"
                                                                    style={{
                                                                        width: `${test.accuracy}%`,
                                                                        backgroundColor: getScoreColor(test.score),
                                                                        height: '8px'
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                                                                {test.accuracy}%
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                                                            {test.correctAnswers}/{test.totalQuestions} đúng
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', fontSize: '0.875rem', color: '#111827' }}>
                                                        {test.completionTime}
                                                    </td>
                                                    <td style={{ padding: '16px 24px', fontSize: '0.875rem', color: '#6b7280' }}>
                                                        {formatDate(test.completedAt)}
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <button
                                                            onClick={() => navigate(`/test-results/${test.id}`)}
                                                            style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: '500', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'none' }}
                                                            onMouseOver={(e) => e.target.style.color = '#1d4ed8'}
                                                            onMouseOut={(e) => e.target.style.color = '#2563eb'}
                                                        >
                                                            📊 Xem chi tiết
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Flashcards Tab */}
                        {activeTab === 'flashcards' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>📚 Thống kê Flashcards</h3>
                                    <button
                                        id="flashcards-today-btn"
                                        onClick={() => navigate('/flashcards/study')}
                                        className="btn-secondary"
                                        style={{ padding: '8px 16px', color: 'white' }}
                                    >
                                        🎯 Học hôm nay
                                    </button>
                                </div>

                                {flashcardStats ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {/* Flashcard Overview */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                                            <div className="flashcard-stat-card" style={{ borderRadius: '16px', padding: '24px', color: 'white', background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <p style={{ color: 'rgba(220, 252, 231, 0.8)', margin: '0 0 4px 0' }}>Đã học</p>
                                                        <p style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: '0' }}>{flashcardStats.totalLearned || 0}</p>
                                                    </div>
                                                    <div style={{ fontSize: '2.5rem', opacity: '0.8' }}>📚</div>
                                                </div>
                                            </div>

                                            <div className="flashcard-stat-card" style={{ borderRadius: '16px', padding: '24px', color: 'white', background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <p style={{ color: 'rgba(219, 234, 254, 0.8)', margin: '0 0 4px 0' }}>Streak hiện tại</p>
                                                        <p style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: '0' }}>{flashcardStats.currentStreak || 0}</p>
                                                    </div>
                                                    <div style={{ fontSize: '2.5rem', opacity: '0.8' }}>🔥</div>
                                                </div>
                                            </div>

                                            <div className="flashcard-stat-card" style={{ borderRadius: '16px', padding: '24px', color: 'white', background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <p style={{ color: 'rgba(233, 213, 255, 0.8)', margin: '0 0 4px 0' }}>Streak dài nhất</p>
                                                        <p style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: '0' }}>{flashcardStats.longestStreak || 0}</p>
                                                    </div>
                                                    <div style={{ fontSize: '2.5rem', opacity: '0.8' }}>🏆</div>
                                                </div>
                                            </div>

                                            <div className="flashcard-stat-card" style={{ borderRadius: '16px', padding: '24px', color: 'white', background: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <p style={{ color: 'rgba(254, 202, 202, 0.8)', margin: '0 0 4px 0' }}>Độ chính xác</p>
                                                        <p style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: '0' }}>{Math.round(flashcardStats.accuracy || 0)}%</p>
                                                    </div>
                                                    <div style={{ fontSize: '2.5rem', opacity: '0.8' }}>🎯</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mastery Breakdown */}
                                        {flashcardStats.masteryBreakdown && flashcardStats.masteryBreakdown.length > 0 && (
                                            <div className="overview-card" style={{ padding: '24px' }}>
                                                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>📊 Phân bố mức độ thành thạo</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {flashcardStats.masteryBreakdown.map((item, index) => {
                                                        const level = Array.isArray(item) ? item[0] : item.level;
                                                        const count = Array.isArray(item) ? item[1] : item.count;

                                                        const levelInfo = {
                                                            'NEW': { label: 'Mới', color: '#6b7280', icon: '🆕' },
                                                            'LEARNING': { label: 'Đang học', color: '#eab308', icon: '📖' },
                                                            'REVIEW': { label: 'Ôn tập', color: '#3b82f6', icon: '🔄' },
                                                            'MASTERED': { label: 'Thành thạo', color: '#22c55e', icon: '✅' }
                                                        };

                                                        const info = levelInfo[level] || { label: level, color: '#6b7280', icon: '❓' };
                                                        const total = flashcardStats.totalLearned || 1;
                                                        const percentage = Math.round((count / total) * 100);

                                                        return (
                                                            <div key={index} className="mastery-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <span style={{ fontSize: '1.25rem' }}>{info.icon}</span>
                                                                    <span style={{ fontWeight: '500', color: '#111827' }}>{info.label}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <div className="progress-bar" style={{ width: '128px', height: '8px' }}>
                                                                        <div
                                                                            className="progress-fill"
                                                                            style={{
                                                                                width: `${percentage}%`,
                                                                                backgroundColor: info.color,
                                                                                height: '8px'
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', width: '64px' }}>
                                                                        {count} thẻ
                                                                    </span>
                                                                    <span style={{ fontSize: '0.875rem', color: '#6b7280', width: '48px' }}>
                                                                        ({percentage}%)
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quick Actions */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                                            <div className="recommendation-card" style={{ textAlign: 'center', padding: '24px' }}>
                                                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎯</div>
                                                <h4 style={{ fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>Học hôm nay</h4>
                                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 16px 0' }}>
                                                    Tiếp tục streak {flashcardStats.currentStreak || 0} ngày
                                                </p>
                                                <button
                                                    onClick={() => navigate('/flashcards/study')}
                                                    className="btn-primary"
                                                    style={{ width: '100%', padding: '8px 16px', color: 'white' }}
                                                >
                                                    Bắt đầu học
                                                </button>
                                            </div>

                                            <div className="recommendation-card" style={{ textAlign: 'center', padding: '24px' }}>
                                                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📑</div>
                                                <h4 style={{ fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>Duyệt bộ thẻ</h4>
                                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 16px 0' }}>
                                                    Khám phá các bộ thẻ từ vựng
                                                </p>
                                                <button
                                                    onClick={() => navigate('/flashcards/sets')}
                                                    className="btn-secondary"
                                                    style={{ width: '100%', padding: '8px 16px', color: 'white' }}
                                                >
                                                    Xem bộ thẻ
                                                </button>
                                            </div>

                                            <div className="recommendation-card" style={{ textAlign: 'center', padding: '24px' }}>
                                                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
                                                <h4 style={{ fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>Thống kê chi tiết</h4>
                                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 16px 0' }}>
                                                    Xem tiến độ học tập chi tiết
                                                </p>
                                                <button
                                                    onClick={() => navigate('/flashcards/statistics')}
                                                    className="btn-accent"
                                                    style={{ width: '100%', padding: '8px 16px', color: 'white' }}
                                                >
                                                    Xem thống kê
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state" style={{ textAlign: 'center', padding: '48px 0' }}>
                                        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📚</div>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827', margin: '0 0 8px 0' }}>Chưa có dữ liệu flashcard</h3>
                                        <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
                                            Bắt đầu học flashcards để theo dõi tiến độ học từ vựng của bạn!
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                            <button
                                                onClick={() => navigate('/flashcards')}
                                                className="btn-primary"
                                                style={{ padding: '12px 24px', color: 'white', marginRight: '12px' }}
                                            >
                                                🏠 Trang chủ Flashcards
                                            </button>
                                            <button
                                                onClick={() => navigate('/flashcards/sets')}
                                                className="btn-secondary"
                                                style={{ padding: '12px 24px', color: 'white' }}
                                            >
                                                📑 Xem bộ thẻ từ vựng
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );



}