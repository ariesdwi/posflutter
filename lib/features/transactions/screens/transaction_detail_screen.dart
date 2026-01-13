import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/transaction.dart';
import '../providers/transaction_provider.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/constants/app_colors.dart';
import '../../cart/providers/cart_provider.dart';
import '../../../core/providers/navigation_provider.dart';
import 'payment_screen.dart';

class TransactionDetailScreen extends StatefulWidget {
  final Transaction transaction;

  const TransactionDetailScreen({Key? key, required this.transaction})
    : super(key: key);

  @override
  State<TransactionDetailScreen> createState() =>
      _TransactionDetailScreenState();
}

class _TransactionDetailScreenState extends State<TransactionDetailScreen> {
  late List<dynamic> _items;
  late double _subtotal;
  late double _discount;
  late double _tax;
  late double _total;

  @override
  void initState() {
    super.initState();
    _items = List.from(widget.transaction.items);
    _recalculateTotals();
  }

  void _recalculateTotals() {
    _subtotal = _items.fold(0.0, (sum, item) => sum + item.subtotal);
    _discount = widget.transaction.discount;
    final taxRate = context.read<CartProvider>().taxRate / 100;
    _tax = (_subtotal - _discount) * taxRate;
    _total = _subtotal - _discount + _tax;
  }

