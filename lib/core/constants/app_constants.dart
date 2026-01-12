class AppConstants {
  // App Name
  static const String appName = 'POS';
  static const String appVersion = '1.0.0';

  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String productsKey = 'products_cache';
  static const String categoriesKey = 'categories_cache';
  static const String rememberMeKey = 'remember_me';
  static const String userEmailKey = 'user_email';

  // Payment Methods
  static const String paymentMethodCash = 'CASH';
  static const String paymentMethodCard = 'CARD';

  // Transaction Status
  static const String transactionStatusPending = 'PENDING';
  static const String transactionStatusCompleted = 'COMPLETED';
  static const String transactionStatusCancelled = 'CANCELLED';

  // Tax Rate (%)
  static const double taxRate = 10.0;

  // Roles
  static const String roleKasir = 'KASIR';
}
