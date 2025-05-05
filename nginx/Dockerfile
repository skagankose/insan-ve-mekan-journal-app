# Use the official Nginx image based on Alpine Linux
FROM nginx:1.25-alpine

# Remove the default Nginx configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Copy the custom configuration file from the nginx directory
COPY nginx.conf /etc/nginx/nginx.conf

# Static assets will be mounted via volume from docker-compose.yml
# No COPY needed here anymore.
# COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"] 