'use client';

import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Users,
  MessageSquare,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

export type NavTab = 'overview' | 'inbox' | 'contacts' | 'rooms' | 'verifier' | 'identity';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadInboxCount: number;
  contactsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  unreadInboxCount,
  contactsCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: unreadInboxCount },
    { id: 'contacts', label: 'Contacts', icon: Users, badge: contactsCount > 0 ? contactsCount : undefined },
    { id: 'rooms', label: 'Rooms', icon: MessageSquare },
    { id: 'verifier', label: 'Protocol Verifier', icon: ShieldCheck },
    { id: 'identity', label: 'Identity', icon: KeyRound },
  ];

  return (
    <nav className="w-full border-b border-slate-800 bg-[#0d0f17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold ${
                    item.id === 'inbox'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
