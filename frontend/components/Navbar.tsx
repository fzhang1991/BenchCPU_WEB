"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Navbar.module.css";

type DropItem = {
  label: string;
  href?: string;
  external?: boolean;
  disabled?: boolean;
};

function Dropdown({
  label,
  items,
  active,
}: {
  label: string;
  items: DropItem[];
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={wrapRef} className={styles.dropWrap}>
      <button
        className={`${styles.navItem} ${styles.dropBtn} ${active ? styles.navActive : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        type="button"
      >
        <span>{label}</span>
        <span className={styles.chev} aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {items.map((it, idx) => {
            if (it.disabled) {
              return (
                <span
                  key={`${it.label}-${idx}`}
                  className={`${styles.menuItem} ${styles.menuItemDisabled}`}
                  role="menuitem"
                  aria-disabled="true"
                >
                  {it.label}
                </span>
              );
            }

            if (it.external && it.href) {
              return (
                <a
                  key={it.href}
                  href={it.href}
                  className={styles.menuItem}
                  role="menuitem"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                >
                  {it.label}
                </a>
              );
            }

            if (it.href) {
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {it.label}
                </Link>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  const nav = useMemo(
    () => ({
      leaderboard: { label: "Model Leaderboard", href: "/leaderboard" },
      probe: { label: "Dataset Analysis", href: "/probe-analysis" },
      explore: { label: "Explore", href: "/explore" },
      about: {
        label: "About",
        items: [
          {
            label: "Paper",
            href: "https://arxiv.org/abs/2603.04408",
            external: true,
          },
          {
            label: "Code (Coming soon)",
            disabled: true,
          },
        ],
      },
    }),
    []
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <Link
          href="/"
          aria-label="Home"
          title="Home"
          className={`${styles.logo} ${isActive("/") ? styles.logoActive : ""}`}
        >
          <span className={styles.logoA}>Probing</span>
          <span className={styles.logoB}>Memes</span>
        </Link>

        <nav className={styles.nav}>
          <Link
            href={nav.leaderboard.href}
            className={`${styles.navItem} ${isActive(nav.leaderboard.href) ? styles.navActive : ""}`}
          >
            {nav.leaderboard.label}
          </Link>

          <Link
            href={nav.probe.href}
            className={`${styles.navItem} ${isActive(nav.probe.href) ? styles.navActive : ""}`}
          >
            {nav.probe.label}
          </Link>

          <Link
            href={nav.explore.href}
            className={`${styles.navItem} ${isActive(nav.explore.href) ? styles.navActive : ""}`}
          >
            {nav.explore.label}
          </Link>

          <Dropdown
            label={nav.about.label}
            items={nav.about.items}
            active={pathname.startsWith("/about")}
          />
        </nav>
      </div>
    </header>
  );
}