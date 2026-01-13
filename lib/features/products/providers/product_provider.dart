import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/product.dart';
import '../models/category.dart';

class ProductProvider extends ChangeNotifier {
  final ApiClient _apiClient;

  List<Product> _products = [];
  List<Category> _categories = [];
  bool _isLoading = false;
  String? _error;
  String? _selectedCategoryId;
  String _searchQuery = '';

  List<Product> get products {
    List<Product> filtered = _products;

    // Filter by category
    if (_selectedCategoryId != null && _selectedCategoryId!.isNotEmpty) {
      filtered = filtered
          .where((product) => product.categoryId == _selectedCategoryId)
          .toList();
    }

    // Filter by search query
    if (_searchQuery.isNotEmpty) {
      final lowerQuery = _searchQuery.toLowerCase();
      filtered = filtered
          .where(
            (product) =>
                product.name.toLowerCase().contains(lowerQuery) ||
                (product.description?.toLowerCase().contains(lowerQuery) ??
                    false),
          )
          .toList();
    }

    return filtered;
  }

  List<Category> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get selectedCategoryId => _selectedCategoryId;
  String get searchQuery => _searchQuery;

  ProductProvider({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<void> fetchProducts() async {
    _setLoading(true);
    _error = null;

    try {
      final response = await _apiClient.get(ApiConstants.menuEndpoint);

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final productsList = data['data'] as List<dynamic>?;

        if (productsList != null) {
          _products = productsList
              .map((p) => Product.fromJson(p as Map<String, dynamic>))
              .toList();
        }
      } else {
        _error = 'Failed to fetch products';
      }
    } catch (e) {
      _error = e.toString();
    }

    _setLoading(false);
    notifyListeners();
  }

  Future<void> fetchCategories() async {
    try {
      final response = await _apiClient.get(ApiConstants.categoriesEndpoint);

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final categoriesList = data['data'] as List<dynamic>?;

        if (categoriesList != null) {
          _categories = categoriesList
              .map((c) => Category.fromJson(c as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (e) {
      _error = e.toString();
    }

    notifyListeners();
  }

  void filterByCategory(String categoryId) {
    _selectedCategoryId = categoryId.isEmpty ? null : categoryId;
    notifyListeners();
  }

  void searchProducts(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Product? getProductById(String id) {
    try {
      return _products.firstWhere((product) => product.id == id);
    } catch (e) {
      return null;
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
  }
}
