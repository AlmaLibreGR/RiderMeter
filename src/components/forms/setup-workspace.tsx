"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { calculateVehicleDerivedCosts, normalizeCadenceToDailyAmount } from "@/lib/calculations";
import { nowIsoDate } from "@/lib/dates";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import type {
  CurrencyCode,
  ExpenseCadence,
  ExpenseCategorySnapshot,
  ExpenseEntrySnapshot,
  ExpenseScope,
  SetupSnapshot,
  VehicleType,
} from "@/types/domain";

type SetupWorkspaceProps = {
  initialData: SetupSnapshot;
  currency: CurrencyCode;
  timezone: string;
};

type VehicleFormState = {
  vehicleType: VehicleType;
  fuelType: string;
  fuelConsumptionPer100Km: string;
  fuelPricePerLiter: string;
  routineServiceIntervalKm: string;
  routineServiceCost: string;
  majorServiceIntervalKm: string;
  majorServiceCost: string;
  tireReplacementIntervalKm: string;
  tireReplacementCost: string;
  purchasePrice: string;
  resaleValue: string;
  expectedLifecycleKm: string;
};

type CategoryFormState = {
  localId: string;
  id?: number;
  name: string;
  scope: ExpenseScope;
  cadence: ExpenseCadence;
  defaultAmount: string;
  isActive: boolean;
};

type ExpenseFormState = {
  date: string;
  categoryLocalId: string;
  amount: string;
  description: string;
};

const fallbackVehicle: VehicleFormState = {
  vehicleType: "scooter",
  fuelType: "petrol",
  fuelConsumptionPer100Km: "",
  fuelPricePerLiter: "",
  routineServiceIntervalKm: "",
  routineServiceCost: "",
  majorServiceIntervalKm: "",
  majorServiceCost: "",
  tireReplacementIntervalKm: "",
  tireReplacementCost: "",
  purchasePrice: "",
  resaleValue: "",
  expectedLifecycleKm: "",
};

