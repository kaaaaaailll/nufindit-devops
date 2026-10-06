FROM nginx:1.27-alpine
ARG BUILD_NUMBER=dev
COPY index.html /usr/share/nginx/html/index.html
RUN sed -i "s/__BUILD__/${BUILD_NUMBER}/g" /usr/share/nginx/html/index.html
