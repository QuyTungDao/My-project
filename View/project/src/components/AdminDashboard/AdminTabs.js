// components/AdminTabs.js
import React from 'react';
import {
    Plus,
    Eye,
    Edit,
    Trash2,
    Users,
    BookOpen,
    CreditCard,
    UserCheck,
    Download, Upload
} from 'lucide-react';
import { StatCard, getStatusBadge, getRoleBadge, ActionButtons } from './AdminComponents';

// Overview Tab Component
export const OverviewTab = ({ dashboardStats, recentActivity, openModal }) => (
    <div className="overview-content">
        {/* Stats Grid */}
        <div className="stats-grid">
            <StatCard
                title="Tổng người dùng"
                value={dashboardStats.totalUsers?.toLocaleString() || '0'}
                change={dashboardStats.userGrowthRate}
                icon={<Users />}
                color="blue"
            />
            <StatCard
                title="Tổng bài thi"
                value={dashboardStats.totalTests || 0}
                change={dashboardStats.testGrowthRate}
                icon={<BookOpen />}
                color="green"
            />
            <StatCard
                title="Tổng Flashcards"
                value={dashboardStats.totalFlashcards?.toLocaleString() || '0'}
                change={dashboardStats.flashcardGrowthRate}
                icon={<CreditCard />}
                color="purple"
            />
            <StatCard
                title="Người dùng hoạt động"
                value={dashboardStats.activeUsers || 0}
                change={dashboardStats.activeUserGrowthRate}
                icon={<UserCheck />}
                color="orange"
            />
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
            <h3 className="card-title">Thao tác nhanh</h3>
            <div className="quick-actions-grid">
                <button
                    onClick={() => openModal('create', 'tests')}
                    className="quick-action-item"
                >
                    <Plus className="quick-action-icon" />
                    <span className="quick-action-text">Tạo bài thi mới</span>
                </button>

                <button
                    onClick={() => openModal('create', 'users')}
                    className="quick-action-item"
                >
                    <Plus className="quick-action-icon" />
                    <span className="quick-action-text">Thêm người dùng</span>
                </button>

                <button
                    onClick={() => openModal('create', 'flashcards')}
                    className="quick-action-item"
                >
                    <Plus className="quick-action-icon" />
                    <span className="quick-action-text">Tạo Flashcard</span>
                </button>
            </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-card">
            <h3 className="card-title">Hoạt động gần đây</h3>
            <div className="activity-list">
                {recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                        <div className="activity-content">
                            <div className={`activity-indicator ${activity.type}`}></div>
                            <span className="activity-text">{activity.description}</span>
                        </div>
                        <span className="activity-time">{activity.timeAgo}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Tests Management Tab Component
export const TestsTab = ({
                             tests,
                             selectedItems,
                             setSelectedItems,
                             openModal,
                             loading
                         }) => (
    <div className="management-content">
        {/* Tests Table */}
        <div className="table-container">
            <table className="data-table">
                <thead>
                <tr>
                    <th>
                        <input
                            type="checkbox"
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedItems(tests.map(test => test.id));
                                } else {
                                    setSelectedItems([]);
                                }
                            }}
                            className="checkbox"
                        />
                    </th>
                    <th>Bài thi</th>
                    <th>Loại</th>
                    <th>Trạng thái</th>
                    <th>Thống kê</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                </tr>
                </thead>
                <tbody>
                {tests.map((test) => (
                    <tr key={test.id} className="table-row">
                        <td>
                            <input
                                type="checkbox"
                                checked={selectedItems.includes(test.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedItems([...selectedItems, test.id]);
                                    } else {
                                        setSelectedItems(selectedItems.filter(id => id !== test.id));
                                    }
                                }}
                                className="checkbox"
                            />
                        </td>
                        <td>
                            <div className="test-info">
                                <div className="test-name">{test.name}</div>
                                <div className="test-details">
                                    {test.questions} câu hỏi • {test.duration} phút
                                </div>
                            </div>
                        </td>
                        <td>
                            <span className="type-badge">{test.type}</span>
                        </td>
                        <td>
                            {getStatusBadge(test.status)}
                        </td>
                        <td>
                            <div className="stats-info">
                                <div className="stat-main">{test.completions || 0} lượt làm</div>
                                <div className="stat-sub">Điểm TB: {test.avgScore || 0}/9.0</div>
                            </div>
                        </td>
                        <td className="date-cell">{new Date(test.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                            <ActionButtons
                                item={test}
                                onView={() => openModal('view', 'tests', test)}
                                onEdit={() => openModal('edit', 'tests', test)}
                                onDelete={() => openModal('delete', 'tests', test)}
                            />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
);

// Users Management Tab Component
export const UsersTab = ({ users, openModal }) => (
    <div className="management-content">
        {/* Users Table */}
        <div className="table-container">
            <table className="data-table">
                <thead>
                <tr>
                    <th>Người dùng</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Thống kê</th>
                    <th>Đăng nhập cuối</th>
                    <th>Thao tác</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user) => (
                    <tr key={user.id} className="table-row">
                        <td>
                            <div className="user-info">
                                <div className="user-avatar">
                                    {user.fullName?.charAt(0) || 'U'}
                                </div>
                                <div className="user-details">
                                    <div className="user-name">{user.fullName}</div>
                                    <div className="user-email">{user.email}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            {getRoleBadge(user.role)}
                        </td>
                        <td>
                            {getStatusBadge(user.status)}
                        </td>
                        <td>
                            <div className="stats-info">
                                <div className="stat-main">{user.testsCompleted || 0} bài thi</div>
                                <div className="stat-sub">Điểm TB: {user.avgScore || 0}/9.0</div>
                            </div>
                        </td>
                        <td className="date-cell">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('vi-VN') : 'Chưa có'}
                        </td>
                        <td>
                            <ActionButtons
                                item={user}
                                onView={() => openModal('view', 'users', user)}
                                onEdit={() => openModal('edit', 'users', user)}
                                onDelete={() => openModal('delete', 'users', user)}
                            />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
);

// Flashcards Management Tab Component
export const FlashcardsTab = ({ flashcards, openModal }) => (
    <div className="management-content">
        {/* Flashcards Table */}
        <div className="table-container">
            <table className="data-table">
                <thead>
                <tr>
                    <th>Từ vựng</th>
                    <th>Loại từ</th>
                    <th>Bộ thẻ</th>
                    <th>Độ khó</th>
                    <th>Lượt học</th>
                    <th>Người tạo</th>
                    <th>Thao tác</th>
                </tr>
                </thead>
                <tbody>
                {flashcards.map((flashcard) => (
                    <tr key={flashcard.id} className="table-row">
                        <td>
                            <div className="flashcard-info">
                                <div className="flashcard-word">{flashcard.word}</div>
                                <div className="flashcard-meaning">{flashcard.meaning}</div>
                            </div>
                        </td>
                        <td>
                            <span className="type-badge">{flashcard.wordType}</span>
                        </td>
                        <td>
                            <div className="set-info">
                                <div className="set-name">{flashcard.setName}</div>
                                <div className="set-category">{flashcard.category}</div>
                            </div>
                        </td>
                        <td>
                            <span className={`difficulty-badge difficulty-${flashcard.difficulty?.toLowerCase()}`}>
                                {flashcard.difficulty === 'EASY' ? 'Dễ' :
                                    flashcard.difficulty === 'MEDIUM' ? 'TB' : 'Khó'}
                            </span>
                        </td>
                        <td className="study-count">{flashcard.studyCount || 0}</td>
                        <td className="creator">{flashcard.createdBy}</td>
                        <td>
                            <ActionButtons
                                item={flashcard}
                                onView={() => openModal('view', 'flashcards', flashcard)}
                                onEdit={() => openModal('edit', 'flashcards', flashcard)}
                                onDelete={() => openModal('delete', 'flashcards', flashcard)}
                            />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
);

// Settings Tab Component
export const SettingsTab = ({ dashboardStats, loading, setLoading, setError, AdminApiService }) => {
    const handleBackup = async () => {
        try {
            setLoading(true);
            await AdminApiService.createBackup();
            alert('Sao lưu thành công!');
        } catch (error) {
            setError('Không thể tạo bản sao lưu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-content">
            <div className="settings-grid">
                {/* System Settings */}
                <div className="settings-card">
                    <h3 className="card-title">Cài đặt hệ thống</h3>
                    <div className="form-group">
                        <label className="form-label">Tên hệ thống</label>
                        <input
                            type="text"
                            defaultValue={dashboardStats.systemName || "English Learning System"}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email liên hệ</label>
                        <input
                            type="email"
                            defaultValue={dashboardStats.contactEmail || "admin@englishlearning.com"}
                            className="form-input"
                        />
                    </div>

                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                defaultChecked={dashboardStats.allowRegistration !== false}
                                className="checkbox"
                            />
                            <span>Cho phép đăng ký tài khoản mới</span>
                        </label>
                    </div>

                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                defaultChecked={dashboardStats.sendNotifications !== false}
                                className="checkbox"
                            />
                            <span>Gửi email thông báo</span>
                        </label>
                    </div>
                </div>

                {/* Test Settings */}
                <div className="settings-card">
                    <h3 className="card-title">Cài đặt bài thi</h3>
                    <div className="form-group">
                        <label className="form-label">Thời gian mặc định (phút)</label>
                        <input
                            type="number"
                            defaultValue={dashboardStats.defaultTestDuration || "60"}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Điểm đạt mặc định</label>
                        <input
                            type="number"
                            step="0.5"
                            defaultValue={dashboardStats.defaultPassingScore || "5.0"}
                            min="0"
                            max="9"
                            className="form-input"
                        />
                    </div>

                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                defaultChecked={dashboardStats.showAnswersAfterTest !== false}
                                className="checkbox"
                            />
                            <span>Hiển thị đáp án sau khi làm bài</span>
                        </label>
                    </div>

                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                defaultChecked={dashboardStats.allowRetakeTests === true}
                                className="checkbox"
                            />
                            <span>Cho phép làm lại bài thi</span>
                        </label>
                    </div>
                </div>

                {/* Backup & Data */}
                <div className="settings-card">
                    <h3 className="card-title">Sao lưu & Dữ liệu</h3>
                    <button
                        className="backup-btn primary"
                        onClick={handleBackup}
                        disabled={loading}
                    >
                        <Download className="icon" />
                        Sao lưu dữ liệu
                    </button>

                    <label className="backup-btn secondary">
                        <Upload className="icon" />
                        Khôi phục dữ liệu
                        <input
                            type="file"
                            style={{ display: 'none' }}
                            accept=".sql,.json"
                            onChange={(e) => {
                                // Handle restore file upload
                                console.log('Restore file selected:', e.target.files[0]);
                            }}
                        />
                    </label>

                    <div className="backup-info">
                        <p className="backup-label">Sao lưu tự động cuối cùng:</p>
                        <p className="backup-time">
                            {dashboardStats.lastBackup ?
                                new Date(dashboardStats.lastBackup).toLocaleString('vi-VN') :
                                'Chưa có'
                            }
                        </p>
                    </div>
                </div>

                {/* Statistics */}
                <div className="settings-card">
                    <h3 className="card-title">Thống kê hệ thống</h3>
                    <div className="system-stats">
                        <div className="system-stat-item">
                            <span className="stat-label">Dung lượng sử dụng:</span>
                            <span className="stat-value">
                            {dashboardStats.storageUsed || '0 MB'} / {dashboardStats.storageLimit || '10 GB'}
                        </span>
                        </div>

                        <div className="system-stat-item">
                            <span className="stat-label">Lượt truy cập hôm nay:</span>
                            <span className="stat-value">{dashboardStats.todayVisits?.toLocaleString() || '0'}</span>
                        </div>

                        <div className="system-stat-item">
                            <span className="stat-label">Người dùng online:</span>
                            <span className="stat-value">{dashboardStats.onlineUsers || 0}</span>
                        </div>

                        <div className="system-stat-item">
                            <span className="stat-label">Uptime:</span>
                            <span className="stat-value uptime">{dashboardStats.uptime || '99.9%'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};