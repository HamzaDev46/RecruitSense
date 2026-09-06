import 'package:flutter/material.dart';
import '../models/resume_insight.dart';
import '../services/resume_coach_service.dart';

class ResumeCoachProvider extends ChangeNotifier {
  final ResumeCoachService _resumeCoachService = ResumeCoachService();

  ResumeInsightData? _insights;
  bool _isLoading = false;
  bool _isUploading = false;
  String? _error;

  ResumeInsightData? get insights => _insights;
  bool get isLoading => _isLoading;
  bool get isUploading => _isUploading;
  String? get error => _error;

  Future<void> fetchInsights() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _insights = await _resumeCoachService.getInsights();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> uploadResume({
    required String filePath,
    required String fileName,
  }) async {
    _isUploading = true;
    _error = null;
    notifyListeners();

    try {
      await _resumeCoachService.uploadResume(filePath: filePath, fileName: fileName);
      await fetchInsights();
      _isUploading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isUploading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteResume() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _resumeCoachService.deleteResume();
      await fetchInsights();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
