FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 8080

# Let the Lovable wrapper handle its own startup flags safely
CMD ["npm", "run", "dev"]