export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`evently-brand${compact ? " evently-brand--compact" : ""}`}
    >
      <img
        className="evently-logo"
        src="/brand/evently-logo-v1.png"
        alt="Evently Invitations"
        width={1592}
        height={988}
        decoding="async"
      />
    </span>
  );
}
