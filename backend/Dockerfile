# Smart Book V2 — backend (Laravel 13) development image.
# PHP image pins a minor version; Laravel requires PHP >= 8.3.

FROM php:8.4-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        git \
        unzip \
        default-mysql-client \
        libzip-dev \
        libcurl4-openssl-dev \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2.10.2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY docker/entrypoint.sh /usr/local/bin/sb-backend-entrypoint
RUN chmod +x /usr/local/bin/sb-backend-entrypoint

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/sb-backend-entrypoint"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8080"]