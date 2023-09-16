# Using node 18
FROM node:18-alpine
# Copy app source & ser working directory
COPY . /usr/src/app
WORKDIR /usr/src/app
# Installing dependencies
RUN npm install
# Expose the port and start the application
EXPOSE 3000
CMD ["npm", "start"]