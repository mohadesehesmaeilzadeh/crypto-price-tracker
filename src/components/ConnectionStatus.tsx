import type {
  ConnectionStatusProps,
} from "../types/crypto";

const STATUS_LABELS = {
  connecting: "Connecting to live prices",
  connected: "Live prices connected",
  disconnected: "Live prices disconnected",
  reconnecting: "Reconnecting to live prices",
} as const;

function ConnectionStatus({
  status,
}: ConnectionStatusProps) {
  return (
    <p
      className={`connection-status connection-status--${status}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className="connection-status-dot"
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </p>
  );
}

export default ConnectionStatus;
