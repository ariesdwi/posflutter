import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/api/api_client.dart';
import 'core/widgets/debug_overlay.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/products/providers/product_provider.dart';
import 'features/cart/providers/cart_provider.dart';
import 'features/transactions/providers/transaction_provider.dart';
import 'features/reports/providers/report_provider.dart';
import 'home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  runApp(MyApp(prefs: prefs));
}

class MyApp extends StatelessWidget {
  final SharedPreferences prefs;

  const MyApp({required this.prefs, Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<SharedPreferences>(create: (_) => prefs),
        Provider<ApiClient>(create: (context) => ApiClient(prefs)),
        ChangeNotifierProvider<AuthProvider>(
          create: (context) =>
              AuthProvider(apiClient: context.read<ApiClient>(), prefs: prefs),
        ),
        ChangeNotifierProvider<ProductProvider>(
          create: (context) =>
              ProductProvider(apiClient: context.read<ApiClient>()),
        ),
        ChangeNotifierProvider<CartProvider>(create: (_) => CartProvider()),
        ChangeNotifierProvider<TransactionProvider>(
          create: (context) =>
              TransactionProvider(apiClient: context.read<ApiClient>()),
        ),
        ChangeNotifierProvider<ReportProvider>(
          create: (context) =>
              ReportProvider(apiClient: context.read<ApiClient>()),
        ),
      ],
      child: MaterialApp(
        title: 'POS Flutter',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(primarySwatch: Colors.blue, useMaterial3: true),
        home: DebugOverlay(
          child: Consumer<AuthProvider>(
            builder: (context, authProvider, _) {
              if (authProvider.isAuthenticated) {
                return const HomeScreen();
              }
              return const LoginScreen();
            },
          ),
        ),
      ),
    );
  }
}
