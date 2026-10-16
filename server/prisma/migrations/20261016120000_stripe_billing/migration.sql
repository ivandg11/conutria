DROP INDEX PendingSignup_providerPreferenceId_key ON PendingSignup;
ALTER TABLE PendingSignup
  CHANGE COLUMN providerPreferenceId checkoutSessionId VARCHAR(191) NULL;
CREATE UNIQUE INDEX PendingSignup_checkoutSessionId_key ON PendingSignup(checkoutSessionId);

ALTER TABLE Subscription
  ADD COLUMN stripeSubscriptionId VARCHAR(191) NULL,
  ADD COLUMN stripeCustomerId VARCHAR(191) NULL,
  ADD COLUMN cancelAtPeriodEnd BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX Subscription_stripeSubscriptionId_key ON Subscription(stripeSubscriptionId);