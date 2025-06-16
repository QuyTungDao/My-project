import React from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../utlis/authUtils';

const AccessDenied = () => {
    const user = getCurrentUser();

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <div className="mb-6">
                    <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Truy cập bị từ chối
                </h1>

                <p className="text-gray-600 mb-6">
                    Bạn không có quyền truy cập vào trang này.
                    {user && (
                        <span className="block mt-2">
                            Vai trò hiện tại: <span className="font-semibold">{user.role}</span>
                        </span>
                    )}
                </p>

                <div className="space-y-3">
                    <Link
                        to="/"
                        className="block w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                    >
                        Về trang chủ
                    </Link>

                    {user?.role === 'STUDENT' && (
                        <Link
                            to="/online-exam"
                            className="block w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
                        >
                            Làm bài thi
                        </Link>
                    )}

                    {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                        <Link
                            to="/create-exam"
                            className="block w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition-colors"
                        >
                            Tạo bài thi
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;