  void _deleteItem(int index) async {
    final dialogContext = context;

    showDialog(
      context: dialogContext,
      builder: (BuildContext confirmContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Hapus Item',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Apakah Anda yakin ingin menghapus "${_items[index].productName}" dari pesanan?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(confirmContext).pop(),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () async {
              // Close confirmation dialog
              Navigator.of(confirmContext).pop();

              // Show loading dialog
              showDialog(
                context: dialogContext,
                barrierDismissible: false,
                builder: (BuildContext loadingContext) =>
                    const Center(child: CircularProgressIndicator()),
              );

              try {
                // Create updated items list (without the deleted item)
                final updatedItems = List.from(_items);
                updatedItems.removeAt(index);

                // Recalculate totals
                final updatedSubtotal = updatedItems.fold(
                  0.0,
                  (sum, item) => sum + item.subtotal,
                );
                final updatedDiscount = _discount;
                final taxRate = context.read<CartProvider>().taxRate / 100;
                final updatedTax =
                    (updatedSubtotal - updatedDiscount) * taxRate;
                final updatedTotal =
                    updatedSubtotal - updatedDiscount + updatedTax;

                // Update transaction on backend
                final success = await context
                    .read<TransactionProvider>()
                    .updateTransaction(widget.transaction.id!, {
                      'items': updatedItems
                          .map(
                            (item) => {
                              'productId': item.productId,
                              'productName': item.productName,
                              'price': item.price,
                              'quantity': item.quantity,
                              'subtotal': item.subtotal,
                            },
                          )
                          .toList(),
                      'subtotal': updatedSubtotal,
                      'discount': updatedDiscount,
                      'tax': updatedTax,
                      'total': updatedTotal,
                    });

                if (!mounted) return;

                // Close loading dialog
                Navigator.of(dialogContext).pop();

                if (success) {
                  // Fetch updated transaction from backend
                  final transactionProvider = context
                      .read<TransactionProvider>();
                  await transactionProvider.fetchTransactions();

                  // Get the updated transaction
                  final updatedTransaction = transactionProvider
                      .getTransactionById(widget.transaction.id!);

                  if (updatedTransaction != null && mounted) {
                    // Update local state with fresh data from server
                    setState(() {
                      _items = List.from(updatedTransaction.items);
                      _recalculateTotals();
                    });
                  }

                  if (mounted) {
                    // Show success message
                    ScaffoldMessenger.of(dialogContext).showSnackBar(
                      SnackBar(
                        content: const Text('Item berhasil dihapus'),
                        backgroundColor: AppColors.success,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    );
                  }
                } else {
                  if (mounted) {
                    // Show error message
                    ScaffoldMessenger.of(dialogContext).showSnackBar(
                      SnackBar(
                        content: const Text('Gagal menghapus item'),
                        backgroundColor: AppColors.error,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    );
                  }
                }
              } catch (e) {
                if (!mounted) return;

                // Close loading dialog
                Navigator.of(dialogContext).pop();

                // Show error message
                ScaffoldMessenger.of(dialogContext).showSnackBar(
                  SnackBar(
                    content: Text('Error: ${e.toString()}'),
                    backgroundColor: AppColors.error,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isPending = widget.transaction.status == 'PENDING';
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: const Text('Detail Transaksi'),
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
                      color: widget.transaction.status == 'COMPLETED'
                          ? AppColors.success.withOpacity(0.1)
                          : AppColors.warning.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      widget.transaction.status,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                        color: widget.transaction.status == 'COMPLETED'
                            ? AppColors.success
                            : AppColors.warning,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    CurrencyFormatter.format(_total),
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: AppColors.slate900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.transaction.transactionNumber ??
                        'Order #${widget.transaction.id?.toUpperCase().substring(0, 8) ?? 'N/A'}',
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
                        'Tanggal',
                        DateFormatter.formatDateTime(
                          widget.transaction.createdAt ?? DateTime.now(),
                        ),
                      ),
                      _buildInfoItem(
                        Icons.payments_outlined,
                        'Metode',
                        widget.transaction.paymentMethod,
                      ),
                      if (widget.transaction.tableNumber != null)
                        _buildInfoItem(
                          Icons.table_restaurant_outlined,
                          'Meja',
                          widget.transaction.tableNumber!,
                        ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Items Section
            const Text(
              'ITEM PESANAN',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
                color: AppColors.slate500,
              ),
            ),
            const SizedBox(height: 16),
            ...List.generate(_items.length, (index) {
              final item = _items[index];
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
                    // Delete button for pending transactions
                    if (isPending) ...[
                      const SizedBox(width: 12),
                      IconButton(
                        onPressed: () => _deleteItem(index),
                        icon: const Icon(Icons.delete_outline_rounded),
                        color: AppColors.error,
                        iconSize: 22,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        tooltip: 'Hapus item',
                      ),
                    ],
                  ],
                ),
              );
            }),

            const SizedBox(height: 32),

            // Summary Card
            const Text(
              'RINGKASAN PEMBAYARAN',
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
                    CurrencyFormatter.format(_subtotal),
                  ),
                  const SizedBox(height: 12),
                  _buildSummaryRow(
                    'Diskon',
                    '-${CurrencyFormatter.format(_discount)}',
                    isError: true,
                  ),
                  const SizedBox(height: 12),
                  Consumer<CartProvider>(
                    builder: (context, cartProvider, _) => _buildSummaryRow(
                      'Pajak (${cartProvider.taxRate.toStringAsFixed(1)}%)',
                      CurrencyFormatter.format(_tax),
                    ),
                  ),
                  const Divider(height: 32),
                  _buildSummaryRow(
                    'Total',
                    CurrencyFormatter.format(_total),
                    isBold: true,
                    fontSize: 18,
                  ),
                  if (widget.transaction.status == 'COMPLETED') ...[
                    const SizedBox(height: 24),
                    _buildSummaryRow(
                      'Jumlah Dibayar',
                      CurrencyFormatter.format(
                        widget.transaction.paymentAmount,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildSummaryRow(
                      'Kembali',
                      CurrencyFormatter.format(widget.transaction.change),
                      isBold: true,
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 48),

            // Actions
            if (isPending)
              Column(
                children: [
                  // Add More Items Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        // Load transaction items to cart
                        context.read<CartProvider>().loadTransactionItems(
                          _items,
                          widget.transaction.tableNumber,
                          widget.transaction.id,
                        );

                        // Navigate to menu screen (index 0)
                        context.read<NavigationProvider>().setIndex(0);

                        // Show confirmation
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text(
                              'Item dimuat ke keranjang. Silakan tambah item lagi.',
                            ),
                            backgroundColor: AppColors.indigo500,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            duration: const Duration(seconds: 2),
                          ),
                        );

                        // Pop back to dine-in screen
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.add_shopping_cart_rounded),
                      label: const Text(
                        'Tambah Item',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.indigo500,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        side: BorderSide(
                          color: AppColors.indigo500.withOpacity(0.5),
                          width: 2,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Proceed to Checkout Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => PaymentScreen(
                              existingTransaction: widget.transaction.copyWith(
                                items: _items
                                    .map(
                                      (item) => item is TransactionItem
                                          ? item
                                          : TransactionItem.fromJson(
                                              item as Map<String, dynamic>,
                                            ),
                                    )
                                    .toList(),
                                subtotal: _subtotal,
                                discount: _discount,
                                tax: _tax,
                                total: _total,
                              ),
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.payment_rounded),
                      label: const Text(
                        'Lanjut ke Pembayaran',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.indigo500,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              )
            else
              Row(
                children: [
                  Expanded(
                    child: _buildActionButton(
                      label: 'Cetak',
                      icon: Icons.print_outlined,
                      color: AppColors.slate900,
                      onPressed: () {},
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildActionButton(
                      label: 'Bagikan',
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
