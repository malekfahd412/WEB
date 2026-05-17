import { Shell } from "@/components/layout/Shell";
import { 
  useGetMe, 
  useGetInventory, 
  useSetRockstarId, 
  useListMyActivities, 
  useClaimDailyReward,
  getGetMeQueryKey,
  getListMyActivitiesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Flame, Target, Trophy, Clock, Gift, Gamepad2, Crosshair, Car, Save, Check } from "lucide-react";
import { SiRockstargames } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { getRankColor } from "@/lib/rank";

export default function Profile() {
  const { data: me, isLoading } = useGetMe();
  const { data: inventory } = useGetInventory();
  const { data: activities } = useListMyActivities({ limit: 50 });
  const [rockstarIdInput, setRockstarIdInput] = useState("");
  const [isEditingRockstar, setIsEditingRockstar] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const setRockstarId = useSetRockstarId();
  const claimDaily = useClaimDailyReward();

  if (isLoading) {
    return <Shell><div className="p-8 text-center text-primary font-mono animate-pulse">LOADING PROFILE...</div></Shell>;
  }

  if (!me) return <Shell><div className="p-8">Error loading profile</div></Shell>;

  const equippedFrame = inventory?.find(i => i.item.id === me.equipped.frameId);
  const equippedBadge = inventory?.find(i => i.item.id === me.equipped.badgeId);
  const frameColor = equippedFrame?.item.previewColor || "hsl(var(--primary))";

  const handleSaveRockstarId = () => {
    if (!rockstarIdInput.trim()) return;
    setRockstarId.mutate({ data: { rockstarId: rockstarIdInput } }, {
      onSuccess: () => {
        toast({ title: "LINKED", description: "Rockstar ID updated." });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setIsEditingRockstar(false);
      },
      onError: () => {
        toast({ variant: "destructive", title: "ERROR", description: "Failed to link ID." });
      }
    });
  };

  const handleClaimDaily = () => {
    claimDaily.mutate(undefined, {
      onSuccess: (res) => {
        if (res.claimed) {
          toast({
            title: "DAILY CLAIMED",
            description: `+${res.xpGained} XP | +${res.coinsGained} Coins`,
          });
        } else {
          toast({
            title: "ALREADY CLAIMED",
            description: "Come back tomorrow.",
          });
        }
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => {
        toast({ variant: "destructive", title: "ERROR", description: "Failed to claim reward." });
      }
    });
  };

  return (
    <Shell>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile HUD */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="cyber-card p-8 border-primary/50 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Shield className="w-48 h-48" />
              </div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 bg-black/50" style={{ borderColor: frameColor, boxShadow: `0 0 20px ${frameColor}40` }}>
                    <img src={me.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg"} alt={me.username} className="w-full h-full object-cover" />
                  </div>
                  {equippedBadge && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center" title={equippedBadge.item.name}>
                      <Shield className="w-5 h-5 text-primary" style={{ color: equippedBadge.item.previewColor }} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-display font-bold uppercase tracking-wider">{me.username}</h1>
                    <span className={`px-3 py-1 text-sm font-mono border uppercase cyber-button ${getRankColor(me.rankTier)}`}>
                      {me.rankTier} LVL {me.level}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-4 text-sm font-mono">
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-sm border border-white/5">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-muted-foreground">RANK</span>
                      <span className="text-white font-bold">#{me.serverRank}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-sm border border-white/5">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-muted-foreground">STREAK</span>
                      <span className="text-white font-bold">{me.streakDays}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-sm border border-white/5">
                      <span className="text-secondary neon-text-secondary font-bold text-lg">{me.coins} 🪙</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span className="text-primary font-bold">XP PROGRESS</span>
                      <span className="text-muted-foreground">{me.currentLevelXp.toLocaleString()} / {me.nextLevelXp.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${me.levelProgressPct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-primary relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30"></div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: "UNITY", value: me.attributes.unity, color: "bg-blue-500" },
                  { label: "FOCUS", value: me.attributes.focus, color: "bg-cyan-500" },
                  { label: "STRENGTH", value: me.attributes.strength, color: "bg-red-500" },
                  { label: "HONOR", value: me.attributes.honor, color: "bg-yellow-500" },
                  { label: "PASSION", value: me.attributes.passion, color: "bg-fuchsia-500" },
                  { label: "VICTORY", value: me.attributes.victory, color: "bg-green-500" },
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
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: "GTA MISSIONS", value: me.gameStats.gtaMissions, icon: Crosshair, color: "text-primary" },
                { label: "GTA HEISTS", value: me.gameStats.gtaHeists, icon: Car, color: "text-secondary" },
                { label: "RL MATCHES", value: me.gameStats.rlMatches, icon: Target, color: "text-accent" },
                { label: "RL WINS", value: me.gameStats.rlWins, icon: Trophy, color: "text-green-500" },
              ].map((stat, i) => (
                <div key={stat.label} className="cyber-card p-4 flex flex-col items-center justify-center text-center group">
                  <stat.icon className={`w-6 h-6 mb-2 ${stat.color} group-hover:scale-110 transition-transform`} />
                  <div className="text-2xl font-mono font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Daily Reward */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="cyber-card p-6 border-yellow-500/30 bg-yellow-500/5 text-center"
            >
              <Gift className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-display font-bold text-lg mb-2 text-yellow-500">DAILY REWARD</h3>
              <div className="text-xs font-mono text-muted-foreground mb-4">Current Streak: {me.streakDays} Days</div>
              <button 
                onClick={handleClaimDaily}
                className="w-full py-3 cyber-button bg-yellow-500 hover:bg-yellow-400 text-black transition-colors"
              >
                CLAIM NOW
              </button>
            </motion.div>

            {/* Rockstar ID */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="cyber-card p-6 border-white/10"
            >
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <SiRockstargames className="text-orange-500" /> ROCKSTAR ID
              </h3>
              
              {!me.rockstarId || isEditingRockstar ? (
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={rockstarIdInput} 
                    onChange={e => setRockstarIdInput(e.target.value)}
                    placeholder="Enter Rockstar ID"
                    className="w-full bg-black/40 border border-white/20 p-2 font-mono text-sm focus:border-primary outline-none transition-colors"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveRockstarId}
                      className="flex-1 py-2 cyber-button bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-black transition-colors text-xs flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> SAVE
                    </button>
                    {isEditingRockstar && (
                      <button 
                        onClick={() => setIsEditingRockstar(false)}
                        className="py-2 px-4 cyber-button bg-white/5 border border-white/20 hover:bg-white/10 transition-colors text-xs"
                      >
                        CANCEL
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-black/40 border border-white/10 p-3">
                  <span className="font-mono text-sm text-white">{me.rockstarId}</span>
                  <button 
                    onClick={() => {
                      setRockstarIdInput(me.rockstarId || "");
                      setIsEditingRockstar(true);
                    }}
                    className="text-xs font-mono text-primary hover:text-primary/80 underline"
                  >
                    EDIT
                  </button>
                </div>
              )}
            </motion.div>

            {/* Activity History */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="cyber-card p-0 border-white/10 flex flex-col h-[400px]"
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> RECENT ACTIVITY
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activities?.map((act, i) => (
                  <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="mt-1">
                      {act.type.includes('gta') ? <Car className="w-4 h-4 text-secondary" /> : 
                       act.type.includes('rl') ? <Gamepad2 className="w-4 h-4 text-accent" /> :
                       <Zap className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-mono text-xs font-bold text-white/90 uppercase">{act.type.replace('_', ' ')}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-primary">+{act.xpGained} XP</div>
                      {act.coinsGained > 0 && <div className="font-mono text-[10px] text-yellow-500">+{act.coinsGained} 🪙</div>}
                    </div>
                  </div>
                ))}
                {!activities?.length && (
                  <div className="text-center p-4 text-muted-foreground font-mono text-xs">NO ACTIVITY</div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </Shell>
  );
}
