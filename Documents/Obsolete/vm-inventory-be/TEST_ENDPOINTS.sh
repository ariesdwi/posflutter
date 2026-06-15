#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  VM Inventory API - Endpoint Tester${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local auth=$3
  local description=$4
  
  echo -e "${YELLOW}Testing: $description${NC}"
  echo -e "   ${method} ${endpoint}"
  
  if [ "$auth" = "true" ]; then
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "${API_URL}${endpoint}" \
      -H "Authorization: Bearer $JWT_TOKEN")
  else
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "${API_URL}${endpoint}")
  fi
  
  http_status=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')
  
  if [ "$http_status" -eq 200 ] || [ "$http_status" -eq 201 ]; then
    echo -e "   ${GREEN}✅ Status: $http_status (Success)${NC}"
  else
    echo -e "   ${RED}❌ Status: $http_status (Failed)${NC}"
  fi
  echo ""
}

# Step 1: Check if server is running
echo -e "${BLUE}Step 1: Checking if server is running...${NC}"
if curl -s "${API_URL}/api/auth/login" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Server is running${NC}"
else
  echo -e "${RED}❌ Server is not running!${NC}"
  echo -e "${YELLOW}Please start the server first: npm run start:dev${NC}"
  exit 1
fi
echo ""

# Step 2: Login
echo -e "${BLUE}Step 2: Attempting login...${NC}"
read -p "Enter username (default: admin): " username
username=${username:-admin}

read -sp "Enter password (default: Admin123456): " password
echo ""
password=${password:-Admin123456}

login_response=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$username\", \"password\": \"$password\"}")

JWT_TOKEN=$(echo "$login_response" | jq -r '.access_token' 2>/dev/null)

if [ "$JWT_TOKEN" != "null" ] && [ -n "$JWT_TOKEN" ]; then
  echo -e "${GREEN}✅ Login successful${NC}"
  echo -e "   Token: ${JWT_TOKEN:0:20}..."
else
  echo -e "${RED}❌ Login failed!${NC}"
  echo -e "${YELLOW}Response: $login_response${NC}"
  echo ""
  echo -e "${YELLOW}If user doesn't exist, create one:${NC}"
  echo -e "   ./scripts/create-admin.sh"
  echo -e "   OR"
  echo -e "   curl -X POST ${API_URL}/api/auth/register -H \"Content-Type: application/json\" -d '{\"username\":\"admin\",\"password\":\"Admin123456\"}'"
  exit 1
fi
echo ""

# Step 3: Test Summary Endpoints
echo -e "${BLUE}Step 3: Testing Summary API Endpoints...${NC}"
echo ""

test_endpoint "GET" "/api/summary/management" "true" "Management Report (All-in-One)"

test_endpoint "GET" "/api/summary/obsolete?osType=Ubuntu" "true" "Ubuntu Obsolete Summary"

test_endpoint "GET" "/api/summary/obsolete?osType=CentOS" "true" "CentOS Obsolete Summary"

test_endpoint "GET" "/api/summary/app-mapping?osType=Ubuntu&category=Production" "true" "Ubuntu App-Department Mapping"

test_endpoint "GET" "/api/summary/app-mapping?osType=CentOS&category=Production" "true" "CentOS App-Department Mapping"

test_endpoint "GET" "/api/summary/by-department" "true" "Department Summary (All OS)"

test_endpoint "GET" "/api/summary/by-department?osType=Ubuntu" "true" "Department Summary (Ubuntu Only)"

# Step 4: Test Other Endpoints
echo -e "${BLUE}Step 4: Testing Other API Endpoints...${NC}"
echo ""

test_endpoint "GET" "/api/vms/stats" "true" "VM Statistics"

test_endpoint "GET" "/api/stats/timeline" "true" "End-of-Support Timeline"

test_endpoint "GET" "/api/stats/resources" "true" "Resource Usage Stats"

test_endpoint "GET" "/api/auth/me" "true" "Current User Info"

test_endpoint "GET" "/api/vms?page=1&limit=10" "true" "List VMs (Paginated)"

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Testing Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Your JWT Token (save this for manual testing):"
echo -e "${YELLOW}$JWT_TOKEN${NC}"
echo ""
echo -e "To use this token in curl commands:"
echo -e "  ${YELLOW}export JWT_TOKEN=\"$JWT_TOKEN\"${NC}"
echo -e "  ${YELLOW}curl -X GET ${API_URL}/api/summary/management -H \"Authorization: Bearer \$JWT_TOKEN\"${NC}"
echo ""
