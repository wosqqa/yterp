<?php
namespace app\support;

class ProductImage
{
    public static function url($url, $thumbnail = true)
    {
        if (!is_string($url) || $url === '') return $url;
        $parts = explode('#', $url, 2);
        $query = explode('?', $parts[0], 2);
        $params = isset($query[1]) ? array_values(array_filter(explode('&', $query[1]), function ($param) {
            return $param !== '' && !preg_match('/^imageMogr2(?:\/|=|$)/i', rawurldecode($param));
        })) : [];
        if ($thumbnail) $params[] = 'imageMogr2/thumbnail/200x';
        return $query[0] . ($params ? '?' . implode('&', $params) : '') . (isset($parts[1]) ? '#' . $parts[1] : '');
    }

    public static function images($images, $thumbnail = true)
    {
        if (is_string($images)) {
            $decoded = json_decode($images, true);
            if (json_last_error() === JSON_ERROR_NONE) $images = $decoded;
            else return self::url($images, $thumbnail);
        }
        if (!is_array($images)) return $images;
        foreach ($images as $key => $value) {
            if ($key === 'url' && is_string($value)) $images[$key] = self::url($value, $thumbnail);
            elseif (is_array($value)) $images[$key] = self::images($value, $thumbnail);
            elseif (is_int($key) && is_string($value)) $images[$key] = self::url($value, $thumbnail);
        }
        return $images;
    }
}
