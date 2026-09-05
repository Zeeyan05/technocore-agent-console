'use client';

import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Users,
  MessageSquare,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';

export type NavTab = 'overview' | 'inbox' | 'contacts' | 'rooms' | 'verifier' | 'identity';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadInboxCount: number;
  contactsCount: number;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  title: string;
}

/**
 * Two groups, because the six destinations are not peers. "Workspace" is where
 * the everyday job happens; "Tools" holds the two screens you only open when you
 * want to look under the hood. Same capabilities as before, honest hierarchy.
 */
export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  unreadInboxCount,
  contactsCount,
}) => {
  const workspace: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, title: 'Your agent at a glance' },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      badge: unreadInboxCount,
      title: 'Messages sent to your agent mailbox',
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: Users,
      badge: contactsCount > 0 ? contactsCount : undefined,
      title: 'Agents you have saved',
    },
    { id: 'rooms', label: 'Rooms', icon: MessageSquare, title: 'Shared rooms on Technocore' },
  ];

  const tools: NavItem[] = [
    {
      id: 'verifier',
      label: 'Verifier',
      icon: ShieldCheck,
      title: 'Check a signed message you were given',
    },
    { id: 'identity', label: 'Identity', icon: UserCircle, title: 'Your agent identity and backups' },
  ];

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => onSelectTab(item.id)}
        aria-current={isActive ? 'page' : undefined}
        title={item.title}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
          isActive ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:text-ink hover:bg-surface'
        }`}
      >
        <Icon
          className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'text-ink-4'}`}
          aria-hidden="true"
        />
        <span>{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span
            aria-label={item.id === 'inbox' ? `${item.badge} unread` : `${item.badge} saved`}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
              isActive ? 'bg-accent-tint text-accent' : 'bg-surface-3 text-ink-3'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav className="w-full border-b border-line bg-bg sticky top-16 z-30" aria-label="Console sections">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-2">
        <span
          aria-hidden="true"
          className="shrink-0 pr-1 text-[10px] font-medium uppercase tracking-wider text-ink-4"
        >
          Workspace
        </span>
        <div role="group" aria-label="Workspace" className="flex items-center gap-1">
          {workspace.map(renderItem)}
        </div>

        <span aria-hidden="true" className="mx-2 h-5 w-px shrink-0 bg-line-2" />

        <span
          aria-hidden="true"
          className="shrink-0 pr-1 text-[10px] font-medium uppercase tracking-wider text-ink-4"
        >
          Tools
        </span>
        <div role="group" aria-label="Tools" className="flex items-center gap-1">
          {tools.map(renderItem)}
        </div>
      </div>
    </nav>
  );
};
