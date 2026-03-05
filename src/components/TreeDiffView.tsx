import type { DiffEntry } from "../utils/treeParser";
import "./TreeDiffView.css";

interface TreeDiffViewProps {
  left: (DiffEntry | null)[];
  right: (DiffEntry | null)[];
  leftLabel: string;
  rightLabel: string;
}

function EntryRow({ entry }: { entry: DiffEntry | null }) {
  if (!entry) {
    return <div className="tree-row tree-row--empty" />;
  }

  const statusClass = `tree-row--${entry.status}`;
  const icon = entry.isDirectory ? "📁" : "📄";
  const indent = entry.depth * 20;

  return (
    <div className={`tree-row ${statusClass}`} title={entry.path}>
      <span style={{ paddingLeft: `${indent}px` }}>
        <span className="tree-icon">{icon}</span>
        <span className="tree-name">{entry.name}</span>
      </span>
    </div>
  );
}

export default function TreeDiffView({
  left,
  right,
  leftLabel,
  rightLabel,
}: TreeDiffViewProps) {
  return (
    <div className="tree-diff">
      <div className="tree-diff__header">
        <div className="tree-diff__label tree-diff__label--left">
          {leftLabel}
        </div>
        <div className="tree-diff__label tree-diff__label--right">
          {rightLabel}
        </div>
      </div>
      <div className="tree-diff__body">
        <div className="tree-diff__column">
          {left.map((entry, i) => (
            <EntryRow key={entry?.path ?? `empty-left-${i}`} entry={entry} />
          ))}
        </div>
        <div className="tree-diff__column">
          {right.map((entry, i) => (
            <EntryRow key={entry?.path ?? `empty-right-${i}`} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
