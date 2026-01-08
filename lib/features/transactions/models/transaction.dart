class TransactionItem {
  final String? id;
  final String productId;
  final String productName;
  final double price;
  final int quantity;
  final double subtotal;

  TransactionItem({
    this.id,
    required this.productId,
    required this.productName,
    required this.price,
    required this.quantity,
    required this.subtotal,
  });

  factory TransactionItem.fromJson(Map<String, dynamic> json) {
    return TransactionItem(
      id: json['id'] as String?,
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? '',
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      quantity: json['quantity'] as int? ?? 0,
      subtotal: double.tryParse(json['subtotal']?.toString() ?? '0') ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'productId': productId,
    'productName': productName,
    'price': price,
    'quantity': quantity,
    'subtotal': subtotal,
  };
}

class Transaction {
  final String? id;
  final String? transactionNumber;
  final List<TransactionItem> items;
  final double subtotal;
  final double discount;
  final double tax;
  final double total;
  final String paymentMethod;
  final double paymentAmount;
  final double change;
  final String status;
  final String? tableNumber;
  final String? notes;
  final DateTime? createdAt;
  final String? userId;

  Transaction({
    this.id,
    this.transactionNumber,
    required this.items,
    this.subtotal = 0.0,
    this.discount = 0.0,
    this.tax = 0.0,
    required this.total,
    required this.paymentMethod,
    required this.paymentAmount,
    required this.change,
    required this.status,
    this.tableNumber,
    this.notes,
    this.createdAt,
    this.userId,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as String?,
      transactionNumber: json['transactionNumber'] as String?,
      items:
          (json['items'] as List<dynamic>?)
              ?.map((e) => TransactionItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      // These might technically be missing in the summary list, default to 0
      subtotal: double.tryParse(json['subtotal']?.toString() ?? '0') ?? 0.0,
      discount: double.tryParse(json['discount']?.toString() ?? '0') ?? 0.0,
      tax: double.tryParse(json['tax']?.toString() ?? '0') ?? 0.0,

      // Map totalAmount -> total
      total:
          double.tryParse(
            json['totalAmount']?.toString() ?? json['total']?.toString() ?? '0',
          ) ??
          0.0,

      paymentMethod: json['paymentMethod'] as String? ?? '',

      // Map paymentAmount -> paymentAmount (handle string)
      paymentAmount:
          double.tryParse(
            json['paymentAmount']?.toString() ??
                json['amountPaid']?.toString() ??
                '0',
          ) ??
          0.0,

      // Map changeAmount -> change
      change:
          double.tryParse(
            json['changeAmount']?.toString() ??
                json['change']?.toString() ??
                '0',
          ) ??
          0.0,

      status: json['status'] as String? ?? 'PENDING',
      tableNumber: json['tableNumber'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      userId: json['userId'] as String?,
    );
  }

  // Simplified toJson for creating transactions - only send what API expects
  Map<String, dynamic> toJson() {
    // When creating a new transaction, only send required fields
    if (id == null) {
      return {
        'items': items
            .map((e) => {'productId': e.productId, 'quantity': e.quantity})
            .toList(),
        'paymentMethod': paymentMethod,
        'paymentAmount': paymentAmount,
        'status': status,
        if (tableNumber != null) 'tableNumber': tableNumber,
        if (notes != null) 'notes': notes,
      };
    }

    // When returning existing transaction, include all fields
    return {
      'id': id,
      'transactionNumber': transactionNumber,
      'items': items.map((e) => e.toJson()).toList(),
      'subtotal': subtotal,
      'discount': discount,
      'tax': tax,
      'totalAmount': total,
      'paymentMethod': paymentMethod,
      'paymentAmount': paymentAmount,
      'changeAmount': change,
      'status': status,
      if (tableNumber != null) 'tableNumber': tableNumber,
      if (notes != null) 'notes': notes,
      'createdAt': createdAt?.toIso8601String(),
      'userId': userId,
    };
  }
}
