import { Shell } from "@/components/layout/Shell";
import { 
  useListShopItems, 
  useGetMe, 
  useGetInventory, 
  usePurchaseItem,
  getListShopItemsQueryKey,
  getGetMeQueryKey,
  getGetInventoryQueryKey
} from "@workspace/api-client-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Tag, Zap, Star, Shield, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "frame" | "badge" | "boost";

export default function Shop() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  
  const { data: items, isLoading } = useListShopItems(
    category === "all" ? {} : { category }
  );
  const { data: me } = useGetMe();
  const { data: inventory } = useGetInventory();
  const purchase = usePurchaseItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [purchasedItem, setPurchasedItem] = useState<any>(null);

  const handlePurchase = (item: any) => {
    purchase.mutate({ data: { itemId: item.id } }, {
      onSuccess: () => {
        setPurchasedItem(item);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListShopItemsQueryKey() });
        setTimeout(() => setPurchasedItem(null), 3000);
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "PURCHASE FAILED",
          description: err.body?.message || "An error occurred"
        });
      }
    });
  };

  const getRarityStyles = (rarity: string, color: string) => {
    switch (rarity) {
      case "common": return { border: "border-slate-500", text: "text-slate-400", bg: "bg-slate-500/10", glow: `shadow-[0_0_15px_${color}40]` };
      case "rare": return { border: "border-cyan-400", text: "text-cyan-400", bg: "bg-cyan-400/10", glow: `shadow-[0_0_20px_${color}60]` };
      case "epic": return { border: "border-purple-500", text: "text-purple-400", bg: "bg-purple-500/10", glow: `shadow-[0_0_30px_${color}80]` };
      case "mythic": return { border: "border-yellow-400", text: "text-yellow-400", bg: "bg-gradient-to-br from-yellow-500/20 to-fuchsia-500/20", glow: `shadow-[0_0_40px_${color}]` };
      default: return { border: "border-primary", text: "text-primary", bg: "bg-primary/10", glow: `shadow-[0_0_15px_${color}40]` };
    }
  };

  const getIcon = (cat: string) => {
    switch(cat) {
      case 'frame': return Shield;
      case 'badge': return Star;
      case 'boost': return Zap;
      default: return Tag;
    }
  };

  return (
    <Shell>
      <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl font-display font-bold uppercase tracking-widest flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-primary" />
              NEON BLACK MARKET
            </h1>
            {me && (
              <div className="mt-2 text-sm font-mono text-muted-foreground flex items-center gap-2">
                BALANCE: <span className="text-secondary neon-text-secondary text-lg font-bold">{me.coins} 🪙</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(["all", "frame", "badge", "boost"] as CategoryFilter[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-4 py-2 text-xs font-mono font-bold transition-all cyber-button border uppercase",
                  category === cat 
                    ? "bg-primary/20 text-primary border-primary neon-text-primary"
                    : "bg-black/40 text-muted-foreground border-white/10 hover:border-white/30 hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-primary font-mono animate-pulse">LOADING MARKET...</div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, i) => {
              const rStyles = getRarityStyles(item.rarity, item.previewColor);
              const Icon = getIcon(item.category);
              const isOwned = inventory?.some(inv => inv.item.id === item.id);
              const canAfford = me ? me.coins >= item.price : false;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "cyber-card flex flex-col relative overflow-hidden border",
                    rStyles.border,
                    rStyles.glow,
                    "hover:-translate-y-1 transition-transform duration-300"
                  )}
                  style={{ borderColor: item.previewColor }}
                >
                  <div className={cn("absolute inset-0 opacity-10", rStyles.bg)}></div>
                  
                  <div className="p-6 flex-1 relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-4 rounded-full flex items-center justify-center border-2 bg-black/50" style={{ borderColor: item.previewColor }}>
                      <Icon className="w-10 h-10" style={{ color: item.previewColor }} />
                    </div>
                    
                    <span className={cn("px-2 py-0.5 text-[10px] font-mono border uppercase mb-2", rStyles.border, rStyles.text)}>
                      {item.rarity} {item.category}
                    </span>
                    
                    <h3 className="font-display font-bold text-xl uppercase mb-2 text-white drop-shadow-md">{item.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground mb-6 line-clamp-3">{item.description}</p>
                    
                    <div className="mt-auto w-full pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="font-mono font-bold text-yellow-500 text-lg flex items-center gap-1">
                        {item.price} 🪙
                      </div>
                      
                      {isOwned ? (
                        <span className="text-xs font-mono font-bold text-green-500 px-3 py-1 border border-green-500/30 bg-green-500/10">OWNED</span>
                      ) : (
                        <button
                          onClick={() => handlePurchase(item)}
                          disabled={!canAfford || purchase.isPending}
                          className={cn(
                            "px-4 py-2 text-xs font-mono font-bold cyber-button border transition-colors",
                            canAfford 
                              ? "bg-primary/20 text-primary border-primary hover:bg-primary hover:text-black" 
                              : "bg-red-500/10 text-red-500 border-red-500/50 cursor-not-allowed opacity-50"
                          )}
                        >
                          {canAfford ? "BUY NOW" : "INSUFFICIENT"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center border border-white/5 bg-black/20 cyber-card">
            <div className="scanline"></div>
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-display text-2xl font-bold text-white/50 tracking-widest">MARKET EMPTY</h3>
            <p className="font-mono text-sm text-muted-foreground mt-2">NO ITEMS FOUND IN THIS CATEGORY</p>
          </div>
        )}

        {/* Celebratory Overlay */}
        <AnimatePresence>
          {purchasedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="cyber-card p-12 bg-black border-2 flex flex-col items-center text-center shadow-[0_0_100px_currentColor]"
                style={{ borderColor: purchasedItem.previewColor, color: purchasedItem.previewColor }}
              >
                <Sparkles className="w-16 h-16 mb-4 animate-pulse" />
                <div className="font-mono text-sm mb-2 text-white">ITEM ACQUIRED</div>
                <div className="font-display text-4xl font-bold uppercase text-white mb-6" style={{ textShadow: `0 0 20px ${purchasedItem.previewColor}` }}>
                  {purchasedItem.name}
                </div>
                <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center bg-black/50" style={{ borderColor: purchasedItem.previewColor }}>
                  {getIcon(purchasedItem.category)({ className: "w-12 h-12" })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Shell>
  );
}
