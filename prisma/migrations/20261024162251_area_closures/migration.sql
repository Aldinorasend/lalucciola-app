-- CreateTable
CREATE TABLE "AreaClosure" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AreaClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AreaClosure_date_idx" ON "AreaClosure"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AreaClosure_areaId_date_key" ON "AreaClosure"("areaId", "date");

-- AddForeignKey
ALTER TABLE "AreaClosure" ADD CONSTRAINT "AreaClosure_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaClosure" ADD CONSTRAINT "AreaClosure_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
