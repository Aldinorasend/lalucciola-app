"use client";

import { closeSection, renameArea, reopenSection, updateTable } from "@/app/(dashboard)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActionToast } from "@/components/use-action-toast";

type Area = { id: string; name: string; closures: { id: string; date: string; label: string; reason: string | null }[] };
type TableRow = {
  id: string;
  label: string;
  areaId: string;
  minSeats: number;
  maxSeats: number;
  combinable: boolean;
  active: boolean;
};

export function TablesEditor({ areas, tables, today }: { areas: Area[]; tables: TableRow[]; today: string }) {
  return (
    <div className="grid gap-6">
      {areas.map((area) => (
        <Card key={area.id}>
          <CardHeader>
            <SectionNameForm area={area} />
            <SectionClosures area={area} today={today} />
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="hidden grid-cols-[4rem_5rem_5rem_9rem_7rem_6rem_auto] gap-3 text-xs text-muted-foreground md:grid">
              <span>Table</span>
              <span>Min seats</span>
              <span>Max seats</span>
              <span>Section</span>
              <span>Combinable</span>
              <span>Active</span>
            </div>
            {tables
              .filter((table) => table.areaId === area.id)
              .map((table) => (
                <TableForm key={table.id} table={table} areas={areas} />
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Close this section for a day, and list upcoming closures (D-033). */
function SectionClosures({ area, today }: { area: Area; today: string }) {
  const [onClose, closing] = useActionToast(closeSection, `${area.name} closed for that day`);
  return (
    <div className="grid gap-2 text-sm">
      {area.closures.map((closure) => (
        <ReopenRow key={closure.id} closure={closure} />
      ))}
      <form onSubmit={onClose} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="areaId" value={area.id} />
        <Input aria-label={`Date to close ${area.name}`} name="date" type="date" min={today} defaultValue={today} required className="w-40" />
        <Input aria-label={`Reason for closing ${area.name}`} name="reason" maxLength={200} placeholder="Reason (optional)" className="max-w-56" />
        <Button type="submit" variant="outline" size="sm" disabled={closing}>
          Close section that day
        </Button>
      </form>
    </div>
  );
}

function ReopenRow({ closure }: { closure: Area["closures"][number] }) {
  const [onReopen, reopening] = useActionToast(reopenSection, "Section reopened");
  return (
    <form onSubmit={onReopen} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={closure.id} />
      <Badge variant="outline" className="border-destructive text-destructive">
        Closed {closure.label}
      </Badge>
      {closure.reason && <span className="text-muted-foreground">{closure.reason}</span>}
      <Button type="submit" variant="ghost" size="sm" disabled={reopening}>
        Reopen
      </Button>
    </form>
  );
}

function SectionNameForm({ area }: { area: Area }) {
  const [onSubmit, pending] = useActionToast(renameArea, "Section renamed");
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input type="hidden" name="id" value={area.id} />
      <Input aria-label="Section name" name="name" defaultValue={area.name} className="max-w-56 font-medium" required />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        Rename
      </Button>
    </form>
  );
}

function TableForm({ table, areas }: { table: TableRow; areas: Area[] }) {
  const [onSubmit, pending] = useActionToast(updateTable, `Table ${table.label} saved`);
  const id = (field: string) => `${field}-${table.id}`;

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-2 items-center gap-3 border-t py-2 md:grid-cols-[4rem_5rem_5rem_9rem_7rem_6rem_auto] md:border-0 md:py-0"
    >
      <input type="hidden" name="id" value={table.id} />
      <span className="font-medium">
        {table.label}
        {!table.active && (
          <Badge variant="outline" className="ml-1">
            off
          </Badge>
        )}
      </span>
      <label className="grid gap-1">
        <span className="text-xs text-muted-foreground md:sr-only">Min seats</span>
        <Input name="minSeats" type="number" min={1} max={30} defaultValue={table.minSeats} required />
      </label>
      <label className="grid gap-1">
        <span className="text-xs text-muted-foreground md:sr-only">Max seats</span>
        <Input name="maxSeats" type="number" min={1} max={30} defaultValue={table.maxSeats} required />
      </label>
      <Select name="areaId" defaultValue={table.areaId}>
        <SelectTrigger aria-label={`Table ${table.label} section`} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {areas.map((area) => (
            <SelectItem key={area.id} value={area.id}>
              {area.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label htmlFor={id("combinable")} className="flex items-center gap-2 text-sm md:justify-center">
        <Checkbox id={id("combinable")} name="combinable" defaultChecked={table.combinable} />
        <span className="md:sr-only">Combinable</span>
      </label>
      <label htmlFor={id("active")} className="flex items-center gap-2 text-sm md:justify-center">
        <Checkbox id={id("active")} name="active" defaultChecked={table.active} />
        <span className="md:sr-only">Active</span>
      </label>
      <Button type="submit" variant="outline" size="sm" disabled={pending} className="w-fit">
        Save
      </Button>
    </form>
  );
}
