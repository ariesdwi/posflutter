import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/transaction_provider.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/providers/navigation_provider.dart';
import '../../cart/providers/cart_provider.dart';
import 'transaction_detail_screen.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({Key? key}) : super(key: key);

  @override
  State<TransactionHistoryScreen> createState() =>
      _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  bool _todayOnly = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TransactionProvider>().fetchTransactions();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: const Text('Transaction History'),
        centerTitle: true,
        elevation: 0,
        actions: [const SizedBox(width: 8)],
      ),
      body: Column(
        children: [
          // Elegant Filter Section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: AppColors.slate900.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                _buildFilterChip(
                  label: 'Today',
                  selected: _todayOnly,
                  onTap: () => setState(() => _todayOnly = true),
                ),
                const SizedBox(width: 12),
                _buildFilterChip(
                  label: 'All History',
                  selected: !_todayOnly,
                  onTap: () => setState(() => _todayOnly = false),
                ),
              ],
            ),
          ),

          // Transactions List
          Expanded(
            child: Consumer<TransactionProvider>(
              builder: (context, transactionProvider, _) {
                if (transactionProvider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                final transactions = _todayOnly
                    ? transactionProvider.getTodayTransactions()
                    : transactionProvider.transactions;

                // Calculate total (only completed transactions)
                final completedTransactions = transactions
                    .where(
                      (t) =>
                          t.status.toLowerCase() == 'completed' ||
                          t.status.toLowerCase() == 'success',
                    )
                    .toList();

                final totalSales = completedTransactions.fold<double>(
                  0,
                  (sum, t) => sum + t.total,
                );

                if (transactions.isEmpty) {
                  return _buildEmptyState();
                }

                return Column(
                  children: [
                    // Total Summary Card (only for Today filter)
                    if (_todayOnly)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.fromLTRB(24, 0, 24, 16),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.indigo500, Color(0xFF4F46E5)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.indigo500.withOpacity(0.3),
                              blurRadius: 15,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Today\'s Sales',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.8),
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              CurrencyFormatter.format(totalSales),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -1,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.receipt_long_rounded,
                                        color: Colors.white,
                                        size: 14,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        '${completedTransactions.length} Completed',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                    // Transactions List
                    Expanded(
                      child: ListView.separated(
                        padding: EdgeInsets.fromLTRB(
                          24,
                          _todayOnly ? 0 : 24,
                          24,
                          120,
                        ),
                        itemCount: transactions.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 16),
                        itemBuilder: (context, index) {
                          final transaction = transactions[index];
                          return _buildTransactionCard(context, transaction);
                        },
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.indigo500 : AppColors.slate50,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.indigo500 : AppColors.slate200,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: selected ? Colors.white : AppColors.slate500,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.slate900.withOpacity(0.05),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: const Icon(
              Icons.receipt_long_outlined,
              size: 48,
              color: AppColors.slate200,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No transactions found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.slate900,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Sales you complete will appear here.',
            style: TextStyle(color: AppColors.slate500),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionCard(BuildContext context, transaction) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.slate900.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) =>
                    TransactionDetailScreen(transaction: transaction),
              ),
            );
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          transaction.transactionNumber ??
                              'Order #${transaction.id?.toUpperCase().substring(0, 8) ?? 'N/A'}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                            color: AppColors.slate900,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          transaction.createdAt != null
                              ? DateFormatter.formatDateTime(
                                  transaction.createdAt!,
                                )
                              : 'No date',
                          style: const TextStyle(
                            color: AppColors.slate500,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    _StatusBadge(status: transaction.status),
                  ],
                ),
                const Divider(height: 32, thickness: 1),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        _buildMiniInfo(
                          Icons.inventory_2_outlined,
                          '${transaction.items.length}',
                        ),
                        const SizedBox(width: 16),
                        _buildMiniInfo(
                          Icons.payments_outlined,
                          transaction.paymentMethod,
                        ),
                        if (transaction.tableNumber != null) ...[
                          const SizedBox(width: 16),
                          _buildMiniInfo(
                            Icons.table_restaurant_outlined,
                            'T${transaction.tableNumber}',
                          ),
                        ],
                      ],
                    ),
                    if (transaction.status == 'PENDING')
                      TextButton.icon(
                        onPressed: () {
                          // Load items to cart and switch to menu
                          context.read<CartProvider>().loadTransactionItems(
                            transaction.items,
                            transaction.tableNumber,
                          );
                          context.read<NavigationProvider>().setIndex(
                            0,
                          ); // 0 is Menu

                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Items loaded to cart. You can now add more items.',
                              ),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        },
                        icon: const Icon(Icons.playlist_add_rounded, size: 20),
                        label: const Text('Add More'),
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.indigo500,
                          padding: EdgeInsets.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      )
                    else
                      Text(
                        CurrencyFormatter.format(transaction.total),
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          color: AppColors.indigo500,
                          fontSize: 16,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMiniInfo(IconData icon, String value) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.slate500),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.slate500,
          ),
        ),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({Key? key, required this.status}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color color;

    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        color = AppColors.success;
        break;
      case 'pending':
        color = AppColors.warning;
        break;
      case 'cancelled':
      case 'failed':
        color = AppColors.error;
        break;
      default:
        color = AppColors.slate500;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 1,
        ),
      ),
    );
  }
}
