import type { ToolDefinition } from "../catalog/tools";

export function ToolMark({ tool, className }: { tool: ToolDefinition; className: string }) {
  return (
    <span className={`${className}${tool.logo ? " has-logo" : ""}`} aria-hidden="true">
      {tool.logo ? <img src={tool.logo} alt="" loading="lazy" /> : tool.mark}
    </span>
  );
}
