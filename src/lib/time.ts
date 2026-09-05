/**
 * Human timestamps.
 *
 * Message rows show "4m ago" because that is what a person wants at a glance;
 * the exact server timestamp stays available in the `title` and in the
 * verification panel, so nothing is lost.
 */

export function timeAgo(ts: string, now: number = Date.now()): string {
  const then = Date.parse(ts);
  if (!Number.isFinite(then)) return '';

  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return 'just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(then).toLocaleDateString();
}

export function fullTimestamp(ts: string): string {
  const then = Date.parse(ts);
  return Number.isFinite(then) ? new Date(then).toLocaleString() : ts;
}
