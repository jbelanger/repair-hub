import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "~/utils/cn";

type ToastType = "success" | "error" | "warning" | "info";
type ToastPosition = "top" | "bottom";
type ToastSize = "small" | "normal" | "xl";

interface ToastProps {
  title?: string;
  message: string;
  type?: ToastType;
  size?: ToastSize;
  duration?: number;
  position?: ToastPosition;
  onClose: () => void;
}

const iconSizes: Record<ToastSize, string> = {
  small: "h-5 w-5",
  normal: "h-7 w-7",
  xl: "h-10 w-10"
};

const closeButtonSizes: Record<ToastSize, string> = {
  small: "h-4 w-4",
  normal: "h-6 w-6",
  xl: "h-8 w-8"
};

const containerSizes: Record<ToastSize, string> = {
  small: "min-w-[300px] max-w-md rounded-lg border-2 gap-1",
  normal: "min-w-[360px] max-w-lg rounded-lg border-2 gap-1",
  xl: "min-w-[480px] max-w-2xl rounded-xl border-3 gap-2"
};

const contentPadding: Record<ToastSize, string> = {
  small: "p-3 gap-2",
  normal: "p-4 gap-2",
  xl: "p-6 gap-3"
};

const titleSizes: Record<ToastSize, string> = {
  small: "text-sm gap-2",
  normal: "text-base gap-3",
  xl: "text-2xl gap-4"
};

const messageSizes: Record<ToastSize, string> = {
  small: "text-xs",
  normal: "text-sm",
  xl: "text-lg"
};

const progressSizes: Record<ToastSize, string> = {
  small: "h-0.5",
  normal: "h-1",
  xl: "h-1.5"
};

const stackSpacing: Record<ToastSize, number> = {
  small: 4.5,
  normal: 6,
  xl: 8
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle />,
  error: <AlertCircle />,
  warning: <AlertTriangle />,
  info: <Info />
};

const backgrounds: Record<ToastType, string> = {
  success: "bg-green-500/10 border-green-500/30",
  error: "bg-red-500/10 border-red-500/30",
  warning: "bg-yellow-500/10 border-yellow-500/30",
  info: "bg-blue-500/10 border-blue-500/30"
};

const progressColors: Record<ToastType, string> = {
  success: "bg-green-500/50",
  error: "bg-red-500/50",
  warning: "bg-yellow-500/50",
  info: "bg-blue-500/50"
};

// Default titles for different types
const defaultTitles: Record<ToastType, string> = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info"
};

// Default durations for different types of toasts
const defaultDurations: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 4000
};

export function Toast({ 
  title, 
  message, 
  type = "info", 
  size = "normal",
  duration, 
  position = "bottom", 
  onClose 
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const actualDuration = duration || defaultDurations[type];
  const actualTitle = title || defaultTitles[type];
  
  useEffect(() => {
    const enterTimeout = setTimeout(() => {
      setIsEntering(false);
    }, 300);

    const dismissTimeout = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, actualDuration);

    return () => {
      clearTimeout(enterTimeout);
      clearTimeout(dismissTimeout);
    };
  }, [actualDuration, onClose]);

  const positionClasses = {
    top: "top-6",
    bottom: "bottom-6"
  };

  const exitAnimation = {
    top: "-translate-y-2",
    bottom: "translate-y-2"
  };

  const content = (
    <div
      className={cn(
        "fixed right-6 z-50 flex flex-col shadow-lg transition-all duration-300 overflow-hidden",
        containerSizes[size],
        positionClasses[position],
        backgrounds[type],
        isEntering ? "scale-105 opacity-0" : "scale-100 opacity-100",
        isExiting ? `opacity-0 ${exitAnimation[position]}` : "opacity-100 translate-y-0"
      )}
      role="alert"
    >
      <div className={cn("flex flex-col", contentPadding[size])}>
        {/* Header with icon and close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("text-white/90", iconSizes[size])}>
              {icons[type]}
            </div>
            <h3 className={cn("font-bold text-white/90 tracking-tight", titleSizes[size])}>{actualTitle}</h3>
          </div>
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(onClose, 300);
            }}
            className="text-white/50 hover:text-white/90 transition-colors"
          >
            <X className={closeButtonSizes[size]} />
          </button>
        </div>
        
        {/* Message */}
        <div className="flex">
          <div className={cn("flex-1 text-white/80 leading-relaxed", messageSizes[size])}>{message}</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className={cn("bg-white/5 w-full", progressSizes[size])}>
        <div
          className={cn("h-full origin-left", progressColors[type])}
          style={{
            animation: `shrink ${actualDuration}ms linear forwards`
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}

interface ToastItem extends ToastProps {
  id: string;
}

interface ToastManagerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
  position?: ToastPosition;
}

export function ToastManager({ toasts, removeToast, position = "bottom" }: ToastManagerProps) {
  return (
    <>
      {toasts.map((toast, index) => {
        const spacing = stackSpacing[toast.size || "normal"];
        return (
          <div
            key={toast.id}
            style={{
              position: 'fixed',
              right: '1.5rem',
              zIndex: 50,
              [position]: `${index * spacing + 1.5}rem`
            }}
          >
            <Toast
              title={toast.title}
              message={toast.message}
              type={toast.type}
              size={toast.size}
              duration={toast.duration}
              position={position}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        );
      })}
    </>
  );
}

export function useToast(defaultPosition: ToastPosition = "bottom") {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    message: string, 
    type?: ToastType, 
    title?: string, 
    size?: ToastSize,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { 
      id, 
      message, 
      type, 
      title,
      size,
      duration, 
      position: defaultPosition, 
      onClose: () => {} 
    }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
    success: (message: string, title?: string, size?: ToastSize, duration?: number) => 
      addToast(message, "success", title, size, duration),
    error: (message: string, title?: string, size?: ToastSize, duration?: number) => 
      addToast(message, "error", title, size, duration),
    warning: (message: string, title?: string, size?: ToastSize, duration?: number) => 
      addToast(message, "warning", title, size, duration),
    info: (message: string, title?: string, size?: ToastSize, duration?: number) => 
      addToast(message, "info", title, size, duration),
  };
}
