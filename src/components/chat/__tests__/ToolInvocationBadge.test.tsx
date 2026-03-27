import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// getToolLabel — pure function unit tests
// ---------------------------------------------------------------------------

test("str_replace_editor create returns Creating {filename}", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/components/App.jsx" })).toBe("Creating App.jsx");
});

test("str_replace_editor str_replace returns Editing {filename}", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.tsx" })).toBe("Editing Card.tsx");
});

test("str_replace_editor insert returns Editing {filename}", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/components/Card.tsx" })).toBe("Editing Card.tsx");
});

test("str_replace_editor view returns Viewing {filename}", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/src/index.ts" })).toBe("Viewing index.ts");
});

test("str_replace_editor undo_edit returns Undoing edit to {filename}", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/foo.js" })).toBe("Undoing edit to foo.js");
});

test("str_replace_editor unknown command falls back to tool name", () => {
  expect(getToolLabel("str_replace_editor", { command: "unknown_cmd" })).toBe("str_replace_editor");
});

test("str_replace_editor args as JSON string (MockLanguageModel format)", () => {
  const args = JSON.stringify({ command: "create", path: "/components/App.jsx" });
  expect(getToolLabel("str_replace_editor", args)).toBe("Creating App.jsx");
});

test("str_replace_editor args as JSON string for str_replace", () => {
  const args = JSON.stringify({ command: "str_replace", path: "/components/Header.tsx" });
  expect(getToolLabel("str_replace_editor", args)).toBe("Editing Header.tsx");
});

test("str_replace_editor missing path returns verb only", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating");
});

test("str_replace_editor empty path returns verb only", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "" })).toBe("Creating");
});

test("str_replace_editor path with no slashes returns full path as filename", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "App.jsx" })).toBe("Creating App.jsx");
});

test("file_manager rename returns Renaming {filename} to {newFilename}", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old.tsx", new_path: "/new.tsx" })).toBe("Renaming old.tsx to new.tsx");
});

test("file_manager rename missing new_path returns Renaming {filename}", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old.tsx" })).toBe("Renaming old.tsx");
});

test("file_manager delete returns Deleting {filename}", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/foo.tsx" })).toBe("Deleting foo.tsx");
});

test("file_manager unknown command falls back to tool name", () => {
  expect(getToolLabel("file_manager", { command: "move" })).toBe("file_manager");
});

test("unknown tool name returns raw tool name", () => {
  expect(getToolLabel("my_custom_tool", { command: "create" })).toBe("my_custom_tool");
});

test("args is null returns raw tool name", () => {
  expect(getToolLabel("str_replace_editor", null)).toBe("str_replace_editor");
});

test("args is undefined returns raw tool name", () => {
  expect(getToolLabel("str_replace_editor", undefined)).toBe("str_replace_editor");
});

test("args is an array returns raw tool name", () => {
  expect(getToolLabel("str_replace_editor", [])).toBe("str_replace_editor");
});

test("args is malformed JSON string returns raw tool name", () => {
  expect(getToolLabel("str_replace_editor", "not valid json {")).toBe("str_replace_editor");
});

test("args is valid JSON but a number returns raw tool name", () => {
  expect(getToolLabel("str_replace_editor", "42")).toBe("str_replace_editor");
});

// ---------------------------------------------------------------------------
// ToolInvocationBadge — component render tests
// ---------------------------------------------------------------------------

function makeInvocation(
  overrides: Partial<{
    toolName: string;
    args: unknown;
    state: "call" | "partial-call" | "result";
    result: unknown;
  }> = {}
) {
  return {
    toolCallId: "test-id",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/components/App.jsx" },
    state: "result" as const,
    result: "ok",
    ...overrides,
  };
}

test("renders friendly label in DOM", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation()} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows green dot when state is result and result is truthy", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation({ state: "result", result: "ok" })} />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is call", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation({ state: "call", result: undefined })} />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is partial-call", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation({ state: "partial-call", result: undefined })} />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is result but result is falsy (null)", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation({ state: "result", result: null })} />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("renders raw tool name for unknown tool", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation({ toolName: "my_custom_tool", args: {} })}
    />
  );
  expect(screen.getByText("my_custom_tool")).toBeDefined();
});

test("badge has correct outer classes", () => {
  const { container } = render(<ToolInvocationBadge toolInvocation={makeInvocation()} />);
  const badge = container.firstChild as HTMLElement;
  expect(badge.classList.contains("inline-flex")).toBe(true);
  expect(badge.classList.contains("items-center")).toBe(true);
  expect(badge.classList.contains("font-mono")).toBe(true);
  expect(badge.classList.contains("mt-2")).toBe(true);
});
