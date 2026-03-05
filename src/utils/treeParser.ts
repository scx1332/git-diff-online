export interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
  depth: number;
}

/**
 * Parse the output of a `tree` command into a structured tree.
 * Supports both UTF-8 box-drawing characters and ASCII fallback.
 *
 * Example input:
 * ```
 * my-project
 * ├── src
 * │   ├── index.ts
 * │   └── utils
 * │       └── helper.ts
 * ├── package.json
 * └── README.md
 * ```
 */
export function parseTree(input: string): TreeNode {
  const lines = input.split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) {
    return { name: "", path: "", isDirectory: true, children: [], depth: 0 };
  }

  // Strip the summary line that `tree` prints at the end (e.g. "3 directories, 10 files")
  const lastLine = lines[lines.length - 1];
  if (/^\d+ director/.test(lastLine.trim())) {
    lines.pop();
  }

  const rootName = lines[0].replace(/[\\/]$/, "").trim();
  const root: TreeNode = {
    name: rootName,
    path: rootName,
    isDirectory: true,
    children: [],
    depth: 0,
  };

  if (lines.length <= 1) return root;

  // Each non-root line has a tree-drawing prefix followed by the entry name.
  // We determine depth by counting prefix segments (each 4 chars wide).
  const connectorPattern = /[├└│─┬]/g;

  const stack: TreeNode[] = [root];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Find where the actual name starts (after connectors and whitespace)
    // The pattern: every 4-char block in the prefix is one depth level.
    // e.g. "├── name" = depth 1, "│   ├── name" = depth 2
    const nameMatch = line.match(
      /(?:^|.*(?:[├└│][\s─]*|[\s]{4}))([^\s├└│─┬].*)$/
    );
    if (!nameMatch) continue;

    const rawName = nameMatch[1].trim();
    const trailingSlash = rawName.endsWith("/");
    const name = rawName.replace(/[\\/]$/, "").trim();
    if (!name) continue;

    // Calculate depth by looking at the prefix part
    const prefixEnd = line.indexOf(rawName);
    const prefix = line.substring(0, prefixEnd);
    // Each depth level is ~4 characters in the prefix
    const depth = Math.round(prefix.replace(connectorPattern, "X").length / 4);

    // Pop stack to correct parent
    while (stack.length > depth) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    const node: TreeNode = {
      name,
      path: parent.path + "/" + name,
      isDirectory: trailingSlash,
      children: [],
      depth,
    };

    parent.children.push(node);
    // Always push to stack so subsequent deeper entries become children.
    // We'll mark nodes with children as directories in a post-processing step.
    stack.push(node);
  }

  // Post-process: any node that has children is a directory
  function markDirectories(node: TreeNode) {
    if (node.children.length > 0) {
      node.isDirectory = true;
    }
    for (const child of node.children) {
      markDirectories(child);
    }
  }
  markDirectories(root);

  return root;
}

export interface FlatTreeEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  depth: number;
}

/** Flatten a tree into a depth-first list for rendering. */
export function flattenTree(node: TreeNode): FlatTreeEntry[] {
  const result: FlatTreeEntry[] = [];

  function walk(n: TreeNode) {
    result.push({
      name: n.name,
      path: n.path,
      isDirectory: n.isDirectory,
      depth: n.depth,
    });
    // Sort children: directories first, then alphabetically
    const sorted = [...n.children].sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const child of sorted) {
      walk(child);
    }
  }

  walk(node);
  return result;
}

export type DiffStatus = "same" | "added" | "removed" | "modified";

export interface DiffEntry {
  path: string;
  name: string;
  depth: number;
  isDirectory: boolean;
  status: DiffStatus;
}

/** Compare two flat trees and produce aligned diff entries for left and right. */
export function diffTrees(
  leftRoot: TreeNode,
  rightRoot: TreeNode
): { left: (DiffEntry | null)[]; right: (DiffEntry | null)[] } {
  const leftFlat = flattenTree(leftRoot);
  const rightFlat = flattenTree(rightRoot);

  const leftPaths = new Set(leftFlat.map((e) => e.path));
  const rightPaths = new Set(rightFlat.map((e) => e.path));

  // Build maps for quick lookup
  const leftMap = new Map(leftFlat.map((e) => [e.path, e]));
  const rightMap = new Map(rightFlat.map((e) => [e.path, e]));

  // Collect all unique paths, maintaining a stable order
  const allPaths: string[] = [];
  const seen = new Set<string>();

  // Interleave paths from both sides to maintain relative order
  let li = 0,
    ri = 0;
  while (li < leftFlat.length || ri < rightFlat.length) {
    if (li < leftFlat.length && !seen.has(leftFlat[li].path)) {
      // If this left path also exists on the right, add it
      // If it doesn't exist on the right, add it (removed)
      allPaths.push(leftFlat[li].path);
      seen.add(leftFlat[li].path);
    }
    if (ri < rightFlat.length && !seen.has(rightFlat[ri].path)) {
      allPaths.push(rightFlat[ri].path);
      seen.add(rightFlat[ri].path);
    }
    li++;
    ri++;
  }

  const left: (DiffEntry | null)[] = [];
  const right: (DiffEntry | null)[] = [];

  for (const p of allPaths) {
    const inLeft = leftPaths.has(p);
    const inRight = rightPaths.has(p);

    if (inLeft && inRight) {
      const le = leftMap.get(p)!;
      const re = rightMap.get(p)!;
      const status: DiffStatus = "same";
      left.push({ ...le, status });
      right.push({ ...re, status });
    } else if (inLeft && !inRight) {
      const le = leftMap.get(p)!;
      left.push({ ...le, status: "removed" });
      right.push(null);
    } else {
      const re = rightMap.get(p)!;
      left.push(null);
      right.push({ ...re, status: "added" });
    }
  }

  return { left, right };
}
