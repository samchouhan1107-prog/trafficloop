FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY dist/server.cjs ./server.cjs
COPY data ./data

EXPOSE 3000

CMD ["node", "server.cjs"]
