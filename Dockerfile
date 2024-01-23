FROM    node:alpine

WORKDIR /app

COPY    ./client/package*.json ./

ADD    ./api/src/types/clientSchema.ts ../api/src/types/clientSchema.ts

RUN     npm ci

CMD     npm run dev
