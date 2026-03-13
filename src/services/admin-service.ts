import { aggregateShiftMetrics, withShiftMetrics } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import { getCostProfileSnapshot, getUserSettingsSnapshot, getVehicleProfileSnapshot } from "@/services/settings-service";
import { listUserShifts } from "@/services/shift-service";
import type {
  AdminOverviewDataset,
  BillingInterval,
  BillingPlanType,
  BillingProfileSnapshot,
  BillingStatus,
  CurrencyCode,
  RoleType,
} from "@/types/domain";

const activeBillingStatuses = new Set<BillingStatus>(["trial", "active", "past_due"]);

export async function getAdminOverviewDataset(): Promise<AdminOverviewDataset> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      appSettings: true,
      billingProfile: true,
    },
  });

  const snapshots = await Promise.all(
    users.map(async (user) => {
      const roleType: RoleType = user.roleType === "admin" ? "admin" : "simple";
      const [settings, vehicleProfile, costProfile, shifts] = await Promise.all([
        getUserSettingsSnapshot(user.id),
        getVehicleProfileSnapshot(user.id),
        getCostProfileSnapshot(user.id),
        listUserShifts(user.id),
      ]);

      const shiftsWithMetrics = withShiftMetrics(shifts, {
        settings,
        vehicleProfile,
        costProfile,
      });
      const aggregate = aggregateShiftMetrics(shiftsWithMetrics);
      const lastActiveAt = shiftsWithMetrics.reduce<string | null>((latest, shift) => {
        if (!latest || shift.date > latest) {
          return shift.date;
        }

        return latest;
      }, null);

      return {
        userId: user.id,
        publicCode: `RM-${String(user.id).padStart(6, "0")}`,
        roleType,
        locale: (user.appSettings?.locale ?? user.locale ?? "el") as "en" | "el",
        createdAt: user.createdAt.toISOString(),
        lastActiveAt,
        totalShifts: aggregate.totalShifts,
        totalRevenue: aggregate.totalRevenue,
        totalNetProfit: aggregate.netProfit,
        billing: toBillingSnapshot(user.billingProfile),
      };
    })
  );

  const activeThreshold = new Date();
  activeThreshold.setDate(activeThreshold.getDate() - 30);
  const activeThresholdIso = activeThreshold.toISOString().slice(0, 10);

  return {
    totalUsers: snapshots.length,
    activeUsers30d: snapshots.filter(
      (snapshot) => snapshot.lastActiveAt && snapshot.lastActiveAt >= activeThresholdIso
    ).length,
    payingUsers: snapshots.filter(
      (snapshot) =>
        snapshot.billing.planType !== "free" &&
        activeBillingStatuses.has(snapshot.billing.status)
    ).length,
    lifetimeUsers: snapshots.filter((snapshot) => snapshot.billing.planType === "lifetime")
      .length,
    subscriptionUsers: snapshots.filter(
      (snapshot) =>
        snapshot.billing.planType === "subscription" &&
        activeBillingStatuses.has(snapshot.billing.status)
    ).length,
    projectedMrr: snapshots.reduce((sum, snapshot) => sum + toMonthlyBillingAmount(snapshot.billing), 0),
    users: snapshots,
  };
}

export async function updateUserBillingProfile(args: {
  userId: number;
  planType: BillingPlanType;
  status: BillingStatus;
  billingInterval: BillingInterval | null;
  priceAmount: number | null;
  currency: CurrencyCode;
  currentPeriodEndsAt: string | null;
  lifetimeAccessGrantedAt: string | null;
}) {
  return prisma.billingProfile.upsert({
    where: { userId: args.userId },
    create: {
      userId: args.userId,
      planType: args.planType,
      status: args.status,
      billingInterval: args.billingInterval,
      priceAmount: args.priceAmount,
      currency: args.currency,
      currentPeriodEndsAt: args.currentPeriodEndsAt ? new Date(args.currentPeriodEndsAt) : null,
      lifetimeAccessGrantedAt: args.lifetimeAccessGrantedAt
        ? new Date(args.lifetimeAccessGrantedAt)
        : null,
    },
    update: {
      planType: args.planType,
      status: args.status,
      billingInterval: args.billingInterval,
      priceAmount: args.priceAmount,
      currency: args.currency,
      currentPeriodEndsAt: args.currentPeriodEndsAt ? new Date(args.currentPeriodEndsAt) : null,
      lifetimeAccessGrantedAt: args.lifetimeAccessGrantedAt
        ? new Date(args.lifetimeAccessGrantedAt)
        : null,
    },
  });
}

function toBillingSnapshot(
  billingProfile:
    | {
        planType: string;
        status: string;
        billingInterval: string | null;
        priceAmount: unknown;
        currency: string;
        paymentProvider: string | null;
        currentPeriodEndsAt: Date | null;
        lifetimeAccessGrantedAt: Date | null;
      }
    | null
): BillingProfileSnapshot {
  if (!billingProfile) {
    return {
      planType: "free",
      status: "inactive",
      billingInterval: null,
      priceAmount: null,
      currency: "EUR",
      paymentProvider: null,
      currentPeriodEndsAt: null,
      lifetimeAccessGrantedAt: null,
    };
  }

  return {
    planType: billingProfile.planType === "lifetime" || billingProfile.planType === "subscription"
      ? billingProfile.planType
      : "free",
    status:
      billingProfile.status === "trial" ||
      billingProfile.status === "active" ||
      billingProfile.status === "past_due" ||
      billingProfile.status === "cancelled"
        ? billingProfile.status
        : "inactive",
    billingInterval:
      billingProfile.billingInterval === "monthly" ||
      billingProfile.billingInterval === "yearly" ||
      billingProfile.billingInterval === "one_time"
        ? billingProfile.billingInterval
        : null,
    priceAmount:
      billingProfile.priceAmount == null
        ? null
        : Number((billingProfile.priceAmount as { toString(): string }).toString()),
    currency: billingProfile.currency === "EUR" ? "EUR" : "EUR",
    paymentProvider: billingProfile.paymentProvider,
    currentPeriodEndsAt: billingProfile.currentPeriodEndsAt?.toISOString() ?? null,
    lifetimeAccessGrantedAt: billingProfile.lifetimeAccessGrantedAt?.toISOString() ?? null,
  };
}

function toMonthlyBillingAmount(billing: BillingProfileSnapshot) {
  if (
    billing.planType !== "subscription" ||
    !activeBillingStatuses.has(billing.status) ||
    !billing.priceAmount
  ) {
    return 0;
  }

  if (billing.billingInterval === "yearly") {
    return billing.priceAmount / 12;
  }

  return billing.priceAmount;
}
