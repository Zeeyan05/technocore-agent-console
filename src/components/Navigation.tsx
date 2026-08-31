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
    accentColor: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, accentColor: 'cyan' },
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: unreadInboxCount, accentColor: 'cyan' },
    { id: 'contacts', label: 'Contacts', icon: Users, badge: contactsCount > 0 ? contactsCount : undefined, accentColor: 'purple' },
    { id: 'rooms', label: 'Rooms', icon: MessageSquare, accentColor: 'emerald' },
    { id: 'verifier', label: 'Protocol Verifier', icon: ShieldCheck, accentColor: 'amber' },
    { id: 'identity', label: 'Identity', icon: KeyRound, accentColor: 'cyan' },
  ];

  return (
    <nav className="w-full border-b border-white/[0.08] bg-[#0a0c13]/90 backdrop-blur-md sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-white/[0.12] to-white/[0.05] text-white border border-white/[0.2] shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive
                    ? item.accentColor === 'emerald'
                      ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                      : item.accentColor === 'purple'
                      ? 'text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]'
                      : item.accentColor === 'amber'
                      ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                      : 'text-cyan-400 drop-shadow-[0_0_6px_rgba(0,242,254,0.6)]'
                    : 'text-slate-500'
                }`}
              />
              <span className="tracking-wide">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    item.id === 'inbox'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,242,254,0.3)] animate-pulse'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,242,254,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
