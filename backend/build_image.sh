ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile think-tank)
AWS_REGION=us-west-2

AGENT_NAME=agentcore-amplify-nextjs-backend

docker buildx create --use

aws ecr create-repository --repository-name ${AGENT_NAME} --region ${AWS_REGION} --profile think-tank
aws ecr get-login-password --region ${AWS_REGION} --profile think-tank | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

docker buildx build --platform linux/arm64 -t ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${AGENT_NAME}:latest --push .
