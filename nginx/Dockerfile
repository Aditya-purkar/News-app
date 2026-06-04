FROM nginx:alpine

# Remove default nginx config and replace it with ours
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80