import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';
import '../services/debug_log_service.dart';
import 'dart:developer' as developer;

class ApiClient {
  late Dio _dio;
  final SharedPreferences _prefs;
  final DebugLogService _debugLog = DebugLogService();

  // Getter for testing
  Dio get dio => _dio;

  ApiClient(this._prefs) {
    _initializeDio();
  }

  void _initializeDio() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(
          milliseconds: ApiConstants.connectionTimeout,
        ),
        receiveTimeout: const Duration(
          milliseconds: ApiConstants.receiveTimeout,
        ),
        contentType: Headers.jsonContentType,
        responseType: ResponseType.json,
      ),
    );

    // Add logging interceptor first
    _dio.interceptors.add(_LoggingInterceptor(_debugLog));

    // Add auth interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = _prefs.getString('auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          if (e.response?.statusCode == 401) {
            // Handle token expiration
            developer.log('🔓 Token expired - logging out', name: 'API.ERROR');
            _prefs.remove('auth_token');
          }
          return handler.next(e);
        },
      ),
    );
  }

  Future<Response> get(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.get(
        endpoint,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } on DioException catch (e) {
      rethrow;
    }
  }

  Future<Response> post(
    String endpoint, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.post(
        endpoint,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } on DioException catch (e) {
      rethrow;
    }
  }

  Future<Response> put(
    String endpoint, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.put(
        endpoint,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } on DioException catch (e) {
      rethrow;
    }
  }

  Future<Response> delete(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.delete(
        endpoint,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } on DioException catch (e) {
      rethrow;
    }
  }
}

// HTTP Logging Interceptor
class _LoggingInterceptor extends Interceptor {
  final DebugLogService _debugLog;

  _LoggingInterceptor(this._debugLog);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final fullUrl = options.uri.toString();
    final String logMessage = '🚀 [${options.method}] $fullUrl';
    final String detailsMessage =
        '   Base: ${options.baseUrl} | Endpoint: ${options.path}';
    final String requestBody = '   Request Body: ${options.data ?? "(empty)"}';
    final String headers = '   Headers: ${options.headers}';

    developer.log(logMessage, name: 'API.REQUEST', level: 800);
    developer.log(detailsMessage, name: 'API.REQUEST', level: 800);
    developer.log(requestBody, name: 'API.REQUEST', level: 800);
    developer.log(headers, name: 'API.REQUEST', level: 800);
    _debugLog.addLog(logMessage);
    _debugLog.addLog(detailsMessage);
    _debugLog.addLog(requestBody);

    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final fullUrl = response.requestOptions.uri.toString();
    final String logMessage = '✅ [${response.statusCode}] $fullUrl';
    final String statusMessage =
        '   Status: ${response.statusCode} ${response.statusMessage ?? ""}';
    final String responseBody = '   Response: ${response.data}';

    developer.log(logMessage, name: 'API.RESPONSE', level: 800);
    developer.log(statusMessage, name: 'API.RESPONSE', level: 800);
    developer.log(responseBody, name: 'API.RESPONSE', level: 800);
    _debugLog.addLog(logMessage);
    _debugLog.addLog(statusMessage);
    _debugLog.addLog(responseBody);

    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final fullUrl = err.requestOptions.uri.toString();
    final statusCode = err.response?.statusCode ?? 'N/A';
    final String logMessage = '❌ [ERROR $statusCode] $fullUrl';
    final String errorDetails =
        '   Type: ${err.type.name} | Message: ${err.message}';
    final String urlBreakdown =
        '   Base: ${err.requestOptions.baseUrl} | Endpoint: ${err.requestOptions.path}';
    final String requestBody =
        '   Request Body: ${err.requestOptions.data ?? "(empty)"}';
    final String responseBody = err.response?.data != null
        ? '   Response: ${err.response!.data}'
        : '   Response: (no response)';

    developer.log(logMessage, name: 'API.ERROR', level: 1000);
    developer.log(errorDetails, name: 'API.ERROR', level: 1000);
    developer.log(urlBreakdown, name: 'API.ERROR', level: 1000);
    developer.log(requestBody, name: 'API.ERROR', level: 1000);
    developer.log(responseBody, name: 'API.ERROR', level: 1000);
    _debugLog.addLog(logMessage);
    _debugLog.addLog(errorDetails);
    _debugLog.addLog(urlBreakdown);
    _debugLog.addLog(requestBody);
    _debugLog.addLog(responseBody);

    handler.next(err);
  }
}
