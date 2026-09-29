import type {
  AlertNotification,
} from "../types/crypto";

interface AlertToastsProps {
  notifications: readonly AlertNotification[];
  onDismiss: (id: string) => void;
}

function AlertToasts({
  notifications,
  onDismiss,
}: AlertToastsProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="alert-toasts"
      aria-label="Price alert notifications"
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="alert-toast"
          role="status"
        >
          <div>
            <strong>{notification.symbol} price alert</strong>
            <p>
              Price moved {notification.condition} $${notification.targetPrice.toLocaleString()} and is now $${notification.currentPrice.toLocaleString()}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(notification.id)}
            aria-label={`Dismiss ${notification.symbol} price alert`}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}

export default AlertToasts;
