export REFERRAL_TXS_TABLE_NAME=$(cat ../../../../../config/config.dev.json  | ../../../../../binaries/jq-binary -r ".REFERRAL_TXS_TABLE_NAME");
export REFERRAL_POINTS_TABLE_NAME=$(cat ../../../../../config/config.dev.json  | ../../../../../binaries/jq-binary -r ".REFERRAL_POINTS_TABLE_NAME");
export REFERRER_TABLE_NAME=$(cat ../../../../../config/config.dev.json  | ../../../../../binaries/jq-binary -r ".REFERRER_TABLE_NAME");
export ACCESS_KEY_ID=$(cat ../../../../../config/config.dev.json  | ../../../../../binaries/jq-binary -r ".ACCESS_KEY_ID");
export SECRET=$(cat ../../../../../config/config.dev.json  | ../../../../../binaries/jq-binary -r ".SECRET");

docker run -e STAGE="dev" \
-e ACCESS_KEY_ID=$ACCESS_KEY_ID \
-e SECRET=$SECRET \
-e REFERRAL_TXS_TABLE_NAME=$REFERRAL_TXS_TABLE_NAME \
-e REFERRAL_POINTS_TABLE_NAME=$REFERRAL_POINTS_TABLE_NAME \
-e REFERRER_TABLE_NAME=$REFERRER_TABLE_NAME \
test:v1