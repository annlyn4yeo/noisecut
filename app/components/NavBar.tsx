import { memo } from "react";

function NavBarComponent() {
  return (
    <nav className="flex items-center justify-between gap-4 px-12 py-8">
      <div className="font-playfair text-[32px] leading-none text-ink">
        noise<span className="text-signal">[cut]</span>
      </div>
      <div className="rounded-full border border-ink/20 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-ink">
        signal extractor
      </div>
    </nav>
  );
}

export const NavBar = memo(NavBarComponent);
