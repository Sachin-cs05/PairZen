import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { HintRequestSchema } from "@/lib/ai/types";
import { handleAIHint } from "@/lib/ai/service";

export async function POST(req: NextRequest) {
  try {
    const auth = await validateSession();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = HintRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const hint = await handleAIHint(auth.user.id, parseResult.data);

    return NextResponse.json({
      success: true,
      hint,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate hint";
    const status = msg.includes("not an authorized participant") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: msg },
      { status }
    );
  }
}
