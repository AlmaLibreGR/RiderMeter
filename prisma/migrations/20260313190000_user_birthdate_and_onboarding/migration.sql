ALTER TABLE "User"
ADD COLUMN "birthDate" TIMESTAMP(3);

ALTER TABLE "AppSettings"
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
