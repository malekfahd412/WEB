import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetAuthSession } from "@workspace/api-client-react";
import { Zap } from "lucide-react";

const DiscordIcon = () => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="w-5 h-5"
    fill="currentColor"
  >
    <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a14.62 14.62 0 0 0-.687 1.41 18.27 18.27 0 0 0-5.487 0A14.6 14.6 0 0 0 9.69 3 19.74 19.74 0 0 0 5.93 4.369C2.27 9.79 1.27 15.07 1.77 20.27a19.9 19.9 0 0 0 6.073 3.09c.49-.66.927-1.36 1.302-2.094a13 13 0 0 1-2.05-.99c.171-.127.34-.26.502-.398a14.06 14.06 0 0 0 12.054 0c.165.139.333.272.504.398a13 13 0 0 1-2.054.991c.376.732.812 1.432 1.302 2.092a19.86 19.86 0 0 0 6.075-3.09c.585-6.034-1-11.27-4.181-15.9zM8.62 16.45c-1.18 0-2.156-1.085-2.156-2.42 0-1.336.96-2.42 2.156-2.42 1.196 0 2.176 1.084 2.156 2.42 0 1.335-.96 2.42-2.156 2.42zm6.76 0c-1.18 0-2.156-1.085-2.156-2.42 0-1.336.96-2.42 2.156-2.42 1.197 0 2.177 1.084 2.157 2.42 0 1.335-.96 2.42-2.157 2.42z" />
  </svg>
);

export default function Login() {
  const { data, isLoading } = useGetAuthSession();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (data?.authenticated) {
      navigate("/");
    }
  }, [data, navigate]);

  const onLogin = () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    window.location.href = `${base}/api/auth/discord`;
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden">
      <div className="scanline pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.18),_transparent_50%)]" />

      <div className="relative z-10 max-w-md w-full border border-border bg-card/70 backdrop-blur-xl rounded-lg p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-8 h-8 text-primary neon-text-primary" />
          <h1 className="text-3xl font-bold font-mono tracking-widest text-primary neon-text-primary">
            HEROES EMPIRE
          </h1>
        </div>

        <p className="font-mono text-sm text-muted-foreground mb-1">
          ACCESS // OPERATIVE TERMINAL
        </p>
        <p className="text-foreground/90 mb-8 leading-relaxed">
          Authenticate with Discord to load your operative profile, link your
          Rockstar ID, and sync GTA Online + Rocket League progression.
        </p>

        <button
          onClick={onLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-mono tracking-wider py-3 rounded-md transition-colors disabled:opacity-50 cyber-button"
          data-testid="button-login-discord"
        >
          <DiscordIcon />
          <span>CONTINUE WITH DISCORD</span>
        </button>

        <p className="text-xs font-mono text-muted-foreground mt-6 text-center">
          We only request your Discord identity (username + avatar).
        </p>
      </div>
    </div>
  );
}
