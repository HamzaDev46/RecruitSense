<?php

namespace App\Support;

class ImageHelper
{
    /**
     * Resolve image URL handling both Base64 Data URIs and local storage file paths.
     */
    public static function url(?string $path, ?string $baseUrl = null): ?string
    {
        if (empty($path)) {
            return null;
        }

        if (str_starts_with($path, 'data:') || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $base = $baseUrl ?: (url('storage') . '/');
        if (!str_ends_with($base, '/')) {
            $base .= '/';
        }

        return $base . ltrim($path, '/');
    }
}

