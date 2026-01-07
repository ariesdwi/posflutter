# POS Flutter Mobile App

A mobile point of sale application built with Flutter, designed for fast and efficient transaction processing with a focus on user experience.

## Project Overview

This is a complete Flutter implementation of a POS system with the following capabilities:
- User authentication with token management
- Product management with search and filtering
- Shopping cart functionality
- Payment processing (Cash/Card)
- Transaction history and receipts
- Settings and profile management

## Tech Stack

- **Framework**: Flutter 3.x
- **Language**: Dart
- **State Management**: Provider
- **HTTP Client**: Dio
- **Local Storage**: Shared Preferences + Hive
- **Architecture**: Clean Architecture (simplified)

## Project Structure

```
lib/
├── core/
│   ├── api/
│   │   ├── api_client.dart          # HTTP client with interceptors
│   │   ├── api_response.dart        # API response model
│   │   └── api_constants.dart       # API endpoints & config
│   ├── constants/
│   │   ├── api_constants.dart       # API related constants
│   │   └── app_constants.dart       # App-wide constants
│   ├── utils/
│   │   └── formatters.dart          # Currency & date formatters
│   └── widgets/
│       └── custom_widgets.dart      # Reusable UI components
├── features/
│   ├── auth/
│   │   ├── models/
│   │   │   └── user.dart            # User model
│   │   ├── providers/
│   │   │   └── auth_provider.dart   # Authentication provider
│   │   └── screens/
│   │       └── login_screen.dart    # Login UI
│   ├── products/
│   │   ├── models/
│   │   │   ├── product.dart         # Product model
│   │   │   └── category.dart        # Category model
│   │   ├── providers/
│   │   │   └── product_provider.dart# Product state management
│   │   └── screens/
│   │       └── product_list_screen.dart # Product list & grid view
│   ├── cart/
│   │   ├── models/
│   │   │   └── cart_item.dart       # Cart item model
│   │   ├── providers/
│   │   │   └── cart_provider.dart   # Cart state management
│   │   └── screens/
│   │       └── cart_screen.dart     # Shopping cart UI
│   └── transactions/
│       ├── models/
│       │   └── transaction.dart     # Transaction models
│       ├── providers/
│       │   └── transaction_provider.dart # Transaction state mgmt
│       └── screens/
│           ├── payment_screen.dart      # Payment UI
│           ├── receipt_screen.dart      # Receipt display
│           ├── transaction_history_screen.dart  # History list
│           ├── transaction_detail_screen.dart   # Transaction details
│           └── settings_screen.dart             # App settings
├── home_screen.dart                 # Main app navigation
└── main.dart                        # App entry point
```

## Features Implemented

### 1. Authentication
- ✅ Email & password login
- ✅ Remember me functionality
- ✅ Auto-login with valid token
- ✅ Token management via SharedPreferences
- ✅ Logout functionality

### 2. Product Management
- ✅ Product list with grid/list view toggle
- ✅ Search products by name/description
- ✅ Filter by category
- ✅ Display product details (price, stock, image)
- ✅ Stock status indicator

### 3. Shopping Cart
- ✅ Add/remove items
- ✅ Update quantity
- ✅ Calculate subtotal per item
- ✅ Apply discount (percentage)
- ✅ Calculate tax (10%)
- ✅ Show grand total

### 4. Payment Processing
- ✅ Select payment method (Cash/Card)
- ✅ Input amount received
- ✅ Calculate change
- ✅ Process transaction
- ✅ Clear cart after successful payment

### 5. Receipt & Transactions
- ✅ Display receipt with transaction details
- ✅ View transaction history
- ✅ Filter today's transactions
- ✅ View transaction details
- ✅ Print/Share receipt (UI prepared, backend needed)

### 6. Settings
- ✅ View user profile
- ✅ Sync data (UI prepared)
- ✅ Printer settings (UI prepared)
- ✅ App version info
- ✅ Logout

## API Integration

### Endpoints Used
```
Authentication:
- POST   /auth/login              # Login
- GET    /auth/profile            # Get user profile

Products:
- GET    /menu                    # Get all products
- GET    /menu/:id                # Get product details

Categories:
- GET    /categories              # Get all categories

Transactions:
- POST   /transactions            # Create transaction
- GET    /transactions            # Get all transactions
- GET    /transactions/:id        # Get transaction details

Receipts:
- GET    /receipts/:transactionId/thermal  # Get receipt
```

