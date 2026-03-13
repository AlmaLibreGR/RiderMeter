"use client";

import Link from "next/link";
import { CarFront, Plus, ReceiptText, Trash2, WalletCards } from "lucide-react";
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

type SetupStepId = "vehicle" | "categories" | "expenses";

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

const cadenceOptions: ExpenseCadence[] = ["daily", "weekly", "monthly", "yearly", "one_time"];

export default function SetupWorkspace({
  initialData,
  currency,
  timezone,
}: SetupWorkspaceProps) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "el";
  const [activeStep, setActiveStep] = useState<SetupStepId>("vehicle");
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
    const dailyBudget = categories
      .filter(
        (category) =>
          category.isActive &&
          category.scope === "business" &&
          category.cadence !== "one_time"
      )
      .reduce(
        (sum, category) =>
          sum +
          normalizeCadenceToDailyAmount(toNumber(category.defaultAmount), category.cadence),
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
  const steps = [
    {
      id: "vehicle" as const,
      title: t("setupWorkspace.sections.vehicleTitle"),
      description: t("setupWorkspace.sections.vehicleBody"),
      icon: CarFront,
    },
    {
      id: "categories" as const,
      title: t("setupWorkspace.sections.budgetTitle"),
      description: t("setupWorkspace.sections.budgetBody"),
      icon: WalletCards,
    },
    {
      id: "expenses" as const,
      title: t("setupWorkspace.sections.expensesTitle"),
      description: t("setupWorkspace.sections.expensesBody"),
      icon: ReceiptText,
    },
  ];
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  async function handleSaveSetup() {
    setSaveState({ loading: true, message: null, error: false });

    const response = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
    setExpenseForm((current) => ({ ...current, amount: "", description: "" }));
    setExpenseState({
      loading: false,
      message: t("setupWorkspace.expenses.success"),
      error: false,
    });
  }

  function goToStep(direction: "next" | "previous") {
    const offset = direction === "next" ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(steps.length - 1, activeIndex + offset));
    setActiveStep(steps[nextIndex].id);
  }

  return (
    <div className="grid gap-5 pb-28 xl:grid-cols-[minmax(0,1.3fr)_22rem] xl:pb-0">
      <div className="space-y-4">
        <section className="rm-surface p-4 md:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="rm-pill">{t("setupWorkspace.eyebrow")}</div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
                  {t("setupWorkspace.title")}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {t("setupWorkspace.body")}
                </p>
              </div>
              <div className="hidden rounded-[22px] border border-orange-100 bg-white px-4 py-3 text-right sm:block">
                <p className="rm-stat-kicker">{`${activeIndex + 1}/${steps.length}`}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {steps[activeIndex]?.title}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryPair
                label={t("settings.fields.vehicleType")}
                value={t(`setupWorkspace.vehicle.types.${vehicle.vehicleType}`)}
              />
              <SummaryPair
                label={t("setupWorkspace.vehicle.totalPerKm")}
                value={formatCurrency(derivedCosts.totalCostPerKm, locale, currency)}
              />
              <SummaryPair
                label={t("setupWorkspace.categories.dailyBudget")}
                value={formatCurrency(recurringSummary.dailyBudget, locale, currency)}
              />
              <SummaryPair
                label={t("setupWorkspace.sections.recentTitle")}
                value={formatNumber(recentExpenses.length, locale, 0)}
              />
            </div>

            {saveState.message ? (
              <InlineNotice error={saveState.error}>{saveState.message}</InlineNotice>
            ) : null}

            <div className="rm-step-strip xl:hidden">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === activeStep;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`rm-step-chip ${isActive ? "rm-step-chip-active" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rm-step-index">{index + 1}</span>
                      <Icon size={15} className={isActive ? "text-orange-600" : "text-slate-500"} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <WorkspaceSection
          eyebrow={t("setupWorkspace.sections.vehicleEyebrow")}
          title={t("setupWorkspace.sections.vehicleTitle")}
          description={t("setupWorkspace.sections.vehicleBody")}
          icon={<CarFront size={18} />}
          className={activeStep === "vehicle" ? "block" : "hidden xl:block"}
        >
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              {(["car", "scooter", "ebike"] as VehicleType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setVehicle((current) => ({
                      ...current,
                      vehicleType: type,
                      fuelType:
                        type === "ebike"
                          ? "electric"
                          : current.fuelType === "electric"
                            ? "petrol"
                            : current.fuelType,
                    }))
                  }
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    vehicle.vehicleType === type
                      ? "border-orange-200 bg-orange-50 text-slate-950 shadow-[0_16px_32px_rgba(239,90,41,0.12)]"
                      : "border-stone-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/50"
                  }`}
                >
                  <p className="rm-stat-kicker">{t("settings.fields.vehicleType")}</p>
                  <p className="mt-2 text-base font-semibold">
                    {t(`setupWorkspace.vehicle.types.${type}`)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {t(`setupWorkspace.vehicle.typeBodies.${type}`)}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rm-subtle-card p-4">
                <p className="rm-pill">{t("settings.fields.fuelType")}</p>
                <div className="mt-4 space-y-4">
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
                        <option value="electric">
                          {t("setupWorkspace.vehicle.energyModes.electric")}
                        </option>
                      ) : (
                        <>
                          <option value="petrol">
                            {t("setupWorkspace.vehicle.energyModes.petrol")}
                          </option>
                          <option value="diesel">
                            {t("setupWorkspace.vehicle.energyModes.diesel")}
                          </option>
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
              </div>

              <div className="rm-subtle-card p-4 xl:col-span-2">
                <p className="rm-pill">{t("setupWorkspace.sections.vehicleEyebrow")}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
              </div>
            </div>

            <div className="rm-subtle-card p-4">
              <p className="rm-pill">{t("setupWorkspace.vehicle.expectedLifecycleKm")}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
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
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                label={t("setupWorkspace.vehicle.energyPerKm")}
                value={formatCurrency(derivedCosts.energyCostPerKm, locale, currency)}
              />
              <MetricTile
                label={t("setupWorkspace.vehicle.maintenancePerKm")}
                value={formatCurrency(derivedCosts.maintenanceCostPerKm, locale, currency)}
              />
              <MetricTile
                label={t("setupWorkspace.vehicle.tiresPerKm")}
                value={formatCurrency(derivedCosts.tiresCostPerKm, locale, currency)}
              />
              <MetricTile
                label={t("setupWorkspace.vehicle.totalPerKm")}
                value={formatCurrency(derivedCosts.totalCostPerKm, locale, currency)}
                emphasis
              />
            </div>

            <StepNavigation
              activeIndex={activeIndex}
              lastIndex={steps.length - 1}
              onPrevious={() => goToStep("previous")}
              onNext={() => goToStep("next")}
              previousLabel={t("common.previous")}
              nextLabel={t("common.next")}
              className="xl:hidden"
            />
          </div>
        </WorkspaceSection>

        <WorkspaceSection
          eyebrow={t("setupWorkspace.sections.budgetEyebrow")}
          title={t("setupWorkspace.sections.budgetTitle")}
          description={t("setupWorkspace.sections.budgetBody")}
          icon={<WalletCards size={18} />}
          className={activeStep === "categories" ? "block" : "hidden xl:block"}
        >
          <div className="space-y-4">
            <div className="rm-action-row">
              <button
                type="button"
                onClick={() =>
                  setCategories((current) => [...current, createEmptyCategory("business")])
                }
                className="rm-button-secondary"
              >
                <Plus size={16} />
                {t("setupWorkspace.categories.addBusiness")}
              </button>
              <button
                type="button"
                onClick={() =>
                  setCategories((current) => [...current, createEmptyCategory("personal")])
                }
                className="rm-button-secondary"
              >
                <Plus size={16} />
                {t("setupWorkspace.categories.addPersonal")}
              </button>
            </div>

            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.localId} className="rm-subtle-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <InputField label={t("setupWorkspace.categories.name")}>
                        <input
                          type="text"
                          value={category.name}
                          onChange={(event) =>
                            updateCategory(setCategories, category.localId, {
                              name: event.target.value,
                            })
                          }
                          className="rm-input"
                          placeholder={
                            locale === "el" ? "π.χ. Ασφάλεια ή Snacks" : "e.g. Insurance or snacks"
                          }
                        />
                      </InputField>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCategories((current) =>
                          current.filter((item) => item.localId !== category.localId)
                        )
                      }
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-stone-200 bg-white text-slate-500 hover:border-orange-200 hover:text-orange-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]">
                    <div className="space-y-4">
                      <div>
                        <label className="rm-field-label">{t("setupWorkspace.categories.scope")}</label>
                        <div className="rm-inline-chip-row">
                          {(["business", "personal"] as ExpenseScope[]).map((scope) => (
                            <button
                              key={scope}
                              type="button"
                              onClick={() => updateCategory(setCategories, category.localId, { scope })}
                              className={`rm-inline-chip ${
                                category.scope === scope ? "rm-inline-chip-active" : ""
                              }`}
                            >
                              {t(`setupWorkspace.categories.scopes.${scope}`)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="rm-field-label">{t("setupWorkspace.categories.cadence")}</label>
                        <div className="rm-inline-chip-row">
                          {cadenceOptions.map((cadence) => (
                            <button
                              key={cadence}
                              type="button"
                              onClick={() =>
                                updateCategory(setCategories, category.localId, { cadence })
                              }
                              className={`rm-inline-chip ${
                                category.cadence === cadence ? "rm-inline-chip-active" : ""
                              }`}
                            >
                              {t(`setupWorkspace.categories.cadences.${cadence}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <NumberInput
                        label={t("setupWorkspace.categories.amount")}
                        value={category.defaultAmount}
                        onChange={(value) =>
                          updateCategory(setCategories, category.localId, { defaultAmount: value })
                        }
                      />
                      <label className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-slate-600">
                        <input
                          type="checkbox"
                          checked={category.isActive}
                          onChange={(event) =>
                            updateCategory(setCategories, category.localId, {
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

            <div className="grid gap-3 md:grid-cols-2">
              <MetricTile
                label={t("setupWorkspace.categories.dailyBudget")}
                value={formatCurrency(recurringSummary.dailyBudget, locale, currency)}
              />
              <MetricTile
                label={t("setupWorkspace.categories.monthlyBudget")}
                value={formatCurrency(recurringSummary.monthlyEquivalent, locale, currency)}
              />
            </div>

            <div className="rm-action-row">
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

            <StepNavigation
              activeIndex={activeIndex}
              lastIndex={steps.length - 1}
              onPrevious={() => goToStep("previous")}
              onNext={() => goToStep("next")}
              previousLabel={t("common.previous")}
              nextLabel={t("common.next")}
              className="xl:hidden"
            />
          </div>
        </WorkspaceSection>

        <WorkspaceSection
          eyebrow={t("setupWorkspace.sections.expensesEyebrow")}
          title={t("setupWorkspace.sections.expensesTitle")}
          description={t("setupWorkspace.sections.expensesBody")}
          icon={<ReceiptText size={18} />}
          className={activeStep === "expenses" ? "block" : "hidden xl:block"}
        >
          <div className="space-y-4">
            {availableExpenseCategories.length === 0 ? (
              <InlineNotice error>{t("setupWorkspace.expenses.unsavedCategory")}</InlineNotice>
            ) : null}

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                        (category) => String(category.id ?? category.localId) === event.target.value
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
              </div>

              <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
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
                    className="rm-input min-h-[128px] resize-none"
                    placeholder={
                      locale === "el"
                        ? "π.χ. καύσιμα, καφές, λάστιχο ή αγορά εξοπλισμού"
                        : "e.g. fuel, coffee, tire, or gear purchase"
                    }
                  />
                </InputField>
              </div>

              <button
                type="submit"
                disabled={expenseState.loading || availableExpenseCategories.length === 0}
                className="rm-button-primary disabled:opacity-60"
              >
                {expenseState.loading ? t("common.saving") : t("setupWorkspace.expenses.submit")}
              </button>

              {expenseState.message ? (
                <InlineNotice error={expenseState.error}>{expenseState.message}</InlineNotice>
              ) : null}
            </form>

            <div className="rm-section-divider" />

            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="rm-pill">{t("setupWorkspace.sections.recentEyebrow")}</p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">
                    {t("setupWorkspace.sections.recentTitle")}
                  </h3>
                </div>
                <p className="text-sm text-slate-500">
                  {formatNumber(recentExpenses.length, locale, 0)}
                </p>
              </div>

              {recentExpenses.length === 0 ? (
                <div className="mt-4 rounded-[24px] border border-dashed border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-slate-600">
                  {t("setupWorkspace.expenses.empty")}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {recentExpenses.slice(0, 6).map((expense) => (
                    <RecentExpenseCard
                      key={expense.id}
                      expense={expense}
                      locale={locale}
                      currency={currency}
                      timezone={timezone}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>

            <StepNavigation
              activeIndex={activeIndex}
              lastIndex={steps.length - 1}
              onPrevious={() => goToStep("previous")}
              previousLabel={t("common.previous")}
              nextLabel={t("common.next")}
              className="xl:hidden"
            />
          </div>
        </WorkspaceSection>
      </div>

      <aside className="hidden space-y-4 xl:block xl:sticky xl:top-5 xl:self-start">
        <section className="rm-surface-strong p-5">
          <div className="rm-pill">{t("setupWorkspace.eyebrow")}</div>
          <div className="mt-4 grid gap-3">
            <MetricTile
              label={t("setupWorkspace.vehicle.totalPerKm")}
              value={formatCurrency(derivedCosts.totalCostPerKm, locale, currency)}
            />
            <MetricTile
              label={t("setupWorkspace.categories.dailyBudget")}
              value={formatCurrency(recurringSummary.dailyBudget, locale, currency)}
            />
            <MetricTile
              label={t("setupWorkspace.categories.amount")}
              value={formatNumber(recurringCategoryCount, locale, 0)}
            />
            <MetricTile
              label={t("setupWorkspace.expenses.amount")}
              value={formatNumber(recentExpenses.length, locale, 0)}
            />
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => void handleSaveSetup()}
              disabled={saveState.loading}
              className="rm-button-primary w-full disabled:opacity-60"
            >
              {saveState.loading ? t("common.saving") : t("setupWorkspace.messages.save")}
            </button>
            <Link href="/" className="rm-button-secondary w-full">
              {t("common.backToDashboard")}
            </Link>
          </div>
        </section>

        <section className="rm-surface-strong p-5">
          <div className="rm-pill">{t("setupWorkspace.sections.recentEyebrow")}</div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">
            {t("setupWorkspace.sections.recentTitle")}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t("setupWorkspace.sections.recentBody")}
          </p>

          {recentExpenses.length === 0 ? (
            <div className="mt-4 rounded-[24px] border border-dashed border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-slate-600">
              {t("setupWorkspace.expenses.empty")}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {recentExpenses.map((expense) => (
                <RecentExpenseCard
                  key={expense.id}
                  expense={expense}
                  locale={locale}
                  currency={currency}
                  timezone={timezone}
                  t={t}
                />
              ))}
            </div>
          )}
        </section>
      </aside>

      {activeStep !== "expenses" ? (
        <div className="rm-mobile-dock xl:hidden">
          <div className="rm-mobile-dock-card">
            <div className="min-w-0 flex-1">
              <p className="rm-stat-kicker">{t("setupWorkspace.vehicle.totalPerKm")}</p>
              <p className="truncate text-base font-semibold text-slate-950">
                {formatCurrency(derivedCosts.totalCostPerKm, locale, currency)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleSaveSetup()}
              disabled={saveState.loading}
              className="rm-button-primary shrink-0 px-5 disabled:opacity-60"
            >
              {saveState.loading ? t("common.saving") : t("setupWorkspace.messages.save")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rm-summary-pair">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-right text-sm font-semibold text-slate-950">{value}</p>
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
      className={`rounded-[24px] border px-4 py-3 text-sm ${
        error
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {children}
    </div>
  );
}

function WorkspaceSection({
  eyebrow,
  title,
  description,
  icon,
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <div className="rm-surface-strong p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] bg-orange-50 text-orange-600">
            {icon}
          </div>
          <div>
            <div className="rm-pill">{eyebrow}</div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-5">{children}</div>
      </div>
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
        inputMode="decimal"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rm-input"
      />
    </InputField>
  );
}

function MetricTile({
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
      className={`rounded-[24px] border px-4 py-4 ${
        emphasis ? "border-orange-200 bg-orange-50" : "border-stone-200 bg-white"
      }`}
    >
      <p className="rm-stat-kicker">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function StepNavigation({
  activeIndex,
  lastIndex,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  className,
}: {
  activeIndex: number;
  lastIndex: number;
  onPrevious: () => void;
  onNext?: () => void;
  previousLabel: string;
  nextLabel: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className ?? ""}`}>
      <button
        type="button"
        onClick={onPrevious}
        disabled={activeIndex === 0}
        className="rm-button-secondary disabled:opacity-50"
      >
        {previousLabel}
      </button>

      {activeIndex < lastIndex && onNext ? (
        <button type="button" onClick={onNext} className="rm-button-primary">
          {nextLabel}
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}

function RecentExpenseCard({
  expense,
  locale,
  currency,
  timezone,
  t,
}: {
  expense: ExpenseEntrySnapshot;
  locale: "en" | "el";
  currency: CurrencyCode;
  timezone: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="rm-stat-tile">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">{expense.category}</p>
          <p className="mt-1 text-sm text-slate-500">{formatDate(expense.date, locale, timezone)}</p>
          {expense.description ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">{expense.description}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="rm-stat-kicker">{t(`setupWorkspace.categories.scopes.${expense.scope}`)}</p>
          <p className="mt-2 text-base font-semibold text-slate-950">
            {formatCurrency(expense.amount, locale, currency)}
          </p>
        </div>
      </div>
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
  setCategories: React.Dispatch<React.SetStateAction<CategoryFormState[]>>,
  localId: string,
  changes: Partial<CategoryFormState>
) {
  setCategories((current) =>
    current.map((category) =>
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

function getVehicleCopy(vehicleType: VehicleType, t: ReturnType<typeof useTranslations>) {
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
