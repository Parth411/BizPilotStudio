import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <section className="route-loading" role="status" aria-live="polite">
      <div className="route-loading-card">
        <span className="route-loading-mark">B<span>.</span></span>
        <LoaderCircle className="spin" size={25} aria-hidden="true" />
        <strong>Getting things ready</strong>
        <p>Preparing your BizPilot Studio experience…</p>
      </div>
    </section>
  );
}
