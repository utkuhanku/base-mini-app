import { Errors, createClient } from "@farcaster/quick-auth";
import { NextRequest } from "next/server";

const client = createClient();

/**
 * Helper to get the validation domain for the JWT.
 * It's critical this matches the domain where the token was generated (the mini app URL).
 */
function getUrlHost(request: NextRequest): string {
    // 1. Try Origin header (most reliable for CORS/API calls)
    const origin = request.headers.get("origin");
    if (origin) {
        try {
            return new URL(origin).host;
        } catch (e) {
            console.warn("Invalid origin header:", origin, e);
        }
    }

    // 2. Try Host header
    const host = request.headers.get("host");
    if (host) return host;

    // 3. Fallback to env vars (for local dev or strict production override)
    if (process.env.VERCEL_ENV === "production" && process.env.NEXT_PUBLIC_URL) {
        return new URL(process.env.NEXT_PUBLIC_URL).host;
    }

    if (process.env.VERCEL_URL) {
        return process.env.VERCEL_URL;
    }

    return "localhost:3000";
}

export type QuickAuthPayload = {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    custody?: string;
    authenticated: true;
};

/**
 * Verifies the `Authorization: Bearer <token>` header using Farcaster Quick Auth.
 * Throws an error or returns the valid payload.
 */
export async function verifyQuickAuthRequest(request: NextRequest): Promise<QuickAuthPayload> {
    const authorization = request.headers.get("Authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
        throw new Error("Missing or invalid Authorization header");
    }

    const token = authorization.split(" ")[1];
    const domain = getUrlHost(request);

    try {
        const result = await client.verifyJwt({ token, domain });

        // In strict Quick Auth, we rely on the sub (fid).
        // The JWT might contain basic profile info if configured, but primarily it proves FID ownership.
        return {
            fid: Number(result.sub),
            // Map custody address if available in the JWT payload claims
            custody: (result as any).custody || (result as any).custody_address,
            authenticated: true,
        };
    } catch (e) {
        if (e instanceof Errors.InvalidTokenError) {
            throw new Error("Invalid Quick Auth token");
        }
        // Re-throw other errors for the caller to handle (500s)
        throw e;
    }
}
