// =====================================
// Audio Utilities - audioUtils.js
// Comprehensive audio handling utilities for IELTS Listening Test
// =====================================

/**
 * Extracts a valid audio source from audio data object
 * @param {Object} audioData - Audio data object with various possible source formats
 * @returns {string|null} - Valid audio source URL or null if none found
 */
export const getValidAudioSource = (audioData) => {
    if (!audioData) {
        console.warn('❌ No audio data provided');
        return null;
    }

    console.log('🎵 Processing audio source for:', audioData.id || audioData.title || 'unknown');
    console.log('🎵 Available sources:', {
        hasBase64: !!(audioData.base64Data || audioData.audioBase64),
        hasFile: !!(audioData.file),
        hasFileUrl: !!(audioData.fileUrl),
        hasFilePath: !!(audioData.filePath),
        mimeType: audioData.mimeType
    });

    // 1. Priority: base64Data (most reliable for uploaded files)
    if (audioData.base64Data) {
        if (audioData.base64Data.startsWith('data:')) {
            console.log('✅ Using base64Data (data URL format)');
            return audioData.base64Data;
        } else {
            const mimeType = audioData.mimeType || 'audio/mpeg';
            const dataUrl = `data:${mimeType};base64,${audioData.base64Data}`;
            console.log('✅ Using base64Data (converted to data URL)');
            return dataUrl;
        }
    }

    // 2. Alternative base64 field name
    if (audioData.audioBase64) {
        if (audioData.audioBase64.startsWith('data:')) {
            console.log('✅ Using audioBase64 (data URL format)');
            return audioData.audioBase64;
        } else {
            const mimeType = audioData.mimeType || 'audio/mpeg';
            const dataUrl = `data:${mimeType};base64,${audioData.audioBase64}`;
            console.log('✅ Using audioBase64 (converted to data URL)');
            return dataUrl;
        }
    }

    // 3. File object (from file input) - create object URL
    if (audioData.file && audioData.file instanceof File) {
        try {
            const objectUrl = URL.createObjectURL(audioData.file);
            console.log('✅ Using file object (created object URL)');
            return objectUrl;
        } catch (error) {
            console.error('❌ Failed to create object URL from file:', error);
        }
    }

    // 4. Direct file URL
    if (audioData.fileUrl) {
        console.log('✅ Using fileUrl');
        return audioData.fileUrl;
    }

    // 5. File path (construct full URL if needed)
    if (audioData.filePath) {
        const url = audioData.filePath.startsWith('http')
            ? audioData.filePath
            : `${window.location.origin}/api${audioData.filePath}`;
        console.log('✅ Using filePath:', url);
        return url;
    }

    console.warn('❌ No valid audio source found in audio data');
    return null;
};

/**
 * Validates if an audio source is valid and accessible
 * @param {string} audioSrc - Audio source URL
 * @returns {Promise<boolean>} - Promise that resolves to true if valid
 */
export const validateAudioSource = (audioSrc) => {
    return new Promise((resolve) => {
        if (!audioSrc) {
            resolve(false);
            return;
        }

        const audio = new Audio();

        const timeout = setTimeout(() => {
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            resolve(false);
        }, 5000); // 5 second timeout

        const handleCanPlay = () => {
            clearTimeout(timeout);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            resolve(true);
        };

        const handleError = () => {
            clearTimeout(timeout);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            resolve(false);
        };

        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        audio.src = audioSrc;
        audio.load();
    });
};

/**
 * Loads audio with timeout and proper error handling
 * @param {HTMLAudioElement} audioElement - Audio element to load
 * @param {string} audioSrc - Audio source URL
 * @param {number} timeout - Timeout in milliseconds (default: 15000)
 * @returns {Promise<void>} - Promise that resolves when audio is ready
 */
export const loadAudioWithTimeout = (audioElement, audioSrc, timeout = 15000) => {
    return new Promise((resolve, reject) => {
        if (!audioElement || !audioSrc) {
            reject(new Error('Invalid audio element or source'));
            return;
        }

        console.log('🎵 Loading audio with timeout:', timeout + 'ms');

        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Audio loading timeout'));
        }, timeout);

        const handleCanPlay = () => {
            console.log('✅ Audio can play');
            cleanup();
            resolve();
        };

        const handleError = (e) => {
            console.error('❌ Audio loading error:', e);
            cleanup();

            const errorCode = audioElement.error?.code;
            let errorMessage = 'Unknown audio error';

            switch (errorCode) {
                case 1: // MEDIA_ERR_ABORTED
                    errorMessage = 'Audio loading was aborted';
                    break;
                case 2: // MEDIA_ERR_NETWORK
                    errorMessage = 'Network error occurred while loading audio';
                    break;
                case 3: // MEDIA_ERR_DECODE
                    errorMessage = 'Audio format not supported or corrupted';
                    break;
                case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                    errorMessage = 'Audio source format not supported';
                    break;
                default:
                    errorMessage = audioElement.error?.message || 'Unknown audio error';
            }

            reject(new Error(errorMessage));
        };

        const cleanup = () => {
            clearTimeout(timeoutId);
            audioElement.removeEventListener('canplay', handleCanPlay);
            audioElement.removeEventListener('error', handleError);
        };

        audioElement.addEventListener('canplay', handleCanPlay);
        audioElement.addEventListener('error', handleError);

        // Set source and load
        audioElement.src = audioSrc;
        audioElement.load();
    });
};

/**
 * Preloads audio sources for better performance
 * @param {Array} audioList - Array of audio data objects
 * @returns {Promise<Array>} - Promise that resolves to array of preload results
 */
