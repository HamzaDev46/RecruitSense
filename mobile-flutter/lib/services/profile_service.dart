import 'dart:io';
import 'package:dio/dio.dart';
import '../models/job_experience.dart';
import 'api_service.dart';

class ProfileService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> getMyProfile() async {
    try {
      final response = await _apiService.dio.get('/profile');
      if (response.data is Map<String, dynamic>) {
        return response.data;
      }
      return {};
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<Map<String, dynamic>> updateProfile(
    Map<String, dynamic> data, {
    File? profileImage,
    File? coverImage,
  }) async {
    try {
      dynamic postData = data;
      if (profileImage != null || coverImage != null) {
        final map = Map<String, dynamic>.from(data);
        if (profileImage != null) {
          map['profile_image'] = await MultipartFile.fromFile(
            profileImage.path,
            filename: profileImage.path.split(Platform.pathSeparator).last,
          );
        }
        if (coverImage != null) {
          map['cover_image'] = await MultipartFile.fromFile(
            coverImage.path,
            filename: coverImage.path.split(Platform.pathSeparator).last,
          );
        }
        postData = FormData.fromMap(map);
      }

      final response = await _apiService.dio.post('/profile', data: postData);
      if (response.data is Map<String, dynamic>) {
        return response.data;
      }
      return {};
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<JobExperience> addExperience(Map<String, dynamic> data) async {
    try {
      final response = await _apiService.dio.post('/profile/experiences', data: data);
      final raw = response.data['experience'] ?? response.data;
      return JobExperience.fromJson(raw is Map<String, dynamic> ? raw : {});
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<JobExperience> updateExperience(int id, Map<String, dynamic> data) async {
    try {
      final response = await _apiService.dio.put('/profile/experiences/$id', data: data);
      final raw = response.data['experience'] ?? response.data;
      return JobExperience.fromJson(raw is Map<String, dynamic> ? raw : {});
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<void> deleteExperience(int id) async {
    try {
      await _apiService.dio.delete('/profile/experiences/$id');
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<Map<String, dynamic>> getPublicProfile(int userId) async {
    try {
      final response = await _apiService.dio.get('/profiles/$userId');
      if (response.data is Map<String, dynamic>) {
        return response.data;
      }
      return {};
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<List<dynamic>> getUserPosts(int userId) async {
    try {
      final response = await _apiService.dio.get('/profiles/$userId/posts');
      final data = response.data;
      if (data is List) return data;
      if (data['posts'] is List) return data['posts'];
      if (data['data'] is List) return data['data'];
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<dynamic>> getProfileViewers() async {
    try {
      final response = await _apiService.dio.get('/profile/viewers');
      final data = response.data;
      if (data is List) return data;
      if (data['views'] is List) return data['views'];
      if (data['viewers'] is List) return data['viewers'];
      if (data['data'] is List) return data['data'];
      return [];
    } catch (_) {
      return [];
    }
  }
}
