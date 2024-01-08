FROM    node:alpine

WORKDIR /app

COPY    package*.json ./
# COPY    postcss.config.js ./

RUN     npm i

# RUN     npm install -D tailwindcss postcss autoprefixer
# RUN     npx tailwindcss init -p

CMD     npm run dev
