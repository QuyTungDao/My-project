import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FlashcardHome = () => {
    const [statistics, setStatistics] = useState(null);
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [setCounts, setSetCounts] = useState([]);
    const [filterType, setFilterType] = useState('ALL');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const promises = [];

            // Fetch statistics if user is logged in
            if (token && token !== 'undefined' && token !== 'null') {
                promises.push(
                    fetch('http://localhost:8080/api/flashcards/statistics', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => res.ok ? res.json() : null)
                );
            } else {
                promises.push(Promise.resolve(null));
            }

            // Fetch sets
            promises.push(fetch('http://localhost:8080/api/flashcards/sets').then(res => res.json()));

            // Fetch set counts
            promises.push(fetch('http://localhost:8080/api/flashcards/sets/counts').then(res => res.json()));

            const [statsData, setsData, countsData] = await Promise.all(promises);

            setStatistics(statsData);
            setSets(setsData);
            setSetCounts(countsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flashcard-container flashcard-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="flashcard-container flashcard-home">
            <div className="flashcard-home-container">
                {/* Header */}
                <div className="flashcard-home-header">
                    <h1 className="flashcard-home-title">
                        📚 Flashcard Library
                    </h1>
                    <p className="flashcard-home-subtitle">
                        Master vocabulary with spaced repetition
                    </p>
                </div>

                {/* Statistics Bar - Only show if logged in */}
                {statistics && (
                    <>
                        <div className="stats-section">
                            <div className="stats-bar">
                                <div className="stat-item">
                                    <span className="stat-number">{sets.length}</span>
                                    <span className="stat-label">Total Sets</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">{statistics.totalLearned || 0}</span>
                                    <span className="stat-label">Words Learned</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">{statistics.currentStreak || 0}</span>
                                    <span className="stat-label">Day Streak</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">{statistics.longestStreak || 0}</span>
                                    <span className="stat-label">Best Streak</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Button */}
                        <div className="action-container">
                            <Link to="/flashcards/study" className="primary-action-btn">
                                🎯 Start Learning Today
                            </Link>
                        </div>
                    </>
                )}

                {/* Sets Section */}
                <div className="sets-section">
                    <div className="sets-header">
                        <h2 className="sets-title">
                            Flashcard Sets
                        </h2>
                        <Link to="/flashcards/create" className="create-btn">
                            + Create New
                        </Link>
                    </div>

                    {/* Filter Bar */}
                    {sets.length > 0 && (
                        <div className="filters-bar">
                            <div className="filter-group">
                                <label className="filter-label">📑 Filter by Category:</label>
                                <div className="filter-buttons">
                                    {['ALL', ...new Set(sets.map(s => s.split(' ')[0]))].slice(0, 6).map(type => (
                                        <button
                                            key={type}
                                            className={`filter-btn ${filterType === type ? 'active' : ''}`}
                                            onClick={() => setFilterType(type)}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sets Grid */}
                    {sets.length > 0 ? (
                        <div className="sets-grid">
                            {sets
                                .filter(setName => filterType === 'ALL' || setName.startsWith(filterType))
                                .map((setName, index) => {
                                    const setCount = setCounts.find(([name]) => name === setName)?.[1] || 0;

                                    return (
                                        <div key={index} className="set-card">
                                            <div className="set-card-header">
                                                <div className="set-icon">📝</div>
                                                <span className="set-count-badge">
                                                    {setCount} cards
                                                </span>
                                            </div>

                                            <h3 className="set-title">
                                                {setName}
                                            </h3>
                                            <p className="set-description">
                                                Practice vocabulary for {setName}
                                            </p>

                                            <div className="set-actions">
                                                <Link
                                                    to={`/flashcards/sets/${setName}`}
                                                    className="set-action-btn secondary"
                                                >
                                                    👀 View Cards
                                                </Link>
                                                <Link
                                                    to={`/flashcards/study?set=${setName}`}
                                                    className="set-action-btn primary"
                                                >
                                                    🎯 Study Now
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <h3 className="empty-state-title">
                                No Flashcard Sets Yet
                            </h3>
                            <p className="empty-state-description">
                                Create your first flashcard set to start learning
                            </p>
                            <Link to="/flashcards/create" className="empty-state-btn">
                                ✏️ Create First Set
                            </Link>
                        </div>
                    )}
                </div>

                {/* CTA for guests */}
                {!statistics && sets.length > 0 && (
                    <div className="cta-section">
                        <h2 className="cta-title">
                            Ready to start learning?
                        </h2>
                        <p className="cta-description">
                            Sign up to track your progress and get personalized learning recommendations
                        </p>
                        <div className="cta-buttons">
                            <Link to="/register" className="cta-btn primary">
                                Sign Up Free
                            </Link>
                            <Link to="/login" className="cta-btn secondary">
                                Already have account
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlashcardHome;