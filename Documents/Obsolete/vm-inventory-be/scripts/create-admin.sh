#!/bin/bash

# Script to create first admin user
# First user will automatically be ADMIN role

echo "🔐 Creating Admin User..."
echo ""

# Default values
API_URL="http://localhost:3000/api/auth/register"
USERNAME="admin"
PASSWORD="Admin123456"

# Allow custom values
read -p "Enter username (default: admin): " input_username
USERNAME=${input_username:-$USERNAME}

read -sp "Enter password (min 8 chars, default: Admin123456): " input_password
echo ""
PASSWORD=${input_password:-$PASSWORD}

echo ""
echo "Creating user: $USERNAME"
echo ""

# Make the API call
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\"
  }")

# Extract response body and status
http_body=$(echo "$response" | sed -e 's/HTTP_STATUS\:.*//g')
http_status=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Response status: $http_status"
echo ""

if [ "$http_status" -eq 201 ] || [ "$http_status" -eq 200 ]; then
  echo "✅ Admin user created successfully!"
  echo ""
  echo "$http_body" | jq '.' 2>/dev/null || echo "$http_body"
  echo ""
  echo "📝 Login credentials:"
  echo "   Username: $USERNAME"
  echo "   Password: $PASSWORD"
  echo ""
  echo "🔗 You can now login at:"
  echo "   POST http://localhost:3000/api/auth/login"
else
  echo "❌ Failed to create admin user"
  echo ""
  echo "$http_body"
fi