export default function SetupWorkspace({
  initialData,
  currency,
  timezone,
}: SetupWorkspaceProps) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "el";
  const [vehicle, setVehicle] = useState<VehicleFormState>(
    mapVehicleToForm(initialData.vehicleProfile)
  );
  const [categories, setCategories] = useState<CategoryFormState[]>(
    initialData.recurringCategories.length > 0
      ? initialData.recurringCategories.map(mapCategoryToForm)
      : [createEmptyCategory("business"), createEmptyCategory("personal")]
  );
  const [recentExpenses, setRecentExpenses] = useState<ExpenseEntrySnapshot[]>(
    initialData.recentExpenses
  );
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    date: nowIsoDate(timezone),
    categoryLocalId: initialData.recurringCategories[0]?.id
      ? String(initialData.recurringCategories[0].id)
      : "",
    amount: "",
    description: "",
  });
  const [saveState, setSaveState] = useState({
    loading: false,
    message: null as string | null,
    error: false,
  });
  const [expenseState, setExpenseState] = useState({
    loading: false,
    message: null as string | null,
    error: false,
  });

  const derivedCosts = useMemo(
    () =>
      calculateVehicleDerivedCosts({
        fuelPricePerLiter: toNumber(vehicle.fuelPricePerLiter),
        fuelConsumptionPer100Km: toNumber(vehicle.fuelConsumptionPer100Km),
        routineServiceIntervalKm: nullableNumber(vehicle.routineServiceIntervalKm),
        routineServiceCost: nullableNumber(vehicle.routineServiceCost),
        majorServiceIntervalKm: nullableNumber(vehicle.majorServiceIntervalKm),
        majorServiceCost: nullableNumber(vehicle.majorServiceCost),
        tireReplacementIntervalKm: nullableNumber(vehicle.tireReplacementIntervalKm),
        tireReplacementCost: nullableNumber(vehicle.tireReplacementCost),
        purchasePrice: nullableNumber(vehicle.purchasePrice),
        resaleValue: nullableNumber(vehicle.resaleValue),
        expectedLifecycleKm: nullableNumber(vehicle.expectedLifecycleKm),
      }),
    [vehicle]
  );

  const recurringSummary = useMemo(() => {
    const activeBusiness = categories.filter(
      (category) =>
        category.isActive &&
        category.scope === "business" &&
        category.cadence !== "one_time"
    );
    const dailyBudget = activeBusiness.reduce(
      (sum, category) =>
        sum +
        normalizeCadenceToDailyAmount(
          toNumber(category.defaultAmount),
          category.cadence
        ),
      0
    );

    return {
      dailyBudget,
      monthlyEquivalent: dailyBudget * 30,
    };
  }, [categories]);

  const availableExpenseCategories = categories.filter(
    (category) => category.isActive && category.name.trim().length > 0 && Boolean(category.id)
  );
  const selectedExpenseCategory = availableExpenseCategories.find(
    (category) => String(category.id ?? category.localId) === expenseForm.categoryLocalId
  );
  const vehicleContent = getVehicleCopy(vehicle.vehicleType, t);
  const recurringCategoryCount = categories.filter((category) => category.name.trim()).length;

  async function handleSaveSetup() {
    setSaveState({ loading: true, message: null, error: false });

    const response = await fetch("/api/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vehicle: {
          vehicleType: vehicle.vehicleType,
          fuelType: vehicle.fuelType,
          fuelConsumptionPer100Km: toNumber(vehicle.fuelConsumptionPer100Km),
          fuelPricePerLiter: toNumber(vehicle.fuelPricePerLiter),
          maintenanceCostPerKm: derivedCosts.maintenanceCostPerKm,
          tiresCostPerKm: derivedCosts.tiresCostPerKm,
          depreciationCostPerKm: derivedCosts.depreciationCostPerKm,
          routineServiceIntervalKm: nullableNumber(vehicle.routineServiceIntervalKm),
          routineServiceCost: nullableNumber(vehicle.routineServiceCost),
          majorServiceIntervalKm: nullableNumber(vehicle.majorServiceIntervalKm),
          majorServiceCost: nullableNumber(vehicle.majorServiceCost),
          tireReplacementIntervalKm: nullableNumber(vehicle.tireReplacementIntervalKm),
          tireReplacementCost: nullableNumber(vehicle.tireReplacementCost),
          purchasePrice: nullableNumber(vehicle.purchasePrice),
          resaleValue: nullableNumber(vehicle.resaleValue),
          expectedLifecycleKm: nullableNumber(vehicle.expectedLifecycleKm),
        },
        recurringCategories: categories
          .filter((category) => category.name.trim())
          .map((category) => ({
            name: category.name.trim(),
            scope: category.scope,
            cadence: category.cadence,
            defaultAmount: toNumber(category.defaultAmount),
            isActive: category.isActive,
          })),
      }),
    });

    const payload = (await response.json()) as {
      ok: boolean;
      error?: string;
      data?: SetupSnapshot;
    };

    if (!response.ok || !payload.ok || !payload.data) {
      setSaveState({
        loading: false,
        message: payload.error ?? t("setupWorkspace.messages.error"),
        error: true,
      });
      return;
    }

    const savedCategories = payload.data.recurringCategories.map(mapCategoryToForm);
    setCategories(savedCategories);
    setRecentExpenses(payload.data.recentExpenses);
    setExpenseForm((current) => ({
      ...current,
      categoryLocalId: savedCategories[0]?.id ? String(savedCategories[0].id) : "",
    }));
    setSaveState({
      loading: false,
      message: t("setupWorkspace.messages.saved"),
      error: false,
    });
  }

  async function handleCreateExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setExpenseState({ loading: true, message: null, error: false });

    if (!selectedExpenseCategory?.id) {
      setExpenseState({
        loading: false,
        message: t("setupWorkspace.expenses.unsavedCategory"),
        error: true,
      });
      return;
    }

    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: expenseForm.date,
        categoryId: selectedExpenseCategory.id,
        amount: toNumber(expenseForm.amount),
        description: expenseForm.description,
      }),
    });

    const payload = (await response.json()) as {
      ok: boolean;
      error?: string;
      data?: ExpenseEntrySnapshot;
    };

    if (!response.ok || !payload.ok || !payload.data) {
      setExpenseState({
        loading: false,
        message: payload.error ?? t("setupWorkspace.expenses.error"),
        error: true,
      });
      return;
    }

    setRecentExpenses((current) => [payload.data!, ...current].slice(0, 12));
    setExpenseForm((current) => ({
      ...current,
      amount: "",
      description: "",
    }));
    setExpenseState({
      loading: false,
      message: t("setupWorkspace.expenses.success"),
      error: false,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="space-y-6">
        <SectionCard
          eyebrow={t("setupWorkspace.sections.vehicleEyebrow")}
          title={t("setupWorkspace.sections.vehicleTitle")}
          description={t("setupWorkspace.sections.vehicleBody")}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <CompactStat
              label={t("settings.fields.vehicleType")}
              value={t(`setupWorkspace.vehicle.types.${vehicle.vehicleType}`)}
            />
            <CompactStat
              label={t("setupWorkspace.vehicle.totalPerKm")}
              value={formatCurrency(derivedCosts.totalCostPerKm, locale, currency)}
            />
            <CompactStat
              label={t("setupWorkspace.categories.dailyBudget")}
              value={formatCurrency(recurringSummary.dailyBudget, locale, currency)}
            />
            <CompactStat
              label={t("setupWorkspace.sections.recentTitle")}
              value={formatNumber(recentExpenses.length, locale, 0)}
            />
          </div>

          <div className="rm-section-divider mt-6" />

          <div className="grid gap-3 md:grid-cols-3">
            {(["car", "scooter", "ebike"] as VehicleType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setVehicle((current) => ({
                    ...current,
                    vehicleType: type,
                    fuelType:
                      type === "ebike"
                        ? "electric"
                        : current.fuelType === "electric"
                          ? "petrol"
                          : current.fuelType,
                  }));
                }}
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  vehicle.vehicleType === type
                    ? "border-orange-200 bg-orange-50 text-slate-950 shadow-[0_18px_40px_rgba(154,96,54,0.12)]"
                    : "border-stone-200 bg-white text-slate-700 hover:-translate-y-[1px] hover:border-orange-200 hover:bg-orange-50/40"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-current/60">
                  {t("settings.fields.vehicleType")}
                </p>
                <p className="mt-2 text-base font-semibold">
                  {t(`setupWorkspace.vehicle.types.${type}`)}
                </p>
                <p className={`mt-2 text-sm leading-6 ${vehicle.vehicleType === type ? "text-slate-600" : "text-slate-500"}`}>
                  {t(`setupWorkspace.vehicle.typeBodies.${type}`)}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InputField label={vehicleContent.fuelTypeLabel}>
              <select
                value={vehicle.vehicleType === "ebike" ? "electric" : vehicle.fuelType}
                onChange={(event) =>
                  setVehicle((current) => ({
                    ...current,
                    fuelType: event.target.value,
                  }))
                }
                disabled={vehicle.vehicleType === "ebike"}
                className="rm-input"
              >
                {vehicle.vehicleType === "ebike" ? (
                  <option value="electric">{t("setupWorkspace.vehicle.energyModes.electric")}</option>
                ) : (
                  <>
                    <option value="petrol">{t("setupWorkspace.vehicle.energyModes.petrol")}</option>
                    <option value="diesel">{t("setupWorkspace.vehicle.energyModes.diesel")}</option>
                  </>
                )}
              </select>
            </InputField>
            <NumberInput
              label={vehicleContent.energyConsumptionLabel}
              value={vehicle.fuelConsumptionPer100Km}
              onChange={(value) => updateVehicleField(setVehicle, "fuelConsumptionPer100Km", value)}
              helper={vehicleContent.energyConsumptionHelp}
            />
            <NumberInput
              label={vehicleContent.energyPriceLabel}
              value={vehicle.fuelPricePerLiter}
              onChange={(value) => updateVehicleField(setVehicle, "fuelPricePerLiter", value)}
              helper={vehicleContent.energyPriceHelp}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <NumberInput
              label={vehicleContent.routineIntervalLabel}
              value={vehicle.routineServiceIntervalKm}
              onChange={(value) => updateVehicleField(setVehicle, "routineServiceIntervalKm", value)}
            />
            <NumberInput
              label={vehicleContent.routineCostLabel}
              value={vehicle.routineServiceCost}
              onChange={(value) => updateVehicleField(setVehicle, "routineServiceCost", value)}
            />
            <NumberInput
              label={vehicleContent.majorIntervalLabel}
              value={vehicle.majorServiceIntervalKm}
              onChange={(value) => updateVehicleField(setVehicle, "majorServiceIntervalKm", value)}
            />
            <NumberInput
              label={vehicleContent.majorCostLabel}
              value={vehicle.majorServiceCost}
              onChange={(value) => updateVehicleField(setVehicle, "majorServiceCost", value)}
            />
            <NumberInput
              label={vehicleContent.tireIntervalLabel}
              value={vehicle.tireReplacementIntervalKm}
              onChange={(value) => updateVehicleField(setVehicle, "tireReplacementIntervalKm", value)}
            />
            <NumberInput
              label={vehicleContent.tireCostLabel}
              value={vehicle.tireReplacementCost}
              onChange={(value) => updateVehicleField(setVehicle, "tireReplacementCost", value)}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <NumberInput
              label={t("setupWorkspace.vehicle.purchasePrice")}
              value={vehicle.purchasePrice}
              onChange={(value) => updateVehicleField(setVehicle, "purchasePrice", value)}
            />
            <NumberInput
              label={t("setupWorkspace.vehicle.resaleValue")}
              value={vehicle.resaleValue}
              onChange={(value) => updateVehicleField(setVehicle, "resaleValue", value)}
            />
            <NumberInput
              label={t("setupWorkspace.vehicle.expectedLifecycleKm")}
              value={vehicle.expectedLifecycleKm}
              onChange={(value) => updateVehicleField(setVehicle, "expectedLifecycleKm", value)}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryTile
              label={t("setupWorkspace.vehicle.energyPerKm")}
              value={formatCurrency(derivedCosts.energyCostPerKm, locale, currency)}
            />
            <SummaryTile
              label={t("setupWorkspace.vehicle.maintenancePerKm")}
              value={formatCurrency(derivedCosts.maintenanceCostPerKm, locale, currency)}
            />
            <SummaryTile
              label={t("setupWorkspace.vehicle.tiresPerKm")}
              value={formatCurrency(derivedCosts.tiresCostPerKm, locale, currency)}
            />
            <SummaryTile
              label={t("setupWorkspace.vehicle.totalPerKm")}
              value={formatCurrency(derivedCosts.totalCostPerKm, locale, currency)}
              emphasis
            />
          </div>
        </SectionCard>

        <SectionCard
          eyebrow={t("setupWorkspace.sections.budgetEyebrow")}
          title={t("setupWorkspace.sections.budgetTitle")}
          description={t("setupWorkspace.sections.budgetBody")}
        >
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category.localId}
                className="rm-subtle-card p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="rm-stat-kicker">{t("setupWorkspace.categories.scope")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {category.name.trim() || t(`setupWorkspace.categories.scopes.${category.scope}`)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCategories((current) =>
                        current.filter((item) => item.localId !== category.localId)
                      )
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-slate-500 hover:border-orange-200 hover:text-orange-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr_auto] lg:items-end">
                  <InputField label={t("setupWorkspace.categories.name")}>
                    <input
                      type="text"
                      value={category.name}
                      onChange={(event) =>
                        updateCategory(categories, setCategories, category.localId, {
                          name: event.target.value,
                        })
                      }
                      className="rm-input"
                    />
                  </InputField>
                  <InputField label={t("setupWorkspace.categories.scope")}>
                    <select
                      value={category.scope}
                      onChange={(event) =>
                        updateCategory(categories, setCategories, category.localId, {
                          scope: event.target.value as ExpenseScope,
                        })
                      }
                      className="rm-input"
                    >
                      <option value="business">{t("setupWorkspace.categories.scopes.business")}</option>
                      <option value="personal">{t("setupWorkspace.categories.scopes.personal")}</option>
                    </select>
                  </InputField>
                  <InputField label={t("setupWorkspace.categories.cadence")}>
                    <select
                      value={category.cadence}
                      onChange={(event) =>
                        updateCategory(categories, setCategories, category.localId, {
                          cadence: event.target.value as ExpenseCadence,
                        })
                      }
                      className="rm-input"
                    >
                      {(["daily", "weekly", "monthly", "yearly", "one_time"] as ExpenseCadence[]).map(
                        (cadence) => (
                          <option key={cadence} value={cadence}>
                            {t(`setupWorkspace.categories.cadences.${cadence}`)}
                          </option>
                        )
                      )}
                    </select>
                  </InputField>
                  <NumberInput
                    label={t("setupWorkspace.categories.amount")}
                    value={category.defaultAmount}
                    onChange={(value) =>
                      updateCategory(categories, setCategories, category.localId, {
                        defaultAmount: value,
                      })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={category.isActive}
                        onChange={(event) =>
                          updateCategory(categories, setCategories, category.localId, {
                            isActive: event.target.checked,
                          })
                        }
                      />
                      {t("setupWorkspace.categories.active")}
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setCategories((current) => [...current, createEmptyCategory("business")])}
              className="rm-button-secondary inline-flex items-center gap-2"
            >
              <Plus size={16} />
              {t("setupWorkspace.categories.addBusiness")}
            </button>
            <button
              type="button"
              onClick={() => setCategories((current) => [...current, createEmptyCategory("personal")])}
              className="rm-button-secondary inline-flex items-center gap-2"
            >
              <Plus size={16} />
              {t("setupWorkspace.categories.addPersonal")}
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SummaryTile
              label={t("setupWorkspace.categories.dailyBudget")}
              value={formatCurrency(recurringSummary.dailyBudget, locale, currency)}
            />
            <SummaryTile
              label={t("setupWorkspace.categories.monthlyBudget")}
              value={formatCurrency(recurringSummary.monthlyEquivalent, locale, currency)}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSaveSetup()}
              disabled={saveState.loading}
              className="rm-button-primary disabled:opacity-60"
            >
              {saveState.loading ? t("common.saving") : t("setupWorkspace.messages.save")}
            </button>
            <Link href="/" className="rm-button-secondary">
              {t("common.backToDashboard")}
            </Link>
          </div>

          {saveState.message ? (
            <InlineNotice error={saveState.error}>{saveState.message}</InlineNotice>
          ) : null}
        </SectionCard>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <SectionCard
          eyebrow={t("setupWorkspace.eyebrow")}
          title={t("setupWorkspace.title")}
          description={t("setupWorkspace.body")}
        >
          <div className="grid gap-3">
            <CompactStat
              label={t("setupWorkspace.vehicle.totalPerKm")}
              value={formatCurrency(derivedCosts.totalCostPerKm, locale, currency)}
            />
            <CompactStat
              label={t("setupWorkspace.categories.dailyBudget")}
              value={formatCurrency(recurringSummary.dailyBudget, locale, currency)}
            />
            <CompactStat
              label={t("setupWorkspace.categories.amount")}
              value={formatNumber(recurringCategoryCount, locale, 0)}
              helper={t("setupWorkspace.sections.budgetTitle")}
            />
            <CompactStat
              label={t("setupWorkspace.expenses.amount")}
              value={formatNumber(recentExpenses.length, locale, 0)}
              helper={t("setupWorkspace.sections.recentTitle")}
            />
          </div>
        </SectionCard>

        <SectionCard
          eyebrow={t("setupWorkspace.sections.expensesEyebrow")}
          title={t("setupWorkspace.sections.expensesTitle")}
          description={t("setupWorkspace.sections.expensesBody")}
        >
          <form onSubmit={handleCreateExpense} className="space-y-4">
            {availableExpenseCategories.length === 0 ? (
              <InlineNotice error>{t("setupWorkspace.expenses.unsavedCategory")}</InlineNotice>
            ) : null}

            <InputField label={t("setupWorkspace.expenses.date")}>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, date: event.target.value }))
                }
                className="rm-input"
              />
            </InputField>

            <InputField label={t("setupWorkspace.expenses.category")}>
              <select
                value={expenseForm.categoryLocalId}
                onChange={(event) => {
                  const nextCategory = availableExpenseCategories.find(
                    (category) =>
                      String(category.id ?? category.localId) === event.target.value
                  );

                  setExpenseForm((current) => ({
                    ...current,
                    categoryLocalId: event.target.value,
                    amount:
                      !current.amount.trim() && nextCategory?.defaultAmount
                        ? nextCategory.defaultAmount
                        : current.amount,
                  }));
                }}
                className="rm-input"
              >
                <option value="">{t("setupWorkspace.expenses.selectCategory")}</option>
                {availableExpenseCategories.map((category) => (
                  <option key={category.localId} value={String(category.id ?? category.localId)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </InputField>

            <NumberInput
              label={t("setupWorkspace.expenses.amount")}
              value={expenseForm.amount}
              onChange={(value) =>
                setExpenseForm((current) => ({
                  ...current,
                  amount: value,
                }))
              }
            />

            <InputField label={t("setupWorkspace.expenses.description")}>
              <textarea
                value={expenseForm.description}
                onChange={(event) =>
                  setExpenseForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="rm-input min-h-[110px]"
              />
            </InputField>

            <button
              type="submit"
              disabled={expenseState.loading || availableExpenseCategories.length === 0}
              className="rm-button-primary w-full disabled:opacity-60"
            >
              {expenseState.loading
                ? t("common.saving")
                : t("setupWorkspace.expenses.submit")}
            </button>

            {expenseState.message ? (
              <InlineNotice error={expenseState.error}>{expenseState.message}</InlineNotice>
            ) : null}
          </form>
        </SectionCard>

        <SectionCard
          eyebrow={t("setupWorkspace.sections.recentEyebrow")}
          title={t("setupWorkspace.sections.recentTitle")}
          description={t("setupWorkspace.sections.recentBody")}
        >
          {recentExpenses.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-stone-200 bg-stone-50 p-5 text-sm leading-6 text-slate-600">
              {t("setupWorkspace.expenses.empty")}
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="rm-stat-tile"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{expense.category}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(expense.date, locale, timezone)}
                      </p>
                      {expense.description ? (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {expense.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="rm-stat-kicker">
                        {t(`setupWorkspace.categories.scopes.${expense.scope}`)}
                      </p>
                      <p className="text-lg font-semibold text-slate-950">
                        {formatCurrency(expense.amount, locale, currency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rm-surface-strong p-5 md:p-6">
      <div className="rm-pill">{eyebrow}</div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function InputField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="rm-field-label">{label}</label>
      {children}
      {helper ? <p className="rm-field-helper">{helper}</p> : null}
    </div>
  );
}

function NumberInput({
  label,
  value,
  helper,
  onChange,
}: {
  label: string;
  value: string;
  helper?: string;
  onChange: (value: string) => void;
}) {
  return (
    <InputField label={label} helper={helper}>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rm-input"
      />
    </InputField>
  );
}

function SummaryTile({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-[28px] border p-5 ${
        emphasis
          ? "border-orange-200 bg-[linear-gradient(135deg,#fff1e6_0%,#fff7f2_100%)] text-slate-950"
          : "border-stone-200 bg-white text-slate-950"
      }`}
    >
      <p className={`text-sm ${emphasis ? "text-slate-600" : "text-slate-500"}`}>{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function CompactStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rm-stat-tile">
      <p className="rm-stat-kicker">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

function InlineNotice({
  error,
  children,
}: {
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mt-4 rounded-[24px] border px-4 py-3 text-sm ${
        error
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {children}
    </div>
  );
}

function mapVehicleToForm(vehicle: SetupSnapshot["vehicleProfile"]): VehicleFormState {
  if (!vehicle) {
    return fallbackVehicle;
  }

  return {
    vehicleType: vehicle.vehicleType,
    fuelType: vehicle.fuelType,
    fuelConsumptionPer100Km: stringifyNumber(vehicle.fuelConsumptionPer100Km),
    fuelPricePerLiter: stringifyNumber(vehicle.fuelPricePerLiter),
    routineServiceIntervalKm: stringifyNullableNumber(vehicle.routineServiceIntervalKm),
    routineServiceCost: stringifyNullableNumber(vehicle.routineServiceCost),
    majorServiceIntervalKm: stringifyNullableNumber(vehicle.majorServiceIntervalKm),
    majorServiceCost: stringifyNullableNumber(vehicle.majorServiceCost),
    tireReplacementIntervalKm: stringifyNullableNumber(vehicle.tireReplacementIntervalKm),
    tireReplacementCost: stringifyNullableNumber(vehicle.tireReplacementCost),
    purchasePrice: stringifyNullableNumber(vehicle.purchasePrice),
    resaleValue: stringifyNullableNumber(vehicle.resaleValue),
    expectedLifecycleKm: stringifyNullableNumber(vehicle.expectedLifecycleKm),
  };
}

function mapCategoryToForm(category: ExpenseCategorySnapshot): CategoryFormState {
  return {
    localId: String(category.id),
    id: category.id,
    name: category.name,
    scope: category.scope,
    cadence: category.cadence,
    defaultAmount: stringifyNumber(category.defaultAmount),
    isActive: category.isActive,
  };
}

function createEmptyCategory(scope: ExpenseScope): CategoryFormState {
  return {
    localId: `${scope}-${Math.random().toString(36).slice(2, 10)}`,
    name: "",
    scope,
    cadence: scope === "business" ? "monthly" : "one_time",
    defaultAmount: "",
    isActive: true,
  };
}

function updateVehicleField(
  setVehicle: React.Dispatch<React.SetStateAction<VehicleFormState>>,
  key: keyof VehicleFormState,
  value: string
) {
  setVehicle((current) => ({
    ...current,
    [key]: value,
  }));
}

function updateCategory(
  categories: CategoryFormState[],
  setCategories: React.Dispatch<React.SetStateAction<CategoryFormState[]>>,
  localId: string,
  changes: Partial<CategoryFormState>
) {
  setCategories(
    categories.map((category) =>
      category.localId === localId ? { ...category, ...changes } : category
    )
  );
}

function stringifyNumber(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}

function stringifyNullableNumber(value: number | null) {
  return value == null || !Number.isFinite(value) ? "" : String(value);
}

function toNumber(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getVehicleCopy(
  vehicleType: VehicleType,
  t: ReturnType<typeof useTranslations>
) {
  if (vehicleType === "car") {
    return {
      fuelTypeLabel: t("settings.fields.fuelType"),
      energyConsumptionLabel: t("setupWorkspace.vehicle.fuelConsumption"),
      energyConsumptionHelp: t("setupWorkspace.vehicle.fuelConsumptionHelp"),
      energyPriceLabel: t("setupWorkspace.vehicle.fuelPrice"),
      energyPriceHelp: t("setupWorkspace.vehicle.fuelPriceHelp"),
      routineIntervalLabel: t("setupWorkspace.vehicle.carRoutineInterval"),
      routineCostLabel: t("setupWorkspace.vehicle.carRoutineCost"),
      majorIntervalLabel: t("setupWorkspace.vehicle.carMajorInterval"),
      majorCostLabel: t("setupWorkspace.vehicle.carMajorCost"),
      tireIntervalLabel: t("setupWorkspace.vehicle.carTireInterval"),
      tireCostLabel: t("setupWorkspace.vehicle.carTireCost"),
    };
  }

  if (vehicleType === "ebike") {
    return {
      fuelTypeLabel: t("settings.fields.fuelType"),
      energyConsumptionLabel: t("setupWorkspace.vehicle.ebikeConsumption"),
      energyConsumptionHelp: t("setupWorkspace.vehicle.ebikeConsumptionHelp"),
      energyPriceLabel: t("setupWorkspace.vehicle.ebikePrice"),
      energyPriceHelp: t("setupWorkspace.vehicle.ebikePriceHelp"),
      routineIntervalLabel: t("setupWorkspace.vehicle.ebikeRoutineInterval"),
      routineCostLabel: t("setupWorkspace.vehicle.ebikeRoutineCost"),
      majorIntervalLabel: t("setupWorkspace.vehicle.ebikeMajorInterval"),
      majorCostLabel: t("setupWorkspace.vehicle.ebikeMajorCost"),
      tireIntervalLabel: t("setupWorkspace.vehicle.ebikeTireInterval"),
      tireCostLabel: t("setupWorkspace.vehicle.ebikeTireCost"),
    };
  }

  return {
    fuelTypeLabel: t("settings.fields.fuelType"),
    energyConsumptionLabel: t("setupWorkspace.vehicle.fuelConsumption"),
    energyConsumptionHelp: t("setupWorkspace.vehicle.fuelConsumptionHelp"),
    energyPriceLabel: t("setupWorkspace.vehicle.fuelPrice"),
    energyPriceHelp: t("setupWorkspace.vehicle.fuelPriceHelp"),
    routineIntervalLabel: t("setupWorkspace.vehicle.scooterRoutineInterval"),
    routineCostLabel: t("setupWorkspace.vehicle.scooterRoutineCost"),
    majorIntervalLabel: t("setupWorkspace.vehicle.scooterMajorInterval"),
    majorCostLabel: t("setupWorkspace.vehicle.scooterMajorCost"),
    tireIntervalLabel: t("setupWorkspace.vehicle.scooterTireInterval"),
    tireCostLabel: t("setupWorkspace.vehicle.scooterTireCost"),
  };
}
