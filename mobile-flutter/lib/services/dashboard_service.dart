import '../models/dashboard_summary.dart';
import 'api_service.dart';

class DashboardService {
  final ApiService _apiService = ApiService();

  Future<JobSeekerDashboardSummary> getJobSeekerDashboard() async {
    try {
      final res = await _apiService.dio.get('/dashboard/jobseeker');
      return JobSeekerDashboardSummary.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<CompanyDashboardSummary> getCompanyDashboard() async {
    try {
      final res = await _apiService.dio.get('/dashboard/company');
      return CompanyDashboardSummary.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<List<dynamic>> getCompanyActivityLog() async {
    try {
      final res = await _apiService.dio.get('/company/activity-log');
      return (res.data as List<dynamic>?) ?? [];
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }
}
