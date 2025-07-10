// components/AdminModals.js
import React from 'react';

// Test Form Component
export const TestForm = ({ formData, setFormData, modalType }) => (
    <>
        <div className="form-row">
            <div className="form-group">
                <label className="form-label">Tên bài thi</label>
                <input
                    type="text"
                    value={formData.name || formData.testName || ''}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value, testName: e.target.value}))}
                    className="form-input"
                    disabled={modalType === 'view'}
                    required
                />
            </div>
            <div className="form-group">
                <label className="form-label">Loại bài thi</label>
                <select
                    value={formData.type || formData.testType || 'READING'}
                    onChange={(e) => setFormData(prev => ({...prev, type: e.target.value, testType: e.target.value}))}
                    className="form-select"
                    disabled={modalType === 'view'}
                >
                    <option value="READING">Reading</option>
                    <option value="LISTENING">Listening</option>
                    <option value="WRITING">Writing</option>
                    <option value="SPEAKING">Speaking</option>
                </select>
            </div>
        </div>

        <div className="form-row">
            <div className="form-group">
                <label className="form-label">Thời gian (phút)</label>
                <input
                    type="number"
                    value={formData.duration || formData.durationMinutes || 60}
                    onChange={(e) => setFormData(prev => ({...prev, duration: parseInt(e.target.value), durationMinutes: parseInt(e.target.value)}))}
                    className="form-input"
                    disabled={modalType === 'view'}
                    min="1"
                    required
                />
            </div>
            <div className="form-group">
                <label className="form-label">Số câu hỏi</label>
                <input
                    type="number"
                    value={formData.questions || 40}
                    onChange={(e) => setFormData(prev => ({...prev, questions: parseInt(e.target.value)}))}
                    className="form-input"
                    disabled={modalType === 'view'}
                    min="1"
                    required
                />
            </div>
        </div>

        <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                className="form-textarea"
                disabled={modalType === 'view'}
            />
        </div>

        {modalType !== 'view' && (
            <div className="checkbox-groups">
                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.isPublic || false}
                            onChange={(e) => setFormData(prev => ({...prev, isPublic: e.target.checked}))}
                            className="checkbox"
                        />
                        <span>Công khai</span>
                    </label>
                </div>
                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.status === 'PUBLISHED' || formData.isPublished}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                status: e.target.checked ? 'PUBLISHED' : 'DRAFT',
                                isPublished: e.target.checked
                            }))}
                            className="checkbox"
                        />
                        <span>Xuất bản ngay</span>
                    </label>
                </div>
            </div>
        )}
    </>
);

// User Form Component
export const UserForm = ({ formData, setFormData, modalType }) => (
    <>
        <div className="form-row">
            <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
                    className="form-input"
                    disabled={modalType === 'view'}
                    required
                />
            </div>
            <div className="form-group">
                <label className="form-label">Email</label>
                <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    className="form-input"
                    disabled={modalType === 'view'}
                    required
                />
            </div>
        </div>

        <div className="form-row">
            <div className="form-group">
                <label className="form-label">Vai trò</label>
                <select
                    value={formData.role || 'STUDENT'}
                    onChange={(e) => setFormData(prev => ({...prev, role: e.target.value}))}
                    className="form-select"
                    disabled={modalType === 'view'}
                >
                    <option value="STUDENT">Học sinh</option>
                    <option value="TEACHER">Giáo viên</option>
                    <option value="ADMIN">Admin</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData(prev => ({...prev, status: e.target.value}))}
                    className="form-select"
                    disabled={modalType === 'view'}
                >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Tạm khóa</option>
                </select>
            </div>
        </div>

        {modalType === 'create' && (
            <div className="form-group">
                <label className="form-label">Mật khẩu tạm thời</label>
                <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                    placeholder="Nhập mật khẩu tạm thời..."
                    className="form-input"
                    required
                />
            </div>
        )}
    </>
);

