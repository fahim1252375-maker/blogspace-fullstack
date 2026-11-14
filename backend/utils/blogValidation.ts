export const BLOG_LIMITS = {
  title: 160,
  description: 300,
  content: 50_000,
  category: 50,
  coverImage: 2048,
} as const;

export type BlogStatus = "published" | "draft";

export interface CreateBlogInput {
  title: string;
  content: string;
  description?: string;
  category?: string;
  coverImage?: string;
  status?: BlogStatus;
}

export interface UpdateBlogInput {
  title?: string;
  content?: string;
  description?: string;
  category?: string;
  coverImage?: string;
  status?: BlogStatus;
}

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

type FieldResult =
  | { ok: true; value: string | undefined }
  | { ok: false; message: string };

const fail = <T>(message: string): ParseResult<T> => ({ ok: false, message });
const isAbsent = (value: unknown): boolean => value === undefined || value === null;

function asObject(body: unknown): Record<string, unknown> | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

function readText(
  raw: Record<string, unknown>,
  key: string,
  label: string,
  max: number,
  trim: boolean
): FieldResult {
  const value = raw[key];
  if (isAbsent(value)) return { ok: true, value: undefined };
  if (typeof value !== "string") return { ok: false, message: label + " must be text" };

  const text = trim ? value.trim() : value;
  if (text.length > max) {
    return { ok: false, message: label + " must be " + max + " characters or fewer" };
  }
  return { ok: true, value: text };
}

function readCoverImage(raw: Record<string, unknown>): FieldResult {
  const field = readText(raw, "coverImage", "Cover image URL", BLOG_LIMITS.coverImage, true);
  if (!field.ok || field.value === undefined || field.value === "") return field;

  try {
    const url = new URL(field.value);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
      return { ok: false, message: "Cover image URL must be a valid https URL" };
    }
  } catch {
    return { ok: false, message: "Cover image must be a valid URL" };
  }
  return field;
}

function readStatus(raw: Record<string, unknown>): ParseResult<BlogStatus | undefined> {
  const value = raw.status;
  if (isAbsent(value)) return { ok: true, value: undefined };
  if (value !== "published" && value !== "draft") {
    return fail("Status must be either 'published' or 'draft'");
  }
  return { ok: true, value };
}

function readOptionalFields(
  raw: Record<string, unknown>
): ParseResult<Omit<UpdateBlogInput, "title" | "content">> {
  const description = readText(raw, "description", "Description", BLOG_LIMITS.description, true);
  if (!description.ok) return fail(description.message);

  const category = readText(raw, "category", "Category", BLOG_LIMITS.category, true);
  if (!category.ok) return fail(category.message);

  const coverImage = readCoverImage(raw);
  if (!coverImage.ok) return fail(coverImage.message);

  const status = readStatus(raw);
  if (!status.ok) return fail(status.message);

  const value: Omit<UpdateBlogInput, "title" | "content"> = {};
  if (description.value !== undefined) value.description = description.value;
  if (category.value) value.category = category.value;
  if (coverImage.value) value.coverImage = coverImage.value;
  if (status.value) value.status = status.value;
  return { ok: true, value };
}

export function parseCreateBlogInput(body: unknown): ParseResult<CreateBlogInput> {
  const raw = asObject(body);
  if (!raw) return fail("Request body must be a JSON object");

  const title = readText(raw, "title", "Story title", BLOG_LIMITS.title, true);
  if (!title.ok) return fail(title.message);
  if (!title.value) return fail("Story title is required");

  const content = readText(raw, "content", "Story content", BLOG_LIMITS.content, false);
  if (!content.ok) return fail(content.message);
  if (!content.value || !content.value.trim()) return fail("Story content is required");

  const optional = readOptionalFields(raw);
  if (!optional.ok) return fail(optional.message);

  return {
    ok: true,
    value: { title: title.value, content: content.value, ...optional.value },
  };
}

export function parseUpdateBlogInput(body: unknown): ParseResult<UpdateBlogInput> {
  const raw = asObject(body);
  if (!raw) return fail("Request body must be a JSON object");

  const value: UpdateBlogInput = {};

  const title = readText(raw, "title", "Story title", BLOG_LIMITS.title, true);
  if (!title.ok) return fail(title.message);
  if (title.value !== undefined) {
    if (!title.value) return fail("Story title cannot be empty");
    value.title = title.value;
  }

  const content = readText(raw, "content", "Story content", BLOG_LIMITS.content, false);
  if (!content.ok) return fail(content.message);
  if (content.value !== undefined) {
    if (!content.value.trim()) return fail("Story content cannot be empty");
    value.content = content.value;
  }

  const optional = readOptionalFields(raw);
  if (!optional.ok) return fail(optional.message);

  return { ok: true, value: { ...value, ...optional.value } };
}
