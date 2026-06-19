-- AlterTable
ALTER TABLE "Block" ADD COLUMN     "metricActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "metricTarget" DOUBLE PRECISION,
ADD COLUMN     "metricType" "MetricType",
ADD COLUMN     "metricUnit" TEXT,
ADD COLUMN     "timerAccumMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timerStartedAt" TIMESTAMP(3);