// Flashcard Form Component
export const FlashcardForm = ({ formData, setFormData, modalType }) => (
    <>
        <div className="form-row">
            <div className="form-group">
                <label className="form-label">Từ vựng</label>
                <input
                    type="text"
                    value={formData.word || ''}
                    onChange={(e) => setFormData(prev => ({...prev, word: e.target.value}))}
                    className="form-input"
                    disabled={modalType === 'view'}
                    required
                />
            </div>
            <div className="form-group">
                <label className="form-label">Loại từ</label>
                <select
                    value={formData.wordType || 'NOUN'}
                    onChange={(e) => setFormData(prev => ({...prev, wordType: e.target.value}))}
                    className="form-select"
                    disabled={modalType === 'view'}
                >
                    <option value="NOUN">Danh từ</option>
                    <option value="VERB">Động từ</option>
                    <option value="ADJECTIVE">Tính từ</option>
                    <option value="ADVERB">Trạng từ</option>
                </select>
            </div>
        </div>

        <div className="form-group">
            <label className="form-label">Nghĩa tiếng Việt</label>
            <input
                type="text"
                value={formData.meaning || ''}
                onChange={(e) => setFormData(prev => ({...prev, meaning: e.target.value}))}
                className="form-input"
                disabled={modalType === 'view'}
                required
            />
        </div>

        <div className="form-row">
            <div className="form-group">
                <label className="form-label">Danh mục</label>
                <select
                    value={formData.category || 'IELTS'}
                    onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
                    className="form-select"
                    disabled={modalType === 'view'}
                >
                    <option value="IELTS">IELTS</option>
                    <option value="TOEIC">TOEIC</option>
                    <option value="Basic English">Basic English</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Độ khó</label>
                <select
                    value={formData.difficulty || 'MEDIUM'}
                    onChange={(e) => setFormData(prev => ({...prev, difficulty: e.target.value}))}
                    className="form-select"
                    disabled={modalType === 'view'}
                >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                </select>
            </div>
        </div>

        <div className="form-group">
            <label className="form-label">Bộ thẻ</label>
            <input
                type="text"
                value={formData.setName || ''}
                onChange={(e) => setFormData(prev => ({...prev, setName: e.target.value}))}
                className="form-input"
                disabled={modalType === 'view'}
                required
            />
        </div>

        <div className="form-group">
            <label className="form-label">Câu ví dụ</label>
            <textarea
                rows={2}
                value={formData.exampleSentence || ''}
                onChange={(e) => setFormData(prev => ({...prev, exampleSentence: e.target.value}))}
                className="form-textarea"
                disabled={modalType === 'view'}
            />
        </div>

        {modalType !== 'view' && (
            <div className="checkbox-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={formData.isPublic || false}
                        onChange={(e) => setFormData(prev => ({...prev, isPublic: e.target.checked}))}
                        className="checkbox"
                    />
                    <span>Công khai cho mọi người</span>
                </label>
            </div>
        )}
    </>
);

// Main Modal Component
export const AdminModal = ({
                               showModal,
                               closeModal,
                               modalType,
                               modalContent,
                               formData,
                               setFormData,
                               handleSubmit,
                               loading,
                               error
                           }) => {
    if (!showModal) return null;

    const getModalTitle = () => {
        const contentName = modalContent === 'tests' ? 'bài thi' :
            modalContent === 'users' ? 'người dùng' : 'flashcard';

        switch(modalType) {
            case 'create': return `Tạo ${contentName} mới`;
            case 'edit': return `Chỉnh sửa ${contentName}`;
            case 'view': return `Xem chi tiết ${contentName}`;
            case 'delete': return `Xóa ${contentName}`;
            default: return 'Modal';
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={closeModal}></div>
            <div className="modal-container">
                <div className="modal-header">
                    <h3 className="modal-title">{getModalTitle()}</h3>
                    <button onClick={closeModal} className="modal-close">✕</button>
                </div>

                <div className="modal-content">
                    {/* Error display in modal */}
                    {error && <div className="modal-error">{error}</div>}

                    {/* Delete Confirmation */}
                    {modalType === 'delete' ? (
                        <div className="delete-content">
                            <p className="delete-message">
                                Bạn có chắc chắn muốn xóa {modalContent === 'tests' ? 'bài thi' : modalContent === 'users' ? 'người dùng' : 'flashcard'} này không?
                                Hành động này không thể hoàn tác.
                            </p>
                            <div className="modal-actions">
                                <button onClick={closeModal} className="cancel-btn" disabled={loading}>
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="delete-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Đang xóa...' : 'Xóa'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Form Content */
                        <form className="modal-form" onSubmit={handleSubmit}>
                            {/* Render appropriate form based on content type */}
                            {modalContent === 'tests' && (
                                <TestForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    modalType={modalType}
                                />
                            )}

                            {modalContent === 'users' && (
                                <UserForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    modalType={modalType}
                                />
                            )}

                            {modalContent === 'flashcards' && (
                                <FlashcardForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    modalType={modalType}
                                />
                            )}

                            {/* Action Buttons */}
                            {modalType !== 'view' && modalType !== 'delete' && (
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="cancel-btn"
                                        disabled={loading}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="submit-btn"
                                        disabled={loading}
                                    >
                                        {loading ? 'Đang xử lý...' : (modalType === 'create' ? 'Tạo mới' : 'Cập nhật')}
                                    </button>
                                </div>
                            )}

                            {modalType === 'view' && (
                                <div className="modal-actions">
                                    <button onClick={closeModal} className="cancel-btn">
                                        Đóng
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};