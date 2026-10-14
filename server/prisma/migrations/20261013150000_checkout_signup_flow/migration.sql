ALTER TABLE `User` MODIFY `passwordHash` VARCHAR(191) NULL;

ALTER TABLE `Payment` ADD COLUMN `providerPaymentId` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `Payment_providerPaymentId_key` ON `Payment`(`providerPaymentId`);

CREATE TABLE `PendingSignup` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `plan` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `providerPreferenceId` VARCHAR(191) NULL,
  `userId` INTEGER NULL,
  `paidAt` DATETIME(3) NULL,
  `emailSentAt` DATETIME(3) NULL,
  `processingStartedAt` DATETIME(3) NULL,
  UNIQUE INDEX `PendingSignup_providerPreferenceId_key` (`providerPreferenceId`),
  UNIQUE INDEX `PendingSignup_userId_key` (`userId`),
  INDEX `PendingSignup_email_status_expiresAt_idx` (`email`, `status`, `expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PasswordSetupToken` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `PasswordSetupToken_tokenHash_key` (`tokenHash`),
  INDEX `PasswordSetupToken_userId_expiresAt_idx` (`userId`, `expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PendingSignup` ADD CONSTRAINT `PendingSignup_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `PasswordSetupToken` ADD CONSTRAINT `PasswordSetupToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
