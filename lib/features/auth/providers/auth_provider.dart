import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_constants.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient;
  final SharedPreferences _prefs;

  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isAuthenticated = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _isAuthenticated;

  AuthProvider({required ApiClient apiClient, required SharedPreferences prefs})
    : _apiClient = apiClient,
      _prefs = prefs {
    _checkAuthStatus();
  }

  void _checkAuthStatus() {
    final token = _prefs.getString(AppConstants.tokenKey);
    _isAuthenticated = token != null;
    _loadUserFromPrefs();
  }

  void _loadUserFromPrefs() {
    final userJson = _prefs.getString(AppConstants.userKey);
    if (userJson != null) {
      try {
        final Map<String, dynamic> userData = jsonDecode(userJson);
        _user = User.fromJson(userData);
      } catch (e) {
        // Handle JSON parsing error
      }
    }
  }

  Future<bool> login({
    required String email,
    required String password,
    bool rememberMe = false,
  }) async {
    _setLoading(true);
    _error = null;

    try {
      final response = await _apiClient.post(
        ApiConstants.loginEndpoint,
        data: {'email': email, 'password': password},
      );

      // Accept both 200 OK and 201 Created
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data as Map<String, dynamic>;
        // Backend returns 'accessToken', not 'token'
        final token =
            data['data']?['accessToken'] as String? ??
            data['data']?['token'] as String?;
        final userData = data['data']?['user'];

        if (token != null && userData != null) {
          // Debug: Print raw JSON
          print('=== RAW USER DATA ===');
          print(jsonEncode(userData));
          print('=====================');

          _user = User.fromJson(userData as Map<String, dynamic>);

          // Debug: Print business data
          print('=== AUTH DEBUG ===');
          print('User: ${_user?.name}');
          print('Business ID: ${_user?.businessId}');
          print('Business Name: ${_user?.business?.name}');
          print('Business Address: ${_user?.business?.address}');
          print('Business Phone: ${_user?.business?.phone}');
          print('==================');

          await _prefs.setString(AppConstants.tokenKey, token);
          await _prefs.setString(AppConstants.userKey, jsonEncode(userData));

          // Fetch full profile to get business data
          try {
            final profileResponse = await _apiClient.get(
              ApiConstants.profileEndpoint,
            );
            if (profileResponse.statusCode == 200) {
              final profileData = profileResponse.data as Map<String, dynamic>;
              final fullUserData = profileData['data']?['user'];

              if (fullUserData != null) {
                _user = User.fromJson(fullUserData as Map<String, dynamic>);
                await _prefs.setString(
                  AppConstants.userKey,
                  jsonEncode(fullUserData),
                );

                print('=== PROFILE FETCHED ===');
                print('Business Name: ${_user?.business?.name}');
                print('Business Address: ${_user?.business?.address}');
                print('Business Phone: ${_user?.business?.phone}');
                print('=======================');
              }
            }
          } catch (e) {
            print('Profile fetch error: $e');
            // Continue anyway with login data
          }

          if (rememberMe) {
            await _prefs.setBool(AppConstants.rememberMeKey, true);
            await _prefs.setString(AppConstants.userEmailKey, email);
          }

          _isAuthenticated = true;
          _setLoading(false);
          notifyListeners();
          return true;
        }
      }

      // Log why login failed
      final data = response.data as Map<String, dynamic>?;
      final token = data?['data']?['token'];
      final userData = data?['data']?['user'];
      _error =
          'Login failed - ${ApiConstants.baseUrl}${ApiConstants.loginEndpoint}\n' +
          'Status: ${response.statusCode}\n' +
          'Token: ${token != null ? "present" : "MISSING"}\n' +
          'User data: ${userData != null ? "present" : "MISSING"}\n' +
          'Response: ${response.data}';
      _setLoading(false);
      notifyListeners();
      return false;
    } catch (e) {
      _error =
          'Error: $e\nEndpoint: ${ApiConstants.baseUrl}${ApiConstants.loginEndpoint}';
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }

  Future<bool> logout() async {
    try {
      await _prefs.remove(AppConstants.tokenKey);
      await _prefs.remove(AppConstants.userKey);
      await _prefs.remove(AppConstants.rememberMeKey);

      _user = null;
      _isAuthenticated = false;
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  bool getRememberMe() {
    return _prefs.getBool(AppConstants.rememberMeKey) ?? false;
  }

  String? getSavedEmail() {
    return _prefs.getString(AppConstants.userEmailKey);
  }

  void _setLoading(bool value) {
    _isLoading = value;
  }
}
