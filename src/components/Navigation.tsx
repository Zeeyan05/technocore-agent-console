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
    <nav
      className="w-full border-b border-line bg-bg sticky top-16 z-30"
      aria-label="Console sections"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-surface-2 text-ink'
                  : 'text-ink-3 hover:text-ink hover:bg-surface'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-accent' : 'text-ink-4'
                }`}
              />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  aria-label={
                    item.id === 'inbox'
                      ? `${item.badge} unread`
                      : `${item.badge} saved`
                  }
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    isActive
                      ? 'bg-accent-tint text-accent'
                      : 'bg-surface-3 text-ink-3'
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