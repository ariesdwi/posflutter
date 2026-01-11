import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/providers/navigation_provider.dart';
import 'features/products/screens/product_list_screen.dart';
import 'features/transactions/screens/dine_in_screen.dart';
import 'features/transactions/screens/transaction_history_screen.dart';
import 'features/transactions/screens/settings_screen.dart';
import 'core/constants/app_colors.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final List<Widget> _screens = [
    const ProductListScreen(),
    const DineInScreen(),
    const TransactionHistoryScreen(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final selectedIndex = context.watch<NavigationProvider>().selectedIndex;

    return Scaffold(
      backgroundColor: AppColors.slate50,
      extendBody: true, // Crucial for the floating look
      body: Stack(
        children: [
          // Screen Content with index safety
          Positioned.fill(
            child: _screens[selectedIndex.clamp(0, _screens.length - 1)],
          ),

          // Floating "Super Premium" Dock
          Positioned(
            left: 20,
            right: 20,
            bottom: 30,
            child: _buildFloatingDock(context, selectedIndex),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingDock(BuildContext context, int selectedIndex) {
    return Container(
      height: 64,
      decoration: BoxDecoration(
        color: AppColors.slate900,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: AppColors.slate900.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildDockItem(
              context,
              selectedIndex,
              0,
              Icons.restaurant_menu_rounded,
              'Menu',
            ),
            _buildDockItem(
              context,
              selectedIndex,
              1,
              Icons.table_restaurant_rounded,
              'Tables',
            ),
            _buildDockItem(
              context,
              selectedIndex,
              2,
              Icons.history_rounded,
              'History',
            ),
            _buildDockItem(
              context,
              selectedIndex,
              3,
              Icons.settings_rounded,
              'System',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDockItem(
    BuildContext context,
    int selectedIndex,
    int index,
    IconData icon,
    String label,
  ) {
    final isSelected = selectedIndex == index;
    return GestureDetector(
      onTap: () => context.read<NavigationProvider>().setIndex(index),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : Colors.white.withOpacity(0.4),
              size: 22,
            ),
            const SizedBox(height: 4),
            // Minimalist dot indicator
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: isSelected ? 4 : 0,
              height: 4,
              decoration: const BoxDecoration(
                color: AppColors.indigo500,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
