-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('driving', 'parked', 'charging', 'offline');

-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('charging', 'waypoint');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted');

-- CreateEnum
CREATE TYPE "InvitePermission" AS ENUM ('live', 'live_history');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "chargeLevel" INTEGER NOT NULL DEFAULT 0,
    "estimatedRange" INTEGER NOT NULL DEFAULT 0,
    "status" "VehicleStatus" NOT NULL DEFAULT 'offline',
    "speed" INTEGER NOT NULL DEFAULT 0,
    "heading" INTEGER NOT NULL DEFAULT 0,
    "locationName" TEXT NOT NULL DEFAULT '',
    "locationAddress" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interiorTemp" INTEGER NOT NULL DEFAULT 0,
    "exteriorTemp" INTEGER NOT NULL DEFAULT 0,
    "odometerMiles" INTEGER NOT NULL DEFAULT 0,
    "fsdMilesToday" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "destinationName" TEXT,
    "destinationAddress" TEXT,
    "etaMinutes" INTEGER,
    "tripDistanceMiles" DOUBLE PRECISION,
    "tripDistanceRemaining" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripStop" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "type" "StopType" NOT NULL,

    CONSTRAINT "TripStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drive" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "startLocation" TEXT NOT NULL,
    "startAddress" TEXT NOT NULL,
    "endLocation" TEXT NOT NULL,
    "endAddress" TEXT NOT NULL,
    "distanceMiles" DOUBLE PRECISION NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "avgSpeedMph" DOUBLE PRECISION NOT NULL,
    "maxSpeedMph" DOUBLE PRECISION NOT NULL,
    "energyUsedKwh" DOUBLE PRECISION NOT NULL,
    "startChargeLevel" INTEGER NOT NULL,
    "endChargeLevel" INTEGER NOT NULL,
    "fsdMiles" DOUBLE PRECISION NOT NULL,
    "fsdPercentage" DOUBLE PRECISION NOT NULL,
    "interventions" INTEGER NOT NULL,
    "routePoints" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Drive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'pending',
    "permission" "InvitePermission" NOT NULL DEFAULT 'live',
    "sentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedDate" TIMESTAMP(3),
    "lastSeen" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teslaLinked" BOOLEAN NOT NULL DEFAULT false,
    "teslaVehicleName" TEXT,
    "notifyDriveStarted" BOOLEAN NOT NULL DEFAULT true,
    "notifyDriveCompleted" BOOLEAN NOT NULL DEFAULT true,
    "notifyChargingComplete" BOOLEAN NOT NULL DEFAULT true,
    "notifyViewerJoined" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");

-- CreateIndex
CREATE INDEX "TripStop_vehicleId_idx" ON "TripStop"("vehicleId");

-- CreateIndex
CREATE INDEX "Drive_vehicleId_idx" ON "Drive"("vehicleId");

-- CreateIndex
CREATE INDEX "Drive_vehicleId_date_idx" ON "Drive"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "Invite_senderId_idx" ON "Invite"("senderId");

-- CreateIndex
CREATE INDEX "Invite_vehicleId_idx" ON "Invite"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_vehicleId_email_key" ON "Invite"("vehicleId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drive" ADD CONSTRAINT "Drive_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
