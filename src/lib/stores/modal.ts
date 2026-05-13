import { writable } from 'svelte/store';

export type ModalTarget =
  | { kind: 'item'; id: string }
  | { kind: 'quest'; id: string };

export const modalTarget = writable<ModalTarget | null>(null);

export function openModal(target: ModalTarget) {
  modalTarget.set(target);
}
export function closeModal() {
  modalTarget.set(null);
}

/**
 * Returns true if the click was an "in-site item/quest link" and the modal
 * was opened. Caller should preventDefault in that case.
 */
export function tryInterceptLink(e: MouseEvent): boolean {
  if (e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const t = e.target as Element | null;
  const a = t?.closest('a');
  if (!a) return false;
  const href = a.getAttribute('href');
  if (!href || !href.startsWith('/')) return false;
  const itemMatch = href.match(/^\/items\/([^/?#]+)$/);
  if (itemMatch) {
    e.preventDefault();
    openModal({ kind: 'item', id: itemMatch[1] });
    return true;
  }
  const questMatch = href.match(/^\/quetes\/([^/?#]+)$/);
  if (questMatch) {
    e.preventDefault();
    openModal({ kind: 'quest', id: questMatch[1] });
    return true;
  }
  return false;
}
