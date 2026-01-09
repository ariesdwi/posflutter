class ApiConstants {
  // Base URL - Update this based on your backend
  static const String baseUrl = 'https://posbackend-18c9.vercel.app';

  // Endpoints
  static const String loginEndpoint = '/auth/login';
  static const String profileEndpoint = '/auth/profile';
  static const String menuEndpoint = '/menu';
  static const String categoriesEndpoint = '/categories';
  static const String transactionsEndpoint = '/transactions';

  static const String receiptsEndpoint = '/receipts';

  // Report Endpoints
  static const String reportsDailyEndpoint = '/reports/daily';
  static const String reportsWeeklyEndpoint = '/reports/weekly';
  static const String reportsMonthlyEndpoint = '/reports/monthly';
  static const String reportsBestSellersEndpoint = '/reports/best-sellers';
  static const String reportsRevenueByCategoryEndpoint =
      '/reports/revenue-by-category';

  // Timeout
  static const int connectionTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
}
