import 'package:flutter/material.dart';
import '../models/dashboard_summary.dart';
import '../services/dashboard_service.dart';

class DashboardProvider extends ChangeNotifier {
  final DashboardService _dashboardService = DashboardService();

  JobSeekerDashboardSummary? _jobSeekerSummary;
  CompanyDashboardSummary? _companySummary;
  bool _isLoading = false;
  String? _error;

  JobSeekerDashboardSummary? get jobSeekerSummary => _jobSeekerSummary;
  CompanyDashboardSummary? get companySummary => _companySummary;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchJobSeekerDashboard() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _jobSeekerSummary = await _dashboardService.getJobSeekerDashboard();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchCompanyDashboard() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _companySummary = await _dashboardService.getCompanyDashboard();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
