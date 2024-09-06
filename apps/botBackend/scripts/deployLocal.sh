BOT_PORT=$(cat ../../config/config.dev.json  | jq -r ".BOT_PORT");
LAMBDA_PORT=$(cat ../../config/config.dev.json  | jq -r ".LAMBDA_PORT");

serverless offline --httpPort $BOT_PORT --lambdaPort $LAMBDA_PORT --stage dev --verbose
