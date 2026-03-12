export const supportedLocales = ["en", "el"] as const;
export type AppLocale = (typeof supportedLocales)[number];

export const supportedCurrencies = ["EUR"] as const;
export type CurrencyCode = (typeof supportedCurrencies)[number];

export const supportedPlatforms = ["efood", "wolt", "freelance", "other"] as const;
export type PlatformKey = (typeof supportedPlatforms)[number];

export const dashboardPeriods = ["today", "week", "month", "custom"] as const;
export type DashboardPeriod = (typeof dashboardPeriods)[number];

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
  vehicleType: string;
  fuelType: string;
  fuelPricePerLiter: number;
  fuelConsumptionPer100Km: number;
  maintenanceCostPerKm: number;
  depreciationCostPerKm: number;
  tiresCostPerKm: number;
};

export type CostProfileSnapshot = {
  dailyFixedCost: Money;
  insuranceMonthly: Money;
  phoneMonthly: Money;
  accountantMonthly: Money;
  roadTaxMonthly: Money;
  kteoMonthly: Money;
  otherMonthly: Money;
};

export type AppSettingsSnapshot = {
  currency: CurrencyCode;
  timezone: string;
  locale: AppLocale;
  preferredDashboardPeriod: DashboardPeriod;
  platformFeePercent: number;
  taxReservePercent: number;
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
