import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import {getAllUsers, createUser, setupTokenExpirationChecker} from './api';
import { getUserFromToken } from './utlis/authUtils';
import Home from './components/Home';
import Login from './components/LoginRegister/Login';
import Register from './components/LoginRegister/Register';
import './App.css';
import CreateExamPage from './components/CreateExam/CreateExamPage';
import ProtectedRoute from "./utlis/ProtectedRoute";
import TestLibrary from "./components/TestDisplay/TestLibrary";
import TestDetail from "./components/TestDisplay/TestDetail";
import TestResult from "./components/TestDisplay/TestResult";
import AccessDenied from "./utlis/AccessDenied";

// ✅ IMPORT ALL FLASHCARD COMPONENTS
import FlashcardHome from "./components/flashcard/FlashcardHome";
import FlashcardStudy from "./components/flashcard/FlashcardStudy";
import FlashcardCreate from "./components/flashcard/FlashcardCreate";
import FlashcardSetView from "./components/flashcard/FlashcardSetView";
import FlashcardStatistics from "./components/flashcard/FlashcardStatistics";
import FlashcardSetsList from "./components/flashcard/FlashcardSetsList";

// ✅ IMPORT CSS - THÊM DÒNG NÀY
import './components/flashcard/Flashcard.css';
import Profile from "./components/Profile";
import MyTestsPage from "./components/MyTestPage";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";

// ✅ WRAPPER COMPONENT FOR SET VIEW WITH PARAMS
const FlashcardSetViewWrapper = () => {
    const { setName } = useParams();
    return (
        <ProtectedRoute>
            <Navbar />
            <FlashcardSetView setName={decodeURIComponent(setName)} />
        </ProtectedRoute>
    );
};

