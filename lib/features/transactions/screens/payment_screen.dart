import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../cart/providers/cart_provider.dart';
import '../providers/transaction_provider.dart';
import '../models/transaction.dart';
import '../models/transaction.dart' as trans;
import '../../../core/constants/app_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/custom_widgets.dart';
import 'receipt_screen.dart';

class PaymentScreen extends StatefulWidget {
  final Transaction? existingTransaction;

  const PaymentScreen({Key? key, this.existingTransaction}) : super(key: key);

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _selectedPaymentMethod = AppConstants.paymentMethodCash;
  late TextEditingController _amountPaidController;

  @override
  void initState() {
    super.initState();
    _amountPaidController = TextEditingController();
  }

  @override
  void dispose() {
    _amountPaidController.dispose();
    super.dispose();
  }

  Future<void> _processPayment(
    BuildContext context,
    CartProvider cartProvider,
    TransactionProvider transactionProvider,
  ) async {
    final amountPaid = double.tryParse(_amountPaidController.text) ?? 0;
    final totalToPay = widget.existingTransaction?.total ?? cartProvider.total;
    final String? effectiveTransactionId =
        widget.existingTransaction?.id ?? cartProvider.transactionId;

    if (amountPaid < totalToPay) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Jumlah yang dibayar kurang dari total')),
      );
      return;
    }

    final String tableNumber =
        widget.existingTransaction?.tableNumber ??
        cartProvider.tableNumber ??
        '';

    // Create transaction items - use existing transaction items if available
    final items = widget.existingTransaction != null
        ? widget.existingTransaction!.items
        : cartProvider.items
              .map(
                (item) => trans.TransactionItem(
                  productId: item.product.id,
                  productName: item.product.name,
                  price: item.product.price,
                  quantity: item.quantity,
                  subtotal: item.subtotal,
                ),
              )
              .toList();

    // Create transaction - use existing transaction data if available
    final transaction = Transaction(
      items: items,
      subtotal: widget.existingTransaction?.subtotal ?? cartProvider.subtotal,
      discount: widget.existingTransaction?.discount ?? cartProvider.discount,
      tax: widget.existingTransaction?.tax ?? cartProvider.tax,
      total: totalToPay,
      paymentMethod: _selectedPaymentMethod,
      paymentAmount: amountPaid,
      change: amountPaid - totalToPay,
      status: AppConstants.transactionStatusCompleted,
      tableNumber: tableNumber.isNotEmpty ? tableNumber : null,
      createdAt: DateTime.now(),
    );

    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) =>
          const LoadingDialog(message: 'Memproses transaksi...'),
    );

    // Submit transaction
    bool success;
    if (effectiveTransactionId != null) {
      // If coming from cart and we have a transaction ID, we might have updated items
      if (widget.existingTransaction == null) {
        // Update items and totals first before checkout
        await transactionProvider.updateTransaction(effectiveTransactionId, {
          'items': items
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
          'subtotal': cartProvider.subtotal,
          'discount': cartProvider.discount,
          'tax': cartProvider.tax,
          'total': cartProvider.total,
          'tableNumber': tableNumber.isNotEmpty ? tableNumber : null,
        });
      }

      success = await transactionProvider
          .checkoutTransaction(effectiveTransactionId, {
            'paymentMethod': _selectedPaymentMethod,
            'paymentAmount': amountPaid,
            'notes':
                'Payment for ${tableNumber.isNotEmpty ? tableNumber : "Order"}',
          });
    } else {
      success = await transactionProvider.createTransaction(transaction);
    }

    if (mounted) {
      Navigator.pop(context); // Close loading dialog

      if (success) {
        // Clear cart
        context.read<CartProvider>().clearCart();

        // Navigate to receipt screen
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => ReceiptScreen(transaction: transaction),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              transactionProvider.error ?? 'Gagal memproses transaksi',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pembayaran')),
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          final totalToPay =
              widget.existingTransaction?.total ?? cartProvider.total;
          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Modern Order Summary Card
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.shadow.withOpacity(0.08),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                    border: Border.all(
                      color: AppColors.slate200.withOpacity(0.5),
                    ),
                  ),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Ringkasan Tagihan',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                    color: AppColors.slate900,
                                  ),
                                ),
                                if (widget.existingTransaction?.tableNumber !=
                                        null ||
                                    cartProvider.tableNumber != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.indigo500.withOpacity(
                                        0.1,
                                      ),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      widget.existingTransaction?.tableNumber ??
                                          cartProvider.tableNumber ??
                                          '-',
                                      style: const TextStyle(
                                        color: AppColors.indigo500,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _buildSummaryRow(
                              'Subtotal',
                              CurrencyFormatter.format(
                                widget.existingTransaction?.subtotal ??
                                    cartProvider.subtotal,
                              ),
                            ),
                            const SizedBox(height: 8),
                            _buildSummaryRow(
                              'Diskon',
                              '-${CurrencyFormatter.format(widget.existingTransaction?.discount ?? cartProvider.discount)}',
                              isNegative: true,
                            ),
                            const SizedBox(height: 8),
                            _buildSummaryRow(
                              'Pajak (10%)',
                              CurrencyFormatter.format(
                                widget.existingTransaction?.tax ??
                                    cartProvider.tax,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 20,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.slate50,
                          borderRadius: const BorderRadius.only(
                            bottomLeft: Radius.circular(24),
                            bottomRight: Radius.circular(24),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: AppColors.slate900,
                              ),
                            ),
                            Text(
                              CurrencyFormatter.format(totalToPay),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 22,
                                color: AppColors.indigo500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Payment Method Selection
                const Text(
                  'Pilih Metode Pembayaran',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: AppColors.slate900,
                  ),
                ),
                const SizedBox(height: 16),
                Column(
                  children: [
                    Row(
                      children: [
                        _buildPaymentCard(
                          'Tunai',
                          Icons.payments_outlined,
                          AppConstants.paymentMethodCash,
                        ),
                        const SizedBox(width: 12),
                        _buildPaymentCard(
                          'Kartu',
                          Icons.credit_card_outlined,
                          AppConstants.paymentMethodCard,
                        ),
                        const SizedBox(width: 12),
                        _buildPaymentCard(
                          'QRIS',
                          Icons.qr_code_scanner_rounded,
                          AppConstants.paymentMethodQris,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildPaymentCard(
                          'Transfer',
                          Icons.account_balance_rounded,
                          AppConstants.paymentMethodTransfer,
                        ),
                        const SizedBox(width: 12),
                        _buildPaymentCard(
                          'Lainnya',
                          Icons.more_horiz_rounded,
                          AppConstants.paymentMethodOther,
                        ),
                        const Expanded(child: SizedBox()),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Amount Entry with "Quick Pay" buttons style
                const Text(
                  'Jumlah Dibayar',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: AppColors.slate900,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _amountPaidController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.slate900,
                  ),
                  decoration: InputDecoration(
                    prefixIcon: const Padding(
                      padding: EdgeInsets.only(left: 16, right: 8),
                      child: Text(
                        'Rp',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.slate500,
                        ),
                      ),
                    ),
                    prefixIconConstraints: const BoxConstraints(
                      minWidth: 0,
                      minHeight: 0,
                    ),
                    hintText: '0',
                    filled: true,
                    fillColor: AppColors.surface,
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: AppColors.slate200),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(
                        color: AppColors.indigo500,
                        width: 2,
                      ),
                    ),
                  ),
                  onChanged: (_) => setState(() {}),
                ),

                const SizedBox(height: 24),

                // Dynamic Change Display
                if (_amountPaidController.text.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color:
                          ((double.tryParse(_amountPaidController.text) ?? 0) >=
                              totalToPay)
                          ? AppColors.success.withOpacity(0.08)
                          : AppColors.error.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color:
                            ((double.tryParse(_amountPaidController.text) ??
                                    0) >=
                                totalToPay)
                            ? AppColors.success.withOpacity(0.2)
                            : AppColors.error.withOpacity(0.2),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          ((double.tryParse(_amountPaidController.text) ?? 0) >=
                                  totalToPay)
                              ? 'Kembalian untuk Pelanggan'
                              : 'Sisa Saldo',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color:
                                ((double.tryParse(_amountPaidController.text) ??
                                        0) >=
                                    totalToPay)
                                ? AppColors.success
                                : AppColors.error,
                          ),
                        ),
                        Text(
                          CurrencyFormatter.format(
                            ((double.tryParse(_amountPaidController.text) ??
                                        0) -
                                    totalToPay)
                                .abs(),
                          ),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                            color:
                                ((double.tryParse(_amountPaidController.text) ??
                                        0) >=
                                    totalToPay)
                                ? AppColors.success
                                : AppColors.error,
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 40),

                // Final Action Button
                Consumer<TransactionProvider>(
                  builder: (context, transactionProvider, _) {
                    return SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: transactionProvider.isLoading
                            ? null
                            : () => _processPayment(
                                context,
                                cartProvider,
                                transactionProvider,
                              ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.slate900,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: transactionProvider.isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'Selesaikan Transaksi',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'Kembali ke Keranjang',
                      style: TextStyle(color: AppColors.slate500),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSummaryRow(
    String label,
    String value, {
    bool isNegative = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppColors.slate500, fontSize: 14),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
            color: isNegative ? AppColors.error : AppColors.slate900,
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentCard(String label, IconData icon, String value) {
    final isSelected = _selectedPaymentMethod == value;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedPaymentMethod = value;
            _amountPaidController.clear();
          });
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.indigo500 : AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppColors.indigo500 : AppColors.slate200,
              width: 1.5,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.indigo500.withOpacity(0.2),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : [],
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : AppColors.slate500,
                size: 32,
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : AppColors.slate900,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
