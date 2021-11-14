FROM node:12.0 as base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

FROM argovis/datapages:base-211114 as head
COPY . .
CMD [ "npm", "start"]
