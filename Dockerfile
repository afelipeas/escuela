FROM php:8.3-cli

WORKDIR /app

COPY backend/ .

EXPOSE $PORT

CMD ["sh", "-c", "php -S 0.0.0.0:$PORT router.php"]
