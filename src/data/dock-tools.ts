export type DockTool = {
  name: string;
  iconImage: string;
  url: string;
};

export const DOCK_TOOLS: DockTool[] = [
  { name: "Figma", iconImage: "/icons/figma.png", url: "https://www.figma.com" },
  { name: "Photoshop", iconImage: "/icons/photoshop.png", url: "https://www.adobe.com/products/photoshop.html" },
  { name: "Illustrator", iconImage: "/icons/illustrator.png", url: "https://www.adobe.com/products/illustrator.html" },
  { name: "Claude Code", iconImage: "/icons/claude.png", url: "https://www.claude.com/product/claude-code" },
  { name: "OpenAI Codex", iconImage: "/icons/codex.png", url: "https://openai.com/codex/" },
  { name: "Vercel V0", iconImage: "/icons/v0.png", url: "https://v0.dev" },
  { name: "Lovable", iconImage: "/icons/lovable.png", url: "https://lovable.dev" },
  { name: "Notion", iconImage: "/icons/notion.png", url: "https://www.notion.so" },
  { name: "VS Code", iconImage: "/icons/vscode.png", url: "https://code.visualstudio.com" },
];
