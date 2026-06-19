"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Palette,
  Settings,
  Users,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/conversations", icon: MessageSquare, label: "Conversaciones" },
  { href: "/admin/leads", icon: Users, label: "Leads" },
  { href: "/admin/documents", icon: FileText, label: "Documentos" },
  { href: "/admin/customize", icon: Palette, label: "Personalización" },
  { href: "/admin/settings", icon: Settings, label: "Configuración" },
];

const superAdminItems = [
  { href: "/admin/users", icon: UserCog, label: "Usuarios" },
];

export default function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const allItems = role === "superadmin" ? [...navItems, ...superAdminItems] : navItems;

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-lg font-bold text-gray-900">Cirochat</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {allItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
