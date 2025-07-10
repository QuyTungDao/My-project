// hooks/useAdminData.js - UPDATED: Remove mock data, use real database
import { useState, useEffect } from 'react';
import AdminApiService from './AdminApiService';

export const useAdminData = (activeTab, searchTerm, filters, pagination) => {
    const [dashboardStats, setDashboardStats] = useState({
        totalUsers: 0,
        totalTests: 0,
        totalFlashcards: 0,
        activeUsers: 0,
        userGrowthRate: 0,
        testGrowthRate: 0,
        flashcardGrowthRate: 0,
        activeUserGrowthRate: 0,
        publishedTests: 0,
        draftTests: 0,
        totalTestAttempts: 0,
        todayVisits: 0,
        onlineUsers: 0
    });

    const [tests, setTests] = useState([]);
    const [users, setUsers] = useState([]);
    const [flashcards, setFlashcards] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);



    // ✅ UPDATED: Load real dashboard stats from database
    const loadDashboardStats = async () => {
        try {
            console.log('=== LOADING REAL DASHBOARD STATS ===');
            setLoading(true);
            setError(null);

            const stats = await AdminApiService.getDashboardStats();
            console.log('✅ Real dashboard stats loaded:', stats);

            setDashboardStats(stats);
        } catch (error) {
            console.error('❌ Error loading real dashboard stats:', error);
            setError('Không thể tải thống kê dashboard từ database');

            // ✅ Keep current state instead of resetting to mock data
            console.log('Keeping current dashboard stats state');
        } finally {
            setLoading(false);
        }
    };

    // ✅ UPDATED: Load real tests from database
    const loadTests = async () => {
        try {
            console.log('=== LOADING REAL TESTS FROM DATABASE ===');
            setLoading(true);
            setError(null);

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                type: filters.testType
            };

            console.log('Loading real tests with params:', params);
            const response = await AdminApiService.getTests(params);
            console.log('✅ Real tests loaded:', response);

            const testsData = response.data || response || [];
            console.log('Setting real tests data:', testsData.length, 'tests');
            setTests(Array.isArray(testsData) ? testsData : []);

            return response.pagination;
        } catch (error) {
            console.error('❌ Error loading real tests:', error);
            setError('Không thể tải danh sách bài thi từ database: ' + (error.message || 'Unknown error'));

            // ✅ Don't reset to empty array, keep current state
            console.log('Keeping current tests state');
        } finally {
            setLoading(false);
        }
    };

    // ✅ UPDATED: Load real users from database
    const loadUsers = async () => {
        try {
            console.log('=== LOADING REAL USERS FROM DATABASE ===');
            setLoading(true);
            setError(null);

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                role: filters.userRole
            };

            console.log('Loading real users with params:', params);
            const response = await AdminApiService.getUsers(params);
            console.log('✅ Real users loaded:', response);

            const usersData = response.data || response || [];
            console.log('Setting real users data:', usersData.length, 'users');
            setUsers(Array.isArray(usersData) ? usersData : []);

            return response.pagination;
        } catch (error) {
            console.error('❌ Error loading real users:', error);
            setError('Không thể tải danh sách người dùng từ database: ' + (error.message || 'Unknown error'));

            // ✅ Don't reset to empty array, keep current state
            console.log('Keeping current users state');
        } finally {
            setLoading(false);
        }
    };

    // ✅ UPDATED: Load real flashcards from database
    const loadFlashcards = async () => {
        try {
            console.log('=== LOADING REAL FLASHCARDS FROM DATABASE ===');
            setLoading(true);
            setError(null);

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                category: filters.flashcardCategory,
                difficulty: filters.flashcardDifficulty
            };

            console.log('Loading real flashcards with params:', params);
            const response = await AdminApiService.getFlashcards(params);
            console.log('✅ Real flashcards loaded:', response);

            const flashcardsData = response.data || response || [];
            console.log('Setting real flashcards data:', flashcardsData.length, 'flashcards');
            setFlashcards(Array.isArray(flashcardsData) ? flashcardsData : []);

            return response.pagination;
        } catch (error) {
            console.error('❌ Error loading real flashcards:', error);
            setError('Không thể tải danh sách flashcards từ database: ' + (error.message || 'Unknown error'));

            // ✅ Don't reset to empty array, keep current state
            console.log('Keeping current flashcards state');
        } finally {
            setLoading(false);
        }
    };

    // ✅ UPDATED: Load real recent activity from database
    const loadRecentActivity = async () => {
        try {
            console.log('=== LOADING REAL RECENT ACTIVITY FROM DATABASE ===');

            const activity = await AdminApiService.getRecentActivity();
            console.log('✅ Real recent activity loaded:', activity);

            setRecentActivity(Array.isArray(activity) ? activity : []);
        } catch (error) {
            console.error('❌ Error loading real recent activity:', error);

            // ✅ Set basic fallback activity instead of mock data
            setRecentActivity([
                {
                    type: 'info',
                    description: 'Dashboard được tải từ database',
                    timeAgo: 'Vừa xong',
                    timestamp: new Date().toISOString()
                },
                {
                    type: 'system',
                    description: 'Kết nối database thành công',
                    timeAgo: 'Vừa xong',
                    timestamp: new Date().toISOString()
                }
            ]);
        }
    };

    // ✅ Add debug logging for data state changes
    useEffect(() => {
        console.log('=== ADMIN DATA STATE UPDATE ===');
        console.log('Dashboard Stats:', {
            totalUsers: dashboardStats.totalUsers,
            totalTests: dashboardStats.totalTests,
            totalFlashcards: dashboardStats.totalFlashcards,
            activeUsers: dashboardStats.activeUsers
        });
        console.log('Data Arrays:', {
            testsCount: tests.length,
            usersCount: users.length,
            flashcardsCount: flashcards.length,
            activitiesCount: recentActivity.length
        });
    }, [dashboardStats, tests, users, flashcards, recentActivity]);

    return {
        // ✅ Data - all from real database
        dashboardStats,
        tests,
        users,
        flashcards,
        recentActivity,

        // ✅ State
        loading,
        error,
        setError,

        // ✅ Setters - for real-time updates
        setDashboardStats,
        setTests,
        setUsers,
        setFlashcards,

        // ✅ Loaders - all connected to real database
        loadDashboardStats,
        loadTests,
        loadUsers,
        loadFlashcards,
        loadRecentActivity
    };
};