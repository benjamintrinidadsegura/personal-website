const colors = ["#a6dfba", "#a9e3ef", "#cfc1f0", "#f0d48a", "#f2bdba"];
export function EchoAvatar({ name }: { name: string }) {
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase() ?? "?";
  const hash = Array.from(name).reduce((sum, char) => (sum * 31 + (char.codePointAt(0) ?? 0)) >>> 0, 0);
  return <span aria-hidden="true" className="community-avatar" style={{ backgroundColor: colors[hash % colors.length] }}>{initial}</span>;
}
