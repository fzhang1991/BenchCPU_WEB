"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Navbar.module.css";

type DropItem = {
  label: string;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  iconSrc?: string;
};

function ExternalLinkIcon() {
  return (
    <svg
      className={styles.externalIcon}
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M6 3.5H4.75A1.75 1.75 0 0 0 3 5.25v6A1.75 1.75 0 0 0 4.75 13h6a1.75 1.75 0 0 0 1.75-1.75V10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 3h5v5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 3L7 9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
                  <span className={styles.menuItemMain}>
                    <span>{it.label}</span>
                  </span>
                </span>
              );
            }

            const content = (
              <>
                <span className={styles.menuItemMain}>
                  {it.iconSrc && (
                    <Image
                      src={it.iconSrc}
                      alt=""
                      width={16}
                      height={16}
                      className={styles.menuItemIcon}
                    />
                  )}
                  <span>{it.label}</span>
                </span>
                {it.external && <ExternalLinkIcon />}
              </>
            );

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
                  {content}
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
                  {content}
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

function ExternalNavLink({
  label,
  href,
  iconSrc,
}: {
  label: string;
  href: string;
  iconSrc?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${styles.navItem} ${styles.navExternal}`}
    >
      <span className={styles.navExternalMain}>
        {iconSrc && (
          <Image
            src={iconSrc}
            alt=""
            width={16}
            height={16}
            className={styles.navExternalLogo}
          />
        )}
        <span>{label}</span>
      </span>
      <ExternalLinkIcon />
    </a>
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
      yangs: {
        label: "Yangs AI",
        href: "https://benchmarks.yangs.ai",
        iconSrc: "/logos/YangsAI.png",
      },
      benchcouncil: {
        label: "BenchCouncil",
        href: "https://www.benchcouncil.org",
        iconSrc: "/logos/BenchCouncil.jpg",
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

          <ExternalNavLink
            label={nav.yangs.label}
            href={nav.yangs.href}
            iconSrc={nav.yangs.iconSrc}
          />

          <ExternalNavLink
            label={nav.benchcouncil.label}
            href={nav.benchcouncil.href}
            iconSrc={nav.benchcouncil.iconSrc}
          />
        </nav>
      </div>
    </header>
  );
}