function App() {
    // ... rest of your App component remains the same
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [authState, setAuthState] = useState(!!localStorage.getItem('token'));

    // ... rest of your code remains unchanged
    useEffect(() => {
        // Kiểm tra token khi component mount
        const token = localStorage.getItem('token');
        const isValid = !!token && token !== 'undefined' && token !== 'null';
        console.log("App.js - Initial auth state:", isValid ? "Authenticated" : "Not authenticated");
        setAuthState(isValid);

        // ✅ CHỈ TẢI USERS NẾU LÀ ADMIN
        if (isValid) {
            const user = getUserFromToken();
            console.log("App.js - Current user:", user);

            // Chỉ gọi getAllUsers nếu user là ADMIN
            if (user && (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN')) {
                console.log("App.js - User is ADMIN, fetching users");
                fetchUsers();
            } else {
                console.log("App.js - User is not ADMIN, skipping fetchUsers");
            }
        }

        // Thêm event listener để kiểm tra thay đổi trong localStorage
        const handleStorageChange = (e) => {
            console.log("Storage event triggered:", e);

            const currentToken = localStorage.getItem('token');
            const newAuthState = !!currentToken && currentToken !== 'undefined' && currentToken !== 'null';

            console.log("New auth state:", newAuthState ? "Authenticated" : "Not authenticated");

            if (newAuthState !== authState) {
                console.log("Updating auth state in App.js");
                setAuthState(newAuthState);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [authState]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            console.log("App.js - Fetching users...");
            const data = await getAllUsers();
            console.log("App.js - Users fetched successfully:", data);
            setUsers(data);
        } catch (err) {
            // ✅ KHÔNG HIỂN THỊ LỖI CHO USER THƯỜNG
            console.warn("App.js - Could not fetch users (probably not admin):", err.message);

            // Chỉ set error nếu thực sự là lỗi hệ thống, không phải lỗi permission
            if (err.response?.status !== 403) {
                setError('Không thể tải danh sách người dùng');
                console.error("Lỗi khi tải danh sách người dùng:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    // Kiểm tra token trước khi cho phép truy cập các route bảo mật
    const isAuthenticated = () => {
        const token = localStorage.getItem('token');
        console.log("App.js - Kiểm tra token:", token ? "Có token" : "Không có token");

        // Kiểm tra token có giá trị hợp lệ không
        const isValid = !!token && token !== 'undefined' && token !== 'null';

        // Ghi log thêm thông tin để debug
        if (isValid) {
            console.log("Token hợp lệ - cho phép truy cập");
        } else {
            console.log("Token không hợp lệ - chuyển hướng về login");
        }

        // Cập nhật state nếu trạng thái xác thực thay đổi
        if (isValid !== authState) {
            console.log("Cập nhật authState từ", authState, "thành", isValid);
            setAuthState(isValid);
        }

        return isValid;
    };

    useEffect(() => {
        const tokenCheckerInterval = setupTokenExpirationChecker();

        return () => {
            clearInterval(tokenCheckerInterval);
        };
    }, []);

    return (
        <Router>
            <div className="app">
                <Routes>
                    {/* ================================================ */}
                    {/* PUBLIC ROUTES */}
                    {/* ================================================ */}
                    <Route path="/access-denied" element={<AccessDenied />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* ================================================ */}
                    {/* MAIN APPLICATION ROUTES */}
                    {/* ================================================ */}
                    <Route
                        path="/"
                        element={
                            isAuthenticated() ? (
                                <ProtectedRoute>
                                    <Navbar />
                                    <Home />
                                </ProtectedRoute>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    <Route
                        path="/create-exam"
                        element={
                            <ProtectedRoute requiredRole={["TEACHER", "ROLE_TEACHER", "ADMIN", "ROLE_ADMIN"]} fallbackPath="/access-denied">
                                <Navbar />
                                <CreateExamPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/my-tests"
                        element={
                            <ProtectedRoute requiredRole={["TEACHER", "ROLE_TEACHER", "ADMIN", "ROLE_ADMIN"]} fallbackPath="/access-denied">
                                <Navbar />
                                {/* Add your MyTests component here */}
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/all-tests"
                        element={
                            <ProtectedRoute requiredRole={["ADMIN", "ROLE_ADMIN"]} fallbackPath="/access-denied">
                                <Navbar />
                                {/* Add your AdminTestsPage component here */}
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/online-exam"
                        element={
                            isAuthenticated() ? (
                                <ProtectedRoute>
                                    <Navbar />
                                    <TestLibrary />
                                </ProtectedRoute>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    <Route
                        path="/test-detail/:id"
                        element={
                            isAuthenticated() ? (
                                <ProtectedRoute>
                                    <TestDetail />
                                </ProtectedRoute>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    <Route
                        path="/test-results/:id"
                        element={
                            isAuthenticated() ? (
                                <ProtectedRoute>
                                    <TestResult />
                                </ProtectedRoute>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    {/* ================================================ */}
                    {/* OTHER MAIN ROUTES */}
                    {/* ================================================ */}
                    <Route
                        path="/program"
                        element={
                            isAuthenticated() ? (
                                <ProtectedRoute>
                                    <Navbar />
                                    <div className="container mx-auto mt-8">
                                        <h1 className="text-2xl font-bold">Chương trình học</h1>
                                        <p className="mt-4">Nội dung chương trình học sẽ được hiển thị tại đây.</p>
                                    </div>
                                </ProtectedRoute>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    <Route
                        path="/blog"
                        element={
                            isAuthenticated() ? (
                                <ProtectedRoute>
                                    <Navbar />
                                    <div className="container mx-auto mt-8">
                                        <h1 className="text-2xl font-bold">Blog</h1>
                                        <p className="mt-4">Nội dung blog sẽ được hiển thị tại đây.</p>
                                    </div>
                                </ProtectedRoute>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    {/* ================================================ */}
                    {/* FLASHCARD ROUTES */}
                    {/* ================================================ */}

                    {/* Main Flashcard Home - Can be accessed by guests and authenticated users */}
                    <Route
                        path="/flashcards"
                        element={
                            <>
                                <Navbar />
                                <FlashcardHome />
                            </>
                        }
                    />

                    {/* Flashcard Study - Requires authentication */}
                    <Route
                        path="/flashcards/study"
                        element={
                            isAuthenticated() ? (
                                <ProtectedRoute>
                                    <Navbar />
                                    <FlashcardStudy />
                                </ProtectedRoute>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    {/* Create Flashcard - Requires authentication */}
                    <Route
                        path="/flashcards/create"
                        element={
                            isAuthenticated() ? (
                                <ProtectedRoute>
                                    <Navbar />
                                    <FlashcardCreate />
                                </ProtectedRoute>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    {/* All Sets List - Can be accessed by anyone */}
                    <Route
                        path="/flashcards/sets"
                        element={
                            <>
                                <Navbar />
                                <FlashcardSetsList />
                            </>
                        }
                    />

                    {/* Individual Set View - Can be accessed by anyone */}
                    <Route
                        path="/flashcards/sets/:setName"
                        element={<FlashcardSetViewWrapper />}
                    />

                    {/* Statistics - Requires authentication */}
                    <Route
                        path="/flashcards/statistics"
                        element={
                            isAuthenticated() ? (
                                <ProtectedRoute>
                                    <Navbar />
                                    <FlashcardStatistics />
                                </ProtectedRoute>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    <Route path="*" element={<Navigate to="/login" />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/learning-history" element={<Profile />} />

                    <Route
                        path="/my-tests"
                        element={
                            <ProtectedRoute requiredRole={["TEACHER", "ROLE_TEACHER", "ADMIN", "ROLE_ADMIN"]} fallbackPath="/access-denied">
                                <Navbar />
                                <MyTestsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute requiredRole="ADMIN">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    // Also add the grade-submissions route:
                    <Route
                        path="/grade-submissions"
                        element={
                            <ProtectedRoute requiredRole={["TEACHER", "ROLE_TEACHER", "ADMIN", "ROLE_ADMIN"]} fallbackPath="/access-denied">
                                <Navbar />
                                <MyTestsPage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;