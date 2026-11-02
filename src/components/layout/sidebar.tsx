import {
  BarChart3,
  LayoutDashboard,
  Settings,
  UserRoundSearch,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: UserRoundSearch },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  onNavigate?: () => void;
  isCollapsed?: boolean;
};

export function Sidebar({ onNavigate, isCollapsed = false }: SidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-800 bg-surface-muted p-4">
      <div className="mb-8 px-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Porthen
        </p>
        {!isCollapsed ? (
          <p className="mt-1 text-lg font-semibold text-slate-100">
            Growth Console
          </p>
        ) : null}
      </div>

      <nav className="space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-800/80 hover:text-white",
                isCollapsed ? "justify-center" : "gap-3",
                isActive && "bg-slate-800 text-white",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {!isCollapsed ? label : null}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
