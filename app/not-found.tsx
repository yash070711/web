import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-inner" style={{ padding: 80, textAlign: "center" }}>
      <h1 className="page-title">Not found</h1>
      <p className="page-subtitle">That product or page is not in this workspace.</p>
      <Link className="btn btn-primary" href="/catalogue">Back to catalogue</Link>
    </div>
  );
}
