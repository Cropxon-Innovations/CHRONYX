import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 sm:space-y-8 px-1 sm:px-0">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </header>

      {/* Metric cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 mt-3" />
          </div>
        ))}
      </section>

      {/* Highlight card */}
      <section className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-12 w-28" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </section>

      {/* Trends */}
      <section className="space-y-3 sm:space-y-4">
        <Skeleton className="h-5 w-20" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-48 w-full mt-4" />
          </div>
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-48 w-full mt-4" />
          </div>
        </div>
      </section>

      {/* Life */}
      <section className="space-y-3 sm:space-y-4">
        <Skeleton className="h-5 w-14" />
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </section>

      {/* Financial overview */}
      <section className="space-y-3 sm:space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-56 w-full mt-4" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardSkeleton;
