import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
