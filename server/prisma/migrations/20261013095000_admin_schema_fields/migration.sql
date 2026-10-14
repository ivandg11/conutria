-- Bring databases created from the original migration in line with the current Prisma schema.
ALTER TABLE `User`
  ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'NUTRITIONIST',
  ADD COLUMN `lastLoginAt` DATETIME(3) NULL;

ALTER TABLE `Patient`
  ADD COLUMN `medicalHistory` JSON NULL,
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN `dischargedAt` DATETIME(3) NULL;

ALTER TABLE `Consultation`
  ADD COLUMN `measures` JSON NULL,
  ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'FOLLOWUP',
  ADD COLUMN `recall24h` JSON NULL,
  ADD COLUMN `foodFrequency` JSON NULL;
