// =====================================
// FRONTEND: EnhancedAudioUploader.js với Base64 - IMPROVED VERSION
// =====================================

import React, { useState, useRef, useEffect } from 'react';
import './EnhancedAudioUploader.css';

const validateAudioFile = (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mpeg'];

    const errors = [];

    if (!file) {
        errors.push('Vui lòng chọn file audio');
        return { isValid: false, errors };
    }

    if (file.size > maxSize) {
        errors.push('File quá lớn. Kích thước tối đa là 50MB');
    }

    if (!allowedTypes.includes(file.type)) {
        errors.push('Định dạng file không được hỗ trợ. Chỉ chấp nhận: MP3, WAV, OGG, M4A');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const getAudioDuration = (file) => {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        const url = URL.createObjectURL(file);

        audio.addEventListener('loadedmetadata', () => {
            URL.revokeObjectURL(url);
            resolve(Math.round(audio.duration));
        });

        audio.addEventListener('error', () => {
            URL.revokeObjectURL(url);
            reject(new Error('Không thể đọc thông tin audio'));
        });

        audio.src = url;
    });
};

const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

// Simple confirmation modal component
const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Xác nhận</h3>
                <p>{message}</p>
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onCancel}>
                        Hủy
                    </button>
                    <button className="btn-confirm" onClick={onConfirm}>
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
};

