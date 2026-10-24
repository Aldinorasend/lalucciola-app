import { test } from "node:test";
import assert from "node:assert/strict";
import { callbackPath } from "../lib/callback-path";

test("sign-in returns to the requested page, never to another site", () => {
  assert.equal(callbackPath("http://localhost:3000/bookings/calendar?view=month"), "/bookings/calendar?view=month");
  assert.equal(callbackPath("/settings"), "/settings");
  assert.equal(callbackPath("https://evil.example/steal"), "/steal");
  assert.equal(callbackPath("//evil.example/steal"), "/steal");
  assert.equal(callbackPath("http://localhost:3000/login"), "/");
  assert.equal(callbackPath(""), "/");
  assert.equal(callbackPath(null), "/");
});
