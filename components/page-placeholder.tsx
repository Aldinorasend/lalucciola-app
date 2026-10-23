import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PagePlaceholderProps = {
  title: string;
  description: string;
  phase: string;
};

// Stand-in for screens scheduled in later roadmap phases (wiki/roadmap.md).
export function PagePlaceholder({ title, description, phase }: PagePlaceholderProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Not built yet</CardTitle>
            <Badge variant="secondary">{phase}</Badge>
          </div>
          <CardDescription>This screen arrives in {phase} of the roadmap.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export function AccessDenied() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>No access</CardTitle>
        <CardDescription>Your role can&apos;t open this page. Ask the owner if you need it.</CardDescription>
      </CardHeader>
    </Card>
  );
}
