import 'package:flutter/material.dart';
import '../models/cart_item.dart';
import '../../products/models/product.dart';
import '../../../core/constants/app_constants.dart';

class CartProvider extends ChangeNotifier {
  List<CartItem> _items = [];
  double _discount = 0;
  String? _tableNumber;

  List<CartItem> get items => _items;
  String? get tableNumber => _tableNumber;
  int get itemCount => _items.length;
  double get subtotal => _items.fold(0, (sum, item) => sum + item.subtotal);
  double get discount => _discount;
  double get tax => (subtotal - discount) * (AppConstants.taxRate / 100);
  double get total => (subtotal - discount) + tax;

  void addProduct(Product product, {int quantity = 1}) {
    final existingIndex = _items.indexWhere(
      (item) => item.product.id == product.id,
    );

    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(product: product, quantity: quantity));
    }

    notifyListeners();
  }

  void removeProduct(String productId) {
    _items.removeWhere((item) => item.product.id == productId);
    notifyListeners();
  }

  void updateQuantity(String productId, int quantity) {
    final index = _items.indexWhere((item) => item.product.id == productId);
    if (index >= 0) {
      if (quantity <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = quantity;
      }
      notifyListeners();
    }
  }

  void setDiscount(double discount) {
    _discount = discount;
    notifyListeners();
  }

  void setTableNumber(String? table) {
    _tableNumber = table;
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    _discount = 0;
    _tableNumber = null;
    notifyListeners();
  }

  bool get isEmpty => _items.isEmpty;
  bool get isNotEmpty => _items.isNotEmpty;

  CartItem? getCartItem(String productId) {
    try {
      return _items.firstWhere((item) => item.product.id == productId);
    } catch (e) {
      return null;
    }
  }
}
