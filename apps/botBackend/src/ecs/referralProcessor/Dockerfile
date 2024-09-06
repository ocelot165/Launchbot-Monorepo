FROM node:alpine

WORKDIR /referralProcessor

COPY dist/index.js /referralProcessor/index.js

RUN npm install pm2 -g

ENTRYPOINT pm2-runtime /referralProcessor/index.js