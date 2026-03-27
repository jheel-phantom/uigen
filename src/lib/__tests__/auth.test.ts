// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: mockCookieGet,
  }),
}));

const { getSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(
  payload: Record<string, unknown>,
  expirationTime = "7d"
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("returns null when no cookie is present", async () => {
  mockCookieGet.mockReturnValue(undefined);

  const result = await getSession();

  expect(result).toBeNull();
});

test("returns null when cookie has no value", async () => {
  mockCookieGet.mockReturnValue({ value: undefined });

  const result = await getSession();

  expect(result).toBeNull();
});

test("returns session payload for a valid token", async () => {
  const token = await makeToken({ userId: "user-1", email: "user@example.com" });
  mockCookieGet.mockReturnValue({ value: token });

  const result = await getSession();

  expect(result).not.toBeNull();
  expect(result?.userId).toBe("user-1");
  expect(result?.email).toBe("user@example.com");
});

test("returns null for a malformed token string", async () => {
  mockCookieGet.mockReturnValue({ value: "not.a.valid.jwt" });

  const result = await getSession();

  expect(result).toBeNull();
});

test("returns null for a token signed with a different secret", async () => {
  const wrongSecret = new TextEncoder().encode("wrong-secret");
  const token = await new SignJWT({ userId: "user-1", email: "user@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(wrongSecret);
  mockCookieGet.mockReturnValue({ value: token });

  const result = await getSession();

  expect(result).toBeNull();
});

test("returns null for an expired token", async () => {
  const token = await makeToken(
    { userId: "user-1", email: "user@example.com" },
    "-1s" // expired 1 second ago
  );
  mockCookieGet.mockReturnValue({ value: token });

  const result = await getSession();

  expect(result).toBeNull();
});

test("returns null for an empty token string", async () => {
  mockCookieGet.mockReturnValue({ value: "" });

  const result = await getSession();

  expect(result).toBeNull();
});
