// components/AdminHeader.js
import React from 'react';
import { RefreshCw } from 'lucide-react';

export const AdminHeader = ({ activeTab, handleRefresh, loading }) => {
    const getTabTitle = () => {
        switch(activeTab) {
            case 'overview': return 'Tổng quan hệ thống';
            case 'tests': return 'Quản lý bài thi';
            case 'users': return 'Quản lý người dùng';
            case 'flashcards': return 'Quản lý Flashcards';
            case 'settings': return 'Cài đặt hệ thống';
            default: return 'Dashboard';
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-info">
                    <h2 className="header-title">{getTabTitle()}</h2>
                    <p className="header-subtitle">Quản trị viên hệ thống học tiếng Anh</p>
                </div>

                <div className="header-actions">
                    {/*<button*/}
                    {/*    className="refresh-btn"*/}
                    {/*    onClick={handleRefresh}*/}
                    {/*    disabled={loading}*/}
                    {/*>*/}
                    {/*    <RefreshCw className={`icon ${loading ? 'spinning' : ''}`} />*/}
                    {/*</button>*/}
                    <div className="user-info">
                        <div className="user-avatar">A</div>
                        <span className="username">Admin</span>
                    </div>
                </div>
            </div>
        </header>
    );
};