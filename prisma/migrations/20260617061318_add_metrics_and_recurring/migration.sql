-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('TIME', 'DISTANCE', 'COUNT', 'CUSTOM');

-- AlterEnum
ALTER TYPE "TodoStatus" ADD VALUE 'SKIPPED';

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "carriedFromId" TEXT,
ADD COLUMN     "metricActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "metricTarget" DOUBLE PRECISION,
ADD COLUMN     "metricType" "MetricType",
ADD COLUMN     "metricUnit" TEXT,
ADD COLUMN     "timerAccumMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timerStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RecurringRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🔁',
    "tagId" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "recurrence" "Recurrence" NOT NULL DEFAULT 'DAILY',
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "todosTemplate" JSONB NOT NULL DEFAULT '[]',
    "lastRunDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
