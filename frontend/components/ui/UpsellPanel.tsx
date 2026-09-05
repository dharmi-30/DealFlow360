'use client';

import * as React from 'react';
import {
  Sparkles,
  TrendingUp,
  Tag,
  Package,
  Plus,
  X,
  HelpCircle,
  CheckCircle2,
  Percent,
  RefreshCw,
  Info,
  Award,
} from 'lucide-react';
import { Button, GlassCard, Badge, Modal } from '@/components/ui';
import type { ProductItem, RecommendationItem } from '@/types';
import { MOCK_RECOMMENDATIONS } from '@/data/mockRecommendationData';
import { formatCurrency } from '@/lib/utils';

export interface UpsellPanelProps {
  /** Callback fired when user clicks 'Add to Quote' */
  onAddProduct: (product: ProductItem) => void;
  /** Optional custom initial recommendations list */
  initialRecommendations?: RecommendationItem[];
  /** Optional container CSS class */
  className?: string;
  /** Layout mode: 'sidebar' (compact vertical) or 'bottom' (horizontal grid) */
  layout?: 'sidebar' | 'bottom' | 'auto';
}

export function UpsellPanel({
  onAddProduct,
  initialRecommendations = MOCK_RECOMMENDATIONS,
  className = '',
  layout = 'auto',
}: UpsellPanelProps) {
  const [recommendations, setRecommendations] = React.useState<RecommendationItem[]>(
    initialRecommendations
  );
  const [selectedWhyItem, setSelectedWhyItem] = React.useState<RecommendationItem | null>(null);
  const [addedIds, setAddedIds] = React.useState<Set<string>>(new Set());

  // Dismiss recommendation
  const handleDismiss = (id: string) => {
    setRecommendations((prev) => prev.filter((item) => item.id !== id));
  };

  // Restore dismissed recommendations
  const handleReset = () => {
    setRecommendations(initialRecommendations);
    setAddedIds(new Set());
  };

  // Add item to quote
  const handleAdd = (item: RecommendationItem) => {
    onAddProduct(item.suggestedProduct);
    setAddedIds((prev) => new Set(prev).add(item.id));
  };

  // Get reason badge styling
  const getReasonBadge = (reason: RecommendationItem['reason'], label: string) => {
    switch (reason) {
      case 'frequently_bought_together':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="h-3 w-3" />
            {label}
          </span>
        );
      case 'customer_tier_popular':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Award className="h-3 w-3" />
            {label}
          </span>
        );
      case 'active_promotion':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Tag className="h-3 w-3" />
            {label}
          </span>
        );
      case 'high_margin_addon':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="h-3 w-3" />
            {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-300 border border-slate-500/20">
            {label}
          </span>
        );
    }
  };

  return (
    <GlassCard className={`p-4 space-y-4 border-l-4 border-l-purple-500/80 ${className}`}>
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Recommended for this deal
            </h3>
            <p className="text-[10px] text-slate-400">
              Deal telemetry & margin expansion suggestions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full font-mono">
            {recommendations.length} available
          </span>
          {recommendations.length < initialRecommendations.length && (
            <button
              onClick={handleReset}
              className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              title="Reset dismissed recommendations"
            >
              <RefreshCw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* RECOMMENDATIONS CARDS CONTAINER */}
      {recommendations.length === 0 ? (
        <div className="p-6 text-center space-y-2 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto opacity-80" />
          <h4 className="text-xs font-semibold text-slate-300">All recommendations reviewed</h4>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            You have dismissed or added all upsell recommendations for this session.
          </p>
          <Button variant="outline" size="sm" onClick={handleReset} className="mt-2 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Reload Suggestions
          </Button>
        </div>
      ) : (
        <div
          className={`grid gap-3 ${
            layout === 'bottom'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              : layout === 'sidebar'
              ? 'grid-cols-1'
              : 'grid-cols-1'
          }`}
        >
          {recommendations.map((item, idx) => {
            const isAdded = addedIds.has(item.id);
            return (
              <div
                key={item.id}
                className="group relative p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-purple-500/30 transition-all space-y-3 shadow-lg shadow-black/20"
              >
                {/* CARD TOP BAR: RANK & DISMISS */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold border border-purple-500/30">
                      #{item.rank || idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                      {item.confidence}% Match
                    </span>
                  </div>

                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1 rounded-md transition-colors"
                    title="Dismiss recommendation"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* PRODUCT TITLE & CATEGORY */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors leading-tight">
                      {item.suggestedProduct.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                      {item.suggestedProduct.category}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.suggestedProduct.sku}
                    </span>
                  </div>
                </div>

                {/* REASON BADGE & WHY? INTERACTION */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    {getReasonBadge(item.reason, item.reasonLabel)}
                  </div>

                  {/* "Why?" Interactive Trigger */}
                  <button
                    onClick={() => setSelectedWhyItem(item)}
                    className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 hover:underline inline-flex items-center gap-0.5 transition-colors"
                  >
                    <HelpCircle className="h-3 w-3" />
                    <span>Why?</span>
                  </button>
                </div>

                {/* MARGIN DELTA, PROMOTION & STOCK */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-center">
                    <span className="text-[9px] text-emerald-400 uppercase font-medium">Margin Boost</span>
                    <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      +{item.marginDelta}%
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-center">
                    <span className="text-[9px] text-slate-400 uppercase font-medium">Unit Price</span>
                    <span className="text-xs font-bold text-slate-200">
                      {formatCurrency(item.suggestedProduct.unitPrice)}
                    </span>
                  </div>
                </div>

                {/* PROMOTION TAG & STOCK METADATA */}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  {item.promotion ? (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-semibold truncate max-w-[150px]">
                      <Tag className="h-2.5 w-2.5 shrink-0" />
                      {item.promotion}
                    </span>
                  ) : (
                    <span className="text-slate-500">Standard Pricing</span>
                  )}

                  <span className="inline-flex items-center gap-1 shrink-0 font-mono text-slate-400">
                    <Package className="h-2.5 w-2.5" />
                    {item.stock} in stock
                  </span>
                </div>

                {/* ACTIONS: ADD TO QUOTE */}
                <div className="pt-2">
                  <Button
                    variant={isAdded ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleAdd(item)}
                    className="w-full text-xs justify-center gap-1.5"
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Added to Quote</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add to Quote</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "WHY?" REASON EXPLANATION MODAL */}
      <Modal
        isOpen={!!selectedWhyItem}
        onClose={() => setSelectedWhyItem(null)}
        title={`Recommendation Rationale — ${selectedWhyItem?.suggestedProduct.name}`}
        description="Rule engine & deal telemetry intelligence rationale"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-500">
              Match Confidence: <strong>{selectedWhyItem?.confidence}%</strong>
            </span>
            <Button variant="primary" size="sm" onClick={() => setSelectedWhyItem(null)}>
              Got it
            </Button>
          </div>
        }
      >
        {selectedWhyItem && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-purple-300 font-bold uppercase text-[10px]">Primary Factor</span>
                {getReasonBadge(selectedWhyItem.reason, selectedWhyItem.reasonLabel)}
              </div>
              <p className="text-sm font-semibold text-slate-100 pt-1">
                {selectedWhyItem.explanation}
              </p>
            </div>

            {/* TELEMETRY BREAKDOWN */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <h5 className="font-bold text-slate-200 text-[11px] uppercase tracking-wider">
                Deal Financial Impact
              </h5>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-slate-400 block text-[10px]">Product Unit Price</span>
                  <span className="text-sm font-extrabold text-cyan-400">
                    {formatCurrency(selectedWhyItem.suggestedProduct.unitPrice)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-emerald-400 block text-[10px]">Estimated Margin Impact</span>
                  <span className="text-sm font-extrabold text-emerald-300">
                    +{selectedWhyItem.marginDelta}% Gross Margin
                  </span>
                </div>
              </div>
            </div>

            {/* TECHNICAL & ARCHITECTURAL DISCLAMER */}
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/10 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Info className="h-3.5 w-3.5 text-cyan-400" />
                <span>Architecture Note:</span>
              </div>
              <p>
                This recommendation is populated from mock frontend dataset matching the FastAPI response contract schema (`suggested_product`, `reason`, `margin_delta`, `promotion`, `confidence`).
              </p>
            </div>
          </div>
        )}
      </Modal>
    </GlassCard>
  );
}
