import { NextRequest, NextResponse } from "next/server";
import { validateSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/auth/schemas";
import { User } from "@/lib/db/models/user";

export async function PATCH(request: NextRequest) {
  try {
    // 1. Authenticate user
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = await validateSession(token);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate JSON payload
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Explicitly reject any attempt to self-assign elevated roles or change immutable fields
    if ("role" in body || "email" in body || "password" in body || "status" in body) {
      return NextResponse.json(
        {
          error:
            "Role, email, password, and account status cannot be modified via profile update.",
        },
        { status: 403 }
      );
    }

    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, avatarUrl } = parseResult.data;

    // 3. Update permitted fields on the user document
    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const updatedUser = await User.findByIdAndUpdate(
      auth.rawUser._id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser.toSafeObject(),
    });
  } catch (error) {
    console.error("PATCH /api/users/me error:", error);
    return NextResponse.json(
      { error: "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }
}
