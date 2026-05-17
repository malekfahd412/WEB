import { Shell } from "@/components/layout/Shell";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal } from "lucide-react";
import { Link } from "wouter";
import { getRankColor } from "@/lib/rank";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "xp", label: "TOTAL XP" },
  { id: "gta_missions", label: "GTA MISSIONS" },
  { id: "gta_heists", label: "GTA HEISTS" },
  { id: "rl_matches", label: "RL MATCHES" },
  { id: "rl_wins", label: "RL WINS" },
] as const;

type LeaderboardType = "xp" | "gta_missions" | "gta_heists" | "rl_matches" | "rl_wins";

export default function Leaderboards() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("xp");
  
  const { data: leaderboard, isLoading } = useGetLeaderboard(activeTab, { limit: 25 });

  return (
    <Shell>
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
          <h1 className="text-4xl font-display font-bold uppercase tracking-widest flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            HALL OF FAME
          </h1>
          
          <div className="flex flex-wrap gap-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LeaderboardType)}
                className={cn(
                  "px-4 py-2 text-xs font-mono font-bold transition-all cyber-button border",
                  activeTab === tab.id 
                    ? "bg-primary/20 text-primary border-primary neon-text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                    : "bg-black/40 text-muted-foreground border-white/10 hover:border-white/30 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-primary font-mono animate-pulse">LOADING RANKINGS...</div>
        ) : leaderboard ? (
          <div className="space-y-8">
            
            {/* Podium (Top 3) */}
            <div className="flex items-end justify-center gap-4 md:gap-8 pt-8 pb-12">
              {[2, 1, 3].map(rankPos => {
                const entry = leaderboard.entries.find(e => e.rank === rankPos);
                if (!entry) return null;
                
                const isFirst = rankPos === 1;
                const height = isFirst ? "h-48" : rankPos === 2 ? "h-36" : "h-28";
                const rankColorClass = getRankColor(entry.rankTier);
                
                return (
                  <motion.div 
                    key={entry.playerId}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: rankPos * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <Link href={`/players/${entry.playerId}`} className="flex flex-col items-center group mb-4">
                      <div className={cn(
                        "rounded-full overflow-hidden border-4 mb-3 transition-transform group-hover:scale-110",
                        isFirst ? "w-24 h-24 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.5)]" : 
                        rankPos === 2 ? "w-20 h-20 border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.3)]" : 
                        "w-16 h-16 border-orange-700 shadow-[0_0_20px_rgba(194,65,12,0.3)]"
                      )}>
                        <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                      </div>
                      <div className="font-display font-bold text-lg group-hover:text-primary transition-colors">{entry.username}</div>
                      <div className="text-xs font-mono text-muted-foreground">{entry.value.toLocaleString()} {leaderboard.valueLabel}</div>
                    </Link>
                    
                    <div className={cn(
                      "w-24 md:w-32 cyber-card border-t-0 border-b-0 flex flex-col items-center justify-start pt-4",
                      height,
                      isFirst ? "bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 border-yellow-500/50" : 
                      rankPos === 2 ? "bg-gradient-to-t from-slate-400/20 to-slate-400/5 border-slate-400/50" : 
                      "bg-gradient-to-t from-orange-700/20 to-orange-700/5 border-orange-700/50"
                    )}>
                      {isFirst ? <Crown className="w-8 h-8 text-yellow-500" /> : <Medal className={cn("w-6 h-6", rankPos === 2 ? "text-slate-300" : "text-orange-700")} />}
                      <span className="font-display font-bold text-3xl mt-2 text-white/80">{rankPos}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* List (4+) */}
            <div className="space-y-2">
              {leaderboard.entries.filter(e => e.rank > 3).map((entry, i) => (
                <motion.div
                  key={entry.playerId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.05) }}
                >
                  <Link href={`/players/${entry.playerId}`}>
                    <div className={cn(
                      "flex items-center gap-4 p-3 pr-6 cyber-card transition-colors hover:bg-white/5 cursor-pointer",
                      entry.isMe ? "border-primary bg-primary/10" : "border-white/5 bg-black/20"
                    )}>
                      <div className="w-12 text-center font-mono font-bold text-xl text-muted-foreground">{entry.rank}</div>
                      
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                        <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-display font-bold text-lg truncate", entry.isMe && "text-primary neon-text-primary")}>
                          {entry.username}
                        </div>
                      </div>
                      
                      <div className="hidden md:flex">
                        <span className={`px-2 py-0.5 text-[10px] font-mono border uppercase ${getRankColor(entry.rankTier)}`}>
                          {entry.rankTier}
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-mono font-bold text-white">{entry.value.toLocaleString()}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{leaderboard.valueLabel}</div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
              {leaderboard.entries.length <= 3 && (
                <div className="text-center p-8 text-muted-foreground font-mono">NO MORE PLAYERS RANKED</div>
              )}
            </div>
            
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
