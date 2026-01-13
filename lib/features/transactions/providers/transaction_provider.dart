import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/transaction.dart';

class TransactionProvider extends ChangeNotifier {
  final ApiClient _apiClient;

  List<Transaction> _transactions = [];
  bool _isLoading = false;
  String? _error;

  List<Transaction> get transactions => _transactions;
  bool get isLoading => _isLoading;
  String? get error => _error;

  TransactionProvider({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<bool> createTransaction(Transaction transaction) async {
    _setLoading(true);
    _error = null;

    try {
      final response = await _apiClient.post(
        ApiConstants.transactionsEndpoint,
        data: transaction.toJson(),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true) {
          // If it was a pending transaction, refresh the list
          if (transaction.status == 'PENDING') {
            await fetchTransactions();
          }
          _setLoading(false);
          notifyListeners();
          return true;
        }
      }

      _error = 'Failed to create transaction';
      _setLoading(false);
      return false;
    } catch (e) {
      _error = e.toString();
      _setLoading(false);
      return false;
    }
  }

  Future<void> fetchTransactions({String? status, String? tableNumber}) async {
    _setLoading(true);
    _error = null;

    try {
      final Map<String, dynamic> queryParameters = {};
      if (status != null) queryParameters['status'] = status;
      if (tableNumber != null) queryParameters['tableNumber'] = tableNumber;

      final response = await _apiClient.get(
        ApiConstants.transactionsEndpoint,
        queryParameters: queryParameters,
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final transactionsList = data['data'] as List<dynamic>?;

        if (transactionsList != null) {
          _transactions = transactionsList
              .map((t) => Transaction.fromJson(t as Map<String, dynamic>))
              .toList();
          // Sort by created date descending
          _transactions.sort(
            (a, b) => (b.createdAt ?? DateTime.now()).compareTo(
              a.createdAt ?? DateTime.now(),
            ),
          );
        }
      } else {
        _error = 'Failed to fetch transactions';
      }
    } catch (e) {
      _error = e.toString();
    }

    _setLoading(false);
    notifyListeners();
  }

  List<Transaction> getTodayTransactions() {
    final today = DateTime.now();
    return _transactions.where((transaction) {
      final transactionDate = transaction.createdAt;
      return transactionDate != null &&
          transactionDate.year == today.year &&
          transactionDate.month == today.month &&
          transactionDate.day == today.day;
    }).toList();
  }

  Transaction? getTransactionById(String id) {
    try {
      return _transactions.firstWhere((transaction) => transaction.id == id);
    } catch (e) {
      return null;
    }
  }

  Future<bool> checkoutTransaction(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    _error = null;

    try {
      final response = await _apiClient.post(
        '${ApiConstants.transactionsEndpoint}/$id/checkout',
        data: data,
      );

      // Accept both 200 and 201 status codes (API returns 201 for created)
      if (response.statusCode == 200 || response.statusCode == 201) {
        final respData = response.data as Map<String, dynamic>;
        if (respData['success'] == true) {
          await fetchTransactions();
          _setLoading(false);
          return true;
        }
      }

      _error = 'Failed to checkout transaction';
      _setLoading(false);
      return false;
    } catch (e) {
      _error = e.toString();
      _setLoading(false);
      return false;
    }
  }

  Future<bool> updateTransaction(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    _error = null;

    try {
      final response = await _apiClient.patch(
        '${ApiConstants.transactionsEndpoint}/$id',
        data: data,
      );

      if (response.statusCode == 200) {
        final respData = response.data as Map<String, dynamic>;
        if (respData['success'] == true) {
          await fetchTransactions();
          _setLoading(false);
          return true;
        }
      }

      _error = 'Failed to update transaction';
      _setLoading(false);
      return false;
    } catch (e) {
      _error = e.toString();
      _setLoading(false);
      return false;
    }
  }

  Future<bool> updateStatus(String id, String status) async {
    _setLoading(true);
    _error = null;

    try {
      final response = await _apiClient.patch(
        '${ApiConstants.transactionsEndpoint}/$id/status',
        data: {'status': status},
      );

      if (response.statusCode == 200) {
        final respData = response.data as Map<String, dynamic>;
        if (respData['success'] == true) {
          await fetchTransactions();
          _setLoading(false);
          return true;
        }
      }

      _error = 'Failed to update status';
      _setLoading(false);
      return false;
    } catch (e) {
      _error = e.toString();
      _setLoading(false);
      return false;
    }
  }

  Future<String?> getReceiptPdf(String transactionId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.receiptsEndpoint}/$transactionId/thermal',
      );

      if (response.statusCode == 200) {
        return response.data as String?;
      }
      return null;
    } catch (e) {
      _error = e.toString();
      return null;
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
  }
}
