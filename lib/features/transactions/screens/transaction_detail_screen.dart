import 'package:flutter/material.dart';
import '../models/transaction.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/constants/app_colors.dart';
import 'payment_screen.dart';

class TransactionDetailScreen extends StatelessWidget {
  final Transaction transaction;

  const TransactionDetailScreen({Key? key, required this.transaction})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: const Text('Transaction Details'),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.slate900.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: transaction.status == 'COMPLETED'
                          ? AppColors.success.withOpacity(0.1)
                          : AppColors.warning.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      transaction.status,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                        color: transaction.status == 'COMPLETED'
                            ? AppColors.success
                            : AppColors.warning,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    CurrencyFormatter.format(transaction.total),
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: AppColors.slate900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    transaction.transactionNumber ??
                        'Order #${transaction.id?.toUpperCase().substring(0, 8) ?? 'N/A'}',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.slate500,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Divider(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildInfoItem(
                        Icons.calendar_today_outlined,
                        'Date',
                        DateFormatter.formatDateTime(
                          transaction.createdAt ?? DateTime.now(),
                        ),
                      ),
                      _buildInfoItem(
                        Icons.payments_outlined,
                        'Method',
                        transaction.paymentMethod,
                      ),
                      if (transaction.tableNumber != null)
                        _buildInfoItem(
                          Icons.table_restaurant_outlined,
                          'Table',
                          transaction.tableNumber!,
                        ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Items Section
            const Text(
              'ORDER ITEMS',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
                color: AppColors.slate500,
              ),
            ),
            const SizedBox(height: 16),
            ...transaction.items.map((item) {
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.slate200.withOpacity(0.5),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.slate50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.inventory_2_outlined,
                        color: AppColors.slate500,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.productName,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: AppColors.slate900,
                            ),
                          ),
                          Text(
                            '${item.quantity} x ${CurrencyFormatter.format(item.price)}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.slate500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      CurrencyFormatter.format(item.subtotal),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: AppColors.slate900,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),

            const SizedBox(height: 32),

            // Summary Card
            const Text(
              'PAYMENT SUMMARY',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
                color: AppColors.slate500,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.slate200.withOpacity(0.5)),
              ),
              child: Column(
                children: [
                  _buildSummaryRow(
                    'Subtotal',
                    CurrencyFormatter.format(transaction.subtotal),
                  ),
                  const SizedBox(height: 12),
                  _buildSummaryRow(
                    'Discount',
                    '-${CurrencyFormatter.format(transaction.discount)}',
                    isError: true,
                  ),
                  const SizedBox(height: 12),
                  _buildSummaryRow(
                    'Tax (10%)',
                    CurrencyFormatter.format(transaction.tax),
                  ),
                  const Divider(height: 32),
                  _buildSummaryRow(
                    'Total',
                    CurrencyFormatter.format(transaction.total),
                    isBold: true,
                    fontSize: 18,
                  ),
                  if (transaction.status == 'COMPLETED') ...[
                    const SizedBox(height: 24),
                    _buildSummaryRow(
                      'Amount Paid',
                      CurrencyFormatter.format(transaction.paymentAmount),
                    ),
                    const SizedBox(height: 12),
                    _buildSummaryRow(
                      'Change',
                      CurrencyFormatter.format(transaction.change),
                      isBold: true,
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 48),

            // Actions
            if (transaction.status == 'PENDING')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            PaymentScreen(existingTransaction: transaction),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.indigo500,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Proceed to Checkout',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: _buildActionButton(
                      label: 'Print',
                      icon: Icons.print_outlined,
                      color: AppColors.slate900,
                      onPressed: () {},
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildActionButton(
                      label: 'Share',
                      icon: Icons.share_outlined,
                      color: AppColors.indigo500,
                      onPressed: () {},
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String label, String value) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppColors.slate500),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.slate500,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: AppColors.slate900,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(
    String label,
    String value, {
    bool isError = false,
    bool isBold = false,
    double fontSize = 14,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: fontSize,
            color: isBold ? AppColors.slate900 : AppColors.slate500,
            fontWeight: isBold ? FontWeight.w900 : FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: isBold ? FontWeight.w900 : FontWeight.w700,
            color: isError ? AppColors.error : AppColors.slate900,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
