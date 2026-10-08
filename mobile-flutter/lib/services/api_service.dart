import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late Dio _dio;
  String _baseUrl = AppConstants.defaultBaseUrl;

  ApiService._internal() {
    _initDio();
  }

  Dio get dio => _dio;
  String get baseUrl => _baseUrl;

  void _initDio() {
    _dio = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: const Duration(seconds: 60),
        receiveTimeout: const Duration(seconds: 60),
        sendTimeout: const Duration(seconds: 60),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString(AppConstants.keyAuthToken);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          return handler.next(e);
        },
      ),
    );
  }

  Future<void> updateBaseUrl(String newUrl) async {
    _baseUrl = newUrl.endsWith('/api') ? newUrl : (newUrl.endsWith('/') ? '${newUrl}api' : '$newUrl/api');
    _dio.options.baseUrl = _baseUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyCustomBaseUrl, _baseUrl);
  }

  Future<void> loadSavedBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(AppConstants.keyCustomBaseUrl);
    if (saved != null && saved.isNotEmpty) {
      if (saved.contains('127.0.0.1') || saved.contains('192.168.') || saved.contains('10.0.2.2') || saved.contains('localhost')) {
        // Automatically migrate old cached local/LAN IP to 24/7 Render Cloud URL
        _baseUrl = AppConstants.defaultBaseUrl;
        await prefs.setString(AppConstants.keyCustomBaseUrl, _baseUrl);
      } else {
        _baseUrl = saved;
      }
    } else {
      _baseUrl = AppConstants.defaultBaseUrl;
    }
    _dio.options.baseUrl = _baseUrl;
  }

  String handleDioError(dynamic error) {
    if (error is DioException) {
      if (error.response != null) {
        final data = error.response?.data;
        if (data is Map<String, dynamic>) {
          if (data['errors'] != null && data['errors'] is Map) {
            final firstError = (data['errors'] as Map).values.first;
            if (firstError is List && firstError.isNotEmpty) {
              return firstError.first.toString();
            }
            return firstError.toString();
          }
          if (data['message'] != null) {
            return data['message'].toString();
          }
          if (data['error'] != null) {
            return data['error'].toString();
          }
        }
        return 'Server responded with error (${error.response?.statusCode})';
      } else if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout) {
        return 'Server is waking up in cloud. Please try once more.';
      } else if (error.type == DioExceptionType.connectionError) {
        return 'Cannot connect to server at $_baseUrl. Check your internet connection.';
      }
    }
    return error?.toString() ?? 'An unexpected error occurred';
  }
}
