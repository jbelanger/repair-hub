import { useState, useEffect } from "react";
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

export function Notifications({ invitations, notifications }: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = invitations.length + notifications.filter(n => !n.read).length;

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

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-colors duration-200 hover:bg-[var(--color-bg-tertiary)] relative"
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
          className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)'
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
            <h3 className="font-medium">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {invitations.length === 0 && notifications.length === 0 ? (
              <div className="p-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                No new notifications
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                {/* Invitations */}
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="p-4">
                    <div className="mb-2">
                      <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        Property Invitation
                      </p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {invitation.propertyAddress}
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(invitation.startDate).toLocaleDateString()} - {new Date(invitation.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Form method="post" action={`/api/invitations/${invitation.id}/accept`}>
                        <button
                          type="submit"
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                        >
                          <Check className="h-4 w-4" />
                          Accept
                        </button>
                      </Form>
                      <Form method="post" action={`/api/invitations/${invitation.id}/decline`}>
                        <button
                          type="submit"
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-sm hover:bg-[var(--color-bg-tertiary)] transition-colors"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </button>
                      </Form>
                    </div>
                  </div>
                ))}

                {/* General Notifications */}
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {notification.title}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {notification.message}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
