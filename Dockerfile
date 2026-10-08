FROM php:8.3-cli-bookworm

# Install required system tools & PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    ca-certificates \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy Laravel files
COPY backend-laravel/ .

# Configure PHP settings
RUN echo "upload_max_filesize = 64M" > /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 64M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini

# Ensure storage directories exist and have proper write permissions
RUN mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

# Install composer dependencies safely
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader

ENV PORT=8000
EXPOSE 8000

# Resilient startup command
CMD ["/bin/sh", "-c", "php artisan package:discover --ansi || true && php artisan storage:link --force || true && (php artisan migrate --force || true) && exec php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
