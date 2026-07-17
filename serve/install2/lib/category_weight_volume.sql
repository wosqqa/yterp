ALTER TABLE `is_category`
ADD COLUMN `weight` DECIMAL(16,5) NOT NULL DEFAULT '0.00000' COMMENT '重量kg' AFTER `sort`,
ADD COLUMN `volume` DECIMAL(16,5) NOT NULL DEFAULT '0.00000' COMMENT '体积cbm' AFTER `weight`;

UPDATE `is_category`
SET `weight` = ROUND(COALESCE(`weight`, 0), 5),
    `volume` = ROUND(COALESCE(`volume`, 0), 5);
