import 'package:flutter/material.dart';
import '../models/transaction.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/constants/app_colors.dart';

class ReceiptScreen extends StatelessWidget {
  final Transaction transaction;

  const ReceiptScreen({Key? key, required this.transaction}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        Navigator.of(context).popUntil((route) => route.isFirst);
        return false;
      },
      child: Scaffold(
        backgroundColor: AppColors.slate50,
        appBar: AppBar(
          title: const Text('Transaction Receipt'),
          centerTitle: true,
          automaticallyImplyLeading: false,
          elevation: 0,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            children: [
              // Success Header
              const Icon(
                Icons.check_circle_rounded,
                color: AppColors.success,
                size: 80,
              ),
              const SizedBox(height: 16),
              const Text(
                'Payment Successful!',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.slate900,
                ),
              ),
              const SizedBox(height: 32),

              // Thermal Receipt Card
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.slate900.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Jagged / Dotted Top border simulation
                    Container(
                      height: 6,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: AppColors.slate200.withOpacity(0.5),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(4),
                          topRight: Radius.circular(4),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          const Text(
                            'KEDAI KITA',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.2,
                              color: AppColors.indigo500,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Professional POS System',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.slate500,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Receipt Details
                          _buildDetailRow(
                            'Date',
                            DateFormatter.formatDateTime(
                              transaction.createdAt ?? DateTime.now(),
                            ),
                          ),
                          const SizedBox(height: 8),
                          _buildDetailRow(
                            'Order ID',
                            '#${transaction.id?.toUpperCase() ?? 'POS-001'}',
                          ),
                          if (transaction.tableNumber != null) ...[
                            const SizedBox(height: 8),
                            _buildDetailRow(
                              'Table',
                              transaction.tableNumber!,
                              isBold: true,
                            ),
                          ],
                          const SizedBox(height: 12),
                          const Divider(thickness: 1, height: 24),

                          // Items
                          ...transaction.items.map((item) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.productName,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                            color: AppColors.slate900,
                                          ),
                                        ),
                                        Text(
                                          '${item.quantity} x ${CurrencyFormatter.format(item.price)}',
                                          style: TextStyle(
                                            fontSize: 12,
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
                                      fontSize: 14,
                                      color: AppColors.slate900,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),

                          const Divider(thickness: 1, height: 24),

                          // Bill Breakdown
                          _buildBillRow(
                            'Subtotal',
                            CurrencyFormatter.format(transaction.subtotal),
                          ),
                          const SizedBox(height: 8),
                          _buildBillRow(
                            'Discount',
                            '-${CurrencyFormatter.format(transaction.discount)}',
                            isError: true,
                          ),
                          const SizedBox(height: 8),
                          _buildBillRow(
                            'Tax (10%)',
                            CurrencyFormatter.format(transaction.tax),
                          ),
                          const SizedBox(height: 16),

                          // Total
                          Container(
                            padding: const EdgeInsets.symmetric(
                              vertical: 12,
                              horizontal: 16,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.slate50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'TOTAL',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16,
                                    color: AppColors.slate900,
                                  ),
                                ),
                                Text(
                                  CurrencyFormatter.format(transaction.total),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 20,
                                    color: AppColors.slate900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Payment Status
                          _buildDetailRow('Payment', transaction.paymentMethod),
                          const SizedBox(height: 8),
                          _buildDetailRow(
                            'Amount Paid',
                            CurrencyFormatter.format(transaction.paymentAmount),
                          ),
                          const SizedBox(height: 8),
                          _buildDetailRow(
                            'Change',
                            CurrencyFormatter.format(transaction.change),
                            isBold: true,
                          ),

                          const SizedBox(height: 32),
                          const Text(
                            'Thank you for your visit!',
                            style: TextStyle(
                              fontStyle: FontStyle.italic,
                              color: AppColors.slate500,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: _buildActionButton(
                      label: 'Print',
                      icon: Icons.print_outlined,
                      color: AppColors.slate900,
                      onPressed: () {
                        // TODO: Implement print
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildActionButton(
                      label: 'Share',
                      icon: Icons.share_outlined,
                      color: AppColors.indigo500,
                      onPressed: () {
                        // TODO: Implement share
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'Done',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: AppColors.slate500,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13, color: AppColors.slate500),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            color: AppColors.slate900,
          ),
        ),
      ],
    );
  }

  Widget _buildBillRow(String label, String value, {bool isError = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: AppColors.slate900),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
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
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
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
                    fontSize: 15,
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
