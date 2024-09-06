npx esbuild ./src/ecs/referralProcessor/src/index.ts --bundle --platform=node --outfile=./src/ecs/referralProcessor/dist/index.js

cd src/ecs/referralProcessor

sudo docker build -t test:v1 .

docker tag test:v1 381491854830.dkr.ecr.us-east-1.amazonaws.com/serverless-volatilis-auction-bot-staging:referralProcessor

docker push 381491854830.dkr.ecr.us-east-1.amazonaws.com/serverless-volatilis-auction-bot-staging:referralProcessor
