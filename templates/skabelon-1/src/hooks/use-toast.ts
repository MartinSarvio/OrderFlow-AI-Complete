// Toast hook for notifications
import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    if (options.variant === 'destructive') {
      sonnerToast.error(options.title, {
        description: options.description,
      });
    } else {
      sonnerToast.success(options.title, {
        description: options.description,
        action: options.action,
      });
    }
  };

  return { toast };
}
