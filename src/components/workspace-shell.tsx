import Link from "next/link";
import { signOut } from "@/app/actions";

const navigation = [
  ["/documents", "▤", "Documents"], ["/", "⌂", "Home"], ["/process-map", "◇", "Process Map"], ["/catalog", "▦", "Catalog"],
  ["/relationships", "⇄", "Relationships"],
  ["/findings", "!", "Findings"], ["/governance", "◌", "Governance"], ["/notifications", "♧", "Notifications"],
];
type Props = {
  active: string;
  title: string;
  eyebrow: string;
  description: string;
  userName?: string | null;
  role?: string | null;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
};

export default function WorkspaceShell({ active, title, eyebrow, description, userName, role, headerContent, children }: Props) {
  const initials = (userName || "Guest").split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase();
  return <main className="app-shell"><aside className="sidebar"><div className="brand-block"><div className="brand-mark">PM</div><div><p className="eyebrow">PROCESS GOVERNANCE</p><p className="brand-name">Process Map</p></div></div><nav className="nav-list" aria-label="Điều hướng chính"><p className="nav-label">Workspace</p>{navigation.map(([href, icon, label]) => <Link className={`nav-item${active === href ? " is-active" : ""}`} href={href} key={href}><span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span></Link>)}</nav><div className="sidebar-footer"><div className="connection-pill"><span className="status-dot" /> Supabase connected</div><div className="profile-row"><div className="avatar">{initials}</div><div><strong>{userName || "Chưa đăng nhập"}</strong><span>{role || "Guest"}</span></div>{userName ? <form action={signOut}><button className="signout-button" type="submit">Thoát</button></form> : <Link className="signout-button" href="/login">Đăng nhập</Link>}</div></div></aside><section className="main-content"><header className={`workspace-header${headerContent ? " workspace-header-custom" : ""}`}>{headerContent || <div><p className="eyebrow accent">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>}</header><div className="workspace-content">{children}</div></section></main>;
}
