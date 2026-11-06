import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  const raw = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "IN";
  const country = /^[A-Z]{2}$/.test(raw.toUpperCase()) ? raw.toUpperCase() : "IN";
  return NextResponse.json({ country }, { headers: { "Cache-Control": "no-store" } });
}
