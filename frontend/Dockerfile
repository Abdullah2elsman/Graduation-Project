# Smart Book V2 — frontend (Angular 22) development image.
# Node 22 matches the version used to scaffold the project.

FROM node:22.22.3-bookworm-slim

WORKDIR /app

COPY docker/entrypoint.sh /usr/local/bin/sb-frontend-entrypoint
RUN chmod +x /usr/local/bin/sb-frontend-entrypoint

EXPOSE 4200

ENTRYPOINT ["/usr/local/bin/sb-frontend-entrypoint"]
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200"]