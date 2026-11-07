import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useAuthStore } from "../../app/store/auth-store";
import { Button } from "../ui/button";

type NavbarProps = {
  onOpenMobileSidebar: () => void;
  onToggleDesktopSidebar: () => void;
  isSidebarCollapsed: boolean;
};

export function Navbar({
  onOpenMobileSidebar,
  onToggleDesktopSidebar,
  isSidebarCollapsed,
}: NavbarProps) {
  const { user, signOut } = useAuthStore();

  const userName = user?.user_metadata?.full_name || user?.email || "Account";
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-surface/85 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex rounded-lg border border-slate-700 p-2 text-slate-300 lg:hidden"
            onClick={onOpenMobileSidebar}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="hidden rounded-lg border border-slate-700 p-2 text-slate-300 lg:inline-flex"
            onClick={onToggleDesktopSidebar}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
          <label className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-400 transition-all duration-200 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 md:flex">
            <Search className="h-4 w-4" />

            <input
              type="search"
              placeholder="Search leads, companies, or campaigns..."
              className="w-72 bg-transparent text-slate-200 outline-none placeholder:text-slate-500"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-100">{userName}</p>
            <p className="text-xs text-slate-500">Owner</p>
          </div>
          <Button variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
