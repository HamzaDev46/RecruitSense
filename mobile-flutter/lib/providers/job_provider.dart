import 'package:flutter/material.dart';
import '../models/job_posting.dart';
import '../services/job_service.dart';

class JobProvider extends ChangeNotifier {
  final JobService _jobService = JobService();

  List<JobPosting> _jobs = [];
  List<JobPosting> _recommendedJobs = [];
  List<JobPosting> _savedJobs = [];
  List<JobPosting> _myCompanyJobs = [];
  final Set<int> _savedJobIds = {};
  JobPosting? _selectedJob;
  bool _isLoading = false;
  String? _errorMessage;

  String _searchQuery = '';
  String _selectedJobType = 'All';

  List<JobPosting> get jobs => _jobs;
  List<JobPosting> get recommendedJobs => _recommendedJobs;
  List<JobPosting> get savedJobs => _savedJobs;
  Set<int> get savedJobIds => _savedJobIds;
  List<JobPosting> get myCompanyJobs => _myCompanyJobs;
  JobPosting? get selectedJob => _selectedJob;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  String get selectedJobType => _selectedJobType;

  Future<void> fetchJobs({String? search, String? jobType, bool refresh = false}) async {
    if (!refresh && _jobs.isNotEmpty && search == null && jobType == null) return;

    _isLoading = true;
    _errorMessage = null;
    if (search != null) _searchQuery = search;
    if (jobType != null) _selectedJobType = jobType;
    notifyListeners();

    try {
      _jobs = await _jobService.getJobs(
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        jobType: _selectedJobType != 'All' ? _selectedJobType : null,
      );
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchRecommendations() async {
    try {
      _recommendedJobs = await _jobService.getRecommendedJobs();
      notifyListeners();
    } catch (_) {}
  }

  Future<List<JobPosting>> fetchSavedJobs() async {
    try {
      _savedJobs = await _jobService.getSavedJobs();
      _savedJobIds.clear();
      for (var j in _savedJobs) {
        _savedJobIds.add(j.id);
      }
      notifyListeners();
      return _savedJobs;
    } catch (_) {
      return [];
    }
  }

  Future<bool> toggleSaveJob(int jobId, bool currentlySaved) async {
    try {
      final isSaved = await _jobService.toggleSaveJob(jobId, currentlySaved);
      if (isSaved) {
        _savedJobIds.add(jobId);
      } else {
        _savedJobIds.remove(jobId);
        _savedJobs.removeWhere((j) => j.id == jobId);
      }
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> fetchJobDetail(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _selectedJob = await _jobService.getJobDetail(id);
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchCompanyJobs() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _myCompanyJobs = await _jobService.getMyJobs();
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createJob(Map<String, dynamic> data) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final created = await _jobService.createJob(data);
      _myCompanyJobs.insert(0, created);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteJob(int id) async {
    try {
      await _jobService.deleteJob(id);
      _myCompanyJobs.removeWhere((job) => job.id == id);
      _jobs.removeWhere((job) => job.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    fetchJobs(search: query);
  }

  void setJobType(String type) {
    _selectedJobType = type;
    fetchJobs(jobType: type);
  }
}
