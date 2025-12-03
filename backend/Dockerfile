FROM dunglas/frankenphp:latest-php8.3

# Install system dependencies and PHP extensions
RUN install-php-extensions \
    pdo_sqlite \
    pdo_mysql \
    pdo_pgsql \
    zip \
    gd \
    intl \
    opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy application files
COPY . /app

# Install PHP dependencies
RUN composer install --no-dev --no-interaction --optimize-autoloader --prefer-dist

# Create var directory and set permissions
RUN mkdir -p var/cache var/log && \
    chown -R www-data:www-data var && \
    chmod -R 775 var

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
EXPOSE 443
EXPOSE 443/udp

# FrankenPHP will use the Caddyfile automatically
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
