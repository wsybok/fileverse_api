FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_OPTIONS="--experimental-vm-modules"

EXPOSE 3000

CMD ["npm", "start"] 