"use client";

import Link from "next/link";
import { Compass, History, PlusCircle, Radar, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

type MobileTabBarProps = {
  isAdmin?: boolean;
};

export default function MobileTabBar({ isAdmin = false }: MobileTabBarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const items = [
    { href: "/", label: t("common.dashboard"), icon: Compass },
    { href: "/history", label: t("common.history"), icon: History },
    { href: "/new-shift", label: t("common.newShift"), icon: PlusCircle, primary: true },
    { href: "/setup", label: t("common.settings"), icon: Settings2 },
    ...(isAdmin ? [{ href: "/admin", label: t("common.admin"), icon: Radar }] : []),
  ];

  return (
    <nav className="rm-tab-bar xl:hidden" aria-label="Mobile navigation">
      <div className={`rm-tab-bar-shell ${isAdmin ? "grid-cols-5" : "grid-cols-4"}`}>
        {items.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rm-tab-item ${isActive ? "rm-tab-item-active" : ""} ${item.primary ? "rm-tab-item-primary" : ""}`}
            >
              <span className="rm-tab-icon">
                <Icon size={17} />
              </span>
              <span className="rm-tab-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
