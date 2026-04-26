FROM node:20-alpine

# Instalar tzdata para que la variable TZ del docker-compose surta efecto
RUN apk add --no-cache tzdata
ENV TZ=America/Mexico_City

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001
CMD ["node", "server.js"]