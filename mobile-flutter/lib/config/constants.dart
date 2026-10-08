import 'package:flutter/foundation.dart';

class AppConstants {
  // App Info
  static const String appName = 'RecruitSense';
  static const String appTagline = 'AI-Powered Smart Recruitment';
  static const String appVersion = '1.0.0';

  // Base URLs
  // Production Render 24/7 Cloud Backend
  static String get defaultBaseUrl {
    return 'https://recruitsense-gdox.onrender.com/api';
  }

  static String get defaultStorageBaseUrl {
    return 'https://recruitsense-gdox.onrender.com/storage';
  }

  // Storage Keys
  static const String keyAuthToken = 'auth_token';
  static const String keyUserData = 'user_data';
  static const String keyCustomBaseUrl = 'custom_base_url';

  // Roles
  static const String roleJobSeeker = 'job_seeker';
  static const String roleCompany = 'company';
  static const String roleAdmin = 'admin';

  // Google OAuth
  static const String googleClientId = '658382350534-sk01tco3qjc09ra742futf45afck1b62.apps.googleusercontent.com';
  static const String googleAndroidClientId = '658382350534-p4d5bqi4t6ll5eot0adkcvau66sih206.apps.googleusercontent.com';
}
