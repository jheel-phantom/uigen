import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolInvocation: {
    toolCallId: string;
    toolName: string;
    args: unknown;
    state: "call" | "partial-call" | "result";
    result?: unknown;
  };
}

function parseArgs(args: unknown): Record<string, unknown> {
  if (typeof args === "string") {
    try {
      const parsed = JSON.parse(args);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // malformed JSON string
    }
    return {};
  }
  if (args && typeof args === "object" && !Array.isArray(args)) {
    return args as Record<string, unknown>;
  }
  return {};
}

function basename(filePath: unknown): string {
  if (typeof filePath !== "string" || filePath.trim() === "") return "";
  const parts = filePath.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || "";
}

export function getToolLabel(toolName: string, args: unknown): string {
  const parsed = parseArgs(args);
  const command = parsed.command as string | undefined;
  const filename = basename(parsed.path);

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return filename ? `Creating ${filename}` : "Creating";
      case "str_replace":
      case "insert":
        return filename ? `Editing ${filename}` : "Editing";
      case "view":
        return filename ? `Viewing ${filename}` : "Viewing";
      case "undo_edit":
        return filename ? `Undoing edit to ${filename}` : "Undoing edit";
      default:
        return toolName;
    }
  }

  if (toolName === "file_manager") {
    switch (command) {
      case "rename": {
        const newFilename = basename(parsed.new_path);
        return newFilename
          ? `Renaming ${filename} to ${newFilename}`
          : `Renaming ${filename}`;
      }
      case "delete":
        return filename ? `Deleting ${filename}` : "Deleting";
      default:
        return toolName;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation: tool }: ToolInvocationBadgeProps) {
  const label = getToolLabel(tool.toolName, tool.args);
  const isDone = tool.state === "result" && tool.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
