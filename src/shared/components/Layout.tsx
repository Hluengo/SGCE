import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
    // We could lift isOnline here eventually
    return (
        <div className="flex min-h-screen min-h-[100dvh] bg-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700 overflow-x-hidden">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
                <Header />
                <main className="flex-1 min-w-0 min-h-0 relative bg-slate-50 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
