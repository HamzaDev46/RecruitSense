import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  User? _user;
  String? _token;
  bool _isLoading = true;
  String? _errorMessage;

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty && _user != null;
  String? get errorMessage => _errorMessage;

  bool get isJobSeeker => _user?.isJobSeeker ?? false;
  bool get isCompany => _user?.isCompany ?? false;
  bool get isAdmin => _user?.isAdmin ?? false;

  AuthProvider() {
    checkSession();
  }

  Future<void> checkSession() async {
    _isLoading = true;
    notifyListeners();

    try {
      _token = await _authService.getCachedToken();
      _user = await _authService.getCachedUser();

      if (_token != null && _token!.isNotEmpty) {
        // Fetch fresh profile in background
        final freshUser = await _authService.getMe();
        if (freshUser != null) {
          _user = freshUser;
        }
      }
    } catch (_) {
      // Keep cached session if offline
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _authService.login(email, password);

    _isLoading = false;
    if (result['success'] == true) {
      _token = result['token'];
      _user = result['user'];
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['error'];
      notifyListeners();
      return false;
    }
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? phone,
    String? companyName,
    String? industry,
    String? location,
    String? website,
    String? companySize,
    String? contactEmail,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _authService.register(
      name: name,
      email: email,
      password: password,
      role: role,
      phone: phone,
      companyName: companyName,
      industry: industry,
      location: location,
      website: website,
      companySize: companySize,
      contactEmail: contactEmail,
    );

    _isLoading = false;
    if (result['success'] == true) {
      if (result['token'] != null) {
        _token = result['token'];
        _user = result['user'];
      }
      notifyListeners();
      return result;
    } else {
      _errorMessage = result['error'];
      notifyListeners();
      return result;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await _authService.logout();
    _token = null;
    _user = null;
    _isLoading = false;
    notifyListeners();
  }

  Future<void> refreshProfile() async {
    if (_token == null) return;
    final freshUser = await _authService.getMe();
    if (freshUser != null) {
      _user = freshUser;
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
