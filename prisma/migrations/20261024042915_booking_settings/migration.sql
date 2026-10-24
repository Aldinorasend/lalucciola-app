-- CreateEnum
CREATE TYPE "TableShape" AS ENUM ('ROUND', 'SQUARE', 'RECT');

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "minSeats" INTEGER NOT NULL DEFAULT 1,
    "maxSeats" INTEGER NOT NULL,
    "combinable" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "posX" INTEGER NOT NULL DEFAULT 0,
    "posY" INTEGER NOT NULL DEFAULT 0,
    "shape" "TableShape" NOT NULL DEFAULT 'SQUARE',
    "rotation" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpeningHours" (
    "dayOfWeek" INTEGER NOT NULL,
    "firstBookingAt" INTEGER NOT NULL DEFAULT 360,
    "lastBookingAt" INTEGER NOT NULL DEFAULT 1200,

    CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("dayOfWeek")
);

-- CreateTable
CREATE TABLE "BookingSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "slotMinutes" INTEGER NOT NULL DEFAULT 15,
    "diningMinutes" INTEGER NOT NULL DEFAULT 90,
    "reservedSoonMinutes" INTEGER NOT NULL DEFAULT 30,
    "lateGraceMinutes" INTEGER NOT NULL DEFAULT 15,

    CONSTRAINT "BookingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Area_name_key" ON "Area"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Table_label_key" ON "Table"("label");

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
