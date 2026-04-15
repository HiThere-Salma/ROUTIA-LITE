type CommandeStatusBadgeProps = {
  status: string;
};

function getStatusClassName(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("livr")) return "cmd-status--livree";
  if (normalized.includes("cours") || normalized.includes("transport")) return "cmd-status--encours";
  if (normalized.includes("attente")) return "cmd-status--attente";

  return "cmd-status--default";
}

export default function CommandeStatusBadge({ status }: CommandeStatusBadgeProps) {
  return <span className={`cmd-status ${getStatusClassName(status)}`}>{status || "-"}</span>;
}
