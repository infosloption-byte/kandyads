CREATE TABLE `Branch` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `address` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(191) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Branch_code_key` (`code`),
  KEY `Branch_active_idx` (`active`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NumberSequence` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `entity` VARCHAR(100) NOT NULL,
  `prefix` VARCHAR(30) NOT NULL,
  `nextValue` INT NOT NULL DEFAULT 1,
  `padding` INT NOT NULL DEFAULT 4,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `NumberSequence_entity_key` (`entity`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Branch` (`code`, `name`, `active`)
VALUES ('HQ', 'Kandy Ads - Head Office', true)
ON DUPLICATE KEY UPDATE `code` = `code`;

INSERT INTO `NumberSequence` (`entity`, `prefix`, `nextValue`, `padding`, `active`) VALUES
  ('LEAD', 'LEAD-', 1, 5, true),
  ('ENQUIRY', 'ENQ-', 1, 5, true),
  ('QUOTE', 'QT-', 1, 5, true),
  ('PROJECT', 'PRJ-', 1, 5, true),
  ('JOB', 'JOB-', 1, 5, true),
  ('INVOICE', 'INV-', 1, 5, true),
  ('PURCHASE_ORDER', 'PO-', 1, 5, true)
ON DUPLICATE KEY UPDATE `entity` = `entity`;
