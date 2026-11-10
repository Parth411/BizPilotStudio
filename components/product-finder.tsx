"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";

const questions = [
  { title: "Where are you in your business journey?", choices: [
    { label: "I’m exploring a new business idea", value: "starting", detail: "I want to check if it can work." },
    { label: "I’m getting ready to launch", value: "launching", detail: "I need a plan for costs, pricing and sales." },
    { label: "I’m already running my business", value: "operating", detail: "I want to bring day-to-day work together." },
  ] },
  { title: "What would make the biggest difference right now?", choices: [
    { label: "Knowing my numbers", value: "numbers", detail: "Costs, pricing, profit or break-even." },
    { label: "Keeping customer work organised", value: "customers", detail: "Leads, quotes, projects and payments." },
    { label: "Getting a clearer picture of performance", value: "performance", detail: "Sales, expenses and business trends." },
  ] },
  { title: "What kind of help do you prefer?", choices: [
    { label: "A guided online plan", value: "guided", detail: "Work through steps and save my progress." },
    { label: "An editable business workbook", value: "workbook", detail: "Manage operations in Microsoft Excel." },
    { label: "A free place to start", value: "free", detail: "Try a tool before deciding what I need." },
  ] },
];

type Recommendation = { name: string; reason: string; href: string; action: string; fit: string };

function recommend(answers: string[]): Recommendation {
  const [stage, need, preference] = answers;
  if (preference === "free") return {
    name: "Start with the free Business Starter planner",
    reason: "You said you want to explore before committing. The free guided planner lets you map an idea, estimate costs and test pricing to see what questions to tackle next.",
    href: "/tools/business-starter", action: "Try the free planner", fit: "Best first step for exploring",
  };
  if (preference === "workbook" || need === "customers" || stage === "operating" && need !== "numbers") return {
    name: "Small Business Management Workbook",
    reason: "Your priority is organising active business work. The editable Excel workbook brings leads, clients, quotations, projects, invoices, payments and expenses into one command centre.",
    href: "/products/small-business-management-workbook", action: "Explore the workbook", fit: "Best for day-to-day operations",
  };
  return {
    name: "Business Starter System",
    reason: "You’re working through a business idea or its numbers. The guided online planner helps estimate startup capital, test pricing and break-even, and turn goals into practical sales targets.",
    href: "/products/business-starter-system", action: "Explore the planning system", fit: "Best for planning and validation",
  };
}

export function ProductFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const result = useMemo(() => recommend(answers), [answers]);

  function select(value: string) {
    const next = [...answers.slice(0, step), value];
    setAnswers(next);
    setStep(step + 1);
  }

  function restart() { setAnswers([]); setStep(0); }

  return <section className="product-finder" aria-label="Personalised product recommendation">
    <div className="product-finder-top"><span><Sparkles size={16}/> YOUR BIZPILOT MATCH</span><small>{step < questions.length ? `QUESTION ${step + 1} OF ${questions.length}` : "YOUR RECOMMENDATION"}</small></div>
    {step < questions.length ? <>
      <div className="product-finder-progress" aria-label={`Question ${step + 1} of ${questions.length}`}><i style={{ width: `${((step + 1) / questions.length) * 100}%` }}/></div>
      <h2>{questions[step].title}</h2>
      <div className="product-finder-choices">{questions[step].choices.map((choice) => <button type="button" key={choice.value} onClick={() => select(choice.value)}><span><strong>{choice.label}</strong><small>{choice.detail}</small></span><ArrowRight size={18}/></button>)}</div>
      {step > 0 && <button type="button" className="product-finder-back" onClick={() => setStep(step - 1)}><ArrowLeft size={14}/> Previous question</button>}
    </> : <div className="product-finder-result">
      <div className="product-finder-match"><Check size={15}/> {result.fit}</div>
      <h2>{result.name}</h2>
      <p>{result.reason}</p>
      <div className="product-finder-result-actions"><Link className="btn primary" href={result.href}>{result.action} <ArrowRight size={16}/></Link><button type="button" className="product-finder-restart" onClick={restart}><RotateCcw size={14}/> Start again</button></div>
      <small className="product-finder-note">A practical recommendation based on your answers. Explore the details before you buy.</small>
    </div>}
  </section>;
}
