# Launchbot Monorepo

This monorepo contains the backend,contracts and subgraph code to setup and test the bot locally, as well as deploy to prod.

## Setup

### Initial setup

- login to docker : docker login --username AWS --password-stdin X.dkr.ecr.REGION.amazonaws.com
- cd to the root of the project
- Run the following command to install all yarn dependencies:
  `yarn run install-all`
- Now we add dependencies for nginx & pcre (must have jq installed):
  `yarn run install-proxy`
- Create a file called config.dev.json under the config folder and add the following data:
-     {
      "BOT_TOKEN":"botToken",
      "SECRET_KEY":"secretKey",
      "PRIVATE_KEY":"Only on dev",
      "NGROK_API_KEY":"Only on dev",
      "NGROK_PORT":"7777",
      "BOT_PORT":"8443",
      "WEBAPP_PORT":"8444",
      "LAMBDA_PORT":"6077"
      }
- Now we start the nginx server:
  `yarn run start-proxy`

If you made a change to the environment variables(or if you restarted your pc), just call the last command again to restart the proxy

### Backend setup

Docker is required to run the backend locally.

- cd to the root of the project (not the backend folder)
- Start ngrok:
  `yarn run start-ngrok`
- In another terminal, setup your ngrok url as the tg bot webhook url:
  `yarn run setup-webhook`
- Deploy the lambdas locally:
  `yarn run deploy-backend-local`
- cd to the botBackend folder
- Run the dynamodb instance:
  `serverless dynamodb start`
- Build the docker container for the referralProcessor:
  `yarn run build-referralProcessor`
- Start the referralProcessor:
  `yarn run run-referralProcessor`
- Setup SQS
  `docker run --name Offline-SQS -d -p 9324:9324 softwaremill/elasticmq-native`
- Setup DynamoDB (inside the backend folder)
  `sudo sls dynamodb start --migrate`
- Now deploy the lambdas locally (may need to restart docker container):
  `yarn run deploy-backend-local`
- Now run the lambdas (serverless offline start)
  `sudo serverless invoke local --function computeClearingPrice —stage dev`

> Change in the Serverless config to run it locally
> Replace the AuctionBotHandler function env declaration with CLEARING_PRICE_NOTIFICATION_QUEUE_URL: ClearingPriceNotificationQueue
> Comment the RedrivePolicy in the ClearingPriceNotificationQueue
