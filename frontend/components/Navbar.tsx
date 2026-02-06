// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Navbar.module.css";

type DropItem = { label: string; href: string };

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
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={styles.menuItem}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  const nav = useMemo(
    () => ({
      home: { label: "Home", href: "/" },
      leaderboard: { label: "Leaderboard", href: "/leaderboard" },
      probe: { label: "Probe Analysis", href: "/probe-analysis" },

      // ✅ 改成路由页，而不是 /explore#hash
      explore: {
        label: "Explore",
        items: [
          { label: "Overview", href: "/explore/overview" },
          { label: "Probe Properties", href: "/explore/probe-properties" },
          { label: "MemeScores", href: "/explore/meme-scores" },
          { label: "The Paradigm", href: "/explore/the-paradigm" },
        ],
      },

      about: {
        label: "About",
        items: [
          { label: "Paper", href: "/about#paper" },
          { label: "Code", href: "/about#code" },
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
        <Link href="/" className={styles.logo}>
          <span className={styles.logoA}>Probing</span>
          <span className={styles.logoB}>Memes</span>
        </Link>

        <nav className={styles.nav}>
          <Link
            href={nav.home.href}
            className={`${styles.navItem} ${isActive(nav.home.href) ? styles.navActive : ""}`}
          >
            {nav.home.label}
          </Link>

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

          <Dropdown
            label={nav.explore.label}
            items={nav.explore.items}
            active={pathname.startsWith("/explore")}
          />

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
