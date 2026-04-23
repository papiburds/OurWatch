ALTER TABLE `ACCOUNT`
ADD COLUMN `role` ENUM('Citizen', 'Captain', 'Admin') NOT NULL DEFAULT 'Citizen';

UPDATE `ACCOUNT`
SET `role` = CASE
  WHEN `Official_ID` IS NOT NULL THEN 'Captain'
  ELSE 'Citizen'
END
WHERE `role` = 'Citizen';
