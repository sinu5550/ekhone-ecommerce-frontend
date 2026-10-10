export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 flex flex-col h-full overflow-hidden shadow-xs animate-pulse">
      {/* 1. Square Image Skeleton */}
      <div className="relative w-full aspect-square bg-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>

      {/* 2. Product Details Skeleton */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-2">
          {/* Title Lines */}
          <div className="h-4 bg-slate-200 rounded-md w-11/12" />
          <div className="h-4 bg-slate-200 rounded-md w-3/4" />

          {/* Price Line */}
          <div className="flex items-center gap-2 pt-1">
            <div className="h-5 bg-slate-200 rounded-md w-20" />
            <div className="h-3.5 bg-slate-100 rounded-md w-12" />
          </div>
        </div>

        {/* Action Button Skeleton */}
        <div className="h-9 w-full bg-slate-100 rounded-xl mt-1" />
      </div>
    </div>
  );
}
