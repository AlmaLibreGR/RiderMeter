export const supportedLocales = ["en", "el"] as const;
export type AppLocale = (typeof supportedLocales)[number];

export const supportedCurrencies = ["EUR"] as const;
export type CurrencyCode = (typeof supportedCurrencies)[number];

export const supportedRoleTypes = ["simple", "admin"] as const;
export type RoleType = (typeof supportedRoleTypes)[number];

export const supportedPlatforms = ["efood", "wolt", "freelance", "other"] as const;
export type PlatformKey = (typeof supportedPlatforms)[number];

export const supportedVehicleTypes = ["car", "scooter", "ebike"] as const;
export type VehicleType = (typeof supportedVehicleTypes)[number];

export const supportedExpenseScopes = ["business", "personal"] as const;
export type ExpenseScope = (typeof supportedExpenseScopes)[number];

export const expenseCadences = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "one_time",
] as const;
export type ExpenseCadence = (typeof expenseCadences)[number];

export const dashboardPeriods = ["today", "week", "month", "custom"] as const;
export type DashboardPeriod = (typeof dashboardPeriods)[number];

export const billingPlanTypes = ["free", "lifetime", "subscription"] as const;
export type BillingPlanType = (typeof billingPlanTypes)[number];

export const billingStatuses = ["inactive", "trial", "active", "past_due", "cancelled"] as const;
export type BillingStatus = (typeof billingStatuses)[number];

export const billingIntervals = ["one_time", "monthly", "yearly"] as const;
export type BillingInterval = (typeof billingIntervals)[number];

export type Money = number;

