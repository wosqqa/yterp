-- 支持最长2048字符的常用链接
ALTER TABLE is_code MODIFY COLUMN info VARCHAR(2048) NOT NULL COMMENT '条码内容或链接地址';
