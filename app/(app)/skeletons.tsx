import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Esqueletos que se muestran mientras carga cada sección (los usan los loading.tsx).

function Page({ width, children }: { width: string; children: React.ReactNode }) {
  return (
    <main className={`mx-auto w-full ${width} p-4 md:p-8`} aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      {children}
    </main>
  );
}

const Lines = ({ n }: { n: number }) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: n }, (_, i) => (
      <Skeleton key={i} className="h-9 w-full" />
    ))}
  </div>
);

const BlockCard = ({ lines }: { lines: number }) => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent>
      <Lines n={lines} />
    </CardContent>
  </Card>
);

export function DashboardSkeleton() {
  return (
    <Page width="max-w-6xl">
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} size="sm">
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
        <BlockCard lines={3} />
      </div>
      <div className="mt-4">
        <BlockCard lines={2} />
      </div>
    </Page>
  );
}

export function CardsSkeleton({ width = "max-w-3xl", cards = 3, lines = 3 }) {
  return (
    <Page width={width}>
      <div className="mt-6 flex flex-col gap-4">
        {Array.from({ length: cards }, (_, i) => (
          <BlockCard key={i} lines={lines} />
        ))}
      </div>
    </Page>
  );
}

export function GridSkeleton() {
  return (
    <Page width="max-w-6xl">
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} size="sm">
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-7 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </Page>
  );
}

export function ChartSkeleton() {
  return (
    <Page width="max-w-3xl">
      <Card className="mt-6">
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
      <div className="mt-4">
        <Lines n={4} />
      </div>
    </Page>
  );
}