const EnhancedAudioUploader = ({ onAudioUploaded, existingAudio = null, audioIndex, formData = null }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [audioInfo, setAudioInfo] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const fileInputRef = useRef();

    // ✅ FIX: Khởi tạo và theo dõi dữ liệu audio từ form
    useEffect(() => {
        console.log('=== AUDIO UPLOADER EFFECT ===');
        console.log('audioIndex:', audioIndex);
        console.log('existingAudio:', existingAudio);
        console.log('formData:', formData);

        // Kiểm tra dữ liệu từ form (ưu tiên cao nhất)
        if (formData && formData.audio_base64) {
            console.log('✅ Found form data with base64');
            const formAudioInfo = {
                fileName: formData.original_file_name || formData.title || 'Audio file',
                originalFileName: formData.original_file_name,
                fileSize: formData.file_size,
                duration: formData.duration_seconds,
                durationSeconds: formData.duration_seconds,
                mimeType: formData.mime_type,
                audioBase64: formData.audio_base64,
                uploadedAt: new Date().toISOString()
            };

            setAudioInfo(formAudioInfo);
            console.log('Set audioInfo from form data:', formAudioInfo.fileName);
            return;
        }

        // Fallback to existingAudio
        if (existingAudio) {
            console.log('✅ Found existing audio');
            const existingAudioInfo = {
                fileName: existingAudio.originalFileName || existingAudio.fileName || 'Audio file',
                originalFileName: existingAudio.originalFileName,
                fileSize: existingAudio.fileSize,
                duration: existingAudio.duration || existingAudio.durationSeconds,
                durationSeconds: existingAudio.durationSeconds || existingAudio.duration,
                mimeType: existingAudio.mimeType,
                audioBase64: existingAudio.base64Data || existingAudio.audioBase64,
                uploadedAt: existingAudio.uploadedAt || new Date().toISOString()
            };

            setAudioInfo(existingAudioInfo);
            console.log('Set audioInfo from existing audio:', existingAudioInfo.fileName);
            return;
        }

        // Nếu không có dữ liệu, clear audioInfo
        if (!formData && !existingAudio) {
            console.log('No audio data found, clearing audioInfo');
            setAudioInfo(null);
        }
    }, [existingAudio, formData, audioIndex]);

    const handleFileSelect = async (file) => {
        if (!file) return;

        const validation = validateAudioFile(file);
        if (!validation.isValid) {
            alert(validation.errors.join('\n'));
            return;
        }

        // ✅ NEW: Confirmation when replacing existing audio
        if (audioInfo && (audioInfo.audioBase64 || audioInfo.filePath)) {
            const confirmed = window.confirm(
                `Bạn có chắc chắn muốn thay thế audio hiện tại "${audioInfo.fileName}" bằng file mới "${file.name}" không?\n\n` +
                `⚠️ Lưu ý: Audio cũ sẽ bị xóa vĩnh viễn sau khi lưu bài thi.`
            );

            if (!confirmed) {
                console.log('User cancelled audio replacement');
                return;
            }
        }

        try {
            setUploading(true);
            setUploadProgress(0);

            console.log('=== PROCESSING AUDIO FILE REPLACEMENT ===');
            console.log('Previous audio info:', {
                fileName: audioInfo?.fileName,
                hasBase64: !!audioInfo?.audioBase64,
                hasFilePath: !!audioInfo?.filePath,
                source: audioInfo?.source
            });

            console.log('New file info:', {
                name: file.name,
                size: file.size,
                type: file.type
            });

            // Convert to base64
            console.log('Converting to base64...');
            const base64Data = await convertToBase64(file);
            setUploadProgress(30);

            console.log('Base64 conversion result:', {
                length: base64Data.length,
                preview: base64Data.substring(0, 100) + '...',
                isValidDataURL: base64Data.startsWith('data:')
            });

            // Get duration
            let duration = 0;
            try {
                duration = await getAudioDuration(file);
                setUploadProgress(60);
                console.log('Audio duration:', duration, 'seconds');
            } catch (e) {
                console.warn('Cannot get audio duration:', e);
                setUploadProgress(60);
            }

            // ✅ ENHANCED: Create audio info object for replacement
            const newAudioInfo = {
                fileName: file.name,
                originalFileName: file.name,
                fileSize: file.size,
                duration: duration,
                durationSeconds: duration,
                mimeType: file.type,
                audioBase64: base64Data,
                uploadedAt: new Date().toISOString(),
                source: 'file_replacement',

                // ✅ IMPORTANT: Mark as replacement
                isReplacement: true,
                previousAudioInfo: audioInfo ? {
                    fileName: audioInfo.fileName,
                    source: audioInfo.source,
                    hasBase64: !!audioInfo.audioBase64,
                    hasFilePath: !!audioInfo.filePath
                } : null
            };

            console.log('=== AUDIO REPLACEMENT INFO CREATED ===');
            console.log('newAudioInfo:', {
                fileName: newAudioInfo.fileName,
                originalFileName: newAudioInfo.originalFileName,
                fileSize: newAudioInfo.fileSize,
                duration: newAudioInfo.duration,
                durationSeconds: newAudioInfo.durationSeconds,
                mimeType: newAudioInfo.mimeType,
                audioBase64Length: newAudioInfo.audioBase64?.length,
                hasAudioBase64: !!newAudioInfo.audioBase64,
                isReplacement: newAudioInfo.isReplacement,
                previousAudioInfo: newAudioInfo.previousAudioInfo
            });

            setUploadProgress(100);
            setAudioInfo(newAudioInfo);

            // ✅ CALLBACK với debug cho replacement
            console.log('=== CALLING CALLBACK FOR REPLACEMENT ===');
            console.log('audioIndex:', audioIndex);
            console.log('Calling onAudioUploaded for replacement...');

            onAudioUploaded(newAudioInfo, audioIndex);

            console.log('✅ Audio replacement callback completed');
            alert(`Đã thay thế audio thành công!\n\nFile mới: ${file.name}\nKích thước: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

        } catch (error) {
            console.error('❌ Error processing audio replacement:', error);
            alert(`Lỗi khi thay thế audio: ${error.message}\n\nVui lòng thử lại hoặc chọn file khác.`);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const formatDuration = (seconds) => {
        if (!seconds || seconds <= 0) return '';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes <= 0) return '';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };

    // ✅ FIX: Render audio preview với kiểm tra dữ liệu chặt chẽ hơn
    const renderAudioPreview = () => {
        if (!audioInfo || !audioInfo.audioBase64) {
            console.log('No audioInfo or audioBase64 for preview');
            return null;
        }

        try {
            return (
                <div className="audio-preview">
                    <audio controls style={{ width: '100%', marginTop: '10px' }}>
                        <source src={audioInfo.audioBase64} type={audioInfo.mimeType} />
                        Trình duyệt không hỗ trợ audio element.
                    </audio>
                </div>
            );
        } catch (error) {
            console.error('Error rendering audio preview:', error);
            return null;
        }
    };

    // ✅ FIX: Xử lý nút thay đổi để không reset audioInfo
    const handleChangeFile = (e) => {
        e.stopPropagation();

        if (uploading) {
            console.log('Upload in progress, ignoring change file request');
            return;
        }

        console.log('=== CHANGE FILE REQUESTED ===');
        console.log('Current audio info:', {
            fileName: audioInfo?.fileName,
            hasBase64: !!audioInfo?.audioBase64,
            hasFilePath: !!audioInfo?.filePath,
            source: audioInfo?.source
        });

        // Trigger file input
        fileInputRef.current?.click();
    };

    // ✅ FIX: Thêm nút xóa audio với modal confirmation
    const handleRemoveAudio = (e) => {
        e.stopPropagation();

        if (uploading) {
            console.log('Upload in progress, ignoring remove request');
            return;
        }

        console.log('=== REMOVE AUDIO REQUESTED ===');
        console.log('Current audio info:', {
            fileName: audioInfo?.fileName,
            hasBase64: !!audioInfo?.audioBase64,
            hasFilePath: !!audioInfo?.filePath,
            source: audioInfo?.source
        });

        setShowConfirmModal(true);
    };

    const confirmRemoveAudio = () => {
        console.log('=== CONFIRMING AUDIO REMOVAL ===');

        const previousAudioInfo = audioInfo;

        setAudioInfo(null);
        setShowConfirmModal(false);

        // ✅ CALLBACK với thông tin về removal
        if (onAudioUploaded) {
            console.log('Calling onAudioUploaded with null for removal');
            console.log('Previous audio info:', previousAudioInfo);

            onAudioUploaded(null, audioIndex);
        }

        console.log('✅ Audio removal completed');
    };

    const cancelRemoveAudio = () => {
        setShowConfirmModal(false);
    };

    return (
        <div className="enhanced-audio-uploader">
            <div
                className={`upload-area ${dragOver ? 'drag-over' : ''} ${audioInfo ? 'has-file' : ''} ${uploading ? 'uploading' : ''}`}
                onClick={() => !uploading && !audioInfo && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {audioInfo ? (
                    <div className="audio-info">
                        <div className="audio-icon">🎵</div>
                        <div className="audio-details">
                            <div className="filename">{audioInfo.fileName}</div>
                            <div className="file-meta">
                                <span className="filesize">{formatFileSize(audioInfo.fileSize)}</span>
                                {audioInfo.duration > 0 && (
                                    <span className="duration">{formatDuration(audioInfo.duration)}</span>
                                )}
                                <span className="storage-type">Base64</span>
                            </div>
                        </div>
                        <div className="audio-actions">
                            <button
                                type="button"
                                className="change-btn"
                                onClick={handleChangeFile}
                                disabled={uploading}
                                title="Thay đổi file audio"
                            >
                                Thay đổi
                            </button>
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={handleRemoveAudio}
                                disabled={uploading}
                                title="Xóa file audio"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="upload-placeholder">
                        <div className="upload-icon">📁</div>
                        <div className="upload-text">
                            <strong>Kéo thả file audio hoặc nhấp để chọn</strong>
                            <br />
                            Hỗ trợ: MP3, WAV, OGG, M4A (tối đa 50MB)
                            <br />
                            <small>Sẽ được lưu dưới dạng Base64 trong database</small>
                        </div>
                    </div>
                )}

                {uploading && (
                    <div className="upload-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <div className="progress-text">
                            {Math.round(uploadProgress)}% - Đang xử lý...
                        </div>
                    </div>
                )}
            </div>

            {/* Audio Preview */}
            {renderAudioPreview()}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                message="Bạn có chắc chắn muốn xóa audio này không?"
                onConfirm={confirmRemoveAudio}
                onCancel={cancelRemoveAudio}
            />

            <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,audio/*"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default EnhancedAudioUploader;