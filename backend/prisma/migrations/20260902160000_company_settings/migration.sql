CREATE TABLE `CompanySetting` (
  `id` INT NOT NULL DEFAULT 1,
  `companyName` VARCHAR(200) NOT NULL,
  `legalName` VARCHAR(200) NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(191) NULL,
  `address` TEXT NULL,
  `website` VARCHAR(255) NULL,
  `taxNumber` VARCHAR(100) NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `CompanySetting` (`id`, `companyName`)
VALUES (1, 'Kandy Ads')
ON DUPLICATE KEY UPDATE `id` = `id`;
