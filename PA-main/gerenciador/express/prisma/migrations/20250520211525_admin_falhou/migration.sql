-- CreateTable
CREATE TABLE `Posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageName` VARCHAR(191) NOT NULL,
    `originalFileName` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `categoryId` INTEGER NOT NULL,
    `created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tool` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `responsible` VARCHAR(191) NOT NULL,
    `responsibleEmail` VARCHAR(191) NOT NULL,
    `acquisitionDate` DATETIME(3) NOT NULL,
    `expirationDate` DATETIME(3) NOT NULL,
    `lastNotification` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Training` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `imageName` VARCHAR(191) NULL,
    `originalFileName` VARCHAR(191) NULL,
    `fileType` VARCHAR(191) NULL,
    `categoryId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(191) NOT NULL,
    `trainingId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `profileId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Profile_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Posts` ADD CONSTRAINT `Posts_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Training` ADD CONSTRAINT `Training_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingLink` ADD CONSTRAINT `TrainingLink_trainingId_fkey` FOREIGN KEY (`trainingId`) REFERENCES `Training`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
