import { writable } from 'svelte/store';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve: (v: boolean) => void;
}

const initial: ConfirmState = {
  open: false,
  message: '',
  resolve: () => {}
};

export const confirmState = writable<ConfirmState>(initial);

export function askConfirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    confirmState.set({ ...initial, ...opts, open: true, resolve });
  });
}

export function closeConfirm(value: boolean) {
  confirmState.update((s) => {
    s.resolve(value);
    return { ...initial };
  });
}
