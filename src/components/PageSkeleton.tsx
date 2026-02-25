import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-6 py-8 animate-in fade-in duration-300">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-5 w-72 mb-8" />
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader><Skeleton className="h-6 w-28" /></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function BookingsSkeleton() {
  return (
    <div className="container mx-auto px-6 py-8 animate-in fade-in duration-300">
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-5 w-64 mb-6" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className="container mx-auto px-6 py-8 animate-in fade-in duration-300">
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-5 w-56 mb-8" />
      <div className="grid lg:grid-cols-3 gap-6 h-[500px]">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="p-0 space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-start gap-3 border-b">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 hidden lg:flex items-center justify-center">
          <Skeleton className="h-12 w-12 rounded-full" />
        </Card>
      </div>
    </div>
  );
}

export function OrdersSkeleton() {
  return (
    <div className="container mx-auto px-6 py-8 animate-in fade-in duration-300">
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-5 w-48 mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
