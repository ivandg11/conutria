CREATE TABLE `Session` (
  `id` VARCHAR(64) NOT NULL,
  `userId` INTEGER NOT NULL,
  `lastActivity` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Session_userId_revokedAt_idx` (`userId`, `revokedAt`),
  INDEX `Session_expiresAt_idx` (`expiresAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CheckInInvitation` (
  `id` VARCHAR(191) NOT NULL,
  `patientId` INTEGER NOT NULL,
  `tokenHash` VARCHAR(64) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `CheckInInvitation_tokenHash_key` (`tokenHash`),
  INDEX `CheckInInvitation_patientId_createdAt_idx` (`patientId`, `createdAt`),
  INDEX `CheckInInvitation_expiresAt_usedAt_idx` (`expiresAt`, `usedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `CheckInInvitation_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WeeklyCheckIn` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `patientId` INTEGER NOT NULL,
  `invitationId` VARCHAR(191) NOT NULL,
  `adherence` INTEGER NOT NULL,
  `energy` INTEGER NOT NULL,
  `hunger` INTEGER NOT NULL,
  `challenges` VARCHAR(500) NULL,
  `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `consentAcceptedAt` DATETIME(3) NOT NULL,
  `reviewedAt` DATETIME(3) NULL,
  `reviewNotes` VARCHAR(1000) NULL,
  UNIQUE INDEX `WeeklyCheckIn_invitationId_key` (`invitationId`),
  INDEX `WeeklyCheckIn_patientId_submittedAt_idx` (`patientId`, `submittedAt`),
  INDEX `WeeklyCheckIn_patientId_reviewedAt_idx` (`patientId`, `reviewedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `WeeklyCheckIn_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `WeeklyCheckIn_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `CheckInInvitation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
