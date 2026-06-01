import { Skeleton } from "@/components/ui/skeleton";

export const CourseSkeleton = () => (
  // We use bg-gray-200 (or bg-gray-300) to ensure it's visible on white
  <div className="relative overflow-hidden bg-gray-200 rounded-2xl p-[20px] shadow-sm w-full h-[180px] flex flex-col justify-between border border-gray-100 animate-pulse">
    {/* Header area */}
    <div className="flex justify-between items-start">
      <div className="space-y-3 flex-1">
        {/* Title Shimmer - Higher contrast */}
        <div className="h-6 w-3/4 bg-gray-300/60 rounded-md" />

        {/* Description Shimmer - Lines */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-300/40 rounded-md" />
          <div className="h-3 w-5/6 bg-gray-300/40 rounded-md" />
        </div>
      </div>

      {/* Invite Code Box Shimmer */}
      <div className="h-7 w-14 bg-gray-300/60 rounded-lg ml-4" />
    </div>

    {/* Footer area */}
    <div className="flex gap-4 border-t border-gray-300/30 pt-4">
      <div className="h-3 w-16 bg-gray-300/50 rounded" />
      <div className="h-3 w-20 bg-gray-300/50 rounded" />
    </div>

    {/* CSS Shimmer Overlay (Optional but looks great) */}
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  </div>
);
