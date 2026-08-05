"use client";

import type { SchemaType } from "@/lib/tools/schemaTemplates";
import { GraphComposer } from "@/components/tools/schema-generator/workspace/GraphComposer";

type WorkspaceSidebarProps = {
  types: SchemaType[];
  activeType: SchemaType;
  onSelectActive: (type: SchemaType) => void;
  onRemove: (type: SchemaType) => void;
  onAdd: (type: SchemaType) => void;
  onBack: () => void;
};

export function WorkspaceSidebar({ types, activeType, onSelectActive, onRemove, onAdd, onBack }: WorkspaceSidebarProps) {
  return (
    <aside className="md:sticky md:top-24 md:h-fit">
      <button type="button" onClick={onBack} className="mb-6 font-body text-xs text-foreground/40 hover:text-foreground">
        ← Start fresh
      </button>
      <GraphComposer types={types} activeType={activeType} onSelectActive={onSelectActive} onRemove={onRemove} onAdd={onAdd} />
    </aside>
  );
}
