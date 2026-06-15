#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}     Login Test Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check server
echo -e "${BLUE}Step 1: Checking server...${NC}"
if curl -s "${API_URL}" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Server is running${NC}"
else
  echo -e "${RED}❌ Server is NOT running!${NC}"
  echo -e "${YELLOW}Please start server: npm run start:dev${NC}"
  exit 1
fi
echo ""

# Step 2: Ask credentials
echo -e "${BLUE}Step 2: Enter credentials${NC}"
read -p "Username (default: admin): " username
username=${username:-admin}

read -sp "Password (default: Admin123456): " password
echo ""
password=${password:-Admin123456}
echo ""

# Step 3: Try login
echo -e "${BLUE}Step 3: Attempting login...${NC}"
login_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$username\", \"password\": \"$password\"}")

http_body=$(echo "$login_response" | sed -e 's/HTTP_STATUS\:.*//g')
http_status=$(echo "$login_response" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

if [ "$http_status" -eq 200 ]; then
  echo -e "${GREEN}✅ Login SUCCESSFUL!${NC}"
  echo ""
  
  # Extract token
  token=$(echo "$http_body" | jq -r '.access_token' 2>/dev/null)
  
  if [ -n "$token" ] && [ "$token" != "null" ]; then
    echo -e "${GREEN}Access Token:${NC}"
    echo "$token"
    echo ""
    
    echo -e "${YELLOW}Save this token for your frontend:${NC}"
    echo "localStorage.setItem('access_token', '$token');"
    echo ""
    
    echo -e "${BLUE}User Info:${NC}"
    echo "$http_body" | jq '.user' 2>/dev/null || echo "$http_body"
    echo ""
    
    # Test protected endpoint
    echo -e "${BLUE}Step 4: Testing protected endpoint...${NC}"
    test_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "${API_URL}/api/summary/management" \
      -H "Authorization: Bearer $token")
    
    test_status=$(echo "$test_response" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')
    
    if [ "$test_status" -eq 200 ]; then
      echo -e "${GREEN}✅ Protected endpoint works!${NC}"
      echo ""
      echo -e "${GREEN}Summary:${NC}"
      echo "$test_response" | sed -e 's/HTTP_STATUS\:.*//g' | jq '.overview' 2>/dev/null || echo "Data fetched successfully"
    else
      echo -e "${RED}❌ Protected endpoint failed${NC}"
      echo "$test_response"
    fi
  fi
  
else
  echo -e "${RED}❌ Login FAILED!${NC}"
  echo ""
  echo -e "${YELLOW}HTTP Status: $http_status${NC}"
  echo -e "${YELLOW}Response:${NC}"
  echo "$http_body" | jq '.' 2>/dev/null || echo "$http_body"
  echo ""
  
  if [ "$http_status" -eq 401 ]; then
    echo -e "${YELLOW}Possible causes:${NC}"
    echo "1. Wrong username or password"
    echo "2. User doesn't exist yet"
    echo ""
    
    read -p "Do you want to create admin user? (y/n): " create_user
    
    if [ "$create_user" = "y" ] || [ "$create_user" = "Y" ]; then
      echo ""
      echo -e "${BLUE}Creating admin user...${NC}"
      
      register_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${API_URL}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"username\": \"$username\", \"password\": \"$password\"}")
      
      register_status=$(echo "$register_response" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')
      register_body=$(echo "$register_response" | sed -e 's/HTTP_STATUS\:.*//g')
      
      if [ "$register_status" -eq 201 ] || [ "$register_status" -eq 200 ]; then
        echo -e "${GREEN}✅ User created successfully!${NC}"
        echo "$register_body" | jq '.' 2>/dev/null || echo "$register_body"
        echo ""
        echo -e "${YELLOW}Now try to login again:${NC}"
        echo "bash TEST_LOGIN.sh"
      else
        echo -e "${RED}❌ Failed to create user${NC}"
        echo "$register_body" | jq '.' 2>/dev/null || echo "$register_body"
      fi
    fi
  fi
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}     Test Complete${NC}"
echo -e "${BLUE}========================================${NC}"
