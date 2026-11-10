"use client";

import { FormEvent, useState } from "react";
import { Check, Clipboard, LoaderCircle, Sparkles } from "lucide-react";

type DraftInput = { business: string; offer: string; leadNeed: string; context: string; goal: string; tone: string };
const initial: DraftInput = { business: "", offer: "", leadNeed: "", context: "", goal: "follow-up", tone: "warm and professional" };

export function ClientGrowthCopilot() {
  const [form, setForm] = useState(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function update<K extends keyof DraftInput>(key: K, value: DraftInput[K]) { setForm((current) => ({ ...current, [key]: value })); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setDraft(""); setCopied(false);
    try {
      const response = await fetch("/api/client-growth-copilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We couldn’t create a draft right now.");
      setDraft(data.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The copilot is temporarily unavailable.");
    } finally { setBusy(false); }
  }

  async function copyDraft() {
    try { await navigator.clipboard.writeText(draft); setCopied(true); window.setTimeout(() => setCopied(false), 2200); } catch { setError("Copy is unavailable in this browser. Select the draft text to copy it."); }
  }

  return <section className="copilot-workbench" aria-labelledby="copilot-form-title">
    <div className="copilot-workbench-head"><div><span><Sparkles size={17}/></span><div><small>YOUR AI DRAFTING DESK</small><h2 id="copilot-form-title">What’s the conversation about?</h2></div></div><small>DEMO · NO ACCOUNT NEEDED</small></div>
    <div className="copilot-columns">
      <form className="copilot-form" onSubmit={submit}>
        <label>What does your business offer?<input required maxLength={180} value={form.offer} onChange={(e) => update("offer", e.target.value)} placeholder="e.g. Website design for local retailers" /></label>
        <label>What does this customer need?<textarea required maxLength={500} value={form.leadNeed} onChange={(e) => update("leadNeed", e.target.value)} placeholder="e.g. A five-page site with appointment booking" rows={3}/></label>
        <label>What has happened so far?<textarea maxLength={500} value={form.context} onChange={(e) => update("context", e.target.value)} placeholder="e.g. They asked for an estimate yesterday; I haven't replied yet" rows={3}/></label>
        <div className="copilot-form-row"><label>Draft type<select value={form.goal} onChange={(e) => update("goal", e.target.value)}><option value="follow-up">Follow-up message</option><option value="quote">Quote or proposal message</option><option value="reconnect">Reconnect with a quiet lead</option></select></label><label>Tone<select value={form.tone} onChange={(e) => update("tone", e.target.value)}><option>warm and professional</option><option>friendly and casual</option><option>concise and direct</option></select></label></div>
        <label className="copilot-optional">Business name <span>Optional</span><input maxLength={100} value={form.business} onChange={(e) => update("business", e.target.value)} placeholder="e.g. Northside Studio" /></label>
        {error && <p className="copilot-error" role="alert">{error}</p>}
        <button className="btn primary copilot-generate" type="submit" disabled={busy || !form.offer.trim() || !form.leadNeed.trim()}>{busy ? <><LoaderCircle className="spin" size={17}/> Preparing your draft…</> : <><Sparkles size={17}/> Create my draft</>}</button>
      </form>
      <div className={draft ? "copilot-output copilot-output-ready" : "copilot-output"} aria-live="polite">
        {draft ? <><div className="copilot-output-head"><span><Check size={16}/> YOUR FIRST DRAFT</span><button type="button" onClick={() => void copyDraft()}><Clipboard size={15}/>{copied ? "Copied" : "Copy draft"}</button></div><pre>{draft}</pre><small>Edit any detail before sending. The AI may get things wrong.</small></> : <div className="copilot-output-empty"><span><Sparkles size={22}/></span><strong>Your draft will appear here.</strong><p>Tell the copilot what you offer and what your lead is looking for. You’ll get a message plus a suggested next step.</p><div><i/><i/><i/></div></div>}
      </div>
    </div>
  </section>;
}
