export BOT_TOKEN=$(cat ./config/config.dev.json  | jq -r ".BOT_TOKEN");
export SECRET_KEY=$(cat ./config/config.dev.json  | jq -r ".SECRET_KEY");
export PRIVATE_KEY=$(cat ./config/config.dev.json  | jq -r ".PRIVATE_KEY");
export NGROK_API_KEY=$(cat ./config/config.dev.json  | jq -r ".NGROK_API_KEY");
export NGROK_PORT=$(cat ./config/config.dev.json  | jq -r ".NGROK_PORT");
export BOT_PORT=$(cat ./config/config.dev.json  | jq -r ".BOT_PORT");
export WEBAPP_PORT=$(cat ./config/config.dev.json  | jq -r ".WEBAPP_PORT");
export LAMBDA_PORT=$(cat ./config/config.dev.json  | jq -r ".LAMBDA_PORT");
export WEBHOOK_URL=$(cat ./config/config.dev.json  | jq -r ".WEBHOOK_URL");
export NODE_PORT=$(cat ./config/config.dev.json  | jq -r ".NODE_PORT");
export CHAINID=$(cat ./config/config.dev.json  | jq -r ".CHAINID");
export TABLE_NAME=$(cat ./config/config.dev.json  | jq -r ".TABLE_NAME");
export S3_BUCKET_NAME=$(cat ./config/config.dev.json  | jq -r ".S3_BUCKET_NAME");
export DISTRIBUTION_QUEUE_URL=$(cat ./config/config.dev.json  | jq -r ".DISTRIBUTION_QUEUE_URL");
export LAST_CLAIM_REVENUE_SHARE_TABLE=$(cat ./config/config.dev.json  | jq -r ".LAST_CLAIM_REVENUE_SHARE_TABLE");
export REV_SHARING_TABLE_NAME=$(cat ./config/config.dev.json  | jq -r ".REV_SHARING_TABLE_NAME");
export AUCTIONS_TABLE_NAME=$(cat ./config/config.dev.json  | jq -r ".AUCTIONS_TABLE_NAME");
export USER_ID_MAPPING_TABLE_NAME=$(cat ./config/config.dev.json  | jq -r ".USER_ID_MAPPING_TABLE_NAME");
export NOTIFY_WEBHOOK_SECRET=$(cat ./config/config.dev.json  | jq -r ".NOTIFY_WEBHOOK_SECRET");
export INFO_WEBHOOK_SECRET=$(cat ./config/config.dev.json  | jq -r ".INFO_WEBHOOK_SECRET");
export ALCHEMY_API_KEY=$(cat ./config/config.dev.json  | jq -r ".ALCHEMY_API_KEY");
export CLEARING_PRICE_NOTIFICATION_QUEUE_NAME=$(cat ./config/config.dev.json  | jq -r ".CLEARING_PRICE_NOTIFICATION_QUEUE_NAME");
export WEBHOOK_SECRET=$(cat ./config/config.dev.json  | jq -r ".WEBHOOK_SECRET");
export KMS_KEY_ID=$(cat ./config/config.dev.json  | jq -r ".KMS_KEY_ID");
export UPDATE_AUCTION_WEBHOOK_SECRET=$(cat ./config/config.dev.json  | jq -r ".UPDATE_AUCTION_WEBHOOK_SECRET");
export ACCESS_KEY_ID=$(cat ./config/config.dev.json  | jq -r ".ACCESS_KEY_ID");
export SECRET_ACCESS_KEY=$(cat ./config/config.dev.json  | jq -r ".SECRET_ACCESS_KEY");



RESPONSE_CODE=$(curl -s -o /dev/null -w "%{response_code}" -X POST  "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook");

if [[ $RESPONSE_CODE -ne 200 ]]; 
then
    echo "Error while deleting webhook"
    exit 1
fi

FLAG=0

for i in {1..5}
do
    
    export WEBHOOK_URL=$(curl -X GET -H "Authorization: Bearer $NGROK_API_KEY" -H "Ngrok-Version: 2" https://api.ngrok.com/tunnels  | jq -r ".tunnels[0].public_url")
    if [[ ! -z "$WEBHOOK_URL" ]];
    then
        if [ $WEBHOOK_URL != "null" ]; then
            echo $WEBHOOK_URL
            echo "\nNGROK SERVER STARTED!";
            echo "\nUPDATING WEBHOOK URL";
            RESPONSE_CODE=$(curl -s -o /dev/null -w "%{response_code}" -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=$WEBHOOK_URL/dev/auctionBotHandler&secret_token=$SECRET_KEY");
            if [[ $RESPONSE_CODE -ne 200 ]]; 
            then
                continue
            fi
            FLAG=1;

            envsubst < ./config/config.dev.template.json > ./config/config.dev.json

            cd ./packages
            test -f .env || touch .env

            echo "WEBHOOK_URL=$WEBHOOK_URL" > .env
            cd ..
            break;
        fi
    fi
done

if [[ $FLAG -eq 0 ]];
then 
    echo "\nError setting up the webhook!"
    exit 1;
else
    echo "\nSuccessfully setup webhook!"
fi

