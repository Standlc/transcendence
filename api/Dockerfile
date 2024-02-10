FROM    node:alpine

WORKDIR /app

COPY    package*.json ./

RUN     npm i

CMD     npm run migrate && npm run start:dev
