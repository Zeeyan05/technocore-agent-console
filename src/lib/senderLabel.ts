import { formatDidAbbreviated, isValidDid } from './crypto/did';
import type { AgentContact } from '@/types/technocore';

export interface SenderLabel {
  /** The name to show in a message row — a saved nickname when we have one. */
  name: string;
  /** Short DID for the second line, empty when `name` already is the DID. */
  shortDid: string;
  /** True when the sender authenticated with a did:key identity. */
  isDid: boolean;
  /** True when the sender is this browser's own agent. */
  isSelf: boolean;
  /** True when the DID matches a saved contact. */
  isKnown: boolean;
}

/**
 * Turn a raw `from` field into something a person can read.
 *
 * Technocore's `from` is either a 56-character DID or a self-asserted nickname.
 * Neither is a good headline, so a saved contact's nickname wins, then "You",
 * then the abbreviated DID. The full DID is never dropped — it just moves to the
 * verification panel where it belongs.
 */
export function describeSender(
  from: string,
  contacts: readonly AgentContact[],
  selfDid: string
): SenderLabel {
  const isDid = isValidDid(from);

  if (!isDid) {
    return { name: from || 'Unknown sender', shortDid: '', isDid: false, isSelf: false, isKnown: false };
  }

  const short = formatDidAbbreviated(from);

  if (selfDid && from === selfDid) {
    return { name: 'You', shortDid: short, isDid: true, isSelf: true, isKnown: true };
  }

  const contact = contacts.find((c) => c.did === from);
  if (contact) {
    return { name: contact.nickname, shortDid: short, isDid: true, isSelf: false, isKnown: true };
  }

  return { name: short, shortDid: '', isDid: true, isSelf: false, isKnown: false };
}
