"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const links = [
 ["/","⌂","01. Home"],["/documents","▤","02. Document"],["/process-map","◇","03. Process Map"],
 ["/relationships","⇄","04. Relationship"],["/role-knowledge","◎","05. Vai trò của tôi"],
 ["/findings","!","06. Finding & Action"],["/catalog","▦","07. Catalog"],
 ["/governance","◌","08. Governance"],["/notifications","♧","09. Action Log"]
] as const;

// Prefetch only routes with an explicit hover or keyboard-focus intent.
export default function WorkspaceNavigation({active}:{active:string}){
 const router=useRouter();
 return <nav className="nav-list" aria-label="Điều hướng chính"><p className="nav-label">Workspace</p>
  {links.map(([href,icon,label])=><Link key={href} href={href}
    prefetch={false} onPointerEnter={()=>router.prefetch(href)} onFocus={()=>router.prefetch(href)}
    aria-current={href===active?"page":undefined}
    className={`nav-item${active===href?" is-active":""}`}>
    <span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span>
  </Link>)}
 </nav>;
}
