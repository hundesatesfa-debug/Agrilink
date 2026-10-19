CREATE TABLE `FarmerProducePost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `farmerId` INTEGER NOT NULL,
    `cropId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `quantity` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL DEFAULT 'kg',
    `pricePerUnit` DOUBLE NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `postedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FarmerProducePost_isActive_postedAt_idx` (`isActive`, `postedAt`),
    INDEX `FarmerProducePost_farmerId_isActive_idx` (`farmerId`, `isActive`),
    PRIMARY KEY (`id`),
    CONSTRAINT `FarmerProducePost_farmerId_fkey` FOREIGN KEY (`farmerId`) REFERENCES `FarmerProfile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FarmerProducePost_cropId_fkey` FOREIGN KEY (`cropId`) REFERENCES `Crop` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
