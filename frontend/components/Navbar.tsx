"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Navbar.module.css";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

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

export default function Navbar() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [benchMenuOpen, setBenchMenuOpen] = useState(false);
  const [mobileBenchOpen, setMobileBenchOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  const t = useMemo(
    () => ({
      homeAria: lang === "zh" ? "首页" : "Home",
      homeTitle: lang === "zh" ? "首页" : "Home",
      benchCpu: lang === "zh" ? "BenchCPU" : "BenchCPU",
      intro: lang === "zh" ? "介绍" : "Introduction",
      download: lang === "zh" ? "下载" : "Download",
      leaderboard: lang === "zh" ? "CPU 排行榜" : "CPU Leaderboard",
      menu: lang === "zh" ? "菜单" : "Menu",
      menuOpen: lang === "zh" ? "打开导航" : "Open navigation",
      menuClose: lang === "zh" ? "关闭导航" : "Close navigation",
      navigation: lang === "zh" ? "导航" : "Navigation",
      links: lang === "zh" ? "链接" : "Links",
    }),
    [lang]
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      closeMobileMenu();
      setBenchMenuOpen(false);
      setMobileBenchOpen(false);
    });
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
          <div className={styles.desktopNav}>
            <div className={styles.dropWrap}>
              <button
                type="button"
                className={`${styles.navItem} ${styles.dropBtn} ${isActive("/") || isActive("/download") ? styles.navActive : ""}`}
                aria-expanded={benchMenuOpen}
                aria-label={t.benchCpu}
                onClick={() => setBenchMenuOpen((v) => !v)}
              >
                <span>{t.benchCpu}</span>
                <span className={styles.chev}>{benchMenuOpen ? "▲" : "▼"}</span>
              </button>

              {benchMenuOpen && (
                <div className={styles.menu}>
                  <Link href="/" className={styles.menuItem} onClick={() => setBenchMenuOpen(false)}>
                    <span className={styles.menuItemMain}>{t.intro}</span>
                  </Link>
                  <Link href="/download" className={styles.menuItem} onClick={() => setBenchMenuOpen(false)}>
                    <span className={styles.menuItemMain}>{t.download}</span>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/leaderboard"
              className={`${styles.navItem} ${isActive("/leaderboard") ? styles.navActive : ""}`}
            >
              {t.leaderboard}
            </Link>

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

            <button
              type="button"
              className={`${styles.mobileItemButton} ${isActive("/") || isActive("/download") ? styles.mobileItemActive : ""}`}
              onClick={() => setMobileBenchOpen((v) => !v)}
            >
              <span className={styles.mobileItemMain}>
                <span>{t.benchCpu}</span>
              </span>
              <span className={`${styles.mobileChev} ${mobileBenchOpen ? styles.mobileChevOpen : ""}`}>
                ▼
              </span>
            </button>

            {mobileBenchOpen && (
              <div className={styles.mobileSubmenu}>
                <Link href="/" className={styles.mobileSubItem} onClick={closeMobileMenu}>
                  {t.intro}
                </Link>
                <Link href="/download" className={styles.mobileSubItem} onClick={closeMobileMenu}>
                  {t.download}
                </Link>
              </div>
            )}

            <Link
              href="/leaderboard"
              className={`${styles.mobileItem} ${isActive("/leaderboard") ? styles.mobileItemActive : ""}`}
              onClick={closeMobileMenu}
            >
              <span>{t.leaderboard}</span>
            </Link>
          </div>

          <div className={styles.mobileSection}>
            <div className={styles.mobileSectionTitle}>{t.links}</div>
          </div>
        </div>
      </div>
    </header>
  );
}