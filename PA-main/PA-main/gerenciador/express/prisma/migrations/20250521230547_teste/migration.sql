/*
  Warnings:

  - Added the required column `ownerId` to the `Posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Training` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Posts` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ownerId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Profile` ADD COLUMN `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE `Training` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ownerId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `SharedAccess` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `postId` INTEGER NULL,
    `trainingId` INTEGER NULL,
    `canView` BOOLEAN NOT NULL DEFAULT true,
    `canEdit` BOOLEAN NOT NULL DEFAULT false,
    `canDelete` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Posts` ADD CONSTRAINT `Posts_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Profile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Training` ADD CONSTRAINT `Training_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Profile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SharedAccess` ADD CONSTRAINT `SharedAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Profile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SharedAccess` ADD CONSTRAINT `SharedAccess_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Posts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SharedAccess` ADD CONSTRAINT `SharedAccess_trainingId_fkey` FOREIGN KEY (`trainingId`) REFERENCES `Training`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
