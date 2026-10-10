import Container from "@/components/Shared/Container";

export default function ProductLoading() {
  return (
    <div className="bg-white min-h-screen py-8">
      <Container>
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          {/* Gallery Skeleton */}
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-square w-full rounded-2xl bg-slate-100 border border-slate-200 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
            <div className="flex gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Info Skeleton */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="h-6 w-28 bg-orange-100 rounded-full animate-pulse" />
              <div className="h-8 w-3/4 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse" />
            </div>

            {/* Price Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-36 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Variants skeleton */}
            <div className="space-y-3">
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-20 bg-slate-100 border border-slate-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-4">
              <div className="h-12 flex-1 bg-orange-100 rounded-xl animate-pulse" />
              <div className="h-12 flex-1 bg-slate-200 rounded-xl animate-pulse" />
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
