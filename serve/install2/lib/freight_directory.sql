-- 客户联系人只读聚合；货代补充资料单独保存，不删改客户原资料。
CREATE TABLE IF NOT EXISTS `is_freight_profile` (
 `fingerprint` varchar(64) NOT NULL,
 `company` varchar(120) NOT NULL DEFAULT '',
 `name` varchar(120) NOT NULL DEFAULT '',
 `tel` varchar(120) NOT NULL DEFAULT '',
 `address` text NOT NULL,
 `kind` varchar(24) NOT NULL DEFAULT 'candidate',
 `countries` text NOT NULL,
 `transport` varchar(100) NOT NULL DEFAULT '',
 `warehouse` varchar(120) NOT NULL DEFAULT '',
 `note` text NOT NULL,
 `manual` tinyint(1) NOT NULL DEFAULT '0',
 `user` int(11) NOT NULL,
 `frame` int(11) NOT NULL,
 `updated_time` int(11) NOT NULL,
 PRIMARY KEY (`fingerprint`), KEY `frame` (`frame`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='货代与仓库补充资料';
