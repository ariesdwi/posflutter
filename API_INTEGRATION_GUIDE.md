# API Integration Guide

This document explains how to integrate the POS Flutter app with your backend API.

## API Endpoints Summary

### Base URL Configuration
Update in `lib/core/constants/api_constants.dart`:
```dart
static const String baseUrl = 'http://api.yourdomain.com';
```

## Authentication Endpoints

### 1. Login
**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "kasir@example.com",
  "password": "password123"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user_123",
      "email": "kasir@example.com",
      "name": "Kasir Toko",
      "role": "KASIR",
      "isActive": true
    }
  },
  "timestamp": "2024-01-07T12:00:00Z"
}
```

**Error Response (401)**:
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "data": null,
  "timestamp": "2024-01-07T12:00:00Z"
}
```

### 2. Get Profile
**Endpoint**: `GET /auth/profile`

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved",
  "data": {
    "id": "user_123",
    "email": "kasir@example.com",
    "name": "Kasir Toko",
    "role": "KASIR",
    "isActive": true
  },
  "timestamp": "2024-01-07T12:00:00Z"
}
```

---

## Product Endpoints

### 1. Get All Products (Menu)
**Endpoint**: `GET /menu`

**Query Parameters**:
- `skip` (optional): Number of items to skip (for pagination)
- `limit` (optional): Number of items to return (for pagination)
- `search` (optional): Search by product name

**Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved",
  "data": [
    {
      "id": "prod_001",
      "name": "Ayam Goreng",
      "description": "Ayam goreng renyah",
      "price": 45000,
      "stock": 50,
      "image": "https://cdn.example.com/ayam.jpg",
      "categoryId": "cat_001",
      "category": {
        "id": "cat_001",
        "name": "Makanan",
        "description": "Kategori makanan",
        "icon": null
      }
    }
  ],
  "timestamp": "2024-01-07T12:00:00Z"
}
```

### 2. Get Product Details
**Endpoint**: `GET /menu/{productId}`

**Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product retrieved",
  "data": {
    "id": "prod_001",
    "name": "Ayam Goreng",
    "description": "Ayam goreng renyah",
    "price": 45000,
    "stock": 50,
    "image": "https://cdn.example.com/ayam.jpg",
    "categoryId": "cat_001",
    "category": {
      "id": "cat_001",
      "name": "Makanan",
      "description": "Kategori makanan",
      "icon": null
    }
  },
  "timestamp": "2024-01-07T12:00:00Z"
}
```

---

## Category Endpoints

### 1. Get All Categories
**Endpoint**: `GET /categories`

**Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Categories retrieved",
  "data": [
    {
      "id": "cat_001",
      "name": "Makanan",
      "description": "Kategori makanan",
      "icon": null
    },
    {
      "id": "cat_002",
      "name": "Minuman",
      "description": "Kategori minuman",
      "icon": null
    }
  ],
  "timestamp": "2024-01-07T12:00:00Z"
}
```

---

## Transaction Endpoints

### 1. Create Transaction
**Endpoint**: `POST /transactions`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "items": [
    {
      "productId": "prod_001",
      "productName": "Ayam Goreng",
      "price": 45000,
      "quantity": 2,
      "subtotal": 90000
    },
    {
      "productId": "prod_002",
      "productName": "Es Jeruk",
      "price": 8000,
      "quantity": 2,
      "subtotal": 16000
    }
  ],
  "subtotal": 106000,
  "discount": 10000,
  "tax": 9600,
  "total": 105600,
  "paymentMethod": "CASH",
  "amountPaid": 110000,
  "change": 4400,
  "status": "COMPLETED",
  "createdAt": "2024-01-07T12:00:00Z"
}
```

**Response (201/200)**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Transaction created successfully",
  "data": {
    "id": "trans_123",
    "items": [
      {
        "productId": "prod_001",
        "productName": "Ayam Goreng",
        "price": 45000,
        "quantity": 2,
        "subtotal": 90000
      },
      {
        "productId": "prod_002",
        "productName": "Es Jeruk",
        "price": 8000,
        "quantity": 2,
        "subtotal": 16000
      }
    ],
    "subtotal": 106000,
    "discount": 10000,
    "tax": 9600,
    "total": 105600,
    "paymentMethod": "CASH",
    "amountPaid": 110000,
    "change": 4400,
    "status": "COMPLETED",
    "createdAt": "2024-01-07T12:00:00Z"
  },
  "timestamp": "2024-01-07T12:00:00Z"
}
```

