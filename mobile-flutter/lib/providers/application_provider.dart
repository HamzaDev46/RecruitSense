import 'dart:io';
import 'package:flutter/material.dart';
import '../models/application.dart';
import '../services/application_service.dart';

class ApplicationProvider extends ChangeNotifier {
  final ApplicationService _applicationService = ApplicationService();

  List<Application> _myApplications = [];
  List<Application> _companyApplicants = [];
  bool _isLoading = false;
  bool _isApplying = false;
  String? _errorMessage;

  List<Application> get myApplications => _myApplications;
  List<Application> get companyApplicants => _companyApplicants;
  bool get isLoading => _isLoading;
  bool get isApplying => _isApplying;
  String? get errorMessage => _errorMessage;

  Future<void> fetchMyApplications({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      _myApplications = await _applicationService.getMyApplications();
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    } finally {
      if (!silent) {
        _isLoading = false;
        notifyListeners();
      } else {
        notifyListeners();
      }
    }
  }

  Future<void> fetchCompanyApplicants({int? jobId}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _companyApplicants = await _applicationService.getCompanyApplicants(jobId: jobId);
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> applyToJob({
    required int jobId,
    File? resumeFile,
    String? coverLetter,
  }) async {
    _isApplying = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _applicationService.applyToJob(
      jobId: jobId,
      newResumeFile: resumeFile,
      coverLetter: coverLetter,
    );

    _isApplying = false;
    if (result['success'] == true) {
      if (result['application'] != null) {
        _myApplications.insert(0, result['application']);
      }
      notifyListeners();
      return result;
    } else {
      _errorMessage = result['error'];
      notifyListeners();
      return result;
    }
  }

  Future<bool> updateStatus(int applicationId, String newStatus) async {
    try {
      await _applicationService.updateApplicationStatus(applicationId, newStatus);
      final index = _companyApplicants.indexWhere((a) => a.id == applicationId);
      if (index != -1) {
        final current = _companyApplicants[index];
        _companyApplicants[index] = Application(
          id: current.id,
          jobPostingId: current.jobPostingId,
          jobSeekerId: current.jobSeekerId,
          resumePath: current.resumePath,
          resumeScore: current.resumeScore,
          quizScore: current.quizScore,
          totalScore: current.totalScore,
          status: newStatus,
          createdAt: current.createdAt,
          job: current.job,
          candidate: current.candidate,
          notes: current.notes,
        );
        notifyListeners();
      }
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> scheduleInterview({
    required int applicationId,
    required String interviewDate,
    required String interviewTime,
    String interviewType = 'online',
    String? interviewLocation,
    String? interviewNotes,
  }) async {
    try {
      await _applicationService.scheduleInterview(
        applicationId: applicationId,
        interviewDate: interviewDate,
        interviewTime: interviewTime,
        interviewType: interviewType,
        interviewLocation: interviewLocation,
        interviewNotes: interviewNotes,
      );
      await fetchCompanyApplicants();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> withdrawApplication(int applicationId) async {
    try {
      await _applicationService.withdrawApplication(applicationId);
      _myApplications.removeWhere((a) => a.id == applicationId);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return false;
    }
  }
}
