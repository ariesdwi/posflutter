import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/report_provider.dart';

import '../../../core/utils/formatters.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({Key? key}) : super(key: key);

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_handleTabSelection);

    // Initial fetch for Daily
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchData();
    });
  }

  void _handleTabSelection() {
    if (_tabController.indexIsChanging) {
      _fetchData();
    }
  }

  void _fetchData() {
    final provider = context.read<ReportProvider>();
    switch (_tabController.index) {
      case 0: // Daily
        provider.fetchDailyReport(_selectedDate);
        break;
      case 1: // Weekly
        // Logic to find start of week (e.g., Monday) could be improved
        // For now, just pass selected date as start date for simplicity or user picks
        provider.fetchWeeklyReport(_selectedDate);
        break;
      case 2: // Monthly
        provider.fetchMonthlyReport(_selectedDate);
        break;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
      _fetchData();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Laporan'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.black,
          unselectedLabelColor: Colors.black54,
          indicatorColor: Colors.black,
          tabs: const [
            Tab(text: 'Harian'),
            Tab(text: 'Mingguan'),
            Tab(text: 'Bulanan'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () => _selectDate(context),
          ),
        ],
      ),
      body: Consumer<ReportProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Kesalahan: ${provider.error}',
                    style: const TextStyle(color: Colors.red),
                  ),
                  ElevatedButton(
                    onPressed: _fetchData,
                    child: const Text('Coba Lagi'),
                  ),
                ],
              ),
            );
          }

          final data = provider.reportData;
          if (data == null) {
            return const Center(child: Text('Tidak ada data tersedia'));
          }

          return RefreshIndicator(
            onRefresh: () async => _fetchData(),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Period Info
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            data.period.type.toUpperCase(),
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${DateFormatter.formatDateTime(DateTime.parse(data.period.startDate))} - ${DateFormatter.formatDateTime(DateTime.parse(data.period.endDate))}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Summary Cards
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio:
                        1.1, // Decreased to prevent overflow (needs more height)
                    children: [
                      _SummaryCard(
                        title: 'Pendapatan',
                        value: CurrencyFormatter.format(
                          data.summary.totalRevenue,
                        ),
                        icon: Icons.attach_money,
                        color: Colors.green,
                      ),
                      _SummaryCard(
                        title: 'Transaksi',
                        value: data.summary.totalTransactions.toString(),
                        icon: Icons.receipt,
                        color: Colors.blue,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Best Sellers
                  Text(
                    'Penjualan Terbaik',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  if (data.bestSellers.isEmpty)
                    const Text('Tidak ada data penjualan')
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: data.bestSellers.length,
                      itemBuilder: (context, index) {
                        final item = data.bestSellers[index];
                        return ListTile(
                          leading: CircleAvatar(child: Text('${index + 1}')),
                          title: Text(item.productName),
                          subtitle: Text('${item.quantitySold} terjual'),
                          trailing: Text(
                            CurrencyFormatter.format(item.revenue),
                          ),
                        );
                      },
                    ),
                  const SizedBox(height: 24),

                  // Revenue by Payment
                  Text(
                    'Rincian Pendapatan',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  ...data.revenueByPaymentMethod.entries.map((entry) {
                    return ListTile(
                      title: Text(entry.key),
                      trailing: Text(CurrencyFormatter.format(entry.value)),
                    );
                  }).toList(),

                  // Revenue by Category
                  if (provider.revenueByCategory.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Text(
                      'Pendapatan per Kategori',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: provider.revenueByCategory.length,
                      itemBuilder: (context, index) {
                        final item = provider.revenueByCategory[index];
                        return ListTile(
                          title: Text(item.category),
                          subtitle: Text('${item.itemsSold} item terjual'),
                          trailing: Text(
                            CurrencyFormatter.format(item.revenue),
                          ),
                        );
                      },
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _SummaryCard({
    Key? key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontSize: 12)),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
