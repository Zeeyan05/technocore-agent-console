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
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: unreadInboxCount },
    { id: 'contacts', label: 'Contacts', icon: Users, badge: contactsCount > 0 ? contactsCount : undefined },
    { id: 'rooms', label: 'Rooms', icon: MessageSquare },
    { id: 'verifier', label: 'Protocol Verifier', icon: ShieldCheck },
    { id: 'identity', label: 'Identity', icon: KeyRound },
  ];

  return (
    <nav className="w-full border-b border-white/[0.08] bg-[#08090c] sticky top-14 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap border ${
                isActive
                  ? 'bg-[#181e2b] text-white border-white/[0.14]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border-transparent'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-sky-400' : 'text-slate-500'
                }`}
              />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-white/[0.06] text-slate-400'
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
