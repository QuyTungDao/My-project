// components/AdminComponents.js
import React from 'react';
import {Download, Edit, Eye, Plus, RefreshCw, Search, Trash2, Upload} from 'lucide-react';

// Error Message Component
export const ErrorMessage = ({ message, onClose }) => (
    <div className="error-message">
        <p>{message}</p>
        <button onClick={onClose}>×</button>
    </div>
);

// Loading Spinner Component
export const LoadingSpinner = () => (
    <div className="loading-spinner">
        <RefreshCw className="spinning" />
    </div>
);

// Stat Card Component
export const StatCard = ({ title, value, change, icon, color = 'blue' }) => (
    <div className="stat-card">
        <div className="stat-card-content">
            <div className="stat-info">
                <p className="stat-title">{title}</p>
                <p className={`stat-value stat-${color}`}>{value}</p>
                {change && (
                    <p className={`stat-change ${change > 0 ? 'positive' : 'negative'}`}>
                        {change > 0 ? '+' : ''}{change}% so với hôm qua
                    </p>
                )}
            </div>
            <div className={`stat-icon stat-icon-${color}`}>
                {React.cloneElement(icon, { className: 'icon' })}
            </div>
        </div>
    </div>
);

// Status Badge Component
export const getStatusBadge = (status) => {
    const statusClass = status.toLowerCase();
    return <span className={`status-badge status-${statusClass}`}>{status}</span>;
};

// Role Badge Component
export const getRoleBadge = (role) => {
    const roleClass = role.toLowerCase();
    const roleIcons = {
        ADMIN: '👑',
        TEACHER: '👨‍🏫',
        STUDENT: '🎓'
    };

    return (
        <span className={`role-badge role-${roleClass}`}>
            {roleIcons[role]} {role}
        </span>
    );
};

// Pagination Component
export const Pagination = ({ pagination, setPagination, loading }) => {
    if (pagination.total <= pagination.limit) return null;

    return (
        <div className="pagination">
            <button
                onClick={() => setPagination(prev => ({...prev, page: prev.page - 1}))}
                disabled={pagination.page === 1 || loading}
                className="pagination-btn"
            >
                Trước
            </button>

            <span className="pagination-info">
                Trang {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
                ({pagination.total} tổng cộng)
            </span>

            <button
                onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit) || loading}
                className="pagination-btn"
            >
                Sau
            </button>
        </div>
    );
};

// Search and Filter Controls Component
export const SearchFilterControls = ({
                                         searchTerm,
                                         setSearchTerm,
                                         filters,
                                         setFilters,
                                         filterType,
                                         selectedItems,
                                         onBulkAction,
                                         onCreateNew,
                                         onExport,
                                         onImport,
                                         loading
                                     }) => (
    <div className="controls">
        <div className="controls-left">
            <div className="search-box">
                <Search className="search-icon" />
                <input
                    type="text"
                    placeholder={`Tìm kiếm ${filterType}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Test Type Filter */}
            {filterType === 'bài thi' && (
                <select
                    className="filter-select"
                    value={filters.testType}
                    onChange={(e) => setFilters(prev => ({...prev, testType: e.target.value}))}
                >
                    <option value="">Tất cả loại</option>
                    <option value="READING">Reading</option>
                    <option value="LISTENING">Listening</option>
                    <option value="WRITING">Writing</option>
                    <option value="SPEAKING">Speaking</option>
                </select>
            )}

            {/* User Role Filter */}
            {filterType === 'người dùng' && (
                <select
                    className="filter-select"
                    value={filters.userRole}
                    onChange={(e) => setFilters(prev => ({...prev, userRole: e.target.value}))}
                >
                    <option value="">Tất cả vai trò</option>
                    <option value="STUDENT">Học sinh</option>
                    <option value="TEACHER">Giáo viên</option>
                    <option value="ADMIN">Admin</option>
                </select>
            )}

            {/* Flashcard Category Filter */}
            {filterType === 'flashcard' && (
                <>
                    <select
                        className="filter-select"
                        value={filters.flashcardCategory}
                        onChange={(e) => setFilters(prev => ({...prev, flashcardCategory: e.target.value}))}
                    >
                        <option value="">Tất cả danh mục</option>
                        <option value="IELTS">IELTS</option>
                        <option value="TOEIC">TOEIC</option>
                        <option value="Basic English">Basic English</option>
                    </select>

                    <select
                        className="filter-select"
                        value={filters.flashcardDifficulty}
                        onChange={(e) => setFilters(prev => ({...prev, flashcardDifficulty: e.target.value}))}
                    >
                        <option value="">Tất cả độ khó</option>
                        <option value="EASY">Dễ</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HARD">Khó</option>
                    </select>
                </>
            )}
        </div>

        <div className="controls-right">
            {/* Bulk Actions */}
            {selectedItems.length > 0 && filterType === 'bài thi' && (
                <div className="bulk-actions">
                    <span className="selected-count">
                        {selectedItems.length} đã chọn
                    </span>
                    <button
                        onClick={() => onBulkAction('publish')}
                        className="bulk-btn publish"
                        disabled={loading}
                    >
                        Xuất bản
                    </button>
                    <button
                        onClick={() => onBulkAction('delete')}
                        className="bulk-btn delete"
                        disabled={loading}
                    >
                        Xóa
                    </button>
                </div>
            )}

            {/* Export/Import for Users */}
            {filterType === 'người dùng' && onExport && (
                <button
                    className="secondary-btn"
                    onClick={onExport}
                    disabled={loading}
                >
                    <Download className="icon" />
                    Xuất CSV
                </button>
            )}

            {/* Import for Flashcards */}
            {filterType === 'flashcard' && onImport && (
                <label className="secondary-btn">
                    <Upload className="icon" />
                    Import CSV
                    <input
                        type="file"
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            if (e.target.files[0]) {
                                onImport(e.target.files[0]);
                            }
                        }}
                    />
                </label>
            )}

            {/* Create New Button */}
            <button
                onClick={onCreateNew}
                className="primary-btn"
                disabled={loading}
            >
                <Plus className="icon" />
                {filterType === 'bài thi' && 'Tạo bài thi mới'}
                {filterType === 'người dùng' && 'Thêm người dùng'}
                {filterType === 'flashcard' && 'Tạo Flashcard'}
            </button>
        </div>
    </div>
);

// Action Buttons Component
export const ActionButtons = ({ item, onView, onEdit, onDelete }) => (
    <div className="action-buttons">
        <button
            onClick={() => onView(item)}
            className="action-btn view"
        >
            <Eye className="action-icon" />
        </button>
        <button
            onClick={() => onEdit(item)}
            className="action-btn edit"
        >
            <Edit className="action-icon" />
        </button>
        <button
            onClick={() => onDelete(item)}
            className="action-btn delete"
        >
            <Trash2 className="action-icon" />
        </button>
    </div>
);