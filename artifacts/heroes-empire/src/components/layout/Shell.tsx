import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMe,
  useLogout,
  getGetAuthSessionQueryKey,
} from "@workspace/api-client-react";
import {
  Home,
  User,
  Trophy,
  ShoppingCart,
  Briefcase,
  Calendar,
  Zap,
  Shield,
  Sword,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NavItem = ({ href, icon: Icon, children }: { href: string; icon: any; children: ReactNode }) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-md transition-all cyber-button border-l-2",
      isActive 
        ? "bg-primary/20 text-primary border-primary neon-text-primary" 
        : "text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground"
    )}>
      <Icon className="w-5 h-5" />
      <span className="font-mono text-sm tracking-wider">{children}</span>
    </Link>
  );
};

export function Shell({ children }: { children: ReactNode }) {
  const { data: me } = useGetMe();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const logout = useLogout({
    mutation: {
      onSuccess: async () => {
        await qc.resetQueries();
        await qc.invalidateQueries({ queryKey: getGetAuthSessionQueryKey() });
        navigate("/login", { replace: true });
      },
    },
  });

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <div className="scanline"></div>
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl relative z-20 flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold font-mono text-primary neon-text-primary tracking-widest flex items-center gap-2">
            <Zap className="w-6 h-6" />
            HEROES
          </h1>
        </div>

        {me && (
          <div className="p-4 border-b border-border bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden glitch-border">
                <img src={me.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={me.username} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-display font-bold text-lg">{me.username}</div>
                <div className="flex items-center gap-2 text-xs font-mono text-primary">
                  <Shield className="w-3 h-3" /> {me.rankTier} <span className="text-muted-foreground">LVL {me.level}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex justify-between text-xs font-mono mb-1 text-muted-foreground">
                <span>XP</span>
                <span>{me.currentLevelXp} / {me.nextLevelXp}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${me.levelProgressPct}%` }}></div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">COINS</span>
              <span className="text-secondary neon-text-secondary">{me.coins} 🪙</span>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <NavItem href="/" icon={Home}>DASHBOARD</NavItem>
          <NavItem href="/profile" icon={User}>PROFILE</NavItem>
          <NavItem href="/leaderboards" icon={Trophy}>LEADERBOARDS</NavItem>
          <NavItem href="/shop" icon={ShoppingCart}>SHOP</NavItem>
          <NavItem href="/inventory" icon={Briefcase}>INVENTORY</NavItem>
          <NavItem href="/season" icon={Calendar}>SEASON</NavItem>
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 font-mono text-sm tracking-wider transition-colors disabled:opacity-50"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            <span>{logout.isPending ? "DISCONNECTING…" : "LOGOUT"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
