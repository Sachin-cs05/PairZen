import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { ComplexityRequestSchema } from "@/lib/ai/types";
import { handleAIComplexityAnalysis } from "@/lib/ai/service";

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
    const parseResult = ComplexityRequestSchema.safeParse(body);
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

    const complexity = await handleAIComplexityAnalysis(auth.user.id, parseResult.data);

    return NextResponse.json({
      success: true,
      complexity,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to analyze complexity";
    const status = msg.includes("not an authorized participant") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: msg },
      { status }
    );
  }
}
