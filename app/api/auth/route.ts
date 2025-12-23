import { verifyQuickAuthRequest } from "@/lib/auth/quickAuth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyQuickAuthRequest(request);

    return NextResponse.json({
      success: true,
      user: payload,
    });
  } catch (e: any) {
    const message = e.message || "Unknown error";

    if (message === "Missing or invalid Authorization header" || message === "Invalid Quick Auth token") {
      return NextResponse.json({ message }, { status: 401 });
    }

    console.error("Auth error:", e);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}