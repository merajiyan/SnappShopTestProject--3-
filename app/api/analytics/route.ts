import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));

  // In a real app this would forward to a backend analytics service.
  // Keeping this endpoint minimal so browser payloads stay small.
  // eslint-disable-next-line no-console
  console.log("Analytics event:", JSON.stringify(payload));

  return NextResponse.json({ status: "ok" });
}
