"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Navbar.module.css";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { navbarZh } from "@/components/navbarZh";

type DropItem = {
  label: string;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  iconSrc?: string;
};

const BASE_TEXT = {
  homeAria: "Home",
  homeTitle: "Home",

  leaderboard: "Model Leaderboard",
  probe: "Dataset Analysis",
  explore: "Explore",

  about: "About",
  paper: "Paper",
  codeComingSoon: "Code (Coming soon)",

  menu: "Menu",
  menuOpen: "Open navigation",
  menuClose: "Close navigation",
  navigation: "Navigation",
  links: "Links",
};

type NavText = typeof BASE_TEXT;

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

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={styles.menuIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      {open ? (
        <>
          <path
            d="M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M4 7H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M4 12H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M4 17H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
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
  const { lang } = useLanguage();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  const t: NavText = useMemo(
    () => ({
      ...BASE_TEXT,
      ...(lang === "zh" ? (navbarZh as Partial<NavText>) : {}),
    }),
    [lang]
  );

  const nav = useMemo(
    () => ({
      leaderboard: { label: t.leaderboard, href: "/leaderboard" },
      probe: { label: t.probe, href: "/probe-analysis" },
      explore: { label: t.explore, href: "/explore" },
      about: {
        label: t.about,
        items: [
          {
            label: t.paper,
            href: "https://arxiv.org/abs/2603.04408",
            external: true,
          },
          {
            label: t.codeComingSoon,
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
    [t]
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setMobileAboutOpen(false);
  };

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, lang]);

  useEffect(() => {
    if (!mobileOpen) return;

    const onDown = (e: MouseEvent) => {
      if (!shellRef.current) return;
      if (!shellRef.current.contains(e.target as Node)) {
        closeMobileMenu();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMobileMenu();
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <header className={styles.navbar}>
      <div
        ref={shellRef}
        className={`${styles.container} ${mobileOpen ? styles.containerOpen : ""}`}
      >
        <div className={styles.topRow}>
          <Link
            href="/"
            aria-label={t.homeAria}
            title={t.homeTitle}
            className={`${styles.logo} ${isActive("/") ? styles.logoActive : ""}`}
            onClick={closeMobileMenu}
          >
            <span className={styles.logoA}>Probing</span>
            <span className={styles.logoB}>Memes</span>
          </Link>

          <div className={styles.desktopNav}>
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

            <LanguageSwitcher />
          </div>

          <div className={styles.mobileActions}>
            <button
              type="button"
              className={styles.mobileToggle}
              aria-label={mobileOpen ? t.menuClose : t.menuOpen}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <MenuIcon open={mobileOpen} />
              <span className={styles.mobileToggleLabel}>{t.menu}</span>
            </button>

            <div className={styles.mobileLang}>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div
          id="mobile-nav-panel"
          className={`${styles.mobilePanel} ${mobileOpen ? styles.mobilePanelOpen : ""}`}
        >
          <div className={styles.mobileSection}>
            <div className={styles.mobileSectionTitle}>{t.navigation}</div>

            <Link
              href={nav.leaderboard.href}
              className={`${styles.mobileItem} ${isActive(nav.leaderboard.href) ? styles.mobileItemActive : ""}`}
              onClick={closeMobileMenu}
            >
              <span>{nav.leaderboard.label}</span>
            </Link>

            <Link
              href={nav.probe.href}
              className={`${styles.mobileItem} ${isActive(nav.probe.href) ? styles.mobileItemActive : ""}`}
              onClick={closeMobileMenu}
            >
              <span>{nav.probe.label}</span>
            </Link>

            <Link
              href={nav.explore.href}
              className={`${styles.mobileItem} ${isActive(nav.explore.href) ? styles.mobileItemActive : ""}`}
              onClick={closeMobileMenu}
            >
              <span>{nav.explore.label}</span>
            </Link>

            <button
              type="button"
              className={styles.mobileItemButton}
              onClick={() => setMobileAboutOpen((v) => !v)}
              aria-expanded={mobileAboutOpen}
            >
              <span>{nav.about.label}</span>
              <span
                className={`${styles.mobileChev} ${mobileAboutOpen ? styles.mobileChevOpen : ""}`}
                aria-hidden
              >
                ▾
              </span>
            </button>

            {mobileAboutOpen && (
              <div className={styles.mobileSubmenu}>
                {nav.about.items.map((it, idx) => {
                  if (it.disabled) {
                    return (
                      <span
                        key={`${it.label}-${idx}`}
                        className={`${styles.mobileSubItem} ${styles.mobileSubItemDisabled}`}
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
                        target="_blank"
                        rel="noreferrer"
                        className={styles.mobileSubItem}
                        onClick={closeMobileMenu}
                      >
                        <span>{it.label}</span>
                        <ExternalLinkIcon />
                      </a>
                    );
                  }

                  if (it.href) {
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        className={styles.mobileSubItem}
                        onClick={closeMobileMenu}
                      >
                        <span>{it.label}</span>
                      </Link>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>

          <div className={styles.mobileSection}>
            <div className={styles.mobileSectionTitle}>{t.links}</div>

            <a
              href={nav.yangs.href}
              target="_blank"
              rel="noreferrer"
              className={styles.mobileItem}
              onClick={closeMobileMenu}
            >
              <span className={styles.mobileItemMain}>
                <Image
                  src={nav.yangs.iconSrc}
                  alt=""
                  width={18}
                  height={18}
                  className={styles.mobileItemIcon}
                />
                <span>{nav.yangs.label}</span>
              </span>
              <ExternalLinkIcon />
            </a>

            <a
              href={nav.benchcouncil.href}
              target="_blank"
              rel="noreferrer"
              className={styles.mobileItem}
              onClick={closeMobileMenu}
            >
              <span className={styles.mobileItemMain}>
                <Image
                  src={nav.benchcouncil.iconSrc}
                  alt=""
                  width={18}
                  height={18}
                  className={styles.mobileItemIcon}
                />
                <span>{nav.benchcouncil.label}</span>
              </span>
              <ExternalLinkIcon />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}