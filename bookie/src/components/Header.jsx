import React from 'react';

const Header = ({ title, user }) => {
    return (
        <header className="bg-[#181E27] border-b border-[#333D4D] px-6 py-4 shrink-0">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-white">{title || 'Dashboard'}</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">
                        {user?.username && (
                            <span className="text-primary-400 font-medium">{user.username}</span>
                        )}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
