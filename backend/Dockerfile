FROM dunglas/frankenphp:1-php8.4-alpine

# Install system dependencies and PHP extensions
RUN install-php-extensions \
    pdo_sqlite \
    zip \
    opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy composer files first (better caching)
COPY composer.json composer.lock symfony.lock ./

# Install PHP dependencies (with dev for development)
RUN composer install --no-scripts --no-interaction --prefer-dist

# Copy application files
COPY . /app

# Run scripts after copying
RUN composer run-script auto-scripts || true

# Create var directory and set permissions
RUN mkdir -p var/cache var/log && \
    chmod -R 777 var

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

# Development mode without worker (faster startup)
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