export const preloadAudioSources = async (audioList) => {
    if (!Array.isArray(audioList) || audioList.length === 0) {
        console.log('No audio sources to preload');
        return [];
    }

    console.log('🎵 Preloading', audioList.length, 'audio sources...');

    const preloadPromises = audioList.map(async (audioData, index) => {
        try {
            const audioSrc = getValidAudioSource(audioData);
            if (!audioSrc) {
                return {
                    index,
                    success: false,
                    error: 'No valid audio source found',
                    audioData
                };
            }

            const isValid = await validateAudioSource(audioSrc);
            return {
                index,
                success: isValid,
                audioSrc: isValid ? audioSrc : null,
                error: isValid ? null : 'Audio source validation failed',
                audioData
            };
        } catch (error) {
            return {
                index,
                success: false,
                error: error.message,
                audioData
            };
        }
    });

    const results = await Promise.all(preloadPromises);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`🎵 Preload complete: ${successCount} success, ${failureCount} failed`);

    if (failureCount > 0) {
        console.warn('❌ Failed audio sources:', results.filter(r => !r.success));
    }

    return results;
};

/**
 * Formats time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
    if (!seconds || seconds === 0 || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formats time in H:MM:SS or MM:SS format depending on duration
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTimeLarge = (seconds) => {
    if (!seconds || seconds === 0 || isNaN(seconds)) return "00:00";

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Gets audio duration from file or blob
 * @param {File|Blob|string} audioSource - Audio file, blob, or URL
 * @returns {Promise<number>} - Promise that resolves to duration in seconds
 */
export const getAudioDuration = (audioSource) => {
    return new Promise((resolve, reject) => {
        const audio = new Audio();

        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout getting audio duration'));
        }, 10000);

        const handleLoadedMetadata = () => {
            cleanup();
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                resolve(Math.round(audio.duration));
            } else {
                reject(new Error('Invalid audio duration'));
            }
        };

        const handleError = () => {
            cleanup();
            reject(new Error('Error loading audio for duration check'));
        };

        const cleanup = () => {
            clearTimeout(timeout);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('error', handleError);

            // Revoke object URL if we created one
            if (typeof audioSource === 'object' && audioSource instanceof File) {
                URL.revokeObjectURL(audio.src);
            }
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('error', handleError);

        // Handle different source types
        if (typeof audioSource === 'string') {
            audio.src = audioSource;
        } else if (audioSource instanceof File || audioSource instanceof Blob) {
            audio.src = URL.createObjectURL(audioSource);
        } else {
            cleanup();
            reject(new Error('Unsupported audio source type'));
            return;
        }

        audio.load();
    });
};

/**
 * Creates a safe audio player instance with error handling
 * @param {Object} options - Configuration options
 * @returns {Object} - Audio player instance with methods
 */
export const createAudioPlayer = (options = {}) => {
    const {
        onPlay = () => {},
        onPause = () => {},
        onTimeUpdate = () => {},
        onEnded = () => {},
        onError = () => {},
        onLoadStart = () => {},
        onLoadedData = () => {},
        crossOrigin = 'anonymous',
        preload = 'metadata'
    } = options;

    const audio = new Audio();
    audio.crossOrigin = crossOrigin;
    audio.preload = preload;

    // Add event listeners
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('loadeddata', onLoadedData);

    const player = {
        element: audio,

        async loadSource(audioData, timeout = 15000) {
            const audioSrc = getValidAudioSource(audioData);
            if (!audioSrc) {
                throw new Error('No valid audio source found');
            }

            await loadAudioWithTimeout(audio, audioSrc, timeout);
            return audioSrc;
        },

        async play() {
            try {
                await audio.play();
                return true;
            } catch (error) {
                console.error('Play error:', error);
                onError(error);
                return false;
            }
        },

        pause() {
            audio.pause();
        },

        stop() {
            audio.pause();
            audio.currentTime = 0;
        },

        setVolume(volume) {
            audio.volume = Math.max(0, Math.min(1, volume));
        },

        setCurrentTime(time) {
            audio.currentTime = Math.max(0, Math.min(audio.duration || 0, time));
        },

        getCurrentTime() {
            return audio.currentTime || 0;
        },

        getDuration() {
            return audio.duration || 0;
        },

        isPlaying() {
            return !audio.paused;
        },

        destroy() {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            audio.removeEventListener('loadstart', onLoadStart);
            audio.removeEventListener('loadeddata', onLoadedData);

            if (audio.src) {
                audio.pause();
                audio.src = '';
                audio.load();
            }
        }
    };

    return player;
};

/**
 * Utility to handle audio context for better browser compatibility
 */
export const initializeAudioContext = () => {
    // Some browsers require user interaction before playing audio
    const unlockAudio = () => {
        const audio = new Audio();
        audio.volume = 0;

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
            playPromise
                .then(() => {
                    console.log('🎵 Audio context unlocked');
                    audio.pause();
                })
                .catch(() => {
                    console.log('🎵 Audio context unlock failed (may require user interaction)');
                });
        }

        // Remove event listeners after first interaction
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };

    // Add event listeners for user interaction
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
};

// Initialize audio context when module loads
if (typeof window !== 'undefined') {
    initializeAudioContext();
}

export default {
    getValidAudioSource,
    validateAudioSource,
    loadAudioWithTimeout,
    preloadAudioSources,
    formatTime,
    formatTimeLarge,
    getAudioDuration,
    createAudioPlayer,
    initializeAudioContext
};