### 2. Get All Transactions
**Endpoint**: `GET /transactions`

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `skip` (optional): Pagination offset
- `limit` (optional): Pagination limit
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)

**Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Transactions retrieved",
  "data": [
    {
      "id": "trans_123",
      "items": [...],
      "subtotal": 106000,
      "discount": 10000,
      "tax": 9600,
      "total": 105600,
      "paymentMethod": "CASH",
      "amountPaid": 110000,
      "change": 4400,
      "status": "COMPLETED",
      "createdAt": "2024-01-07T12:00:00Z"
    }
  ],
  "timestamp": "2024-01-07T12:00:00Z"
}
```

### 3. Get Transaction Details
**Endpoint**: `GET /transactions/{transactionId}`

**Headers**:
```
Authorization: Bearer {token}
```

**Response**: Same as single transaction object above

---

## Receipt Endpoints

### 1. Get Receipt (Thermal/PDF)
**Endpoint**: `GET /receipts/{transactionId}/thermal`

**Headers**:
```
Authorization: Bearer {token}
```

**Response**: Base64 encoded PDF or image data
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Receipt generated",
  "data": "base64_encoded_pdf_content",
  "timestamp": "2024-01-07T12:00:00Z"
}
```

---

## Error Handling

The app handles these common HTTP status codes:

### 400 - Bad Request
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid request data",
  "data": null,
  "timestamp": "2024-01-07T12:00:00Z"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Token expired or invalid",
  "data": null,
  "timestamp": "2024-01-07T12:00:00Z"
}
```

When 401 is received:
- The app automatically removes the stored token
- User is redirected to login screen

### 404 - Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Resource not found",
  "data": null,
  "timestamp": "2024-01-07T12:00:00Z"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "data": null,
  "timestamp": "2024-01-07T12:00:00Z"
}
```

---

## API Interceptors

The app includes automatic interceptors for:

1. **Authentication Header**
   - Automatically adds `Authorization: Bearer {token}` to all requests

2. **Error Handling**
   - 401 responses trigger logout
   - Error messages are displayed to user

3. **Timeout**
   - Connection timeout: 30 seconds
   - Receive timeout: 30 seconds

---

## Testing API Integration

### Using Postman

1. Create a new request collection
2. Set base URL variable: `{{base_url}}`
3. Set token variable after login: `{{token}}`
4. Use pre-request script:
```javascript
if (pm.request.url.path.join('/').includes('login')) {
  // Don't add token to login
} else {
  pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('token')
  });
}
```

5. Test each endpoint with provided JSON

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kasir@example.com","password":"password123"}'

# Get products (with token)
curl -X GET http://localhost:3000/menu \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create transaction
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...transaction data...}'
```

---

## Pagination

For endpoints that support pagination, use:

**Request**:
```
GET /menu?skip=0&limit=20
```

**Expected Response Structure**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    // array of items
  ],
  "pagination": {
    "total": 100,
    "skip": 0,
    "limit": 20,
    "hasMore": true
  },
  "timestamp": "2024-01-07T12:00:00Z"
}
```

---

## Rate Limiting

Implement rate limiting on your backend:
- Login: 5 requests per minute per IP
- API calls: 100 requests per minute per user
- Transaction creation: 10 requests per minute per user

---

## CORS Configuration

For web deployment, configure CORS:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 3600
```

---

## Security Best Practices

1. ✅ Always use HTTPS in production
2. ✅ Validate all input on backend
3. ✅ Implement token refresh mechanism
4. ✅ Use JWT with expiration (recommend 1 hour)
5. ✅ Store refresh tokens securely
6. ✅ Implement rate limiting
7. ✅ Add request logging
8. ✅ Validate user roles/permissions

---

**Last Updated**: January 7, 2026
**Version**: 1.0.0
