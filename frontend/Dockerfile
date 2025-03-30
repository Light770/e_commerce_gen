FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# For development
CMD ["npm", "run", "dev"]

# For production, uncomment these and comment the above CMD
# RUN npm run build
# CMD ["npm", "start"]