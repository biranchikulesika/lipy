export interface NavAction {
  id: string;
  label: string;
  type: "action" | "link";
  href: string;
  isExternal?: boolean;
}

export const MAIN_NAVIGATION: NavAction[] = [
  { id: "ocr", label: "OCR", type: "link", href: "/" },
  { id: "about", label: "ABOUT", type: "link", href: "/about" },
  { id: "team", label: "TEAM", type: "link", href: "/team" },
  {
    id: "LiPyD",
    label: "LiPyD",
    type: "link",
    href: "/LiPyD",
  },
  {
    id: "github",
    label: "GitHub",
    type: "link",
    href: "https://github.com/biranchikulesika/lipy",
    isExternal: true,
  },
];
