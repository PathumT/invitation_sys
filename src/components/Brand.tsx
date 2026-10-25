export function Brand({
  compact = false,
  logo,
  name,
}: {
  compact?: boolean;
  logo?: string;
  name?: string;
}) {
  return (
    <span
      className={`evently-brand${compact ? " evently-brand--compact" : ""}`}
    >
      {name && name !== "Evently Invitations" && !logo ? (
        <span className="tenant-wordmark">{name}</span>
      ) : (
        <img
          className="evently-logo"
          src={logo || "/brand/evently-logo-v1.png"}
          alt={name || "Evently Invitations"}
          width={1592}
          height={988}
          decoding="async"
        />
      )}
    </span>
  );
}
