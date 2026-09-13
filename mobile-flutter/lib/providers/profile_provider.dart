import 'dart:io';
import 'package:flutter/material.dart';
import '../models/job_experience.dart';
import '../services/profile_service.dart';

class ProfileProvider extends ChangeNotifier {
  final ProfileService _profileService = ProfileService();

  Map<String, dynamic>? _profileData;
  List<JobExperience> _experiences = [];
  List<dynamic> _viewers = [];
  bool _isLoading = false;
  bool _isSaving = false;
  String? _error;

  Map<String, dynamic>? get profileData => _profileData;
  List<JobExperience> get experiences => _experiences;
  List<dynamic> get viewers => _viewers;
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String? get error => _error;

  String get headline => _profileData?['headline'] ?? _profileData?['job_seeker']?['headline'] ?? '';
  String get about => _profileData?['about'] ?? _profileData?['job_seeker']?['about'] ?? '';
  String get location => _profileData?['location'] ?? _profileData?['job_seeker']?['location'] ?? '';
  String get phone => _profileData?['phone'] ?? _profileData?['job_seeker']?['phone'] ?? '';
  String get website => _profileData?['website'] ?? _profileData?['job_seeker']?['website'] ?? '';
  String get education => _profileData?['education'] ?? _profileData?['job_seeker']?['education'] ?? '';
  int get viewersCount => (_profileData?['viewers_count'] ?? _profileData?['stats']?['views_count'] ?? _viewers.length) as int? ?? 0;

  Future<void> fetchProfile({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    }

    try {
      final res = await _profileService.getMyProfile();
      _profileData = res;

      // Extract experiences
      List expList = [];
      if (res['experiences'] is List) {
        expList = res['experiences'];
      } else if (res['job_seeker'] != null && res['job_seeker']['experiences'] is List) {
        expList = res['job_seeker']['experiences'];
      }
      _experiences = expList.map((e) => JobExperience.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      if (!silent) {
        _isLoading = false;
      }
      notifyListeners();
    }
  }

  Future<bool> updateProfile(
    Map<String, dynamic> data, {
    File? profileImage,
    File? coverImage,
  }) async {
    _isSaving = true;
    _error = null;
    notifyListeners();

    try {
      final updated = await _profileService.updateProfile(
        data,
        profileImage: profileImage,
        coverImage: coverImage,
      );
      _profileData = updated;
      _isSaving = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isSaving = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> addExperience(Map<String, dynamic> data) async {
    _isSaving = true;
    _error = null;
    notifyListeners();

    try {
      final exp = await _profileService.addExperience(data);
      _experiences.insert(0, exp);
      _isSaving = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isSaving = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateExperience(int id, Map<String, dynamic> data) async {
    _isSaving = true;
    _error = null;
    notifyListeners();

    try {
      final updated = await _profileService.updateExperience(id, data);
      final idx = _experiences.indexWhere((e) => e.id == id);
      if (idx != -1) {
        _experiences[idx] = updated;
      }
      _isSaving = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isSaving = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteExperience(int id) async {
    try {
      await _profileService.deleteExperience(id);
      _experiences.removeWhere((e) => e.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchViewers() async {
    try {
      _viewers = await _profileService.getProfileViewers();
      notifyListeners();
    } catch (_) {}
  }
}
