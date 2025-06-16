import React, { useState, useEffect, useRef } from 'react';

const ListeningAudioPlayer = ({
                                  audioSrc,
                                  title,
                                  section,
                                  onTimeUpdate,
                                  onPlay,
                                  onPause,
                                  onEnded,
                                  onReplay,
                                  allowSeeking = false,
                                  isCurrentSection = false
                              }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [playCount, setPlayCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const audioRef = useRef();

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            onTimeUpdate?.(audio.currentTime, section);
        };

        const handlePlay = () => {
            setIsPlaying(true);
            if (!hasStarted) {
                setHasStarted(true);
                setPlayCount(prev => prev + 1);
            }
            onPlay?.(section);
        };

        const handlePause = () => {
            setIsPlaying(false);
            onPause?.(section);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            onEnded?.(section);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [onTimeUpdate, onPlay, onPause, onEnded, section, hasStarted]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(console.error);
        }
    };

    const replay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = 0;
        setCurrentTime(0);
        setPlayCount(prev => prev + 1);
        onReplay?.(section);

        if (!isPlaying) {
            audio.play().catch(console.error);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`listening-audio-player ${isCurrentSection ? 'current-section' : ''}`}>
            <audio
                ref={audioRef}
                src={audioSrc}
                preload="metadata"
                volume={volume}
            />

            <div className="player-header">
                <div className="section-info">
                    <h3>{title}</h3>
                    <span className="section-badge">{section}</span>
                    {playCount > 0 && (
                        <span className="play-count">Đã phát: {playCount} lần</span>
                    )}
                </div>
            </div>

            <div className="player-controls">
                <button
                    className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={togglePlay}
                    disabled={!audioSrc}
                    title={isPlaying ? 'Tạm dừng' : 'Phát'}
                >
                    {isPlaying ? '⏸️' : '▶️'}
                </button>

                <button
                    className="control-btn replay-btn"
                    onClick={replay}
                    disabled={!audioSrc}
                    title="Phát lại từ đầu"
                >
                    🔄
                </button>

                <div className="time-info">
                    <span className="current-time">{formatTime(currentTime)}</span>
                    <div
                        className={`progress-bar ${!allowSeeking ? 'no-seeking' : ''}`}
                    >
                        <div
                            className="progress-fill"
                            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                        />
                    </div>
                    <span className="total-time">{formatTime(duration)}</span>
                </div>

                <div className="volume-control">
                    <span className="volume-icon">🔊</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="volume-slider"
                        title="Âm lượng"
                    />
                </div>
            </div>

            {!allowSeeking && (
                <div className="no-seeking-notice">
                    <small>⚠️ Không thể tua trong bài thi thật</small>
                </div>
            )}
        </div>
    );
};

export default ListeningAudioPlayer;