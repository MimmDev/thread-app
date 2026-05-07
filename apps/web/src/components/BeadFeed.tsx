import { type BeadWithHistory } from "@/lib/actions/beads";
import { NoteBead } from "@/components/beads/NoteBead";
import { TaskBead } from "@/components/beads/TaskBead";
import { LinkBead } from "@/components/beads/LinkBead";

type Props = {
  beads: BeadWithHistory[];
};

export function BeadFeed({ beads }: Props) {
  if (beads.length === 0) {
    return (
      <p className="text-muted-foreground text-sm px-6 py-8">
        No beads yet. Dump your thoughts below.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      {beads.map((bead) => {
        if (bead.type === "note") return <NoteBead key={bead.id} bead={bead} />;
        if (bead.type === "task") return <TaskBead key={bead.id} bead={bead} />;
        if (bead.type === "link") return <LinkBead key={bead.id} bead={bead} />;
        return null;
      })}
    </div>
  );
}
