import { Shell } from "@/components/layout/Shell";
import { useGetCurrentSeason } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Calendar, Lock, Coins, Shield, Star, Zap, Award, Sparkles } from "lucide-react";
import bgSeasonBanner from "@/assets/bg-season-banner.png";
import { cn } from "@/lib/utils";

export default function Season() {
  const { data: season, isLoading } = useGetCurrentSeason();

  if (isLoading) {
    return <Shell><div className="p-8 text-center text-primary font-mono animate-pulse">DECRYPTING SEASON DATA...</div></Shell>;
  }

  if (!season) {
    return <Shell><div className="p-8 text-center font-mono">NO ACTIVE SEASON</div></Shell>;
  }

  const getRewardIcon = (kind: string) => {
    switch(kind) {
      case 'coins': return Coins;
      case 'frame': return Shield;
      case 'badge': return Star;
      case 'boost': return Zap;
      case 'xp': return Award;
      default: return Sparkles;
    }
  };

  return (
    <Shell>
      <div className="p-8 max-w-7xl mx-auto space-y-12">
        
        {/* Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative cyber-card overflow-hidden border-primary/50"
        >
          <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${bgSeasonBanner})` }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
          
          <div className="relative p-8 md:p-12 flex flex-col justify-end min-h-[300px]">
            <div className="flex items-center gap-2 text-primary font-mono font-bold mb-2">
              <Calendar className="w-5 h-5" /> SEASON ACTIVE
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              {season.name}
            </h1>
            <p className="text-xl md:text-2xl font-mono text-muted-foreground mt-2 max-w-2xl">
              {season.tagline}
            </p>
            
            <div className="mt-8 max-w-xl">
              <div className="flex justify-between text-sm font-mono mb-2">
                <span className="text-white font-bold">TIER {season.seasonTier}</span>
                <span className="text-primary">{season.daysRemaining} DAYS REMAINING</span>
              </div>
              <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden border border-white/20">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${season.progressPct}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-primary relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/50"></div>
                </motion.div>
              </div>
              <div className="text-right text-[10px] font-mono mt-1 text-muted-foreground">
                {season.seasonXp.toLocaleString()} / {season.nextTierXp.toLocaleString()} XP TO NEXT TIER
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reward Track */}
        <div>
          <h2 className="text-3xl font-display font-bold uppercase mb-8 flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" /> REWARD PROTOCOL
          </h2>
          
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-1000"
              style={{ width: `${Math.min(100, ((season.seasonTier) / season.rewards.length) * 100)}%` }}
            ></div>

            <div className="flex overflow-x-auto pb-8 pt-4 snap-x snap-mandatory hide-scrollbar relative z-10">
              <div className="flex gap-4 md:gap-8 px-4">
                {season.rewards.map((reward, i) => {
                  const isUnlocked = reward.unlocked;
                  const isCurrent = season.seasonTier === i; // 0-indexed tier visually? Reward tiers are usually 1-indexed. Let's say reward.tier == seasonTier+1 is current goal.
                  const isNext = reward.tier === season.seasonTier + 1;
                  const Icon = getRewardIcon(reward.kind);
                  
                  return (
                    <motion.div 
                      key={reward.tier}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "snap-center shrink-0 w-48 cyber-card flex flex-col items-center p-4 border-2 transition-all",
                        isUnlocked 
                          ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]" 
                          : isNext 
                            ? "bg-black/60 border-white/30 scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                            : "bg-black/40 border-white/5 opacity-60 grayscale"
                      )}
                    >
                      <div className="text-xs font-mono font-bold text-muted-foreground mb-4">
                        TIER {reward.tier}
                      </div>
                      
                      <div className={cn(
                        "w-20 h-20 rounded-full border-2 flex items-center justify-center mb-4 relative",
                        isUnlocked ? "border-primary bg-primary/20 text-primary" : "border-white/20 bg-black text-white/50"
                      )}>
                        <Icon className="w-10 h-10" />
                        {!isUnlocked && !isNext && (
                          <div className="absolute -bottom-2 -right-2 bg-black rounded-full p-1 border border-white/20">
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                        {isUnlocked && (
                          <div className="absolute -bottom-2 -right-2 bg-black rounded-full p-1 border border-primary">
                            <Sparkles className="w-3 h-3 text-primary" />
                          </div>
                        )}
                      </div>
                      
                      <div className="font-display font-bold text-center text-lg leading-tight uppercase text-white h-12 flex items-center justify-center">
                        {reward.name}
                      </div>
                      
                      <div className={cn(
                        "text-xs font-mono font-bold mt-2",
                        isUnlocked ? "text-primary" : "text-muted-foreground"
                      )}>
                        {reward.amount > 1 && `${reward.amount}x `}{reward.kind.toUpperCase()}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </Shell>
  );
}
