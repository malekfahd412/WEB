import { PlayerRankTier } from "@workspace/api-client-react";

export function getRankColor(tier: PlayerRankTier | string): string {
  switch (tier) {
    case 'ROOKIE': return 'text-slate-400 border-slate-400/50 bg-slate-400/10 neon-text-slate';
    case 'BRONZE': return 'text-orange-400 border-orange-400/50 bg-orange-400/10';
    case 'SILVER': return 'text-slate-300 border-slate-300/50 bg-slate-300/10';
    case 'GOLD': return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10';
    case 'PLATINUM': return 'text-cyan-400 border-cyan-400/50 bg-cyan-400/10';
    case 'DIAMOND': return 'text-blue-500 border-blue-500/50 bg-blue-500/10';
    case 'MYTHIC': return 'text-fuchsia-500 border-fuchsia-500/50 bg-fuchsia-500/10';
    default: return 'text-primary border-primary/50 bg-primary/10';
  }
}
