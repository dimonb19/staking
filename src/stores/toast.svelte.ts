import { writable } from 'svelte/store';

// Lightweight toast queue with auto-expiry used by ToastContainer.svelte
type ToastType = 'info' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);
  const timers = new Map<number, ReturnType<typeof setTimeout>>();

  const remove = (id: number) =>
    update((toasts) => toasts.filter((toast) => toast.id !== id));

  return {
    subscribe,
    show: (
      message: string,
      type: ToastType = 'info',
      duration: number = 10000,
    ) => {
      const id = Date.now();
      update((toasts) => [...toasts, { id, message, type, duration }]);

      const timeout = setTimeout(() => {
        timers.delete(id);
        remove(id);
      }, duration);

      timers.set(id, timeout);

      return id;
    },
    close: (id: number) => {
      const timeout = timers.get(id);
      if (timeout) {
        clearTimeout(timeout);
        timers.delete(id);
      }
      remove(id);
    },
  };
}

export const toastStore = createToastStore();
