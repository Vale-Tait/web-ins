"use client";

import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { Background, Controls, ReactFlow, type Node, type NodeChange, type NodeProps, applyNodeChanges } from "@xyflow/react";
import { PreviewArt } from "@/components/PreviewArt";
import type { CanvasNodeData, InspirationCanvas, LinkItem } from "@/lib/types";

type FlowData = {
  label: string;
  kind: CanvasNodeData["type"];
  domain?: string;
};

export function CanvasEditor({
  canvas,
  links,
  onMove
}: {
  canvas: InspirationCanvas;
  links: LinkItem[];
  onMove: (nodeId: string, patch: Partial<CanvasNodeData>) => void;
}) {
  const nodeTypes = useMemo(() => ({ inspiration: InspirationNode }), []);
  const nodes = useMemo<Node<FlowData>[]>(
    () =>
      canvas.nodes.map((node) => {
        const link = node.linkId ? links.find((item) => item.id === node.linkId) : undefined;
        return {
          id: node.id,
          position: { x: node.x, y: node.y },
          width: node.width,
          height: node.height,
          data: {
            kind: node.type,
            label: node.type === "website" ? link?.domain ?? node.content : node.content,
            domain: link?.domain
          },
          type: "inspiration",
          style: {
            width: node.width,
            minHeight: node.height
          }
        };
      }),
    [canvas.nodes, links]
  );

  function handleChanges(changes: NodeChange[]) {
    const changed = applyNodeChanges(changes, nodes);
    for (const change of changes) {
      if (change.type === "position" && change.position) {
        onMove(change.id, { x: change.position.x, y: change.position.y });
      }
    }
    return changed;
  }

  return (
    <div className="h-[calc(100dvh-150px)] border-t border-[var(--line)] bg-[var(--bg)]">
      <ReactFlow nodes={nodes} nodeTypes={nodeTypes} onNodesChange={handleChanges} fitView>
        <Background color="var(--line)" gap={24} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function InspirationNode({ data }: NodeProps<Node<FlowData>>) {
  if (data.kind === "website") {
    return (
      <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="h-36 border-b border-[var(--line)]">
          <PreviewArt domain={data.domain ?? data.label} />
        </div>
        <div className="mono px-4 py-3 text-sm font-semibold">{data.label}</div>
      </div>
    );
  }

  return (
    <div className="mono min-h-36 rounded-lg border border-[var(--line)] bg-[var(--muted-panel)] p-5 text-center text-lg leading-8 shadow-[var(--shadow)]">
      {data.label}
    </div>
  );
}
