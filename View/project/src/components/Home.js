import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
    const navigate = useNavigate();

    const features = [
        {
            icon: '📝',
            title: 'Tests',
            description: 'Master your tests and set to unicon start learning.',
            link: '/online-exam'
        },
        {
            icon: '🎴',
            title: 'Flashcards',
            description: 'Maste English with flashcards and socil utuent elants.',
            link: '/flashcards'
        },
        {
            icon: '📊',
            title: 'Progress',
            description: 'Progress professional deilt to and intergrated progress.',
            link: '/my-test'
        }
    ];

    return (
        <div className="home-container">
            {/* Hero Section */}
            <div className="hero-section">
                <h1 className="hero-title">Welcome to EduLearn</h1>
                <p className="hero-subtitle">Master English with confidence</p>
                
                <div className="hero-buttons">
                    <button 
                        className="hero-btn primary"
                        onClick={() => navigate('/online-exam')}
                    >
                        Start Learning
                    </button>
                    <button 
                        className="hero-btn secondary"
                        onClick={() => navigate('/online-exam')}
                    >
                        Browse Tests
                    </button>
                </div>

                {/* Illustration placeholder */}
                <div className="hero-illustration">
                    <div className="illustration-circle">
                        <span className="illustration-emoji">👩‍💻</span>
                        <div className="floating-icon icon-1">📧</div>
                        <div className="floating-icon icon-2">✏️</div>
                        <div className="floating-icon icon-3">📱</div>
                        <div className="floating-icon icon-4">📊</div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="features-grid">
                {features.map((feature, index) => (
                    <div 
                        key={index}
                        className="feature-card"
                        onClick={() => navigate(feature.link)}
                    >
                        <div className="feature-icon-circle">
                            <span className="feature-icon">{feature.icon}</span>
                        </div>
                        <h3 className="feature-title">{feature.title}</h3>
                        <p className="feature-description">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}