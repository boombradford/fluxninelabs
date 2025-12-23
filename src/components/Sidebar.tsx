import React from 'react';
import { LuLayoutDashboard, LuKanban, LuArchive, LuSettings } from 'react-icons/lu';

export function Sidebar() {
    return (
        <div className="w-64 bg-gray-900 text-white h-screen flex flex-col border-r border-gray-800">
            <div className="p-6">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    WaveReact Planner
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                <NavItem icon={<LuLayoutDashboard size={20} />} label="Home" />
                <NavItem icon={<LuKanban size={20} />} label="Board" active />
                <NavItem icon={<LuArchive size={20} />} label="Archive" />
                <NavItem icon={<LuSettings size={20} />} label="Settings" />
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                    <div className="text-sm">
                        <div className="font-medium">User</div>
                        <div className="text-gray-400 text-xs">Pro Plan</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <button
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active
                ? 'bg-blue-600/10 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}
