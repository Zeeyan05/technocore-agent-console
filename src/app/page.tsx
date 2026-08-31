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

import { useIdentity } from '@/hooks/useIdentity';
import { useTechnocore } from '@/hooks/useTechnocore';
import { useMailbox, VerifiedMessage } from '@/hooks/useMailbox';
import { useContacts } from '@/hooks/useContacts';
import { useAudio } from '@/hooks/useAudio';

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

  // Hooks
  const { identity, isLoading: isIdentityLoading, generateNew, importIdentity } = useIdentity();
  const {
    client,
    connectionState,
    latencyMs,
    rooms,
    isChecking,
    checkConnection,
  } = useTechnocore();

  const {
    activeRoom,
    messages,
    isLoading: isMailboxLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useMailbox(client, identity, customMailboxRoom);

  const {
    contacts,
    addContact,
    deleteContact,
  } = useContacts();

  const {
    enabled: audioEnabled,
    toggle: toggleAudio,
    playClick,
    playSend,
    playReceive,
    playVerifySuccess,
    playVerifyFail,
  } = useAudio();

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

  // Copy helper
  const handleCopyText = useCallback((text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      playClick();
      setCopiedKey(label);
      showToast(`Copied ${label} to clipboard`, 'success');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }, [playClick, showToast]);

  const handleCopyDid = useCallback((did: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(did);
      playClick();
      setDidCopied(true);
      showToast('Copied full DID to clipboard', 'success');
      setTimeout(() => setDidCopied(false), 2000);
    }
  }, [playClick, showToast]);

  // Open Compose Modal with optional pre-fill
  const handleOpenCompose = useCallback((recipientOrRoom?: string) => {
    playClick();
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
  }, [playClick]);

  // Open Protocol Inspector Modal
  const handleInspectMessage = useCallback((msg: VerifiedMessage, room: string) => {
    playClick();
    setInspectedMessage(msg);
    setInspectedRoom(room);
    setIsInspectorOpen(true);
    if (msg.verification?.valid) {
      playVerifySuccess();
    }
  }, [playClick, playVerifySuccess]);

  // Tab Selection
  const handleSelectTab = useCallback((tab: NavTab) => {
    playClick();
    if (tab === 'verifier') {
      setIsVerifierOpen(true);
    } else {
      setActiveTab(tab);
    }
  }, [playClick]);

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <Header
        identity={identity}
        connectionState={connectionState}
        latencyMs={latencyMs}
        audioEnabled={audioEnabled}
        onToggleAudio={toggleAudio}
        onOpenCompose={() => handleOpenCompose()}
        onOpenVerifier={() => {
          playClick();
          setIsVerifierOpen(true);
        }}
        onRefreshConnection={() => {
          playClick();
          checkConnection();
        }}
        isChecking={isChecking}
        onCopyDid={handleCopyDid}
        didCopied={didCopied}
      />

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
            unreadCount={unreadCount}
            recentMessages={messages}
            rooms={rooms}
            onNavigate={handleSelectTab}
            onOpenCompose={handleOpenCompose}
            onInspectMessage={handleInspectMessage}
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
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onInspectMessage={handleInspectMessage}
            onOpenCompose={handleOpenCompose}
            onAddContact={(contact) => {
              addContact(contact);
              showToast(`Saved contact: ${contact.nickname}`, 'success');
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
              showToast(`Added agent contact: ${contact.nickname}`, 'success');
            }}
            onDeleteContact={(id) => {
              deleteContact(id);
              showToast('Deleted contact', 'info');
            }}
            onOpenCompose={handleOpenCompose}
            onSelectMailbox={(room) => {
              setCustomMailboxRoom(room);
              setActiveTab('inbox');
              showToast(`Switched to mailbox channel: ${room}`, 'info');
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
            onOpenCompose={handleOpenCompose}
            onInspectMessage={handleInspectMessage}
          />
        )}

        {activeTab === 'identity' && (
          <IdentityTab
            identity={identity}
            onGenerateNew={async () => {
              const id = await generateNew();
              showToast('Generated fresh Ed25519 identity', 'success');
              return id;
            }}
            onImportIdentity={async (seed) => {
              const id = await importIdentity(seed);
              showToast('Imported and verified identity', 'success');
              return id;
            }}
            onOpenExportModal={() => {
              playClick();
              setIsExportSeedOpen(true);
            }}
            onCopyText={handleCopyText}
            copiedKey={copiedKey}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] py-5 bg-[#07080c] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white font-sans">CoreConsole</span>
            <span className="text-slate-700">&bull;</span>
            <span className="text-slate-400 font-mono">Autonomous Agent Control Center</span>
            <span className="text-slate-700">&bull;</span>
            <a
              href="https://x.com/ShaikhZeeyan05"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 font-mono inline-flex items-center gap-1 transition-colors"
            >
              <span>Crafted by @ShaikhZeeyan05</span>
            </a>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Target: technocore.chat &bull; Protocol v0.11.1 &bull; Ed25519 did:key
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
          showToast(`Message broadcast to #${targetRoom}`, 'success');
        }}
        onPlaySendAudio={playSend}
      />

      <StandaloneVerifierModal
        isOpen={isVerifierOpen}
        onClose={() => setIsVerifierOpen(false)}
        onPlaySuccessAudio={playVerifySuccess}
        onPlayFailAudio={playVerifyFail}
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
