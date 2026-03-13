CREATE TABLE "BillingProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planType" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "billingInterval" TEXT,
    "priceAmount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentProvider" TEXT,
    "paymentProviderCustomerId" TEXT,
    "paymentProviderSubscriptionId" TEXT,
    "currentPeriodEndsAt" TIMESTAMP(3),
    "lifetimeAccessGrantedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingProfile_userId_key" ON "BillingProfile"("userId");
CREATE INDEX "BillingProfile_planType_status_idx" ON "BillingProfile"("planType", "status");

ALTER TABLE "BillingProfile"
ADD CONSTRAINT "BillingProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "BillingProfile" ("userId", "planType", "status", "currency", "createdAt", "updatedAt")
SELECT "id", 'free', 'inactive', 'EUR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("userId") DO NOTHING;
