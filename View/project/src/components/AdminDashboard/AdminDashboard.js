// AdminDashboard.js - Updated với navigation đến CreateExamPage
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ THÊM: Import useNavigate
import { Search, Plus, Download, Upload, Edit, FileText } from 'lucide-react';
import './AdminDashboard.css';
import {useAdminData} from "./useAdminData";
import AdminApiService from "./AdminApiService";
import {AdminSidebar} from "./AdminSidebar";
import {AdminHeader} from "./AdminHeader";
import {ErrorMessage, LoadingSpinner} from "./AdminComponents";
import {FlashcardsTab, OverviewTab, SettingsTab, TestsTab, UsersTab} from "./AdminTabs";
import {AdminModal} from "./AdminModals";
import {Pagination} from "./AdminComponents"; // ✅ SỬA: Import từ AdminComponents thay vì @mui/material

const AdminDashboard = () => {
    // ✅ THÊM: Initialize navigation hook
    const navigate = useNavigate();

    // State management (giữ nguyên existing code)
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        userRole: '',
        testType: '',
        flashcardCategory: '',
        flashcardDifficulty: ''
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0
    });

    // Custom hook for data management
    const {
        dashboardStats,
        tests,
        users,
        flashcards,
        recentActivity,
        error,
        setError,
        setTests,
        setUsers,
        setFlashcards,
        loadDashboardStats,
        loadTests,
        loadUsers,
        loadFlashcards,
        loadRecentActivity
    } = useAdminData(activeTab, searchTerm, filters, pagination);

    // ✅ THÊM: Navigation functions
    const navigateToCreateExam = () => {
        console.log('Navigating to Create Exam Page...');
        navigate('/create-exam');
    };

    const navigateToEditExam = (testId) => {
        console.log(`Navigating to Edit Exam Page for test ID: ${testId}`);
        navigate(`/create-exam?id=${testId}`);
    };

    const navigateToCreateFlashcard = () => {
        console.log('Navigating to Create Flashcard Page...');
        navigate('/flashcards/create');
    };

    const navigateToViewExam = (testId) => {
        console.log(`Navigating to View Exam Page for test ID: ${testId}`);
        navigate(`/test-detail/${testId}`);
    };

    // Load data on component mount and tab change (giữ nguyên existing code)
    useEffect(() => {
        loadDashboardStats();
        loadRecentActivity();
    }, []);

    useEffect(() => {
        const loadTabData = async () => {
            let paginationData;

            switch(activeTab) {
                case 'tests':
                    paginationData = await loadTests();
                    break;
                case 'users':
                    paginationData = await loadUsers();
                    break;
                    case 'flashcards':
                        paginationData = await loadFlashcards();
                        break;
                default:
                    return;
            }

            if (paginationData) {
                setPagination(prev => ({
                    ...prev,
                    total: paginationData.total || 0
                }));
            }
        };

        loadTabData();
    }, [activeTab, searchTerm, filters, pagination.page]);

    // ✅ CẬP NHẬT: Modal management với navigation
    const openModal = async (type, content, item = null) => {
        // ✅ THÊM: Redirect to CreateExamPage for test creation/editing
        if (content === 'tests') {
            if (type === 'create') {
                navigateToCreateExam();
                return;
            } else if (type === 'edit' && item) {
                navigateToEditExam(item.id);
                return;
            } else if (type === 'view' && item) {
                navigateToViewExam(item.id);
                return;
            } else if (type === 'flashcards' && item){
                navigateToCreateFlashcard();
                return;
            } else if (type === 'delete' && item) {
                // Xác nhận xóa
                const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa bài thi "${item.name}" không?`);
                if (confirmed) {
                    try {
                        await AdminApiService.deleteTest(item.id);
                        // Reload data
                        await loadTests();
                        await loadDashboardStats();
                    } catch (err) {
                        setError('Không thể xóa bài thi: ' + (err.message || ''));
                    }
                }
                return;  // Quan trọng, ngăn modal mặc định
            }
        }

        // ✅ Giữ nguyên logic cho users và flashcards
        setModalType(type);
        setModalContent(content);

        if (item && type === 'view') {
            try {
                let fullItem;
                switch(content) {
                    case 'users':
                        fullItem = await AdminApiService.getUser(item.id);
                        break;
                    case 'flashcards':
                        fullItem = await AdminApiService.getFlashcard(item.id);
                        break;
                    default:
                        fullItem = item;
                }
                setFormData(fullItem);
            } catch (error) {
                console.error('Error loading item details:', error);
                setFormData(item || {});
            }
        } else {
            setFormData(item || {});
        }

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({});
        setError(null);
    };

    // ✅ CẬP NHẬT: Form submission handler (bỏ test handling vì đã redirect)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let result;

            switch(modalContent) {
                case 'users':
                    result = await handleUserSubmission();
                    break;
                case 'flashcards':
                    result = await handleFlashcardSubmission();
                    break;
                default:
                    console.warn('Unknown modal content:', modalContent);
                    return;
            }

            await loadDashboardStats();
            closeModal();

        } catch (error) {
            setError(error.message || 'Có lỗi xảy ra khi xử lý yêu cầu');
            console.error('Error handling form submission:', error);
        } finally {
            setLoading(false);
        }
    };

    // Individual submission handlers (bỏ handleTestSubmission)
    const handleUserSubmission = async () => {
        if (modalType === 'create') {
            const userData = {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                status: formData.status
            };
            const result = await AdminApiService.createUser(userData);
            setUsers(prev => [result, ...prev]);
            return result;
        } else if (modalType === 'edit') {
            const result = await AdminApiService.updateUser(formData.id, formData);
            setUsers(prev => prev.map(user =>
                user.id === formData.id ? result : user
            ));
            return result;
        } else if (modalType === 'delete') {
            await AdminApiService.deleteUser(formData.id);
            setUsers(prev => prev.filter(user => user.id !== formData.id));
        }
    };

    const handleFlashcardSubmission = async () => {
        if (modalType === 'create') {
            const flashcardData = {
                word: formData.word,
                meaning: formData.meaning,
                wordType: formData.wordType,
                category: formData.category,
                setName: formData.setName,
                difficulty: formData.difficulty,
                isPublic: formData.isPublic,
                exampleSentence: formData.exampleSentence
            };
            const result = await AdminApiService.createFlashcard(flashcardData);
            setFlashcards(prev => [result, ...prev]);
            return result;
        } else if (modalType === 'edit') {
            const result = await AdminApiService.updateFlashcard(formData.id, formData);
            setFlashcards(prev => prev.map(flashcard =>
                flashcard.id === formData.id ? result : flashcard
            ));
            return result;
        } else if (modalType === 'delete') {
            await AdminApiService.deleteFlashcard(formData.id);
            setFlashcards(prev => prev.filter(flashcard => flashcard.id !== formData.id));
        }
    };

    // Bulk actions handler (giữ nguyên nhưng loại bỏ test handling)
    const handleBulkAction = async (action) => {
        if (selectedItems.length === 0) {
            alert('Vui lòng chọn ít nhất một item');
            return;
        }

        if (!window.confirm(`Bạn có chắc muốn ${action} ${selectedItems.length} items?`)) {
            return;
        }

        setLoading(true);
        try {
            // ✅ Note: Bulk test actions đã được handle bởi CreateExamPage
            console.log(`Bulk action ${action} on ${selectedItems.length} items`);
            setSelectedItems([]);
            await loadDashboardStats();
        } catch (error) {
            setError('Có lỗi xảy ra khi thực hiện thao tác hàng loạt');
            console.error('Bulk action error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Export/Import handlers (giữ nguyên)
    const handleExportUsers = async () => {
        try {
            setLoading(true);
            const blob = await AdminApiService.exportUsers();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            setError('Không thể xuất file CSV');
            console.error('Export error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImportFlashcards = async (file) => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);

            await AdminApiService.importFlashcards(formData);
            await loadFlashcards();
            await loadDashboardStats();
        } catch (error) {
            setError('Không thể import file CSV');
            console.error('Import error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Refresh handler
    const handleRefresh = () => {
        switch(activeTab) {
            case 'overview':
                loadDashboardStats();
                loadRecentActivity();
                break;
            case 'tests':
                loadTests();
                break;
            case 'users':
                loadUsers();
                break;
            case 'flashcards':
                loadFlashcards();
                break;
        }
    };

    // ✅ CẬP NHẬT: Search and filter controls component
    const SearchFilterControls = ({ filterType }) => (
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

                {/* Flashcard Filters */}
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
                {/* Bulk Actions for Tests */}
                {selectedItems.length > 0 && filterType === 'bài thi' && (
                    <div className="bulk-actions">
                        <span className="selected-count">
                            {selectedItems.length} đã chọn
                        </span>
                        <button
                            onClick={() => handleBulkAction('publish')}
                            className="bulk-btn publish"
                            disabled={loading}
                        >
                            Xuất bản
                        </button>
                        <button
                            onClick={() => handleBulkAction('delete')}
                            className="bulk-btn delete"
                            disabled={loading}
                        >
                            Xóa
                        </button>
                    </div>
                )}

                {/* Export for Users */}
                {filterType === 'người dùng' && (
                    <button
                        className="secondary-btn"
                        onClick={handleExportUsers}
                        disabled={loading}
                    >
                        <Download className="icon" />
                        Xuất CSV
                    </button>
                )}

                {/* Import for Flashcards */}
                {filterType === 'flashcard' && (
                    <label className="secondary-btn">
                        <Upload className="icon" />
                        Import CSV
                        <input
                            type="file"
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    handleImportFlashcards(e.target.files[0]);
                                }
                            }}
                        />
                    </label>
                )}

                {/* ✅ CẬP NHẬT: Create New Button với navigation */}
                <button
                    onClick={() => {
                        if (filterType === 'bài thi') {
                            navigateToCreateExam(); // ✅ Navigate to CreateExamPage
                        } else if (filterType === 'flashcards') {
                            navigateToCreateExam();
                        }  else {
                            openModal('create',
                                filterType === 'người dùng' ? 'users' : 'flashcards'
                            );
                        }
                    }}
                    className={filterType === 'bài thi' ? 'create-exam-button' : 'primary-btn'}
                    disabled={loading}
                >
                    {filterType === 'bài thi' ? (
                        <>
                            <Edit className="icon" />
                            Tạo bài thi mới
                        </>
                    ) : filterType === 'flashcard' ? (
                        <>
                            <Plus className="icon" />
                            Tạo Flashcard mới
                        </>
                    ) : (
                        <>
                            <Plus className="icon" />
                            Thêm người dùng
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard">
            {/* Error display */}
            {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

            {/* Sidebar */}
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main Content */}
            <div className="main-content">
                {/* Header */}
                <AdminHeader
                    activeTab={activeTab}
                    handleRefresh={handleRefresh}
                    loading={loading}
                />

                {/* Content Area */}
                <main className="content">
                    {loading && <LoadingSpinner />}

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <OverviewTab
                            dashboardStats={dashboardStats}
                            recentActivity={recentActivity}
                            openModal={(type, content) => {
                                if (content === 'tests') {
                                    navigateToCreateExam(); // ✅ Navigate to CreateExamPage
                                } else if (content === 'flashcards' && type === 'create'){
                                    navigateToCreateFlashcard();
                                }
                                else {
                                    openModal(type, content);
                                }
                            }}
                        />
                    )}

                    {/* Tests Management Tab */}
                    {activeTab === 'tests' && (
                        <>
                            <SearchFilterControls filterType="bài thi" />
                            <TestsTab
                                tests={tests}
                                selectedItems={selectedItems}
                                setSelectedItems={setSelectedItems}
                                openModal={openModal} // ✅ Sử dụng updated openModal với navigation
                                loading={loading}
                            />
                        </>
                    )}

                    {/* Users Management Tab */}
                    {activeTab === 'users' && (
                        <>
                            <SearchFilterControls filterType="người dùng" />
                            <UsersTab
                                users={users}
                                openModal={openModal}
                            />
                        </>
                    )}

                    {/* Flashcards Management Tab */}
                    {activeTab === 'flashcards' && (
                        <>
                            <SearchFilterControls filterType="flashcard" />
                            <FlashcardsTab
                                flashcards={flashcards}
                                openModal={openModal}
                            />
                        </>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <SettingsTab
                            dashboardStats={dashboardStats}
                            loading={loading}
                            setLoading={setLoading}
                            setError={setError}
                            AdminApiService={AdminApiService}
                        />
                    )}
                </main>
                {/* Pagination */}
                {(activeTab === 'tests' || activeTab === 'users' || activeTab === 'flashcards') && (
                    <Pagination
                        pagination={pagination}
                        setPagination={setPagination}
                        loading={loading}
                    />
                )}
            </div>



            {/* ✅ CẬP NHẬT: Modal chỉ cho users và flashcards */}
            {modalContent !== 'tests' && (
                <AdminModal
                    showModal={showModal}
                    closeModal={closeModal}
                    modalType={modalType}
                    modalContent={modalContent}
                    formData={formData}
                    setFormData={setFormData}
                    handleSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                />
            )}


        </div>
    );
};

export default AdminDashboard;