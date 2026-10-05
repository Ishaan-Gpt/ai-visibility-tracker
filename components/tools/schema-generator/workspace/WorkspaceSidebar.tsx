"use client";

import type { SchemaType } from "@/lib/tools/schemaTemplates";
import { GraphComposer } from "@/components/tools/schema-generator/workspace/GraphComposer";

type WorkspaceSidebarProps = {
  types: SchemaType[];
  activeType: SchemaType;
  onSelectActive: (type: SchemaType) => void;
  onRemove: (type: SchemaType) => void;
  onAdd: (type: SchemaType) => void;
  onBack?: () => void;
};

export function WorkspaceSidebar({ types, activeType, onSelectActive, onRemove, onAdd }: WorkspaceSidebarProps) {
  return (
    <aside className="md:sticky md:top-24 md:h-fit">
      <GraphComposer types={types} activeType={activeType} onSelectActive={onSelectActive} onRemove={onRemove} onAdd={onAdd} />
    </aside>
  );
}
