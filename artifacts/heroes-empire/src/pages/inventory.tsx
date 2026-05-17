import { Shell } from "@/components/layout/Shell";
import { 
  useGetInventory, 
  useEquipItem,
  getGetMeQueryKey,
  getGetInventoryQueryKey
} from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Briefcase, Shield, Star, Zap, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function Inventory() {
  const { data: inventory, isLoading } = useGetInventory();
  const equip = useEquipItem();
  const queryClient = useQueryClient();

  const handleEquip = (itemId: number) => {
    equip.mutate({ data: { itemId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
      }
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "text-slate-400 border-slate-400";
      case "rare": return "text-cyan-400 border-cyan-400";
      case "epic": return "text-purple-400 border-purple-500";
      case "mythic": return "text-yellow-400 border-yellow-400";
      default: return "text-primary border-primary";
    }
  };

  if (isLoading) {
    return <Shell><div className="p-8 text-center text-primary font-mono animate-pulse">LOADING VAULT...</div></Shell>;
  }

  const frames = inventory?.filter(i => i.item.category === 'frame') || [];
  const badges = inventory?.filter(i => i.item.category === 'badge') || [];
  const boosts = inventory?.filter(i => i.item.category === 'boost') || [];

  const renderSection = (title: string, Icon: any, items: any[], isEquippable: boolean) => (
    <div className="space-y-4">
      <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-2 border-b border-white/10 pb-2 text-white/80">
        <Icon className="w-6 h-6 text-primary" /> {title}
      </h2>
      
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((entry, i) => (
            <motion.div
              key={entry.item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="cyber-card p-4 flex items-center gap-4 border"
              style={{ borderColor: entry.item.previewColor }}
            >
              <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center bg-black/50 shrink-0" style={{ borderColor: entry.item.previewColor }}>
                <Icon className="w-8 h-8" style={{ color: entry.item.previewColor }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-display font-bold text-lg truncate text-white">{entry.item.name}</div>
                  {entry.equipped && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                </div>
                <div className={cn("text-[10px] font-mono uppercase mb-2", getRarityColor(entry.item.rarity).split(' ')[0])}>
                  {entry.item.rarity}
                </div>
                
                {isEquippable && !entry.equipped && (
                  <button
                    onClick={() => handleEquip(entry.item.id)}
                    disabled={equip.isPending}
                    className="text-[10px] px-3 py-1 font-mono font-bold cyber-button bg-white/5 border border-white/20 hover:bg-white/20 transition-colors w-full"
                  >
                    EQUIP
                  </button>
                )}
                {entry.equipped && (
                  <div className="text-[10px] px-3 py-1 font-mono font-bold text-green-500 border border-green-500/30 bg-green-500/10 text-center w-full">
                    EQUIPPED
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center border border-white/5 bg-black/20 cyber-card">
          <div className="font-mono text-sm text-muted-foreground mb-4">VAULT EMPTY</div>
          <Link href="/shop" className="text-primary hover:text-primary/80 font-mono text-xs underline">
            VISIT THE MARKET
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <Shell>
      <div className="p-8 max-w-7xl mx-auto space-y-12 relative">
        <h1 className="text-4xl font-display font-bold uppercase tracking-widest flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-primary" />
          PERSONAL VAULT
        </h1>
        
        {renderSection("Frames", Shield, frames, true)}
        {renderSection("Badges", Star, badges, true)}
        {renderSection("Boosts", Zap, boosts, false)}
      </div>
    </Shell>
  );
}
