CREATE TABLE IF NOT EXISTS `TaskDependency` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `taskId` INT NOT NULL,
  `dependsOnTaskId` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `TaskDependency_taskId_dependsOnTaskId_key` (`taskId`, `dependsOnTaskId`),
  INDEX `TaskDependency_dependsOnTaskId_idx` (`dependsOnTaskId`),
  CONSTRAINT `TaskDependency_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TaskDependency_dependsOnTaskId_fkey` FOREIGN KEY (`dependsOnTaskId`) REFERENCES `Task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TaskChecklistItem` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `taskId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `required` BOOLEAN NOT NULL DEFAULT true,
  `completed` BOOLEAN NOT NULL DEFAULT false,
  `completedAt` DATETIME(3) NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `TaskChecklistItem_taskId_sortOrder_idx` (`taskId`, `sortOrder`),
  CONSTRAINT `TaskChecklistItem_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Task`
  ADD COLUMN `parentTaskId` INT NULL,
  ADD INDEX `Task_jobId_parentTaskId_idx` (`jobId`, `parentTaskId`),
  ADD CONSTRAINT `Task_parentTaskId_fkey` FOREIGN KEY (`parentTaskId`) REFERENCES `Task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
