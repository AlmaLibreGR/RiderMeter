"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import type {
  AdminOverviewDataset,
  AdminUserSnapshot,
  AppLocale,
  BillingInterval,
  BillingPlanType,
  BillingStatus,
} from "@/types/domain";

type AdminWorkspaceProps = {
  dataset: AdminOverviewDataset;
  locale: AppLocale;
  timezone: string;
};

type BillingDraft = {
  planType: BillingPlanType;
  status: BillingStatus;
  billingInterval: BillingInterval | null;
  priceAmount: string;
  currentPeriodEndsAt: string;
  lifetimeAccessGrantedAt: string;
};

export default function AdminWorkspace({
  dataset,
  locale,
  timezone,
}: AdminWorkspaceProps) {
  const t = useTranslations();
  const [drafts, setDrafts] = useState<Record<number, BillingDraft>>(
    Object.fromEntries(dataset.users.map((user) => [user.userId, toDraft(user)]))
  );
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function saveBilling(user: AdminUserSnapshot) {
    const draft = drafts[user.userId];
    if (!draft) {
      return;
    }

    setSavingUserId(user.userId);
    setFeedback(null);

    const response = await fetch(`/api/admin/users/${user.userId}/billing`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planType: draft.planType,
        status: draft.status,
        billingInterval: draft.planType === "subscription" ? draft.billingInterval : null,
        priceAmount: draft.priceAmount.trim() ? Number(draft.priceAmount) : null,
        currency: "EUR",
        currentPeriodEndsAt:
          draft.currentPeriodEndsAt.trim() && draft.planType === "subscription"
            ? new Date(`${draft.currentPeriodEndsAt}T00:00:00.000Z`).toISOString()
            : null,
        lifetimeAccessGrantedAt:
          draft.lifetimeAccessGrantedAt.trim() && draft.planType === "lifetime"
            ? new Date(`${draft.lifetimeAccessGrantedAt}T00:00:00.000Z`).toISOString()
            : null,
      }),
    });

    const payload = (await response.json()) as { ok: boolean; error?: string };
    setSavingUserId(null);

    if (!response.ok || !payload.ok) {
      setFeedback(payload.error ?? t("admin.messages.error"));
      return;
    }

    setFeedback(t("admin.messages.saved"));
  }

  return (
    <div className="space-y-4">
      <section className="rm-home-hero-grid xl:grid-cols-5">
        <StatCard label={t("admin.summary.totalUsers")} value={formatNumber(dataset.totalUsers, locale, 0)} />
        <StatCard
          label={t("admin.summary.activeUsers")}
          value={formatNumber(dataset.activeUsers30d, locale, 0)}
        />
        <StatCard
          label={t("admin.summary.payingUsers")}
          value={formatNumber(dataset.payingUsers, locale, 0)}
        />
        <StatCard
          label={t("admin.summary.subscriptionUsers")}
          value={formatNumber(dataset.subscriptionUsers, locale, 0)}
        />
        <StatCard
          label={t("admin.summary.projectedMrr")}
          value={formatCurrency(dataset.projectedMrr, locale, "EUR")}
        />
      </section>

      <section className="rm-flow-card">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="rm-pill">{t("common.admin")}</div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
              {t("admin.users.title")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {t("admin.users.body")}
            </p>
          </div>

          {feedback ? (
            <div className="rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm text-slate-700">
              {feedback}
            </div>
          ) : null}
        </div>

        <div className="mt-5 space-y-4">
          {dataset.users.map((user) => {
            const draft = drafts[user.userId];
            const isSubscription = draft.planType === "subscription";
            const isLifetime = draft.planType === "lifetime";

            return (
              <article key={user.userId} className="rm-journal-card">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
                    <InfoPill
                      label={t("admin.users.code")}
                      value={user.publicCode}
                    />
                    <InfoPill
                      label={t("admin.users.joined")}
                      value={formatDate(user.createdAt, locale, timezone)}
                    />
                    <InfoPill
                      label={t("admin.users.lastActive")}
                      value={
                        user.lastActiveAt
                          ? formatDate(user.lastActiveAt, locale, timezone)
                          : t("admin.users.noActivity")
                      }
                    />
                    <InfoPill
                      label={t("admin.users.locale")}
                      value={user.locale.toUpperCase()}
                    />
                    <InfoPill
                      label={t("dashboard.hero.orders")}
                      value={formatNumber(user.totalShifts, locale, 0)}
                    />
                    <InfoPill
                      label={t("dashboard.hero.revenue")}
                      value={formatCurrency(user.totalRevenue, locale, "EUR")}
                    />
                    <InfoPill
                      label={t("dashboard.hero.netProfit")}
                      value={formatCurrency(user.totalNetProfit, locale, "EUR")}
                    />
                    <InfoPill
                      label={t("admin.users.role")}
                      value={user.roleType}
                    />
                  </div>

                  <div className="xl:w-[24rem]">
                    <div className="grid gap-4 md:grid-cols-2">
                      <SelectField
                        label={t("admin.billing.planType")}
                        value={draft.planType}
                        onChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [user.userId]: { ...draft, planType: value as BillingPlanType },
                          }))
                        }
                      >
                        <option value="free">{t("admin.billing.plan.free")}</option>
                        <option value="lifetime">{t("admin.billing.plan.lifetime")}</option>
                        <option value="subscription">{t("admin.billing.plan.subscription")}</option>
                      </SelectField>

                      <SelectField
                        label={t("admin.billing.status")}
                        value={draft.status}
                        onChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [user.userId]: { ...draft, status: value as BillingStatus },
                          }))
                        }
                      >
                        <option value="inactive">{t("admin.billing.statuses.inactive")}</option>
                        <option value="trial">{t("admin.billing.statuses.trial")}</option>
                        <option value="active">{t("admin.billing.statuses.active")}</option>
                        <option value="past_due">{t("admin.billing.statuses.pastDue")}</option>
                        <option value="cancelled">{t("admin.billing.statuses.cancelled")}</option>
                      </SelectField>
                      <InputField
                        label={t("admin.billing.price")}
                        value={draft.priceAmount}
                        onChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [user.userId]: { ...draft, priceAmount: value },
                          }))
                        }
                      />
                      <SelectField
                        label={t("admin.billing.interval")}
                        value={draft.billingInterval ?? ""}
                        onChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [user.userId]: {
                              ...draft,
                              billingInterval: value ? (value as BillingInterval) : null,
                            },
                          }))
                        }
                        disabled={!isSubscription}
                      >
                        <option value="">{t("admin.billing.notApplicable")}</option>
                        <option value="monthly">{t("admin.billing.intervals.monthly")}</option>
                        <option value="yearly">{t("admin.billing.intervals.yearly")}</option>
                        <option value="one_time">{t("admin.billing.intervals.oneTime")}</option>
                      </SelectField>
                      <InputField
                        label={t("admin.billing.currentPeriodEndsAt")}
                        value={draft.currentPeriodEndsAt}
                        onChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [user.userId]: { ...draft, currentPeriodEndsAt: value },
                          }))
                        }
                        type="date"
                        disabled={!isSubscription}
                      />
                      <InputField
                        label={t("admin.billing.lifetimeAccessGrantedAt")}
                        value={draft.lifetimeAccessGrantedAt}
                        onChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [user.userId]: { ...draft, lifetimeAccessGrantedAt: value },
                          }))
                        }
                        type="date"
                        disabled={!isLifetime}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => void saveBilling(user)}
                      disabled={savingUserId === user.userId}
                      className="rm-button-primary mt-4 disabled:opacity-60"
                    >
                      {savingUserId === user.userId ? t("common.saving") : t("common.save")}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function toDraft(user: AdminUserSnapshot): BillingDraft {
  return {
    planType: user.billing.planType,
    status: user.billing.status,
    billingInterval: user.billing.billingInterval,
    priceAmount: user.billing.priceAmount == null ? "" : String(user.billing.priceAmount),
    currentPeriodEndsAt: user.billing.currentPeriodEndsAt?.slice(0, 10) ?? "",
    lifetimeAccessGrantedAt: user.billing.lifetimeAccessGrantedAt?.slice(0, 10) ?? "",
  };
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rm-home-hero-card">
      <p className="rm-stat-kicker">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rm-home-hero-card">
      <p className="rm-stat-kicker">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="rm-field-label">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="rm-input disabled:opacity-50"
      >
        {children}
      </select>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "number",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="rm-field-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="rm-input disabled:opacity-50"
      />
    </div>
  );
}
