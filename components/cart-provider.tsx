"use client";
import {createContext,useContext,useEffect,useMemo,useState} from "react";
import type {Product} from "@/lib/products";
type Line={product:Product;quantity:number};
type Cart={lines:Line[];count:number;subtotal:number;ready:boolean;add:(p:Product)=>void;remove:(s:string)=>void;qty:(s:string,n:number)=>void};
const C=createContext<Cart|null>(null);
export function CartProvider({children}:{children:React.ReactNode}){const[lines,setLines]=useState<Line[]>([]);const[ready,setReady]=useState(false);
useEffect(()=>{try{const v=localStorage.getItem("bizpilot-cart");if(v)setLines(JSON.parse(v));}catch{}setReady(true);},[]);
useEffect(()=>{if(ready)localStorage.setItem("bizpilot-cart",JSON.stringify(lines));},[lines,ready]);
const value=useMemo<Cart>(()=>({lines,count:lines.reduce((a,l)=>a+l.quantity,0),subtotal:lines.reduce((a,l)=>a+l.product.price*l.quantity,0),ready,add:p=>setLines(old=>{const f=old.find(x=>x.product.slug===p.slug);return f?old.map(x=>x.product.slug===p.slug?{...x,quantity:x.quantity+1}:x):[...old,{product:p,quantity:1}];}),remove:s=>setLines(old=>old.filter(x=>x.product.slug!==s)),qty:(s,n)=>setLines(old=>old.map(x=>x.product.slug===s?{...x,quantity:Math.max(1,n)}:x))}),[lines,ready]);
return <C.Provider value={value}>{children}</C.Provider>;}
export function useCart(){const v=useContext(C);if(!v)throw Error("CartProvider missing");return v;}
