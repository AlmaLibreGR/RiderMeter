export type Platform = "efood" | "wolt" | "uber" | "other";

export type ShiftInput = {
  id?: string;
  date: string;
  platform?: Platform;
  hours: number;
  orders: number;
  kilometers: number;
  revenue: number;
  tips?: number;
};

export type VehicleSettings = {
  consumptionPer100Km: number;
  fuelPricePerLiter: number;
};

export type FixedCostsSettings = {
  dailyFixedCost: number;
};

export type ShiftCalculationConfig = {
  fuelCostPerKm: number;
  dailyFixedCost: number;
};

export type ShiftMetrics = {
  tipsTotal: number;
  totalRevenue: number;
  grossPerHour: number;
  revenuePerOrder: number;
  fuelCostPerKm: number;
  totalCostPerKm: number;
  variableCost: number;
  dailyFixedCost: number;
  totalShiftCost: number;
  netProfit: number;
  netPerHour: number;
};

export type ShiftWithMetrics = ShiftInput & {
  metrics: ShiftMetrics;
};