import { useState, useEffect, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import { Form } from "@remix-run/react";

interface Invitation {
  id: string;
  propertyAddress: string;
  startDate: string;
  endDate: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsProps {
  invitations: Invitation[];
  notifications: Notification[];
}

// Helper function to get notification color based on type
function getNotificationColors(type: string): { bg: string; text: string } {
  switch (type) {
    case 'repair_request_accepted':
      return {
        bg: 'var(--color-success-bg)',
        text: 'var(--color-success-text)'
      };
    case 'repair_request_refused':
    case 'repair_request_rejected':
      return {
        bg: 'var(--color-error-bg)',
        text: 'var(--color-error-text)'
      };
    case 'repair_request_in_progress':
    case 'repair_request_completed':
      return {
        bg: 'var(--color-warning-bg)',
        text: 'var(--color-warning-text)'
      };
    case 'repair_request_created':
      return {
        bg: 'var(--color-secondary-bg, rgba(246, 0, 221, 0.1))',
        text: 'var(--color-secondary-500)'
      };
    case 'work_details_updated':
      return {
        bg: 'var(--color-info-bg)',
        text: 'var(--color-info-text)'
      };
    default:
      return {
        bg: 'var(--color-tertiary-bg, rgba(0, 147, 205, 0.1))',
        text: 'var(--color-tertiary-500)'
      };
  }
}

export function Notifications({ invitations, notifications }: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const unreadCount = invitations.length + notifications.filter(n => !n.read).length;

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notifications as read when dropdown is opened
  useEffect(() => {
    if (isOpen && notifications.some(n => !n.read)) {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `ids=${unreadIds.join(',')}`
      }).catch(error => {
        console.error('Error marking notifications as read:', error);
      });
    }
  }, [isOpen, notifications]);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 200);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
  };

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        ref={buttonRef}
        onClick={() => isOpen ? handleClose() : handleOpen()}
        className="p-2 rounded-lg transition-all duration-200 hover:bg-purple-500/20 relative"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={`absolute right-0 mt-4 w-80 rounded-xl overflow-hidden z-50 bg-gray-900 border-2 border-purple-500/30 transition-all duration-200 origin-top
            ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
          `}
          style={{
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.15)',
            transform: `translateY(${isAnimating ? '-8px' : '0'})`
          }}
        >
          <div className="px-4 py-3 border-b border-purple-500/30 flex justify-between items-center bg-gray-900/80">
            <h3 className="font-medium text-white">Notifications</h3>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-purple-500/20 transition-colors text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div 
            className={`max-h-[28rem] overflow-y-auto bg-gray-900/95 transition-all duration-300
              ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
            `}
          >
            {invitations.length === 0 && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No new notifications
              </div>
            ) : (
              <ul className="divide-y divide-purple-500/20">
                {/* Invitations */}
                {invitations.map((invitation, index) => (
                  <li 
                    key={invitation.id} 
                    className="p-4 hover:bg-purple-500/10 transition-all duration-200"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: isAnimating ? 'none' : 'slideIn 0.3s ease-out forwards'
                    }}
                  >
                    <div className="mb-2">
                      <p className="font-medium text-white">
                        Property Invitation
                      </p>
                      <p className="text-sm text-emerald-400 mt-1">
                        {invitation.propertyAddress}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(invitation.startDate).toLocaleDateString()} - {new Date(invitation.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Form method="post" action={`/api/invitations/${invitation.id}/accept`}>
                        <button
                          type="submit"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-500 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20"
                        >
                          <Check className="h-4 w-4" />
                          Accept
                        </button>
                      </Form>
                      <Form method="post" action={`/api/invitations/${invitation.id}/decline`}>
                        <button
                          type="submit"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all duration-200"
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </button>
                      </Form>
                    </div>
                  </li>
                ))}

                {/* General Notifications */}
                {notifications.map((notification, index) => {
                  const colors = getNotificationColors(notification.type);
                  return (
                    <li 
                      key={notification.id} 
                      className="p-4 hover:bg-purple-500/10 transition-all duration-200"
                      style={{
                        animationDelay: `${(invitations.length + index) * 50}ms`,
                        animation: isAnimating ? 'none' : 'slideIn 0.3s ease-out forwards'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {notification.title}
                        </p>
                        <span 
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text
                          }}
                        >
                          {notification.type.split('_').slice(1).join(' ')}
                        </span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: colors.text }}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
