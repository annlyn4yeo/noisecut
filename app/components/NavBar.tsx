import { memo } from "react";

import { ThemeToggle } from "./ThemeToggle";

function NavBarComponent() {
  return (
    <nav className="flex items-center justify-between gap-4 px-12 py-8">
      <div className="font-playfair text-[32px] leading-none text-[var(--ink)]">
        noise<span className="text-[var(--accent)]">[cut]</span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </nav>
  );
}

export const NavBar = memo(NavBarComponent);
