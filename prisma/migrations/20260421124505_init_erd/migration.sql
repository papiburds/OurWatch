-- CreateTable
CREATE TABLE `ACCOUNT` (
    `Account_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `Address` VARCHAR(500) NULL,
    `sex` VARCHAR(20) NULL,
    `contact_information` VARCHAR(50) NULL,
    `Official_ID` INTEGER NULL,
    `Contact_Number` VARCHAR(30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ACCOUNT_email_key`(`email`),
    UNIQUE INDEX `ACCOUNT_Official_ID_key`(`Official_ID`),
    UNIQUE INDEX `ACCOUNT_Contact_Number_key`(`Contact_Number`),
    PRIMARY KEY (`Account_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CITIZEN` (
    `Contact_Number` VARCHAR(30) NOT NULL,
    `Citizen_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Full_name` VARCHAR(191) NOT NULL,
    `Address` VARCHAR(500) NULL,
    `User_Credentials` VARCHAR(255) NULL,
    `Registration_Date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CITIZEN_Citizen_ID_key`(`Citizen_ID`),
    PRIMARY KEY (`Contact_Number`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BRGY_OFFICIAL` (
    `Official_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Official_name` VARCHAR(191) NOT NULL,
    `position` VARCHAR(100) NOT NULL,
    `Contact_Info` VARCHAR(100) NULL,
    `Account_Status` VARCHAR(50) NOT NULL DEFAULT 'Active',
    `Community_ID` INTEGER NULL,

    PRIMARY KEY (`Official_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `COMMUNITY` (
    `Community_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Area_Name` VARCHAR(191) NOT NULL,
    `Demographics_Summary` TEXT NULL,
    `Public_Statistics_View` TEXT NULL,
    `Contact_Number` VARCHAR(30) NULL,

    PRIMARY KEY (`Community_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `REPORT` (
    `report_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `type_of_report` VARCHAR(100) NOT NULL,
    `Description` TEXT NOT NULL,
    `Location` VARCHAR(500) NOT NULL,
    `Photo_URL` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Contact_Number` VARCHAR(30) NOT NULL,

    INDEX `REPORT_Contact_Number_idx`(`Contact_Number`),
    INDEX `REPORT_created_at_idx`(`created_at`),
    PRIMARY KEY (`report_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UPDATEDREPORT` (
    `Report_ID` INTEGER NOT NULL,
    `Status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
    `Action_Taken` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UPDATEDREPORT_Status_idx`(`Status`),
    PRIMARY KEY (`Report_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SUBMIT_REPORT_TO` (
    `Contact_Number` VARCHAR(30) NOT NULL,
    `Official_ID` INTEGER NOT NULL,
    `Report_ID` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SUBMIT_REPORT_TO_Official_ID_idx`(`Official_ID`),
    INDEX `SUBMIT_REPORT_TO_Report_ID_idx`(`Report_ID`),
    PRIMARY KEY (`Contact_Number`, `Official_ID`, `Report_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ACCOUNT` ADD CONSTRAINT `ACCOUNT_Official_ID_fkey` FOREIGN KEY (`Official_ID`) REFERENCES `BRGY_OFFICIAL`(`Official_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ACCOUNT` ADD CONSTRAINT `ACCOUNT_Contact_Number_fkey` FOREIGN KEY (`Contact_Number`) REFERENCES `CITIZEN`(`Contact_Number`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BRGY_OFFICIAL` ADD CONSTRAINT `BRGY_OFFICIAL_Community_ID_fkey` FOREIGN KEY (`Community_ID`) REFERENCES `COMMUNITY`(`Community_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `COMMUNITY` ADD CONSTRAINT `COMMUNITY_Contact_Number_fkey` FOREIGN KEY (`Contact_Number`) REFERENCES `CITIZEN`(`Contact_Number`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `REPORT` ADD CONSTRAINT `REPORT_Contact_Number_fkey` FOREIGN KEY (`Contact_Number`) REFERENCES `CITIZEN`(`Contact_Number`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UPDATEDREPORT` ADD CONSTRAINT `UPDATEDREPORT_Report_ID_fkey` FOREIGN KEY (`Report_ID`) REFERENCES `REPORT`(`report_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SUBMIT_REPORT_TO` ADD CONSTRAINT `SUBMIT_REPORT_TO_Contact_Number_fkey` FOREIGN KEY (`Contact_Number`) REFERENCES `CITIZEN`(`Contact_Number`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SUBMIT_REPORT_TO` ADD CONSTRAINT `SUBMIT_REPORT_TO_Official_ID_fkey` FOREIGN KEY (`Official_ID`) REFERENCES `BRGY_OFFICIAL`(`Official_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SUBMIT_REPORT_TO` ADD CONSTRAINT `SUBMIT_REPORT_TO_Report_ID_fkey` FOREIGN KEY (`Report_ID`) REFERENCES `REPORT`(`report_ID`) ON DELETE CASCADE ON UPDATE CASCADE;
