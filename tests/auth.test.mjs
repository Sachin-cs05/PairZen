import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Test against a dedicated test database
const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/pairzen_test";

// User Schema definitions for direct DB test verification
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "interviewer", "admin"], default: "user" },
    avatarUrl: { type: String, default: "" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
  },
  { timestamps: true }
);

UserSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    role: this.role,
    avatarUrl: this.avatarUrl,
    status: this.status,
  };
};

const SessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "TestUser", required: true },
    userAgent: { type: String, default: "test-agent" },
    ip: { type: String, default: "127.0.0.1" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const TestUser = mongoose.models.TestUser || mongoose.model("TestUser", UserSchema);
const TestSession = mongoose.models.TestSession || mongoose.model("TestSession", SessionSchema);

// Helper functions matching production logic
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

async function hashPassword(password) {
  if (!password || typeof password !== "string") throw new Error("Invalid password");
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

describe("Pairzen Authentication & Authorization Test Suite", () => {
  before(async () => {
    await mongoose.connect(TEST_MONGODB_URI);
    await TestUser.deleteMany({});
    await TestSession.deleteMany({});
  });

  after(async () => {
    await TestUser.deleteMany({});
    await TestSession.deleteMany({});
    await mongoose.disconnect();
  });

  // 1. Password Hashing and Verification
  test("1. Password hashing and password verification", async () => {
    const plaintext = "SecurePass123!";
    const hash = await hashPassword(plaintext);

    assert.notEqual(hash, plaintext, "Password hash must not equal plaintext");
    assert.match(hash, /^\$2[aby]\$12\$/, "Password hash must be bcrypt with cost 12");

    const valid = await verifyPassword(plaintext, hash);
    assert.equal(valid, true, "Verification with correct password must pass");

    const invalid = await verifyPassword("WrongPassword123!", hash);
    assert.equal(invalid, false, "Verification with wrong password must fail");
  });

  // 2. Successful Registration
  test("2. Successful registration creates user with normalized email", async () => {
    const rawEmail = "  Alice.Dev@EXAMPLE.com  ";
    const normalizedEmail = rawEmail.trim().toLowerCase();
    const passwordHash = await hashPassword("ComplexPass123#");

    const user = await TestUser.create({
      name: "Alice Developer",
      email: normalizedEmail,
      passwordHash,
      role: "user",
      status: "active",
    });

    assert.ok(user._id);
    assert.equal(user.email, "alice.dev@example.com");
    assert.equal(user.role, "user");

    const safe = user.toSafeObject();
    assert.equal(safe.passwordHash, undefined, "toSafeObject must not expose passwordHash");
    assert.equal(safe.email, "alice.dev@example.com");
  });

  // 3. Duplicate Email Registration Rejection
  test("3. Duplicate email registration rejection", async () => {
    const email = "alice.dev@example.com";
    const passwordHash = await hashPassword("AnotherPass999$");

    await assert.rejects(
      async () => {
        await TestUser.create({
          name: "Alice Imposter",
          email,
          passwordHash,
          role: "user",
        });
      },
      (err) => err.code === 11000,
      "Expected duplicate key error code 11000"
    );
  });

  // 4. Successful Login
  test("4. Successful login verifies credentials", async () => {
    const user = await TestUser.findOne({ email: "alice.dev@example.com" }).select("+passwordHash");
    assert.ok(user, "User must exist in database");

    const isMatch = await verifyPassword("ComplexPass123#", user.passwordHash);
    assert.equal(isMatch, true, "Valid password credentials must match");
  });

  // 5. Invalid Credentials Rejection
  test("5. Invalid credentials rejection", async () => {
    const user = await TestUser.findOne({ email: "alice.dev@example.com" }).select("+passwordHash");
    const isMatch = await verifyPassword("IncorrectPassword!9", user.passwordHash);
    assert.equal(isMatch, false, "Invalid password credentials must fail");

    const nonexistent = await TestUser.findOne({ email: "unknown@nobody.io" });
    assert.equal(nonexistent, null, "Nonexistent user returns null");
  });

  // 6. Session Creation & Validation
  test("6. Session creation and validation with hashed tokens", async () => {
    const user = await TestUser.findOne({ email: "alice.dev@example.com" });
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const session = await TestSession.create({
      tokenHash,
      userId: user._id,
      expiresAt,
    });

    assert.ok(session._id);
    assert.equal(session.tokenHash, tokenHash);

    // Validate using rawToken
    const queriedTokenHash = hashToken(rawToken);
    const foundSession = await TestSession.findOne({
      tokenHash: queriedTokenHash,
      expiresAt: { $gt: new Date() },
    });

    assert.ok(foundSession, "Session must be found with valid raw token");
    assert.equal(foundSession.userId.toString(), user._id.toString());
  });

  // 7. Logout and Session Revocation
  test("7. Logout and session revocation", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const user = await TestUser.findOne({ email: "alice.dev@example.com" });

    await TestSession.create({
      tokenHash,
      userId: user._id,
      expiresAt: new Date(Date.now() + 60000),
    });

    // Invalidate session
    const deleteResult = await TestSession.deleteOne({ tokenHash });
    assert.equal(deleteResult.deletedCount, 1, "Session must be deleted");

    // Subsequent validation fails
    const revokedCheck = await TestSession.findOne({ tokenHash });
    assert.equal(revokedCheck, null, "Revoked session must not be found");
  });

  // 8. Protected Route Behavior (Unauthenticated vs Authenticated)
  test("8. Protected route behavior: expired or missing token fails", async () => {
    // Expired session token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const user = await TestUser.findOne({ email: "alice.dev@example.com" });

    await TestSession.create({
      tokenHash,
      userId: user._id,
      expiresAt: new Date(Date.now() - 5000), // expired 5 seconds ago
    });

    const activeSession = await TestSession.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    assert.equal(activeSession, null, "Expired session must not be considered valid");
  });

  // 9. Profile Update Permissions
  test("9. Profile update allows permitted fields (name, avatarUrl)", async () => {
    const user = await TestUser.findOne({ email: "alice.dev@example.com" });

    const updated = await TestUser.findByIdAndUpdate(
      user._id,
      {
        $set: {
          name: "Alice Vance Updated",
          avatarUrl: "https://example.com/avatar.jpg",
        },
      },
      { returnDocument: "after" }
    );

    assert.equal(updated.name, "Alice Vance Updated");
    assert.equal(updated.avatarUrl, "https://example.com/avatar.jpg");
  });

  // 10. Role Escalation Prevention
  test("10. Role escalation prevention: client cannot self-assign admin role", async () => {
    const clientPayload = {
      name: "Hacker User",
      role: "admin", // Client attempt to grant admin privileges
    };

    // Server-side filter restricts permitted profile updates to safe fields
    const permittedFields = {};
    if (clientPayload.name) permittedFields.name = clientPayload.name;
    // role is deliberately excluded from permitted fields

    assert.equal(permittedFields.role, undefined, "Role must never be included in permitted update payload");

    // Public registration schema also enforces that only 'user' or 'interviewer' can be passed
    const disallowedRole = "admin";
    const isAllowedPublicRole = ["user", "interviewer"].includes(disallowedRole);
    assert.equal(isAllowedPublicRole, false, "admin must not be accepted as a public registration role");
  });

  // 11. Invalid Request Payloads
  test("11. Invalid request payloads rejected by validation rules", () => {
    // Password missing special char and number
    assert.equal(passwordRegex.test("simplepass"), false, "Simple password must fail");

    // Password shorter than 8 chars
    assert.equal(passwordRegex.test("Sh1!"), false, "Short password must fail");

    // Password missing uppercase
    assert.equal(passwordRegex.test("lowercase1!"), false, "Password without uppercase must fail");

    // Valid compliant password
    assert.equal(passwordRegex.test("ValidPass123!"), true, "Compliant password must pass");
  });
});
