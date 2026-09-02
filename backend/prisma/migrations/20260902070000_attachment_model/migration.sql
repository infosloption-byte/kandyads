CREATE TABLE IF NOT EXISTS `attachment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `entityType` VARCHAR(50) NOT NULL,
  `entityId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `mimeType` VARCHAR(120) NULL,
  `sizeBytes` INT NULL,
  `storageKey` VARCHAR(500) NULL,
  `url` VARCHAR(1000) NULL,
  `uploadedById` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `attachment_entityType_entityId_idx` (`entityType`, `entityId`),
  INDEX `attachment_uploadedById_idx` (`uploadedById`),
  CONSTRAINT `attachment_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
