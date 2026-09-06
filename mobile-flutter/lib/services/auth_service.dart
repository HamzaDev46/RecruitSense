import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiService.dio.post('/login', data: {
        'email': email,
        'password': password,
      });

      final data = response.data;
      final token = data['token'] ?? data['access_token'] ?? '';
      final userJson = data['user'] ?? data['data'] ?? {};
      final user = User.fromJson(userJson);

      await saveSession(token, user);

      return {
        'success': true,
        'token': token,
        'user': user,
        'message': data['message'] ?? 'Login successful',
      };
    } catch (e) {
      return {
        'success': false,
        'error': _apiService.handleDioError(e),
      };
    }
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String role, // 'jobseeker' or 'company'
    // Job Seeker optional fields
    String? phone,
    // Company profile fields
    String? companyName,
    String? industry,
    String? location,
    String? website,
    String? companySize,
    String? contactEmail,
  }) async {
    try {
      final Map<String, dynamic> body = {
        'name': name,
        'email': email,
        'password': password,
        'password_confirmation': password,
        'role': role,
      };

      if (phone != null && phone.isNotEmpty) {
        body['phone'] = phone;
      }

      if (role == 'company') {
        body['company_name'] = companyName ?? name;
        if (industry != null && industry.isNotEmpty) body['industry'] = industry;
        if (location != null && location.isNotEmpty) body['location'] = location;
        if (website != null && website.isNotEmpty) body['website'] = website;
        if (companySize != null && companySize.isNotEmpty) body['company_size'] = companySize;
        if (contactEmail != null && contactEmail.isNotEmpty) body['contact_email'] = contactEmail;
      }

      final response = await _apiService.dio.post('/register', data: body);
      final data = response.data;

      // Note: If registration requires email verification, token might not be returned immediately
      User? user;
      String? token = data['token'] ?? data['access_token'];

      if (data['user'] != null) {
        user = User.fromJson(data['user']);
        if (token != null && token.isNotEmpty) {
          await saveSession(token, user);
        }
      }

      return {
        'success': true,
        'token': token,
        'user': user,
        'message': data['message'] ?? 'Registration successful',
        'requiresVerification': data['token'] == null,
      };
    } catch (e) {
      return {
        'success': false,
        'error': _apiService.handleDioError(e),
      };
    }
  }

  Future<User?> getMe() async {
    try {
      final response = await _apiService.dio.get('/me');
      final data = response.data;
      final userJson = data['user'] ?? data;
      final user = User.fromJson(userJson);
      
      // Update local cache
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.keyUserData, jsonEncode(user.toJson()));
      
      return user;
    } catch (e) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _apiService.dio.post('/logout');
    } catch (_) {}
    await clearSession();
  }

  Future<void> saveSession(String token, User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyAuthToken, token);
    await prefs.setString(AppConstants.keyUserData, jsonEncode(user.toJson()));
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.keyAuthToken);
    await prefs.remove(AppConstants.keyUserData);
  }

  Future<String?> getCachedToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConstants.keyAuthToken);
  }

  Future<User?> getCachedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(AppConstants.keyUserData);
    if (jsonStr != null && jsonStr.isNotEmpty) {
      try {
        return User.fromJson(jsonDecode(jsonStr));
      } catch (_) {}
    }
    return null;
  }
}
