'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="btn secondary"
      disabled={busy}
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'same-origin',
          });
          if (!response.ok) throw new Error('Sign out failed');
          window.dispatchEvent(new Event('bps-auth-changed'));
          router.replace('/account/login');
          router.refresh();
        } catch {
          setBusy(false);
        }
      }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
