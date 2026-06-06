-- CreateEnum
CREATE TYPE "BlockStatus" AS ENUM ('PLANNED', 'DONE', 'PARTIAL', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TodoStatus" AS ENUM ('PENDING', 'DONE', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('NONE', 'DAILY', 'WEEKDAYS', 'WEEKLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tagId" TEXT,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "BlockStatus" NOT NULL DEFAULT 'PLANNED',
    "recurrence" "Recurrence" NOT NULL DEFAULT 'NONE',
    "recurrenceEndDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "TodoStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "completedLaterAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
