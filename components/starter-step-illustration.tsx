import { Activity, BarChart3, BriefcaseBusiness, CheckCheck, CircleDollarSign, Crosshair, Gauge, Lightbulb, Megaphone, PieChart, Sparkles } from 'lucide-react';
const icons=[BriefcaseBusiness,Lightbulb,WalletIcon,CircleDollarSign,BarChart3,Megaphone,CheckCheck,Activity,Sparkles,Gauge];
function WalletIcon(){return <PieChart size={18}/>;}
const labels=['BUSINESS SETUP','IDEA SIGNALS','STARTUP COSTS','PRICE & MARGIN','BREAK-EVEN','SALES FUNNEL','LAUNCH CHECKLIST','ACTUAL VS PLAN','AI REVIEW','GROWTH SNAPSHOT'];
export function StarterStepIllustration({index}:{index:number}){
 const Icon=icons[index]||Crosshair;
 return <div className={`step-illustration art-${index+1}`} role="img" aria-label={labels[index]||'Business planning illustration'}>
   <div className="step-art-toolbar"><span><Icon size={14}/></span><b>{labels[index]}</b><i/></div>
   {index===0&&<div className="step-art-setup"><span>YOUR BUSINESS</span><b>Idea → Plan</b><div><i/> Customer <strong>Defined</strong></div><div><i/> Market <strong>Selected</strong></div></div>}
   {index===1&&<div className="step-art-evidence"><div className="evidence-ring"><Crosshair size={23}/><b>Demand</b></div><div><i/><i/><i/><small>Evidence strength</small></div></div>}
   {index===2&&<div className="step-art-costs"><span>STARTUP BUDGET</span><b>₹ 48,500</b><div><i style={{width:'72%'}}/><i style={{width:'46%'}}/><i style={{width:'61%'}}/></div><small>Setup · monthly · buffer</small></div>}
   {index===3&&<div className="step-art-price"><div><span>SELL PRICE</span><b>₹ 799</b></div><div className="price-bar"><i/><i/><i/></div><small>Costs → margin → profit</small></div>}
   {index===4&&<div className="step-art-breakeven"><span>ORDERS / MONTH</span><div><i/><i/><i/><i/><i/><i/><b/></div><small>Break-even point</small></div>}
   {index===5&&<div className="step-art-funnel"><div>VISITORS <b>1,200</b></div><div>ORDERS <b>36</b></div><div>PROFIT GOAL <b>₹ 25k</b></div></div>}
   {index===6&&<div className="step-art-tasks"><div><i>✓</i> Talk to customers</div><div><i>✓</i> Check the offer</div><div><i/> Prepare launch</div></div>}
   {index===7&&<div className="step-art-compare"><span>PLAN</span><span>ACTUAL</span><div><i style={{height:'45%'}}/><i style={{height:'68%'}}/><i style={{height:'57%'}}/><i style={{height:'86%'}}/><i style={{height:'78%'}}/><i style={{height:'62%'}}/></div><small>Review · adjust · repeat</small></div>}
   {index===8&&<div className="step-art-ai"><span><Sparkles size={23}/></span><div><b>AI REVIEW</b><small>Strengths · risks</small><small>Next steps</small></div><i>READY</i></div>}
   {index===9&&<div className="step-art-kpis"><div><small>READINESS</small><b>76%</b><i/></div><div><small>MONTHLY GOAL</small><b>₹ 25k</b><i/></div><div><small>NEXT STEP</small><b>Launch</b><i/></div></div>}
 </div>;
}
