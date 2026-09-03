'use client';

/**
 * Copy text to the clipboard and report whether it actually landed.
 *
 * `navigator.clipboard.writeText` rejects in several ordinary situations — the
 * document lost focus between the click and the write, the page is embedded in
 * a webview, or a permission policy blocks clipboard-write. Reporting "Copied!"
 * in those cases is a lie the user only discovers when they paste, so callers
 * get a boolean and surface the failure themselves.
 *
 * Falls back to the legacy `execCommand('copy')` path, which still works in a
 * few cases where the async API refuses.
 */
export async function copyText(text: string): Promise<{ ok: boolean; reason?: string }> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return legacyCopy(text, reason);
    }
  }
  return legacyCopy(text, 'Clipboard API unavailable in this browser');
}

function legacyCopy(text: string, reason: string): { ok: boolean; reason?: string } {
  if (typeof document === 'undefined') return { ok: false, reason };

  const scratch = document.createElement('textarea');
  scratch.value = text;
  // Keep it off-screen but still selectable — display:none breaks selection.
  scratch.setAttribute('readonly', '');
  scratch.style.position = 'fixed';
  scratch.style.top = '-1000px';
  scratch.style.opacity = '0';
  document.body.appendChild(scratch);

  try {
    scratch.select();
    scratch.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    return ok ? { ok: true } : { ok: false, reason };
  } catch {
    return { ok: false, reason };
  } finally {
    document.body.removeChild(scratch);
  }
}
