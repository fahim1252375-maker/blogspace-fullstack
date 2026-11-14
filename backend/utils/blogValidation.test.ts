import test from "node:test";
import assert from "node:assert/strict";
import {
  parseCreateBlogInput,
  parseUpdateBlogInput,
  BLOG_LIMITS,
} from "./blogValidation.ts";

const validCreate = { title: "  My story  ", content: "Hello world" };

test("create accepts a minimal body and trims the title", () => {
  const result = parseCreateBlogInput(validCreate);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.title, "My story");
    assert.equal(result.value.content, "Hello world");
  }
});

test("create rejects non-object bodies", () => {
  for (const body of [null, undefined, "text", 42, [], [{ title: "x" }]]) {
    assert.equal(parseCreateBlogInput(body).ok, false);
  }
});

test("create rejects missing or blank title and content", () => {
  assert.deepEqual(parseCreateBlogInput({ content: "x" }), {
    ok: false, message: "Story title is required",
  });
  assert.deepEqual(parseCreateBlogInput({ title: "   ", content: "x" }), {
    ok: false, message: "Story title is required",
  });
  assert.deepEqual(parseCreateBlogInput({ title: "x" }), {
    ok: false, message: "Story content is required",
  });
  assert.deepEqual(parseCreateBlogInput({ title: "x", content: "  \n " }), {
    ok: false, message: "Story content is required",
  });
});

test("create rejects non-string fields without throwing", () => {
  for (const title of [123, true, {}, [], { $ne: "" }]) {
    assert.equal(parseCreateBlogInput({ title, content: "x" }).ok, false);
  }
  assert.equal(parseCreateBlogInput({ title: "x", content: { $gt: "" } }).ok, false);
  assert.equal(parseCreateBlogInput({ ...validCreate, description: 5 }).ok, false);
  assert.equal(parseCreateBlogInput({ ...validCreate, category: ["a"] }).ok, false);
});

test("create enforces field length limits", () => {
  assert.equal(parseCreateBlogInput({ ...validCreate, title: "a".repeat(BLOG_LIMITS.title) }).ok, true);
  assert.equal(parseCreateBlogInput({ ...validCreate, title: "a".repeat(BLOG_LIMITS.title + 1) }).ok, false);
  assert.equal(parseCreateBlogInput({ ...validCreate, description: "a".repeat(BLOG_LIMITS.description + 1) }).ok, false);
  assert.equal(parseCreateBlogInput({ ...validCreate, content: "a".repeat(BLOG_LIMITS.content + 1) }).ok, false);
  assert.equal(parseCreateBlogInput({ ...validCreate, category: "a".repeat(BLOG_LIMITS.category + 1) }).ok, false);
});

test("create accepts HTTPS cover images and rejects unsafe URL schemes", () => {
  assert.equal(parseCreateBlogInput({
    ...validCreate, coverImage: "https://images.example.com/a.jpg?w=800",
  }).ok, true);

  for (const coverImage of [
    "http://example.com/a.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "not a url",
    "ftp://x.test/a.png",
    "https://user:pass@example.com/a.jpg",
  ]) {
    assert.equal(parseCreateBlogInput({ ...validCreate, coverImage }).ok, false, coverImage);
  }

  assert.equal(parseCreateBlogInput({ ...validCreate, coverImage: "" }).ok, true);
});

test("create accepts only published or draft status", () => {
  assert.equal(parseCreateBlogInput({ ...validCreate, status: "draft" }).ok, true);
  assert.equal(parseCreateBlogInput({ ...validCreate, status: "published" }).ok, true);
  assert.equal(parseCreateBlogInput({ ...validCreate, status: "archived" }).ok, false);
  assert.equal(parseCreateBlogInput({ ...validCreate, status: { $ne: "x" } }).ok, false);
});

test("create ignores unknown fields to prevent mass assignment", () => {
  const result = parseCreateBlogInput({
    ...validCreate, author: "someone-else", views: 9999, likes: 9999, _id: "x",
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(Object.keys(result.value).sort(), ["content", "title"]);
});

test("update allows an empty object as a no-op", () => {
  assert.deepEqual(parseUpdateBlogInput({}), { ok: true, value: {} });
});

test("update accepts status-only requests", () => {
  assert.deepEqual(parseUpdateBlogInput({ status: "draft" }), {
    ok: true, value: { status: "draft" },
  });
});

test("update validates only fields that are supplied", () => {
  assert.equal(parseUpdateBlogInput({ title: "New title" }).ok, true);
  assert.equal(parseUpdateBlogInput({ title: "   " }).ok, false);
  assert.equal(parseUpdateBlogInput({ title: 99 }).ok, false);
  assert.equal(parseUpdateBlogInput({ content: "  " }).ok, false);
  assert.deepEqual(parseUpdateBlogInput({ description: null }), { ok: true, value: {} });
});

test("update retains an empty description so the author can clear it", () => {
  assert.deepEqual(parseUpdateBlogInput({ description: "" }), {
    ok: true, value: { description: "" },
  });
});

test("update treats empty category and cover image as not supplied", () => {
  assert.deepEqual(parseUpdateBlogInput({ category: "", coverImage: "" }), {
    ok: true, value: {},
  });
});
