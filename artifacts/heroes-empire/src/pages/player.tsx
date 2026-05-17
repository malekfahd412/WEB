import { Shell } from "@/components/layout/Shell";
import { useGetPlayer, getGetPlayerQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Shield, Zap, Target, Trophy, Crosshair, Car, ChevronLeft, Flame } from "lucide-react";
import { getRankColor } from "@/lib/rank";

export default function PlayerProfile() {
  const params = useParams();
  const id = Number(params.id);

  const { data: player, isLoading, isError } = useGetPlayer(id, {
    query: {
      enabled: Number.isFinite(id),
      queryKey: getGetPlayerQueryKey(id)
    }
  });

  if (isLoading) {
    return <Shell><div className="p-8 text-center text-primary font-mono animate-pulse">LOADING PLAYER...</div></Shell>;
  }

  if (isError || !player) {
    return <Shell><div className="p-8 text-center text-destructive font-mono">ERROR LOADING PLAYER OR NOT FOUND</div></Shell>;
  }

  const frameColor = "hsl(var(--primary))"; // Can't easily resolve without inventory API, fallback to primary

  return (
    <Shell>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        
        <div>
          <Link href="/leaderboards" className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-white transition-colors mb-4">
            <ChevronLeft className="w-4 h-4" /> BACK TO LEADERBOARDS
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cyber-card p-8 border-primary/50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Shield className="w-48 h-48" />
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 bg-black/50" style={{ borderColor: frameColor, boxShadow: `0 0 20px ${frameColor}40` }}>
              <img src={player.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg"} alt={player.username} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-display font-bold uppercase tracking-wider">{player.username}</h1>
                <span className={`px-3 py-1 text-sm font-mono border uppercase cyber-button ${getRankColor(player.rankTier)}`}>
                  {player.rankTier} LVL {player.level}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-4 text-sm font-mono">
                <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-sm border border-white/5">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-muted-foreground">RANK</span>
                  <span className="text-white font-bold">#{player.serverRank}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-sm border border-white/5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-muted-foreground">STREAK</span>
                  <span className="text-white font-bold">{player.streakDays}</span>
                </div>
              </div>
              
              <div className="mt-6 font-mono text-xs text-muted-foreground flex gap-6">
                <div>JOINED: <span className="text-white">{new Date(player.joinedAt).toLocaleDateString()}</span></div>
                <div>LAST SEEN: <span className="text-white">{new Date(player.lastActiveAt).toLocaleDateString()}</span></div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Attributes */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="cyber-card p-6 border-white/10"
          >
            <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2 text-white/80">
              <Zap className="w-5 h-5 text-primary" /> NEURAL ATTRIBUTES
            </h2>
            <div className="space-y-4">
              {[
                { label: "UNITY", value: player.attributes.unity, color: "bg-blue-500" },
                { label: "FOCUS", value: player.attributes.focus, color: "bg-cyan-500" },
                { label: "STRENGTH", value: player.attributes.strength, color: "bg-red-500" },
                { label: "HONOR", value: player.attributes.honor, color: "bg-yellow-500" },
                { label: "PASSION", value: player.attributes.passion, color: "bg-fuchsia-500" },
                { label: "VICTORY", value: player.attributes.victory, color: "bg-green-500" },
              ].map(attr => (
                <div key={attr.label}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-muted-foreground">{attr.label}</span>
                    <span>{attr.value}</span>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 ${i < attr.value ? attr.color : 'bg-white/5'} ${i < attr.value ? 'shadow-[0_0_5px_currentColor]' : ''}`}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Game Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { label: "GTA MISSIONS", value: player.gameStats.gtaMissions, icon: Crosshair, color: "text-primary" },
              { label: "GTA HEISTS", value: player.gameStats.gtaHeists, icon: Car, color: "text-secondary" },
              { label: "RL MATCHES", value: player.gameStats.rlMatches, icon: Target, color: "text-accent" },
              { label: "RL WINS", value: player.gameStats.rlWins, icon: Trophy, color: "text-green-500" },
            ].map((stat) => (
              <div key={stat.label} className="cyber-card p-6 flex flex-col items-center justify-center text-center">
                <stat.icon className={`w-8 h-8 mb-3 ${stat.color}`} />
                <div className="text-3xl font-mono font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs font-mono text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

      </div>
    </Shell>
  );
}
