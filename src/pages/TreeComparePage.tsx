import { useState, useMemo } from "react";
import { parseTree, diffTrees } from "../utils/treeParser";
import TreeDiffView from "../components/TreeDiffView";
import {
  sampleTreeLeft,
  sampleTreeRight,
  sampleTreeLeftSmall,
  sampleTreeRightSmall,
} from "../data/sampleTrees";
import "./TreeComparePage.css";

export default function TreeComparePage() {
  const [leftInput, setLeftInput] = useState(sampleTreeLeft);
  const [rightInput, setRightInput] = useState(sampleTreeRight);

  const diff = useMemo(() => {
    try {
      const leftTree = parseTree(leftInput);
      const rightTree = parseTree(rightInput);
      return diffTrees(leftTree, rightTree);
    } catch {
      return null;
    }
  }, [leftInput, rightInput]);

  const loadSample = (variant: "large" | "small") => {
    if (variant === "large") {
      setLeftInput(sampleTreeLeft);
      setRightInput(sampleTreeRight);
    } else {
      setLeftInput(sampleTreeLeftSmall);
      setRightInput(sampleTreeRightSmall);
    }
  };

  const handleClear = () => {
    setLeftInput("");
    setRightInput("");
  };

  return (
    <div className="tree-compare-page">
      <div className="page-header">
        <h1>🌳 Directory Tree Comparison</h1>
        <p className="page-subtitle">
          Paste the output of <code>tree</code> commands to compare two
          directory structures side by side.
        </p>
      </div>

      <div className="sample-buttons">
        <button onClick={() => loadSample("large")}>
          Load Large Sample
        </button>
        <button onClick={() => loadSample("small")}>
          Load Small Sample
        </button>
        <button onClick={handleClear}>
          Clear
        </button>
      </div>

      <div className="input-panels">
        <div className="input-panel">
          <label htmlFor="left-tree">Left Tree (original)</label>
          <textarea
            id="left-tree"
            value={leftInput}
            onChange={(e) => setLeftInput(e.target.value)}
            placeholder="Paste tree output here..."
            spellCheck={false}
          />
        </div>
        <div className="input-panel">
          <label htmlFor="right-tree">Right Tree (modified)</label>
          <textarea
            id="right-tree"
            value={rightInput}
            onChange={(e) => setRightInput(e.target.value)}
            placeholder="Paste tree output here..."
            spellCheck={false}
          />
        </div>
      </div>

      {diff && (
        <div className="diff-result">
          <h2>Comparison Result</h2>
          <div className="diff-legend">
            <span className="legend-item legend-item--same">● Same</span>
            <span className="legend-item legend-item--added">● Added</span>
            <span className="legend-item legend-item--removed">● Removed</span>
          </div>
          <TreeDiffView
            left={diff.left}
            right={diff.right}
            leftLabel="Original"
            rightLabel="Modified"
          />
        </div>
      )}
    </div>
  );
}
