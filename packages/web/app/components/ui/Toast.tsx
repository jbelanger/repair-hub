import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "~/utils/cn";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-400" />,
  error: <AlertCircle className="h-5 w-5 text-red-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
  info: <Info className="h-5 w-5 text-blue-400" />
};

const backgrounds: Record<ToastType, string> = {
  success: "bg-green-400/10 border-green-400/20",
  error: "bg-red-400/10 border-red-400/20",
  warning: "bg-yellow-400/10 border-yellow-400/20",
  info: "bg-blue-400/10 border-blue-400/20"
};

export function Toast({ message, type = "info", duration = 5000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration, onClose]);

  const content = (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 max-w-md p-4 rounded-lg border backdrop-blur-sm shadow-lg transition-all duration-300",
        backgrounds[type],
        isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      )}
      role="alert"
    >
      {icons[type]}
      <p className="text-sm text-white flex-1">{message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        className="text-white/50 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  return createPortal(content, document.body);
}

// Toast manager for handling multiple toasts
interface ToastItem extends ToastProps {
  id: string;
}

interface ToastManagerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

export function ToastManager({ toasts, removeToast }: ToastManagerProps) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}

// Toast hook for easy usage
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string, type?: ToastType, duration?: number) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type, duration, onClose: () => {} }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
    success: (message: string, duration?: number) => addToast(message, "success", duration),
    error: (message: string, duration?: number) => addToast(message, "error", duration),
    warning: (message: string, duration?: number) => addToast(message, "warning", duration),
    info: (message: string, duration?: number) => addToast(message, "info", duration),
  };
}

// Example usage:
// const { toasts, addToast, removeToast, success, error } = useToast();
// return (
//   <>
//     <button onClick={() => success("Operation successful!")}>Show Success</button>
//     <ToastManager toasts={toasts} removeToast={removeToast} />
//   </>
// );
