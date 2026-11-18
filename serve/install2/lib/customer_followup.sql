-- 客户维护独立记录；不改变客户、销售或财务数据。
CREATE TABLE IF NOT EXISTS `is_customer_followup` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer` int(11) NOT NULL,
  `user` int(11) NOT NULL,
  `contact_time` int(11) NOT NULL,
  `channel` varchar(32) NOT NULL,
  `content` text NOT NULL,
  `next_time` int(11) NOT NULL DEFAULT '0',
  `create_time` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer`,`id`),
  KEY `next_time` (`next_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户回访记录';
