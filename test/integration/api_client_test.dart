import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http_mock_adapter/http_mock_adapter.dart';
import 'package:mockito/mockito.dart';
import 'package:pos_flutter/core/api/api_client.dart';
import 'package:pos_flutter/core/constants/api_constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  late ApiClient apiClient;
  late SharedPreferences mockPrefs;
  late DioAdapter dioAdapter;

  setUp(() async {
    // Mock SharedPreferences
    SharedPreferences.setMockInitialValues({});
    mockPrefs = await SharedPreferences.getInstance();

    // Initialize ApiClient
    apiClient = ApiClient(mockPrefs);

    // Setup DioAdapter for mocking HTTP responses
    dioAdapter = DioAdapter(dio: apiClient.dio);
    apiClient.dio.httpClientAdapter = dioAdapter;
  });

  group('ApiClient Tests', () {
    // Test 1: Successful Login
    test('Login with valid credentials returns 200', () async {
      const endpoint = ApiConstants.loginEndpoint;
      const email = 'test@example.com';
      const password = 'password123';

      final requestData = {'email': email, 'password': password};

      // Mock successful login response
      dioAdapter.onPost(
        endpoint,
        (server) => server.reply(200, {
          'success': true,
          'statusCode': 200,
          'message': 'Login successful',
          'data': {
            'token': 'test_token_12345',
            'user': {
              'id': '1',
              'email': email,
              'name': 'Test User',
              'role': 'KASIR',
              'isActive': true,
            },
          },
          'timestamp': DateTime.now().toIso8601String(),
        }),
        data: requestData,
      );

      final response = await apiClient.post(endpoint, data: requestData);

      expect(response.statusCode, 200);
      expect(response.data['success'], true);
      expect(response.data['data']['token'], 'test_token_12345');
    });

    // Test 2: Login with invalid credentials
    test('Login with invalid credentials returns 401', () async {
      const endpoint = ApiConstants.loginEndpoint;

      final requestData = {
        'email': 'wrong@example.com',
        'password': 'wrongpassword',
      };

      dioAdapter.onPost(
        endpoint,
        (server) => server.reply(401, {
          'success': false,
          'statusCode': 401,
          'message': 'Invalid email or password',
          'data': null,
          'timestamp': DateTime.now().toIso8601String(),
        }),
        data: requestData,
      );

      try {
        await apiClient.post(endpoint, data: requestData);
      } catch (e) {
        expect(e, isA<DioException>());
      }
    });

    // Test 3: Get Products List
    test('Fetch products returns 200 with products list', () async {
      const endpoint = ApiConstants.menuEndpoint;

      dioAdapter.onGet(
        endpoint,
        (server) => server.reply(200, {
          'success': true,
          'statusCode': 200,
          'message': 'Products fetched successfully',
          'data': [
            {
              'id': '1',
              'name': 'Coffee',
              'description': 'Hot coffee',
              'price': 25000,
              'stock': 50,
              'image': null,
              'categoryId': 'cat1',
            },
            {
              'id': '2',
              'name': 'Tea',
              'description': 'Hot tea',
              'price': 15000,
              'stock': 30,
              'image': null,
              'categoryId': 'cat1',
            },
          ],
          'timestamp': DateTime.now().toIso8601String(),
        }),
      );

      final response = await apiClient.get(endpoint);

      expect(response.statusCode, 200);
      expect(response.data['success'], true);
      expect(response.data['data'], isA<List>());
      expect(response.data['data'].length, 2);
    });

    // Test 4: Create Transaction
    test('Create transaction returns 200', () async {
      const endpoint = ApiConstants.transactionsEndpoint;

      final requestData = {
        'items': [
          {'productId': '1', 'quantity': 2},
        ],
        'paymentMethod': 'CASH',
        'amountPaid': 60000,
      };

      dioAdapter.onPost(
        endpoint,
        (server) => server.reply(200, {
          'success': true,
          'statusCode': 200,
          'message': 'Transaction created successfully',
          'data': {
            'id': 'TRX123',
            'items': [
              {
                'productId': '1',
                'quantity': 2,
                'price': 25000,
                'subtotal': 50000,
              },
            ],
            'subtotal': 50000,
            'discount': 0,
            'tax': 5000,
            'total': 55000,
            'paymentMethod': 'CASH',
            'amountPaid': 60000,
            'change': 5000,
            'status': 'COMPLETED',
          },
          'timestamp': DateTime.now().toIso8601String(),
        }),
        data: requestData,
      );

      final response = await apiClient.post(endpoint, data: requestData);

      expect(response.statusCode, 200);
      expect(response.data['data']['id'], 'TRX123');
      expect(response.data['data']['total'], 55000);
    });

    // Test 5: Network Error Handling
    test('Network error is handled properly', () async {
      const endpoint = ApiConstants.menuEndpoint;

      dioAdapter.onGet(
        endpoint,
        (server) => server.throws(
          408,
          DioException(
            requestOptions: RequestOptions(path: endpoint),
            error: 'Network error',
            type: DioExceptionType.connectionTimeout,
          ),
        ),
      );

      expect(() => apiClient.get(endpoint), throwsA(isA<DioException>()));
    });

    // Test 6: 404 Not Found Error
    test('404 error is handled properly', () async {
      const endpoint = '/invalid-endpoint';

      dioAdapter.onGet(
        endpoint,
        (server) => server.reply(404, {
          'success': false,
          'statusCode': 404,
          'message': 'Endpoint not found',
          'data': null,
          'timestamp': DateTime.now().toIso8601String(),
        }),
      );

      expect(() => apiClient.get(endpoint), throwsA(isA<DioException>()));
    });

    // Test 7: 500 Server Error
    test('500 server error is handled properly', () async {
      const endpoint = ApiConstants.menuEndpoint;

      dioAdapter.onGet(
        endpoint,
        (server) => server.reply(500, {
          'success': false,
          'statusCode': 500,
          'message': 'Internal server error',
          'data': null,
          'timestamp': DateTime.now().toIso8601String(),
        }),
      );

      expect(() => apiClient.get(endpoint), throwsA(isA<DioException>()));
    });

    // Test 8: GET with query parameters
    test('GET request with query parameters', () async {
      const endpoint = ApiConstants.categoriesEndpoint;

      dioAdapter.onGet(
        endpoint,
        (server) => server.reply(200, {
          'success': true,
          'statusCode': 200,
          'message': 'Categories fetched',
          'data': [
            {'id': 'cat1', 'name': 'Beverages'},
            {'id': 'cat2', 'name': 'Food'},
          ],
          'timestamp': DateTime.now().toIso8601String(),
        }),
      );

      final response = await apiClient.get(
        endpoint,
        queryParameters: {'limit': '10', 'offset': '0'},
      );

      expect(response.statusCode, 200);
      expect(response.data['data'], isA<List>());
    });
  });
}
