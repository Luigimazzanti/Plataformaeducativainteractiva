#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
#                  🚀 EDUCONNECT - AUTOMATED DEPLOYMENT SCRIPT
# ═══════════════════════════════════════════════════════════════════════════

clear

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                           ║"
echo "║              EDUCONNECT V10.3 - AUTOMATED DEPLOYMENT                     ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ID="ldhimtgexjbmwobkmcwr"
FUNCTION_NAME="final_server"
HEALTH_ENDPOINT="https://${PROJECT_ID}.supabase.co/functions/v1/${FUNCTION_NAME}/make-server-05c2b65f/health"

echo "📋 DEPLOYMENT INFORMATION"
echo "────────────────────────────────────────────────────────────────────────────"
echo "  Project ID:      ${PROJECT_ID}"
echo "  Function:        ${FUNCTION_NAME}"
echo "  Health Check:    ${HEALTH_ENDPOINT}"
echo "────────────────────────────────────────────────────────────────────────────"
echo ""

# Step 1: Check if Supabase CLI is installed
echo "🔍 Step 1/5: Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not found${NC}"
    echo ""
    echo "Installing Supabase CLI..."
    npm install -g supabase
    echo ""
fi
echo -e "${GREEN}✓ Supabase CLI ready${NC}"
echo ""

# Step 2: Verify function files exist
echo "🔍 Step 2/5: Verifying function files..."
if [ ! -f "supabase/functions/${FUNCTION_NAME}/index.ts" ]; then
    echo -e "${RED}✗ Function file not found: supabase/functions/${FUNCTION_NAME}/index.ts${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Function files verified${NC}"
echo ""

# Step 3: Deploy the function
echo "🚀 Step 3/5: Deploying ${FUNCTION_NAME} to Supabase..."
echo "────────────────────────────────────────────────────────────────────────────"
npx supabase functions deploy ${FUNCTION_NAME} --project-ref ${PROJECT_ID} --no-verify-jwt

DEPLOY_EXIT_CODE=$?
echo "────────────────────────────────────────────────────────────────────────────"
echo ""

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}✗ Deployment failed with exit code ${DEPLOY_EXIT_CODE}${NC}"
    echo ""
    echo "Common issues:"
    echo "  • Not logged in: Run 'npx supabase login'"
    echo "  • Wrong project ID: Check your Supabase dashboard"
    echo "  • Network issues: Check your internet connection"
    exit 1
fi

echo -e "${GREEN}✓ Deployment completed${NC}"
echo ""

# Step 4: Wait for propagation
echo "⏳ Step 4/5: Waiting for CDN propagation (30 seconds)..."
for i in {30..1}; do
    printf "\r   Waiting: %02d seconds remaining..." $i
    sleep 1
done
printf "\r${GREEN}✓ Wait complete                              ${NC}\n"
echo ""

# Step 5: Verify deployment
echo "🧪 Step 5/5: Verifying deployment..."
echo "────────────────────────────────────────────────────────────────────────────"

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${HEALTH_ENDPOINT}" 2>&1)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

echo "  URL:          ${HEALTH_ENDPOINT}"
echo "  HTTP Status:  ${HTTP_CODE}"
echo "  Response:     ${RESPONSE_BODY}"
echo "────────────────────────────────────────────────────────────────────────────"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed!${NC}"
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                           ║"
    echo "║                   ✅  DEPLOYMENT SUCCESSFUL! 🎉                          ║"
    echo "║                                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🎯 NEXT STEPS:"
    echo ""
    echo "  1. Reload your application (Ctrl + Shift + R)"
    echo "  2. The \"Failed to fetch\" error should be gone"
    echo "  3. Login with demo credentials:"
    echo ""
    echo "     Admin:   admin / EduConnect@Admin2024"
    echo "     Teacher: teacher@demo.com / demo123"
    echo "     Student: student@demo.com / demo123"
    echo ""
    echo "  4. Verify the AI badge is green: \"Servidor conectado ✓\""
    echo ""
    echo "────────────────────────────────────────────────────────────────────────────"
    echo ""
    echo -e "${GREEN}🚀 Your EduConnect platform is now live!${NC}"
    echo ""
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  • Wait a few more minutes for CDN propagation"
    echo "  • Check Supabase logs:"
    echo "    https://supabase.com/dashboard/project/${PROJECT_ID}/functions/${FUNCTION_NAME}/logs"
    echo "  • Retry health check manually:"
    echo "    curl ${HEALTH_ENDPOINT}"
    echo ""
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
