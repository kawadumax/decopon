FROM richarvey/nginx-php-fpm:latest
# Certifique-se de que o sistema está pronto para instalar pacotes
USER root
RUN apk update && \
    apk add --no-cache curl
# nghttp2を明示的にインストール
RUN apk update && \
    apk add --no-cache nghttp2-libs && \
    apk add --no-cache --repository=https://dl-cdn.alpinelinux.org/alpine/edge/main nodejs npm
RUN npm install -g npm@latest
COPY . .
# Image config
ENV SKIP_COMPOSER 1
ENV WEBROOT /var/www/html/public
ENV PHP_ERRORS_STDERR 1
ENV RUN_SCRIPTS 1
ENV REAL_IP_HEADER 1

# Laravel config
ENV APP_ENV production
ENV APP_DEBUG false
ENV LOG_CHANNEL stderr

# Allow composer to run as root
ENV COMPOSER_ALLOW_SUPERUSER 1
CMD ["/start.sh"]