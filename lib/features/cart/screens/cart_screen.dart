import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../../transactions/providers/transaction_provider.dart';
import '../../transactions/models/transaction.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/custom_widgets.dart';
import '../../transactions/screens/payment_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({Key? key}) : super(key: key);

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  late TextEditingController _discountController;
  late TextEditingController _tableController;

  @override
  void initState() {
    super.initState();
    _discountController = TextEditingController();
    _tableController = TextEditingController(
      text: context.read<CartProvider>().tableNumber,
    );
  }

  @override
  void dispose() {
    _discountController.dispose();
    _tableController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Keranjang Belanja')),
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          if (cartProvider.isEmpty) {
            return const Center(child: Text('Keranjang kosong'));
          }

          return Column(
            children: [
              // Cart Items
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  itemCount: cartProvider.items.length,
                  itemBuilder: (context, index) {
                    final cartItem = cartProvider.items[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.shadow.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                        border: Border.all(
                          color: AppColors.slate200.withOpacity(0.5),
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            // Product Info
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    cartItem.product.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                      color: AppColors.slate900,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    CurrencyFormatter.format(
                                      cartItem.product.price,
                                    ),
                                    style: TextStyle(
                                      color: AppColors.indigo500,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Quantity Controls
                            Container(
                              decoration: BoxDecoration(
                                color: AppColors.slate50,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove, size: 18),
                                    onPressed: cartItem.quantity > 1
                                        ? () {
                                            context
                                                .read<CartProvider>()
                                                .updateQuantity(
                                                  cartItem.product.id,
                                                  cartItem.quantity - 1,
                                                );
                                          }
                                        : null,
                                    constraints: const BoxConstraints(),
                                    padding: const EdgeInsets.all(8),
                                  ),
                                  Text(
                                    cartItem.quantity.toString(),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add, size: 18),
                                    onPressed: () {
                                      context
                                          .read<CartProvider>()
                                          .updateQuantity(
                                            cartItem.product.id,
                                            cartItem.quantity + 1,
                                          );
                                    },
                                    constraints: const BoxConstraints(),
                                    padding: const EdgeInsets.all(8),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Delete
                            IconButton(
                              icon: const Icon(
                                Icons.delete_outline,
                                color: AppColors.error,
                                size: 22,
                              ),
                              onPressed: () {
                                context.read<CartProvider>().removeProduct(
                                  cartItem.product.id,
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              // Summary
              Container(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(30),
                    topRight: Radius.circular(30),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.shadow.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Table & Discount Section
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Meja',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.slate500,
                                ),
                              ),
                              const SizedBox(height: 6),
                              TextField(
                                controller: _tableController,
                                decoration: InputDecoration(
                                  hintText: 'mis. M-01',
                                  filled: true,
                                  fillColor: AppColors.slate50,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide.none,
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                  isDense: true,
                                ),
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                                onChanged: (value) {
                                  context.read<CartProvider>().setTableNumber(
                                    value,
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Diskon %',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.slate500,
                                ),
                              ),
                              const SizedBox(height: 6),
                              TextField(
                                controller: _discountController,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                  hintText: '0',
                                  filled: true,
                                  fillColor: AppColors.slate50,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide.none,
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                  isDense: true,
                                ),
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                                onChanged: (value) {
                                  final discount = double.tryParse(value) ?? 0;
                                  final discountAmount =
                                      (cartProvider.subtotal * discount) / 100;
                                  context.read<CartProvider>().setDiscount(
                                    discountAmount,
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    // Bill Breakdown
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Subtotal',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                        Text(
                          CurrencyFormatter.format(cartProvider.subtotal),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    if (cartProvider.discount > 0) ...[
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Diskon',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                          Text(
                            '-${CurrencyFormatter.format(cartProvider.discount)}',
                            style: const TextStyle(
                              color: AppColors.error,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Pajak (${cartProvider.taxRate.toStringAsFixed(1)}%)',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Text(
                          CurrencyFormatter.format(cartProvider.tax),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Total
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.indigo500.withOpacity(0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total Tagihan',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            CurrencyFormatter.format(cartProvider.total),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Actions - Redesigned with better layout
                    Column(
                      children: [
                        // Primary Action - Pay Now (Full Width, Premium)
                        Container(
                          width: double.infinity,
                          height: 60,
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.indigo500.withOpacity(0.4),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const PaymentScreen(),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              foregroundColor: Colors.white,
                              shadowColor: Colors.transparent,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.payment_rounded, size: 24),
                                const SizedBox(width: 12),
                                const Text(
                                  'Bayar Sekarang',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 18,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Secondary Action - Hold Order (Subtle)
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: OutlinedButton(
                            onPressed: () {
                              _saveAsPending(context, cartProvider);
                            },
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              side: BorderSide(
                                color: AppColors.indigo500.withOpacity(0.3),
                                width: 2,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              backgroundColor: Colors.white,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.schedule_rounded,
                                  size: 20,
                                  color: AppColors.indigo500,
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'Bayar Nanti',
                                  style: TextStyle(
                                    color: AppColors.indigo500,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _saveAsPending(BuildContext context, CartProvider cartProvider) async {
    if (cartProvider.tableNumber == null || cartProvider.tableNumber!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Silakan masukkan Nomor Meja untuk Dine-in'),
        ),
      );
      return;
    }

    final transaction = Transaction(
      items: cartProvider.items
          .map(
            (item) => TransactionItem(
              productId: item.product.id,
              productName: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              subtotal: item.subtotal,
            ),
          )
          .toList(),
      total: cartProvider.total,
      paymentMethod: 'CASH', // Dummy for pending
      paymentAmount: 0,
      change: 0,
      status: 'PENDING',
      tableNumber: cartProvider.tableNumber,
    );

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) =>
          const LoadingDialog(message: 'Menyimpan pesanan...'),
    );

    final transactionProvider = context.read<TransactionProvider>();
    bool success;

    if (cartProvider.transactionId != null) {
      // Update existing transaction
      success = await transactionProvider.updateTransaction(
        cartProvider.transactionId!,
        {
          'items': transaction.items
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
          'tableNumber': cartProvider.tableNumber,
        },
      );
    } else {
      // Create new transaction
      success = await transactionProvider.createTransaction(transaction);
    }

    if (mounted) {
      Navigator.pop(context); // Close loading dialog

      if (success) {
        cartProvider.clearCart();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              cartProvider.transactionId != null
                  ? 'Pesanan untuk ${transaction.tableNumber} diperbarui!'
                  : 'Pesanan untuk ${transaction.tableNumber} tersimpan!',
            ),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              transactionProvider.error ?? 'Gagal menyimpan pesanan',
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
}
