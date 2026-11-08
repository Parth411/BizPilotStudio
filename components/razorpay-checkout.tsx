"use client";
import Script from "next/script";
import { useState } from "react";
import { LockKeyhole, LoaderCircle } from "lucide-react";
const PRODUCT_SLUG = "small-business-management-workbook";
type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: "payment.failed", handler: (response: { error?: { description?: string; reason?: string; code?: string } }) => void) => void };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; prefill: { email: string }; theme: { color: string }; handler: (result: RazorpayResult) => void; modal: { ondismiss: () => void } };
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => RazorpayInstance } }
export function RazorpayCheckout({ country, priceLabel, quantity = 1 }: { country: string; priceLabel: string; quantity?: number }) {
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [scriptReady,setScriptReady]=useState(false);
  async function startPayment() {
    setError("");
    if (!window.Razorpay) { setError("Secure payment window is still loading. Please try again."); return; }
    setBusy(true);
    try {
      const response=await fetch("/api/checkout/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:PRODUCT_SLUG,country,quantity})});
      const order=await response.json(); if(!response.ok) throw new Error(order.error||"Could not start payment.");
      const checkout=new window.Razorpay({key:order.keyId,amount:order.amount,currency:order.currency,name:"BizPilot Studio",description:order.productName,order_id:order.orderId,prefill:{email:order.email},theme:{color:"#3478F6"},
        handler:async(result)=>{try{const verifyResponse=await fetch("/api/checkout/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(result)});const verified=await verifyResponse.json();if(!verifyResponse.ok)throw new Error(verified.error||"Payment verification failed.");window.location.assign(`/success?order=${encodeURIComponent(verified.orderId)}`);}catch(e){setError(e instanceof Error?e.message:"Payment verification failed. Contact support before paying again.");setBusy(false);}},
        modal:{ondismiss:()=>setBusy(false)}});
      checkout.on("payment.failed", (response) => {
        const description = response.error?.description || "The payment could not be completed. Please try another payment method.";
        setError(description);
        setBusy(false);
      });
      checkout.open();
    } catch(e) {setError(e instanceof Error?e.message:"Unable to start checkout.");setBusy(false);}
  }
  return <div className="checkoutbox">
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={()=>setScriptReady(true)} onError={()=>setError("Payment service could not load. Check your connection.")}/>
    {error&&<p className="checkouterror" role="alert">{error}</p>}
    <button className="btn primary checkoutbutton" onClick={startPayment} disabled={busy||!scriptReady} aria-busy={busy||!scriptReady}>{busy?<LoaderCircle className="spin" size={16}/>:!scriptReady?<LoaderCircle className="spin" size={16}/>:<LockKeyhole size={16}/>} {busy?"Preparing secure payment…":!scriptReady?"Loading secure checkout…":`Pay ${priceLabel}`}</button>
    <small>Razorpay displays only payment methods and currencies enabled for this merchant account. International payments may need separate activation.</small>
  </div>;
}
