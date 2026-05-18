"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useGlobalNavItems } from "@/components/global-nav/hooks/useGlobalNavItems";
import { ThemeToggle } from "@/components/theme-toggle";

export function GlobalNav() {
  const pathname = usePathname();
  const navItems = useGlobalNavItems(pathname);

  return (
    <header className="surface-card mb-8 flex items-center justify-between gap-4 px-5 py-4 max-w-5xl mx-auto">
      <Link className="site-title" href="/">
        dnd.tools
      </Link>
      <div className="flex items-center gap-4">
        <nav aria-label="Primary">
          <ul className="flex items-center gap-4">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="site-nav-link"
                  data-active={item.isActive}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
