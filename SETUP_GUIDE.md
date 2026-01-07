# Quick Start Guide - POS Flutter App

## Initial Setup

### 1. Update API Configuration

Before running the app, update the API base URL in:
**File**: `lib/core/constants/api_constants.dart`

```dart
static const String baseUrl = 'http://your-api-server.com';
```

Replace with your actual backend API URL.

### 2. Install Dependencies

```bash
flutter pub get
```

### 3. Run the App

**For Android:**
```bash
flutter run -d android
```

**For iOS:**
```bash
flutter run -d ios
```

**For Chrome (Web):**
```bash
flutter run -d chrome
```

## First Time Setup Walkthrough

1. **Login Screen**
   - Email: Use any valid email format
   - Password: Enter any password (backend validates)
   - Check "Remember me" to save email for next login

2. **Home Screen**
   - You'll see the Products list
   - Use bottom navigation to switch between screens
   - Access drawer menu for additional options

3. **Adding Products to Cart**
   - Click "Add" button on any product
   - Floating action button shows cart count
   - Click FAB to view cart

4. **Checkout Process**
   - Review items in cart
   - Apply discount if needed
   - Click "Checkout" to proceed to payment
   - Select payment method
   - Enter amount paid
   - Receipt displays after successful payment

## Important Notes

### API Integration
- The app expects all API endpoints to return data in the specified format
- Authentication uses JWT tokens stored in SharedPreferences
- Token is automatically added to all requests via interceptor
- If token expires (401), user is logged out automatically

### Local Storage
- Products and categories are cached locally
- User data is stored for offline access
- SharedPreferences is used for simple key-value storage
- Hive can be configured for more complex local database needs

### Testing with Mock Data
If your API isn't ready yet, you can:
1. Mock the API responses in `ApiClient`
2. Use a service like Postman to test endpoints first
3. Use Flutter's http package with mock adapters

## File Structure for Custom Development

To add new features:

1. **New Screen**
   ```
   lib/features/[feature_name]/screens/[screen_name].dart
   ```

2. **New Model**
   ```
   lib/features/[feature_name]/models/[model_name].dart
   ```

3. **New Provider**
   ```
   lib/features/[feature_name]/providers/[provider_name].dart
   ```

4. **New Utility**
   ```
   lib/core/utils/[utility_name].dart
   ```

## Common Customizations

### Change App Theme
File: `lib/main.dart`
```dart
theme: ThemeData(
  primarySwatch: Colors.blue,  // Change color
  useMaterial3: true,
),
```

### Change Tax Rate
File: `lib/core/constants/app_constants.dart`
```dart
static const double taxRate = 10.0;  // Change to desired rate
```

### Change Currency Format
File: `lib/core/utils/formatters.dart`
```dart
static String format(double amount) {
  final formatter = NumberFormat.currency(
    locale: 'id_ID',  // Change locale
    symbol: 'Rp ',    // Change currency symbol
    decimalDigits: 0,
  );
  return formatter.format(amount);
}
```

## Debugging

### Enable Debug Logging
Add this to `main.dart` before runApp:
```dart
if (kDebugMode) {
  dio.interceptors.add(LoggingInterceptor());
}
```

### Check SharedPreferences
```bash
flutter logs
```

### Device/Emulator Selection
```bash
flutter devices
flutter run -d <device_id>
```

## Deployment Checklist

- [ ] Update `pubspec.yaml` version number
- [ ] Update API base URL for production
- [ ] Test all API endpoints
- [ ] Generate app signing keys
- [ ] Update app icon and splash screen
- [ ] Test on real device
- [ ] Build release APK/IPA
- [ ] Test release build

## Useful Commands

```bash
# Clean project
flutter clean

# Get dependencies
flutter pub get

# Upgrade dependencies
flutter pub upgrade

# Format code
dart format lib/

# Analyze code
flutter analyze

# Run tests
flutter test

# Build APK
flutter build apk --release

# Build iOS
flutter build ios --release

# Build Web
flutter build web

# Run with specific configuration
flutter run --flavor production
```

## Environment Variables

You can create a `.env` file for different configurations:

**File**: `.env`
```
API_URL=http://dev-api.example.com
APP_NAME=POS Flutter Dev
TAX_RATE=10.0
```

Then load in your app (requires `flutter_dotenv` package).

## Performance Tips

1. Use `const` constructors for widgets
2. Lazy load data when possible
3. Use `RepaintBoundary` for expensive widgets
4. Profile with Flutter DevTools
5. Monitor memory usage on devices

## Security Best Practices

1. ✅ Never commit API credentials
2. ✅ Use HTTPS for API calls
3. ✅ Validate SSL certificates
4. ✅ Store sensitive data securely
5. ✅ Implement token refresh mechanism
6. ✅ Clear sensitive data on logout

## Support & Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Dart Documentation](https://dart.dev/guides)
- [Provider Package](https://pub.dev/packages/provider)
- [Dio Documentation](https://pub.dev/packages/dio)

---

**Version**: 1.0.0
**Last Updated**: January 7, 2026
