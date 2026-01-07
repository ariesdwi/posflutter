import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/report_models.dart';

class ReportProvider extends ChangeNotifier {
  final ApiClient _apiClient;

  ReportData? _reportData;
  bool _isLoading = false;
  String? _error;

  ReportData? get reportData => _reportData;
  bool get isLoading => _isLoading;
  String? get error => _error;

  ReportProvider({required ApiClient apiClient}) : _apiClient = apiClient;

  // Helper date formatter: YYYY-MM-DD
  String _formatDate(DateTime date) {
    return "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
  }

  // Helper month formatter: YYYY-MM
  String _formatMonth(DateTime date) {
    return "${date.year}-${date.month.toString().padLeft(2, '0')}";
  }

  List<RevenueByCategoryItem> _revenueByCategory = [];
  List<RevenueByCategoryItem> get revenueByCategory => _revenueByCategory;

  Future<void> fetchDailyReport(DateTime date) async {
    _setLoading(true);
    _error = null;
    _reportData = null;
    _revenueByCategory = [];

    try {
      final dateStr = _formatDate(date);
      final response = await _apiClient.get(
        ApiConstants.reportsDailyEndpoint,
        queryParameters: {'date': dateStr},
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>;
        _reportData = ReportData.fromJson(data);

        // Fetch revenue by category
        if (_reportData != null) {
          await _fetchRevenueByCategory(
            DateTime.parse(_reportData!.period.startDate),
            DateTime.parse(_reportData!.period.endDate),
          );
        }
      } else {
        _error = 'Failed to fetch daily report';
      }
    } catch (e) {
      _error = e.toString();
    }

    _setLoading(false);
    notifyListeners();
  }

  Future<void> fetchWeeklyReport(DateTime startDate) async {
    _setLoading(true);
    _error = null;
    _reportData = null;
    _revenueByCategory = [];

    try {
      final dateStr = _formatDate(startDate);
      final response = await _apiClient.get(
        ApiConstants.reportsWeeklyEndpoint,
        queryParameters: {'startDate': dateStr},
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>;
        _reportData = ReportData.fromJson(data);

        // Fetch revenue by category
        if (_reportData != null) {
          await _fetchRevenueByCategory(
            DateTime.parse(_reportData!.period.startDate),
            DateTime.parse(_reportData!.period.endDate),
          );
        }
      } else {
        _error = 'Failed to fetch weekly report';
      }
    } catch (e) {
      _error = e.toString();
    }

    _setLoading(false);
    notifyListeners();
  }

  Future<void> fetchMonthlyReport(DateTime month) async {
    _setLoading(true);
    _error = null;
    _reportData = null;
    _revenueByCategory = [];

    try {
      final monthStr = _formatMonth(month);
      final response = await _apiClient.get(
        ApiConstants.reportsMonthlyEndpoint,
        queryParameters: {'month': monthStr},
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>;
        _reportData = ReportData.fromJson(data);

        // Fetch revenue by category
        if (_reportData != null) {
          await _fetchRevenueByCategory(
            DateTime.parse(_reportData!.period.startDate),
            DateTime.parse(_reportData!.period.endDate),
          );
        }
      } else {
        _error = 'Failed to fetch monthly report';
      }
    } catch (e) {
      _error = e.toString();
    }

    _setLoading(false);
    notifyListeners();
  }

  Future<void> _fetchRevenueByCategory(
    DateTime startDate,
    DateTime endDate,
  ) async {
    try {
      final response = await _apiClient.get(
        ApiConstants.reportsRevenueByCategoryEndpoint,
        queryParameters: {
          'startDate': _formatDate(startDate),
          'endDate': _formatDate(endDate),
        },
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as List<dynamic>?;
        if (data != null) {
          _revenueByCategory = data
              .map((e) => RevenueByCategoryItem.fromJson(e))
              .toList();
        }
      }
    } catch (e) {
      // Log error but don't fail the whole report
      print('Error fetching revenue by category: $e');
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners(); // Notify immediately on loading change
  }
}
