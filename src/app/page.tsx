'use client';

import React, { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Navigation, NavTab } from '@/components/Navigation';
import { OverviewTab } from '@/components/OverviewTab';
import { InboxTab } from '@/components/InboxTab';
import { ContactsTab } from '@/components/ContactsTab';
import { RoomsTab } from '@/components/RoomsTab';
import { IdentityTab } from '@/components/IdentityTab';
import { ProtocolInspectorModal } from '@/components/ProtocolInspectorModal';
import { ComposeModal } from '@/components/ComposeModal';
import { StandaloneVerifierModal } from '@/components/StandaloneVerifierModal';
import { ExportSeedModal } from '@/components/ExportSeedModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { ConnectionErrorBanner } from '@/components/ConnectionErrorBanner';

import { useIdentity } from '@/hooks/useIdentity';
import { useTechnocore } from '@/hooks/useTechnocore';
import { useMailbox, VerifiedMessage } from '@/hooks/useMailbox';
import { useContacts } from '@/hooks/useContacts';
import { copyText } from '@/lib/clipboard';

export default function AgentConsolePage() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [customMailboxRoom, setCustomMailboxRoom] = useState<string | undefined>();

  // Modals state
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeRecipient, setComposeRecipient] = useState<string>('');
  const [composeRoom, setComposeRoom] = useState<string>('');

  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [inspectedMessage, setInspectedMessage] = useState<VerifiedMessage | null>(null);
  const [inspectedRoom, setInspectedRoom] = useState<string>('lobby');

  const [isVerifierOpen, setIsVerifierOpen] = useState<boolean>(false);
  const [isExportSeedOpen, setIsExportSeedOpen] = useState<boolean>(false);

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [didCopied, setDidCopied] = useState<boolean>(false);
  const [errorBannerDismissed, setErrorBannerDismissed] = useState<boolean>(false);

  // Hooks
  const { identity, isLoading: isIdentityLoading, generateNew, importIdentity } = useIdentity();
  const {
    client,
    connectionState,
    latencyMs,
    lastChecked,
    errorReason,
    rooms,
    serverVersion,
    isChecking,
    checkConnection,
  } = useTechnocore();

  const {
    activeRoom,
    messages,
    isLoading: isMailboxLoading,
    isPolling,
    error: mailboxError,
    lastSeq,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useMailbox(client, identity, customMailboxRoom);

  const {
    contacts,
    addContact,
    updateContact,
    deleteContact,
  } = useContacts();

  // Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Re-arm the banner when a new connection failure happens
  React.useEffect(() => {
    if (connectionState === 'connected') {
      setErrorBannerDismissed(false);
    }
  }, [connectionState]);

  // Copy helper — never claims success unless the write actually landed.
  const handleCopyText = useCallback(
    async (text: string, label: string): Promise<boolean> => {
      const { ok, reason } = await copyText(text);
      if (ok) {
        setCopiedKey(label);
        showToast(`Copied ${label} to clipboard`, 'success');
        setTimeout(() => setCopiedKey(null), 2000);
      } else {
        showToast(`Could not copy ${label}: ${reason ?? 'clipboard blocked'}`, 'error');
      }
      return ok;
    },
    [showToast]
  );

  const handleCopyDid = useCallback(
    async (did: string) => {
      const { ok, reason } = await copyText(did);
      if (ok) {
        setDidCopied(true);
        showToast('Copied your agent identity', 'success');
        setTimeout(() => setDidCopied(false), 2000);
      } else {
        showToast(`Could not copy identity: ${reason ?? 'clipboard blocked'}`, 'error');
      }
    },
    [showToast]
  );

  // Open Compose Modal with optional pre-fill
  const handleOpenCompose = useCallback((recipientOrRoom?: string) => {
    if (recipientOrRoom) {
      if (recipientOrRoom.startsWith('did:key:')) {
        setComposeRecipient(recipientOrRoom);
        setComposeRoom('');
      } else {
        setComposeRoom(recipientOrRoom);
        setComposeRecipient('');
      }
    } else {
      setComposeRecipient('');
      setComposeRoom('');
    }
    setIsComposeOpen(true);
  }, []);

  // Open Protocol Inspector Modal
  const handleInspectMessage = useCallback((msg: VerifiedMessage, room: string) => {
    setInspectedMessage(msg);
    setInspectedRoom(room);
    setIsInspectorOpen(true);
  }, []);

  // Tab Selection
  const handleSelectTab = useCallback((tab: NavTab) => {
    if (tab === 'verifier') {
      setIsVerifierOpen(true);
    } else {
      setActiveTab(tab);
    }
  }, []);

  // Which mailbox the inbox reads. A mailbox name is app configuration, not a
  // cryptographic binding, so choosing the conventional one just drops the
  // override rather than storing it as a special case.
  const handleSetMailbox = useCallback(
    (room: string) => {
      const next = room.trim().toLowerCase();
      if (!next) return;
      const isDefault = !!identity && next === identity.mailboxRoom;
      setCustomMailboxRoom(isDefault ? undefined : next);
      showToast(
        isDefault ? 'Reading your default mailbox again' : `Now reading ${next}`,
        'info'
      );
    },
    [identity, showToast]
  );

  const showConnectionBanner =
    connectionState === 'error' && errorReason && !errorBannerDismissed;

  return (
    /* No background of its own: the ambient light and grid layers mounted in
       layout.tsx sit behind this, and an opaque page would hide them. */
    <div className="min-h-screen flex flex-col text-ink selection:bg-accent/30 selection:text-ink">
      {/* Header */}
      <Header
        identity={identity}
        connectionState={connectionState}
        latencyMs={latencyMs}
        onOpenCompose={() => handleOpenCompose()}
        onOpenVerifier={() => setIsVerifierOpen(true)}
        onOpenIdentity={() => setActiveTab('identity')}
        onRefreshConnection={() => checkConnection()}
        isChecking={isChecking}
        onCopyDid={handleCopyDid}
        didCopied={didCopied}
        serverVersion={serverVersion}
      />

      {/* Spec-required connection error banner: reason + retry */}
      {showConnectionBanner && (
        <ConnectionErrorBanner
          reason={errorReason}
          onRetry={() => {
            checkConnection();
          }}
          onDismiss={() => setErrorBannerDismissed(true)}
        />
      )}

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        unreadInboxCount={unreadCount}
        contactsCount={contacts.length}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            identity={identity}
            connectionState={connectionState}
            latencyMs={latencyMs}
            lastChecked={lastChecked}
            isPolling={isPolling}
            lastSeq={lastSeq}
            activeMailbox={activeRoom}
            unreadCount={unreadCount}
            recentMessages={messages}
            rooms={rooms}
            contacts={contacts}
            onNavigate={handleSelectTab}
            onOpenCompose={handleOpenCompose}
            onCopyText={handleCopyText}
            copiedKey={copiedKey}
          />
        )}

        {activeTab === 'inbox' && (
          <InboxTab
            messages={messages}
            activeRoom={activeRoom}
            identity={identity}
            contacts={contacts}
            isLoading={isMailboxLoading}
            error={mailboxError}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onInspectMessage={handleInspectMessage}
            onOpenCompose={handleOpenCompose}
            onAddContact={(contact) => {
              addContact(contact);
              showToast(`Saved ${contact.nickname}`, 'success');
            }}
            onCopyText={handleCopyText}
            copiedKey={copiedKey}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsTab
            contacts={contacts}
            onAddContact={(contact) => {
              addContact(contact);
              showToast(`Saved ${contact.nickname}`, 'success');
            }}
            onUpdateContact={(id, updates) => {
              updateContact(id, updates);
              showToast('Contact updated', 'success');
            }}
            onDeleteContact={(id) => {
              deleteContact(id);
              showToast('Contact removed', 'info');
            }}
            onOpenCompose={handleOpenCompose}
            onSelectMailbox={(room) => {
              handleSetMailbox(room);
              setActiveTab('inbox');
            }}
            onCopyText={handleCopyText}
            copiedKey={copiedKey}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomsTab
            client={client}
            identity={identity}
            rooms={rooms}
            contacts={contacts}
            onOpenCompose={handleOpenCompose}
            onInspectMessage={handleInspectMessage}
            onCopyText={handleCopyText}
            copiedKey={copiedKey}
          />
        )}

        {activeTab === 'identity' && (
          <IdentityTab
            identity={identity}
            isLoading={isIdentityLoading}
            activeMailbox={activeRoom}
            onGenerateNew={async () => {
              const id = await generateNew();
              showToast('New agent identity created', 'success');
              return id;
            }}
            onImportIdentity={async (seed) => {
              const id = await importIdentity(seed);
              showToast('Identity imported', 'success');
              return id;
            }}
            onOpenExportModal={() => setIsExportSeedOpen(true)}
            onSetMailbox={handleSetMailbox}
            onNavigate={handleSelectTab}
            onOpenCompose={() => handleOpenCompose()}
            onCopyText={handleCopyText}
            copiedKey={copiedKey}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-line py-5 text-xs text-ink-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-ink-3">
            © Shaikh Zeeyan (<a
              href="https://x.com/ShaikhZeeyan05"
              target="_blank"
              rel="noopener noreferrer"
              /* Vertical padding on an inline link grows the tappable box without
                 adding height to the line, so an 14px-tall credit link is still
                 comfortable to hit on a 360px phone. */
              className="py-1.5 text-ink-2 hover:text-accent transition-colors"
            >
              @ShaikhZeeyan05
            </a>)
          </div>
          <div className="font-mono text-[11px] text-ink-4">
            Target: technocore.chat &bull; Protocol{' '}
            {serverVersion ? `v${serverVersion}` : 'version unavailable'} &bull; Ed25519 did:key
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <ProtocolInspectorModal
        message={inspectedMessage}
        room={inspectedRoom}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onCopyText={handleCopyText}
        serverVersion={serverVersion}
      />

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        identity={identity}
        client={client}
        contacts={contacts}
        defaultRecipient={composeRecipient}
        defaultRoom={composeRoom}
        onSuccess={(targetRoom) => {
          showToast(`Message signed and sent to ${targetRoom}`, 'success');
        }}
      />

      <StandaloneVerifierModal
        isOpen={isVerifierOpen}
        onClose={() => setIsVerifierOpen(false)}
      />

      <ExportSeedModal
        isOpen={isExportSeedOpen}
        onClose={() => setIsExportSeedOpen(false)}
        identity={identity}
        onCopyText={handleCopyText}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}