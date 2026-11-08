import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  Box,
  CircleHelp,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings2,
  ShoppingBag,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { getCurrentCustomer } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getProduct } from '@/lib/products';
import { SignOutButton } from '@/components/sign-out-button';

export const dynamic = 'force-dynamic';

const downloadableProducts = new Set(['small-business-management-workbook']);

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatAmount(value: number | string, currency: string) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currency.trim(),
  }).format(Number(value) / 100);
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect('/account/login?next=/account');

  const [orders, paidCountRows, downloadCountRows] = await Promise.all([
    sql`SELECT id, product_name, product_slug, amount, currency, status, created_at FROM customer_orders WHERE customer_id = ${customer.id} ORDER BY created_at DESC LIMIT 50`,
    sql`SELECT COUNT(*) AS total FROM customer_orders WHERE customer_id = ${customer.id} AND status = 'paid'`,
    sql`SELECT COUNT(*) AS total FROM customer_orders WHERE customer_id = ${customer.id} AND status = 'paid' AND product_slug = 'small-business-management-workbook'`,
  ]);

  const paidOrderCount = Number(paidCountRows[0]?.total ?? 0);
  const downloadCount = Number(downloadCountRows[0]?.total ?? 0);
  const paidOrders = orders.filter((order: any) => order.status === 'paid');
  const productMap = new Map<string, NonNullable<ReturnType<typeof getProduct>>>();
  for (const order of paidOrders) {
    const product = getProduct(String(order.product_slug));
    if (product) productMap.set(product.slug, product);
  }
  const ownedProducts = Array.from(productMap.values());
  const initials = `${customer.first_name?.[0] ?? ''}${customer.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <section className="account-page">
      <div className="account-shell">
        <aside className="account-sidebar" aria-label="Customer workspace navigation">
          <div className="workspace-label"><span className="workspace-mark"><LayoutDashboard size={17} /></span><span>YOUR WORKSPACE<small>Customer account</small></span></div>
          <nav className="workspace-nav">
            <a className="workspace-link active" href="#overview" aria-current="page"><LayoutDashboard size={17} />Overview</a>
            <a className="workspace-link" href="#products"><Package size={17} />My products</a>
            <a className="workspace-link" href="#downloads"><ArrowDownToLine size={17} />My downloads</a>
            <a className="workspace-link" href="#orders"><CreditCard size={17} />Order history</a>
            <a className="workspace-link" href="#profile"><Settings2 size={17} />Profile</a>
          </nav>
          <div className="workspace-sidebar-bottom">
            <div className="help-card"><span className="help-icon"><CircleHelp size={17} /></span><strong>Need a hand?</strong><p>Find answers or get in touch with our team.</p><Link href="/faq">Visit help centre <ArrowRight size={14} /></Link></div>
            <div className="workspace-user"><span className="user-avatar">{initials || <UserRound size={17} />}</span><span className="workspace-user-copy"><strong>{customer.first_name} {customer.last_name}</strong><small>{customer.email}</small></span><SignOutButton /></div>
          </div>
        </aside>

        <main className="account-main" id="overview">
          <header className="account-welcome">
            <div>
              <div className="account-eyebrow"><Sparkles size={14} /> BIZPILOT STUDIO WORKSPACE</div>
              <h1>Good to have you here, {customer.first_name}.</h1>
              <p>Your products and purchase details, all in one place.</p>
            </div>
            <Link className="account-shop-link" href="/shop"><ShoppingBag size={16} /> Browse the shop <ArrowRight size={15} /></Link>
          </header>

          <div className="account-metrics" aria-label="Account summary">
            <article className="account-metric"><span className="metric-icon blue"><ShoppingBag size={18} /></span><span className="metric-copy"><small>PAID PURCHASES</small><strong>{paidOrderCount}</strong><span>Completed orders</span></span></article>
            <article className="account-metric"><span className="metric-icon mint"><ArrowDownToLine size={18} /></span><span className="metric-copy"><small>AVAILABLE DOWNLOADS</small><strong>{downloadCount}</strong><span>Ready in your library</span></span></article>
            <article className="account-metric account-metric-note"><span className="metric-icon gold"><BadgeCheck size={18} /></span><span className="metric-copy"><small>ACCOUNT ACCESS</small><strong>Signed in</strong><span>Your workspace is ready</span></span></article>
          </div>

          <div className="account-content-grid">
            <div className="account-primary-column">
              <section className="workspace-panel" id="products">
                <div className="panel-heading"><div><span className="panel-kicker">YOUR LIBRARY</span><h2>My products</h2><p>Products you have purchased are collected here.</p></div><span className="panel-count">{ownedProducts.length} {ownedProducts.length === 1 ? 'product' : 'products'}</span></div>
                {ownedProducts.length ? (
                  <div className="library-list">{ownedProducts.map((product) => {
                    const productOrders = paidOrders.filter((order: any) => order.product_slug === product.slug);
                    const downloadable = downloadableProducts.has(product.slug);
                    return <article className="library-item" key={product.slug}>
                      <div className="library-art"><span><Box size={23} /></span></div>
                      <div className="library-info"><span className="library-category">{product.category}</span><h3>{product.name}</h3><p>{product.format} <span>·</span> Purchased {formatDate(productOrders[0].created_at)}</p></div>
                      {downloadable ? <a className="download-button" href={`/api/download?order=${encodeURIComponent(productOrders[0].id)}`}><ArrowDownToLine size={16} /><span>Download</span></a> : <span className="library-status">Access available</span>}
                    </article>;
                  })}</div>
                ) : (
                  <div className="account-empty"><span><Package size={21} /></span><div><strong>Your library is ready for its first product.</strong><p>Once a purchase is complete, you will find the product and its files here.</p></div><Link href="/shop">Explore products <ArrowRight size={14} /></Link></div>
                )}
                <div className="library-footnote"><BadgeCheck size={15} /><span>Your purchased files are delivered through your account.</span></div>
              </section>

              <section className="workspace-panel orders-panel" id="orders">
                <div className="panel-heading"><div><span className="panel-kicker">PURCHASE ACTIVITY</span><h2>Order history</h2><p>Your latest orders and payment status.</p></div>{orders.length > 4 && <a className="panel-text-link" href="#all-orders">See all orders <ArrowRight size={14} /></a>}</div>
                {orders.length ? <div className="order-table-wrap"><table className="order-table"><thead><tr><th>Product</th><th>Order date</th><th>Status</th><th className="amount-cell">Total</th></tr></thead><tbody>{orders.slice(0, 4).map((order: any) => <tr key={order.id}><td><span className="order-product-icon"><Package size={16} /></span><span className="order-product-name">{order.product_name}</span></td><td>{formatDate(order.created_at)}</td><td><span className={`order-status ${String(order.status).toLowerCase()}`}>{order.status === 'paid' ? <BadgeCheck size={13} /> : <Clock3 size={13} />}{statusLabel(order.status)}</span></td><td className="amount-cell">{formatAmount(order.amount, order.currency)}</td></tr>)}</tbody></table></div> : <div className="orders-empty"><span>No orders yet.</span><Link href="/shop">Browse products <ArrowRight size={14} /></Link></div>}
                {orders.length > 4 && <div className="all-orders" id="all-orders"><h3>Earlier orders</h3>{orders.slice(4).map((order: any) => <div className="older-order" key={order.id}><span>{order.product_name}</span><span>{formatDate(order.created_at)}</span><span className={`order-status ${String(order.status).toLowerCase()}`}>{statusLabel(order.status)}</span><span>{formatAmount(order.amount, order.currency)}</span></div>)}</div>}
              </section>
            </div>

            <aside className="account-secondary-column">
              <section className="workspace-panel download-panel" id="downloads">
                <div className="panel-heading compact"><div><span className="panel-kicker">QUICK ACCESS</span><h2>My downloads</h2></div><span className="download-total">{downloadCount}</span></div>
                {downloadCount ? <div className="download-shortcuts">{paidOrders.filter((order: any) => downloadableProducts.has(String(order.product_slug))).slice(0, 3).map((order: any) => <a className="download-shortcut" href={`/api/download?order=${encodeURIComponent(order.id)}`} key={order.id}><span className="download-file-icon"><ArrowDownToLine size={16} /></span><span><strong>{order.product_name}</strong><small>ZIP package · {formatDate(order.created_at)}</small></span><ArrowRight size={15} /></a>)}</div> : <div className="download-empty"><ArrowDownToLine size={19} /><p>Downloads for completed purchases will appear here.</p></div>}
                <p className="private-note"><BadgeCheck size={14} /> Files are available to the account that made the purchase.</p>
              </section>

              <section className="workspace-panel profile-panel" id="profile">
                <div className="panel-heading compact"><div><span className="panel-kicker">ACCOUNT DETAILS</span><h2>Profile</h2></div><span className="profile-avatar">{initials || <UserRound size={18} />}</span></div>
                <dl className="profile-details"><div><dt>Name</dt><dd>{customer.first_name} {customer.last_name}</dd></div><div><dt>Email address</dt><dd>{customer.email}</dd></div></dl>
                <p className="profile-note">Need to update your details? <Link href="/contact">Contact support</Link> and we’ll help.</p>
              </section>

              <section className="workspace-promo"><span className="promo-sparkle"><Sparkles size={17} /></span><span className="panel-kicker">MAKE WORK A LITTLE EASIER</span><h2>Find your next useful tool.</h2><p>Explore practical resources built for the day-to-day of running a business.</p><Link href="/shop">Explore the shop <ArrowRight size={15} /></Link><span className="promo-decoration">B<span>.</span></span></section>
            </aside>
          </div>
          <div className="account-footer-line">Questions about an order? <Link href="/faq">Visit our help centre</Link> or <Link href="/contact">contact us</Link>.</div>
        </main>
      </div>
    </section>
  );
}
