import 'package:flutter/foundation.dart';

class AppConstants {
  // App Info
  static const String appName = 'RecruitSense';
  static const String appTagline = 'AI-Powered Smart Recruitment';
  static const String appVersion = '1.0.0';

  // Base URLs
  // 192.168.100.9 is your PC's Wi-Fi LAN IP (reachable from phone on same Wi-Fi)
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:8000/api';
    }
    return 'http://192.168.100.9:8000/api';
  }

  static String get defaultStorageBaseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:8000/storage';
    }
    return 'http://192.168.100.9:8000/storage';
  }

  // Storage Keys
  static const String keyAuthToken = 'auth_token';
  static const String keyUserData = 'user_data';
  static const String keyCustomBaseUrl = 'custom_base_url';

  // Roles
  static const String roleJobSeeker = 'job_seeker';
  static const String roleCompany = 'company';
  static const String roleAdmin = 'admin';
}
