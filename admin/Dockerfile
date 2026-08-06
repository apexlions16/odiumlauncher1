FROM node:22-alpine
WORKDIR /app
COPY admin ./admin
COPY package.json ./package.json
ENV NODE_ENV=production
EXPOSE 4178
CMD ["node", "admin/server.js"]
