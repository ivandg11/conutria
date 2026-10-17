ALTER TABLE `Subscription`
  ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'MXN';

ALTER TABLE `PendingSignup`
  ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'MXN',
  ADD COLUMN `renewalForUserId` INTEGER NULL;

CREATE INDEX `PendingSignup_renewalForUserId_idx` ON `PendingSignup`(`renewalForUserId`);
