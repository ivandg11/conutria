CREATE TABLE `MealFood` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `group` VARCHAR(80) NOT NULL,
  `portion` VARCHAR(80) NOT NULL,
  `equivalents` DECIMAL(5, 2) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `MealFood_userId_name_group_key` (`userId`, `name`, `group`),
  INDEX `MealFood_userId_group_idx` (`userId`, `group`),
  PRIMARY KEY (`id`),
  CONSTRAINT `MealFood_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