export type CanonicalShift = {
  id: number;
  userId: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  hoursWorked: number;
  ordersCompleted: number;
  kilometersDriven: number;
  baseEarnings: Money;
  tipsAmount: Money;
  bonusAmount: Money;
  fuelExpenseDirect: Money | null;
  tollsOrParking: Money;
  platform: PlatformKey;
  area: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type VehicleProfileSnapshot = {
  vehicleType: VehicleType;
  fuelType: string;
  fuelPricePerLiter: number;
  fuelConsumptionPer100Km: number;
  maintenanceCostPerKm: number;
  depreciationCostPerKm: number;
  tiresCostPerKm: number;
  routineServiceIntervalKm: number | null;
  routineServiceCost: number | null;
  majorServiceIntervalKm: number | null;
  majorServiceCost: number | null;
  tireReplacementIntervalKm: number | null;
  tireReplacementCost: number | null;
  purchasePrice: number | null;
  resaleValue: number | null;
  expectedLifecycleKm: number | null;
};

export type CostProfileSnapshot = {
  dailyFixedCost: Money;
  insuranceMonthly: Money;
  phoneMonthly: Money;
  accountantMonthly: Money;
  roadTaxMonthly: Money;
  kteoMonthly: Money;
  otherMonthly: Money;
  recurringCategories: ExpenseCategorySnapshot[];
};

export type ExpenseCategorySnapshot = {
  id: number;
  name: string;
  scope: ExpenseScope;
  cadence: ExpenseCadence;
  defaultAmount: Money;
  isActive: boolean;
};

export type ExpenseEntrySnapshot = {
  id: number;
  categoryId: number | null;
  category: string;
  amount: Money;
  description: string | null;
  date: string;
  scope: ExpenseScope;
};

export type SetupSnapshot = {
  vehicleProfile: VehicleProfileSnapshot | null;
  recurringCategories: ExpenseCategorySnapshot[];
  recentExpenses: ExpenseEntrySnapshot[];
};

export type AppSettingsSnapshot = {
  currency: CurrencyCode;
  timezone: string;
  locale: AppLocale;
  preferredDashboardPeriod: DashboardPeriod;
  platformFeePercent: number;
  taxReservePercent: number;
};

export type BillingProfileSnapshot = {
  planType: BillingPlanType;
  status: BillingStatus;
  billingInterval: BillingInterval | null;
  priceAmount: Money | null;
  currency: CurrencyCode;
  paymentProvider: string | null;
  currentPeriodEndsAt: string | null;
  lifetimeAccessGrantedAt: string | null;
};

export type ShiftMetrics = {
  totalRevenue: Money;
  grossPerHour: Money;
  revenuePerOrder: Money;
  grossPerKm: Money;
  estimatedFuelCost: Money;
  maintenanceCost: Money;
  depreciationCost: Money;
  tiresCost: Money;
  tollsOrParkingCost: Money;
  variableCost: Money;
  allocatedFixedCost: Money;
  totalShiftCost: Money;
  netProfitBeforeReserve: Money;
  platformFeeCost: Money;
  taxReserveCost: Money;
  netProfit: Money;
  netPerHour: Money;
  netPerKm: Money;
  costPerKm: Money;
  profitMarginPercent: number;
  ordersPerHour: number;
  kilometersPerOrder: number;
  tipsSharePercent: number;
};

export type ShiftWithMetrics = CanonicalShift & {
  metrics: ShiftMetrics;
};

export type AggregateMetrics = {
  totalRevenue: Money;
  baseEarnings: Money;
  tipsAmount: Money;
  bonusAmount: Money;
  fuelCost: Money;
  maintenanceCost: Money;
  depreciationCost: Money;
  tiresCost: Money;
  tollsOrParkingCost: Money;
  variableCost: Money;
  fixedCosts: Money;
  platformFeeCost: Money;
  taxReserveCost: Money;
  totalCost: Money;
  netProfitBeforeReserve: Money;
  netProfit: Money;
  marginPercent: number;
  totalShifts: number;
  totalHours: number;
  totalOrders: number;
  totalKilometers: number;
  averageRevenuePerShift: Money;
  averageRevenuePerOrder: Money;
  averageRevenuePerHour: Money;
  netProfitPerHour: Money;
  netProfitPerOrder: Money;
  ordersPerHour: number;
  kilometersPerOrder: number;
  averageNetProfitPerShift: Money;
};

export type TimeSeriesPoint = {
  date: string;
  label: string;
  revenue: Money;
  costs: Money;
  netProfit: Money;
  orders: number;
  hours: number;
  kilometers: number;
};

export type WeekdayPerformancePoint = {
  weekday: string;
  revenue: Money;
  netProfit: Money;
  netProfitPerHour: Money;
};

export type CompositionSlice = {
  key: string;
  label: string;
  value: Money;
};

export type MetricDelta = {
  current: number;
  previous: number;
  changePercent: number;
  direction: "up" | "down" | "flat";
};

export type DashboardComparisons = {
  revenue: MetricDelta;
  netProfit: MetricDelta;
  orders: MetricDelta;
  hours: MetricDelta;
  kilometers: MetricDelta;
  margin: MetricDelta;
};

export type Insight = {
  id: string;
  titleKey: string;
  bodyKey: string;
  tone: "positive" | "neutral" | "caution";
  values?: Record<string, string | number>;
};

export type DashboardDataset = {
  period: DashboardPeriod;
  range: {
    from: string;
    to: string;
  };
  previousRange: {
    from: string;
    to: string;
  };
  hero: AggregateMetrics;
  today: AggregateMetrics;
  week: AggregateMetrics;
  month: AggregateMetrics;
  selected: AggregateMetrics;
  previous: AggregateMetrics;
  comparisons: DashboardComparisons;
  shifts: ShiftWithMetrics[];
  trend: TimeSeriesPoint[];
  previousTrend: TimeSeriesPoint[];
  weekdayPerformance: WeekdayPerformancePoint[];
  revenueComposition: CompositionSlice[];
  costComposition: CompositionSlice[];
  insights: Insight[];
  topShift: ShiftWithMetrics | null;
  topDay: TimeSeriesPoint | null;
  setup: {
    hasVehicleProfile: boolean;
    hasCostProfile: boolean;
  };
  settings: AppSettingsSnapshot;
};

export type AdminUserSnapshot = {
  userId: number;
  publicCode: string;
  roleType: RoleType;
  locale: AppLocale;
  createdAt: string;
  lastActiveAt: string | null;
  totalShifts: number;
  totalRevenue: Money;
  totalNetProfit: Money;
  billing: BillingProfileSnapshot;
};

export type AdminOverviewDataset = {
  totalUsers: number;
  activeUsers30d: number;
  payingUsers: number;
  lifetimeUsers: number;
  subscriptionUsers: number;
  projectedMrr: Money;
  users: AdminUserSnapshot[];
};
