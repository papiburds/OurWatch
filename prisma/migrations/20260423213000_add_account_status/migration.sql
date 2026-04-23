ALTER TABLE `ACCOUNT`
ADD COLUMN `status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Approved';
