import { Shell } from "@/components/layout/Shell";
import { useGetDashboard, useLogActivity, getGetMeQueryKey, getGetDashboardQueryKey, getListMyActivitiesQueryKey, getListActivityFeedQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Crosshair, Car, Target, Trophy, Activity, ArrowUpCircle } from "lucide-react";
import bgHero from "@assets/bg-hero.png";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();
  const logActivity = useLogActivity();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogActivity = (type: any) => {
    logActivity.mutate({ data: { type } }, {
      onSuccess: (res) => {
        toast({
          title: "ACTIVITY LOGGED",
          description: `+${res.xpGained} XP | +${res.coinsGained} Coins`,
        });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListMyActivitiesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "ERROR",
          description: "Failed to log activity.",
        });
      }
    });
  };

  if (isLoading) {
    return <Shell><div className="p-8 text-center text-primary font-mono animate-pulse">LOADING DASHBOARD...</div></Shell>;
  }

  if (!dashboard) return <Shell><div className="p-8">Error loading dashboard</div></Shell>;

  const { player, recentActivities, topPlayers, totals, season } = dashboard;

  return (
    <Shell>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* HERO BANNER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative cyber-card overflow-hidden border-primary/50 group"
        >
          <div className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity" style={{ backgroundImage: `url('/bg-hero.png')` }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
          
          <div className="relative p-8 flex items-center gap-8">
            <div className="w-32 h-32 rounded-full border-4 border-primary glitch-border p-1">
              <img src={player.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg"} className="w-full h-full rounded-full object-cover" alt="Avatar" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-display font-bold uppercase">{player.username}</h1>
                <span className="px-3 py-1 bg-primary/20 text-primary border border-primary font-mono text-sm uppercase">
                  {player.rankTier}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mt-6">
                <div>
                  <div className="text-muted-foreground font-mono text-xs mb-1">GLOBAL RANK</div>
                  <div className="text-2xl font-mono text-white">#{player.serverRank}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-mono text-xs mb-1">TOTAL XP</div>
                  <div className="text-2xl font-mono text-primary">{player.totalXp.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-mono text-xs mb-1">STREAK</div>
                  <div className="text-2xl font-mono text-secondary">{player.streakDays} DAYS</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* QUICK ACTIONS */}
        <div>
          <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2 text-white/80">
            <Activity className="w-5 h-5 text-primary" /> QUICK LOG
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => handleLogActivity("gta_mission")}
              className="cyber-card p-6 flex flex-col items-center justify-center gap-3 hover:bg-primary/10 hover:border-primary transition-colors group cursor-pointer"
            >
              <Crosshair className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-mono font-bold text-sm">GTA MISSION</span>
            </button>
            <button 
              onClick={() => handleLogActivity("gta_heist")}
              className="cyber-card p-6 flex flex-col items-center justify-center gap-3 hover:bg-secondary/10 hover:border-secondary transition-colors group cursor-pointer"
            >
              <Car className="w-8 h-8 text-secondary group-hover:scale-110 transition-transform" />
              <span className="font-mono font-bold text-sm">GTA HEIST</span>
            </button>
            <button 
              onClick={() => handleLogActivity("rl_match")}
              className="cyber-card p-6 flex flex-col items-center justify-center gap-3 hover:bg-accent/10 hover:border-accent transition-colors group cursor-pointer"
            >
              <Target className="w-8 h-8 text-accent group-hover:scale-110 transition-transform" />
              <span className="font-mono font-bold text-sm">RL MATCH</span>
            </button>
            <button 
              onClick={() => handleLogActivity("rl_win")}
              className="cyber-card p-6 flex flex-col items-center justify-center gap-3 hover:bg-green-500/10 hover:border-green-500 transition-colors group cursor-pointer"
            >
              <Trophy className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
              <span className="font-mono font-bold text-sm">RL WIN</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* RECENT ACTIVITIES */}
          <div className="md:col-span-2 cyber-card p-6">
            <h2 className="text-xl font-display font-bold mb-4 border-b border-border pb-2">PERSONAL LOG</h2>
            <div className="space-y-4">
              {recentActivities.map((act, i) => (
                <motion.div 
                  key={act.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-sm"
                >
                  <div className="flex items-center gap-3">
                    <ArrowUpCircle className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-mono font-bold text-sm uppercase">{act.type.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-primary font-bold">+{act.xpGained} XP</div>
                    <div className="font-mono text-secondary text-xs">+{act.coinsGained} COINS</div>
                  </div>
                </motion.div>
              ))}
              {recentActivities.length === 0 && (
                <div className="text-center p-8 text-muted-foreground font-mono text-sm">
                  NO ACTIVITIES LOGGED YET
                </div>
              )}
            </div>
          </div>

          {/* LEADERBOARD PREVIEW */}
          <div className="cyber-card p-6 border-secondary/30">
            <h2 className="text-xl font-display font-bold mb-4 border-b border-border pb-2 text-secondary">TOP PLAYERS</h2>
            <div className="space-y-3">
              {topPlayers.map((p, i) => (
                <div key={p.playerId} className="flex items-center gap-3 p-2 hover:bg-white/5 transition-colors">
                  <div className="w-6 h-6 text-center font-mono text-sm text-muted-foreground">{i + 1}</div>
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                    <img src={p.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg"} alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm truncate">{p.username}</div>
                    <div className="text-xs text-secondary">{p.value.toLocaleString()} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Shell>
  );
}
