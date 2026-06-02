-- CreateTable
CREATE TABLE "RoundEvent" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "penalty" DECIMAL(18,2) NOT NULL,
    "mitigated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoundEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoundEvent" ADD CONSTRAINT "RoundEvent_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundEvent" ADD CONSTRAINT "RoundEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
