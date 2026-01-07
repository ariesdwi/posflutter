class ReportData {
  final ReportPeriod period;
  final ReportSummary summary;
  final Map<String, double> revenueByPaymentMethod;
  final Map<String, double> revenueByCashier;
  final List<BestSellerItem> bestSellers;
  final List<ReportTransaction> transactions;

  ReportData({
    required this.period,
    required this.summary,
    required this.revenueByPaymentMethod,
    required this.revenueByCashier,
    required this.bestSellers,
    required this.transactions,
  });

  factory ReportData.fromJson(Map<String, dynamic> json) {
    return ReportData(
      period: ReportPeriod.fromJson(json['period'] ?? {}),
      summary: ReportSummary.fromJson(json['summary'] ?? {}),
      revenueByPaymentMethod: Map<String, double>.from(
        (json['revenueByPaymentMethod'] ?? {}).map(
          (key, value) => MapEntry(key, (value as num).toDouble()),
        ),
      ),
      revenueByCashier: Map<String, double>.from(
        (json['revenueByCashier'] ?? {}).map(
          (key, value) => MapEntry(key, (value as num).toDouble()),
        ),
      ),
      bestSellers:
          (json['bestSellers'] as List?)
              ?.map((e) => BestSellerItem.fromJson(e))
              .toList() ??
          [],
      transactions:
          (json['transactions'] as List?)
              ?.map((e) => ReportTransaction.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class ReportPeriod {
  final String type;
  final String startDate;
  final String endDate;

  ReportPeriod({
    required this.type,
    required this.startDate,
    required this.endDate,
  });

  factory ReportPeriod.fromJson(Map<String, dynamic> json) {
    return ReportPeriod(
      type: json['type'] ?? '',
      startDate: json['startDate'] ?? '',
      endDate: json['endDate'] ?? '',
    );
  }
}

class ReportSummary {
  final double totalRevenue;
  final int totalTransactions;
  final int totalItemsSold;
  final double averageTransactionValue;

  ReportSummary({
    required this.totalRevenue,
    required this.totalTransactions,
    required this.totalItemsSold,
    required this.averageTransactionValue,
  });

  factory ReportSummary.fromJson(Map<String, dynamic> json) {
    return ReportSummary(
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0.0,
      totalTransactions: (json['totalTransactions'] as num?)?.toInt() ?? 0,
      totalItemsSold: (json['totalItemsSold'] as num?)?.toInt() ?? 0,
      averageTransactionValue:
          (json['averageTransactionValue'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class BestSellerItem {
  final String productId;
  final String productName;
  final int quantitySold;
  final double revenue;

  BestSellerItem({
    required this.productId,
    required this.productName,
    required this.quantitySold,
    required this.revenue,
  });

  factory BestSellerItem.fromJson(Map<String, dynamic> json) {
    return BestSellerItem(
      productId: json['productId'] ?? '',
      productName: json['productName'] ?? '',
      quantitySold: (json['quantitySold'] as num?)?.toInt() ?? 0,
      revenue: (json['revenue'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ReportTransaction {
  final String id;
  final String transactionNumber;
  final double totalAmount;
  final String paymentMethod;
  final String cashier;
  final int itemCount;
  final String createdAt;

  ReportTransaction({
    required this.id,
    required this.transactionNumber,
    required this.totalAmount,
    required this.paymentMethod,
    required this.cashier,
    required this.itemCount,
    required this.createdAt,
  });

  factory ReportTransaction.fromJson(Map<String, dynamic> json) {
    return ReportTransaction(
      id: json['id'] ?? '',
      transactionNumber: json['transactionNumber'] ?? '',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: json['paymentMethod'] ?? '',
      cashier: json['cashier'] ?? '',
      itemCount: (json['itemCount'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class RevenueByCategoryItem {
  final String category;
  final double revenue;
  final int itemsSold;

  RevenueByCategoryItem({
    required this.category,
    required this.revenue,
    required this.itemsSold,
  });

  factory RevenueByCategoryItem.fromJson(Map<String, dynamic> json) {
    return RevenueByCategoryItem(
      category: json['category'] ?? '',
      revenue: (json['revenue'] as num?)?.toDouble() ?? 0.0,
      itemsSold: (json['itemsSold'] as num?)?.toInt() ?? 0,
    );
  }
}
