import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../cart/providers/cart_provider.dart';
import '../providers/transaction_provider.dart';
import '../models/transaction.dart';
import '../models/transaction.dart' as trans;
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/custom_widgets.dart';
import 'receipt_screen.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({Key? key}) : super(key: key);

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

    if (amountPaid < cartProvider.total) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Amount paid is less than total')),
      );
      return;
    }

    // Create transaction items
    final items = cartProvider.items
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

    // Create transaction
    final transaction = Transaction(
      items: items,
      subtotal: cartProvider.subtotal,
      discount: cartProvider.discount,
      tax: cartProvider.tax,
      total: cartProvider.total,
      paymentMethod: _selectedPaymentMethod,
      paymentAmount: amountPaid,
      change: amountPaid - cartProvider.total,
      status: AppConstants.transactionStatusCompleted,
      createdAt: DateTime.now(),
    );

    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) =>
          const LoadingDialog(message: 'Processing transaction...'),
    );

    // Submit transaction
    final success = await transactionProvider.createTransaction(transaction);

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
              transactionProvider.error ?? 'Failed to process transaction',
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
      appBar: AppBar(title: const Text('Payment')),
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Order Summary
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Order Summary',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Subtotal:'),
                          Text(CurrencyFormatter.format(cartProvider.subtotal)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Discount:'),
                          Text(CurrencyFormatter.format(cartProvider.discount)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Tax:'),
                          Text(CurrencyFormatter.format(cartProvider.tax)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total:',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            Text(
                              CurrencyFormatter.format(cartProvider.total),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: Colors.blue,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                // Payment Method
                const Text(
                  'Payment Method',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 12),
                RadioListTile<String>(
                  title: const Text('Cash'),
                  value: AppConstants.paymentMethodCash,
                  groupValue: _selectedPaymentMethod,
                  onChanged: (value) {
                    setState(() {
                      _selectedPaymentMethod = value!;
                      _amountPaidController.clear();
                    });
                  },
                ),
                RadioListTile<String>(
                  title: const Text('Card'),
                  value: AppConstants.paymentMethodCard,
                  groupValue: _selectedPaymentMethod,
                  onChanged: (value) {
                    setState(() {
                      _selectedPaymentMethod = value!;
                      _amountPaidController.clear();
                    });
                  },
                ),
                const SizedBox(height: 24),
                // Amount Paid
                const Text(
                  'Amount Paid',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _amountPaidController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Enter amount',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    prefixText: 'Rp ',
                  ),
                  onChanged: (_) {
                    setState(() {});
                  },
                ),
                const SizedBox(height: 16),
                // Change
                if (_amountPaidController.text.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Change:',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          CurrencyFormatter.format(
                            (double.tryParse(_amountPaidController.text) ?? 0) -
                                cartProvider.total,
                          ),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 24),
                // Buttons
                Consumer<TransactionProvider>(
                  builder: (context, transactionProvider, _) {
                    return Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.grey,
                            ),
                            child: const Text('Back'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: CustomButton(
                            label: 'Process Payment',
                            isLoading: transactionProvider.isLoading,
                            onPressed: () {
                              _processPayment(
                                context,
                                cartProvider,
                                transactionProvider,
                              );
                            },
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
