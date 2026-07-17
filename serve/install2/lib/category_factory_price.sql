ALTER TABLE `is_category`
ADD COLUMN `factory_price` DECIMAL(12,2) NOT NULL DEFAULT '0.00' COMMENT '出厂价' AFTER `volume`;

UPDATE `is_category`
SET `factory_price` = ROUND(COALESCE(`factory_price`, 0), 2);
