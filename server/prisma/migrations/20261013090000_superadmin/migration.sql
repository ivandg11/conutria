CREATE TABLE `Subscription` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `plan` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `renewsAt` DATETIME(3) NULL,
  `canceledAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Subscription_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `Subscription_status_renewsAt_idx`(`status`, `renewsAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Payment` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `subscriptionId` INTEGER NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `paidAt` DATETIME(3) NULL,
  `dueAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Payment_status_createdAt_idx`(`status`, `createdAt`),
  INDEX `Payment_dueAt_idx`(`dueAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Payment_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AuditLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `actorId` INTEGER NULL,
  `action` VARCHAR(191) NOT NULL,
  `details` TEXT NULL,
  `ip` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AuditLog_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SystemError` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `message` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `SystemError_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
