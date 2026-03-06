import { Link } from "react-router-dom";
import "./FileComparePage.css";

export default function FileComparePage() {
  return (
    <div className="file-compare-page">
      <div className="page-header">
        <h1>📄 File Comparison</h1>
        <p className="page-subtitle">
          This page will allow you to compare the contents of two files side by
          side. Coming soon!
        </p>
      </div>

      <div className="placeholder-card">
        <div className="placeholder-icon">🚧</div>
        <h2>Under Construction</h2>
        <p>
          File-level diff comparison is planned for a future update. For now,
          you can compare directory trees.
        </p>
        <Link to="/" className="back-link">
          ← Back to Tree Comparison
        </Link>
      </div>
    </div>
  );
}
