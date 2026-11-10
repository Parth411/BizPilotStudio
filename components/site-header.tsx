"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  UserCircle,
  UserRound,
  UserPlus,
  X,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useCurrency } from "@/components/currency-provider";
import { COUNTRY_OPTIONS } from "@/lib/pricing";

type Customer = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
};

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useCart();
  const { country, setCountry, price } = useCurrency();

  const links = [
    ["Home", "/"],
    ["Shop", "/shop"],
    ["Find your tool", "/tools/product-finder"],
    ["AI Copilot", "/tools/client-growth-copilot"],
    ["Business Tools", "/shop?category=business-tools"],
    ["About", "/about"],
    ["Contact", "/contact"],
  ];

  useEffect(() => {
    let active = true;

    async function refreshCustomer() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = response.ok ? await response.json() : { customer: null };
        if (active) setCustomer(data.customer ?? null);
      } catch {
        if (active) setCustomer(null);
      } finally {
        if (active) setAuthLoaded(true);
      }
    }

    const handleAuthChanged = () => {
      void refreshCustomer();
    };

    void refreshCustomer();
    window.addEventListener("bps-auth-changed", handleAuthChanged);

    return () => {
      active = false;
      window.removeEventListener("bps-auth-changed", handleAuthChanged);
    };
  }, [pathname]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Sign out failed");
      setCustomer(null);
      setAccountOpen(false);
      setOpen(false);
      router.refresh();
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  }

  const displayName = customer
    ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email
    : "My Account";

  return (
    <header className="header">
      <div className="announcement">
        <Link href="/products/small-business-management-workbook">Diwali offer · 69% off · Now {price(399)} (was {price(1299)}) <span>Shop the workbook →</span></Link>
      </div>
      <div className="nav container">
        <Link href="/" className="brand" aria-label="BizPilot Studio home">
          <Image
            src="/bizpilot-logo-lockup.png"
            alt="BizPilot Studio — Run Your Business Smarter"
            width={250}
            height={62}
            priority
          />
        </Link>

        <nav className={open ? "links open" : "links"} aria-label="Main navigation">
          {links.map(([label, href]) => (
            <Link key={label} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="navright">
          <label className="country-select" aria-label="Choose your country">
            <span>🌐</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              {COUNTRY_OPTIONS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <Link href="/cart" className="cart" aria-label={`Cart, ${count} items`}>
            <ShoppingBag size={18} /> Cart <b>{count}</b>
          </Link>

          <div className="account-menu" ref={accountRef}>
            <button
              type="button"
              className="account-trigger"
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((value) => !value)}
            >
              <UserCircle size={23} strokeWidth={1.8} />
              <ChevronDown size={13} className={accountOpen ? "account-chevron rotated" : "account-chevron"} />
            </button>

            {accountOpen && (
              <div className="account-dropdown" role="menu">
                {authLoaded && customer ? (
                  <>
                    <div className="account-dropdown-user">
                      <strong>{displayName}</strong>
                      <span>{customer.email}</span>
                    </div>
                    <Link href="/account" role="menuitem" onClick={() => setAccountOpen(false)}>
                      <UserRound size={16} /> My Account
                    </Link>
                    <Link href="/workspace" role="menuitem" onClick={() => setAccountOpen(false)}>
                      <LayoutDashboard size={16} /> Business Workspace
                    </Link>
                    <Link href="/account#orders" role="menuitem" onClick={() => setAccountOpen(false)}>
                      <Package size={16} /> My Orders
                    </Link>
                    <button type="button" role="menuitem" onClick={handleSignOut} disabled={signingOut}>
                      <LogOut size={16} /> {signingOut ? "Signing out…" : "Sign Out"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/account/login" role="menuitem" onClick={() => setAccountOpen(false)}>
                      <LogIn size={16} /> Sign In
                    </Link>
                    <Link href="/account/register" role="menuitem" onClick={() => setAccountOpen(false)}>
                      <UserPlus size={16} /> Create Account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            className="menu"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
