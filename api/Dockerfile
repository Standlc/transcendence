FROM    node:alpine

WORKDIR /app

COPY    package*.json ./

RUN     npm ci

CMD     npm run migrate && npm run start:dev