### API Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { /* response data */ },
  "timestamp": "2024-01-07T12:00:00Z"
}
```

## Data Models

### User
```dart
User {
  id: String
  email: String
  name: String
  role: String (KASIR)
  isActive: bool
}
```

### Product
```dart
Product {
  id: String
  name: String
  description: String?
  price: double
  stock: int
  image: String?
  categoryId: String
  category: Category?
}
```

### CartItem
```dart
CartItem {
  product: Product
  quantity: int
  subtotal: double (calculated)
}
```

### Transaction
```dart
Transaction {
  id: String?
  items: List<TransactionItem>
  subtotal: double
  discount: double
  tax: double
  total: double
  paymentMethod: String (CASH/CARD)
  amountPaid: double
  change: double
  status: String
  createdAt: DateTime?
}
```

## Navigation Flow

```
Splash Screen
    ↓
Login Screen
    ↓
Home Screen (Main Navigation)
    ├─→ Products Screen
    │   ├─→ Cart Screen
    │   │   └─→ Payment Screen
    │   │       └─→ Receipt Screen → Home
    │   └─→ Product Details
    │
    ├─→ Transactions Screen
    │   └─→ Transaction Details
    │
    └─→ Settings Screen
        └─→ Logout → Login Screen
```

## Setup Instructions

### Prerequisites
- Flutter 3.x or higher
- Dart SDK
- Android Studio or Xcode (for emulator)

### Installation

1. **Clone the project**
```bash
cd /Users/ptsiagaabdiutama/Desktop/pos_flutter
```

2. **Get dependencies**
```bash
flutter pub get
```

3. **Configure API Endpoint**
Edit `lib/core/constants/api_constants.dart` and update the base URL:
```dart
static const String baseUrl = 'http://your-api-url.com';
```

4. **Run the app**
```bash
flutter run
```

## Environment Configuration

### SharedPreferences Keys
- `auth_token` - Authentication JWT token
- `user_data` - Cached user information
- `remember_me` - Remember me preference
- `user_email` - Saved email for login

### Constants
- Tax Rate: 10%
- Supported Roles: KASIR (Cashier)
- Payment Methods: CASH, CARD

## State Management with Provider

The app uses Provider for state management with these key providers:

### AuthProvider
- Manages login/logout
- Token storage and validation
- User session management

### ProductProvider
- Fetches products from API
- Handles search and filtering
- Category management

### CartProvider
- Manages shopping cart items
- Calculates totals, tax, discount
- Cart operations (add, remove, update)

### TransactionProvider
- Submits transactions to API
- Fetches transaction history
- Manages transaction data

## Offline Capabilities

The app includes offline support features:
- Local product caching
- Cached transaction data display
- Token persistence

## UI/UX Features

- **Clean & Fast**: Minimized taps for quick transactions
- **Large Touch Targets**: Easy to tap on tablets
- **Clear Feedback**: Loading states, success/error messages
- **Responsive Design**: Works on phones and tablets
- **Dark Mode Ready**: Easy to add dark theme

## Future Enhancements

- [ ] Barcode scanning (mobile_scanner integration)
- [ ] Printer integration for thermal printing
- [ ] Receipt sharing via email/SMS
- [ ] Offline transaction queuing
- [ ] Advanced reporting & analytics
- [ ] Multiple currency support
- [ ] Inventory management
- [ ] User role-based access control
- [ ] Refund processing
- [ ] Digital receipt/email receipts

## Testing

The project includes setup for:
- Unit tests
- Widget tests
- Integration tests

Run tests with:
```bash
flutter test
```

## Build & Deployment

### Android Build
```bash
flutter build apk
```

### iOS Build
```bash
flutter build ios
```

## Dependencies

Key dependencies include:
- `provider: ^6.1.0` - State management
- `dio: ^5.4.0` - HTTP client
- `shared_preferences: ^2.2.0` - Local storage
- `google_fonts: ^6.1.0` - Custom fonts
- `cached_network_image: ^3.3.0` - Image caching
- `intl: ^0.18.1` - Internationalization

See `pubspec.yaml` for complete dependency list.

## Troubleshooting

### Blank Screen on Startup
- Check API endpoint configuration
- Verify SharedPreferences is accessible
- Check authentication token validity

### API Errors
- Ensure API server is running
- Verify API_CONSTANTS baseUrl is correct
- Check network connectivity

### UI Issues
- Clear app cache: `flutter clean`
- Rebuild: `flutter pub get`
- Hot reload: `r` in terminal

## License

This project is private and confidential.

## Support

For issues and feature requests, contact the development team.

---

**Last Updated**: January 7, 2026
**Version**: 1.0.0
**Status**: Production Ready
