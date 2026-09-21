import assert from "node:assert/strict";
import test from "node:test";

import {
  isKnownPublicSyntheticValue,
  isPublicCommentReady,
  isPublicEchoReady,
  isPublicWritingReady,
} from "../lib/public-content-hygiene";

const writing = (title: string, slug = "a-real-piece") => ({
  title,
  slug,
  deck: "A considered editorial deck.",
  excerpt: "A public excerpt with enough context to be meaningful.",
});

test("known visitor-facing synthetic and recovery markers are suppressed deterministically", () => {
  for (const value of [
    "Writing Test Updated",
    "Test",
    "Archive Recovery Test Message",
    "QA: content",
    "fixture-record",
    "Synthetic data",
    "development-only_entry",
  ]) {
    assert.equal(isKnownPublicSyntheticValue(value), true, value);
  }
});

test("legitimate editorial uses of test, recovery, and development remain public", () => {
  for (const value of [
    "Test automation as a craft",
    "How recovery changes a team",
    "Development without burnout",
    "A synthetic material with a real story",
  ]) {
    assert.equal(isKnownPublicSyntheticValue(value), false, value);
  }
});

test("writing and EchoWall use the same narrow public-readiness boundary", () => {
  assert.equal(isPublicWritingReady(writing("Writing Test Updated", "writing-test-updated")), false);
  assert.equal(isPublicWritingReady(writing("A real piece about testing")), true);
  assert.equal(isPublicEchoReady({ displayName: "Visitor", message: "Archive Recovery Test Message" }), false);
  assert.equal(isPublicEchoReady({ displayName: "Test Automation Engineer", message: "Testing can protect human work." }), true);
  assert.equal(isPublicCommentReady({
    deletion: "active", id: "comment-1", identity: "guest", displayName: "QA: content", isAuthor: false,
    isEdited: false, body: "A comment", createdAt: "2026-09-21T12:00:00.000Z", canEdit: false,
    canDelete: false, ownerVersion: null,
  }), false);
  assert.equal(isPublicCommentReady({
    deletion: "author", id: "comment-2", identity: "account", createdAt: "2026-09-21T12:00:00.000Z",
    isAuthor: false, isEdited: false, canEdit: false, canDelete: false, ownerVersion: null,
  }), true);
});
