import '../models/job_posting.dart';
import '../models/user.dart';
import 'api_service.dart';

class JobService {
  final ApiService _apiService = ApiService();

  Future<List<JobPosting>> getJobs({
    String? search,
    String? location,
    String? jobType,
    String? experienceLevel,
  }) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (location != null && location.isNotEmpty) queryParams['location'] = location;
      if (jobType != null && jobType.isNotEmpty && jobType != 'All') queryParams['job_type'] = jobType;
      if (experienceLevel != null && experienceLevel.isNotEmpty && experienceLevel != 'All') {
        queryParams['experience_level'] = experienceLevel;
      }

      final response = await _apiService.dio.get('/jobs', queryParameters: queryParams);
      final data = response.data;

      List list = [];
      if (data is List) {
        list = data;
      } else if (data['data'] != null && data['data'] is List) {
        list = data['data'];
      } else if (data['jobs'] != null && data['jobs'] is List) {
        list = data['jobs'];
      }

      return list.map((item) => JobPosting.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<JobPosting> getJobDetail(int id) async {
    try {
      final response = await _apiService.dio.get('/jobs/$id');
      final data = response.data;
      final jobData = (data['job'] ?? data['data'] ?? data) as Map<String, dynamic>;
      return JobPosting.fromJson(jobData);
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<List<JobPosting>> getRecommendedJobs() async {
    try {
      final response = await _apiService.dio.get('/recommended-jobs');
      final data = response.data;

      List list = [];
      if (data is List) {
        list = data;
      } else if (data['data'] != null && data['data'] is List) {
        list = data['data'];
      } else if (data['recommendations'] != null && data['recommendations'] is List) {
        list = data['recommendations'];
      }

      return list.map((item) => JobPosting.fromJson(item as Map<String, dynamic>)).toList();
    } catch (_) {
      return getJobs();
    }
  }

  Future<List<JobPosting>> getSavedJobs() async {
    try {
      final response = await _apiService.dio.get('/saved-jobs');
      final data = response.data;

      List list = [];
      if (data is List) {
        list = data;
      } else if (data['data'] != null && data['data'] is List) {
        list = data['data'];
      } else if (data['saved_jobs'] != null && data['saved_jobs'] is List) {
        list = data['saved_jobs'];
      }

      return list.map((item) {
        final jobMap = (item['job_posting'] ?? item['job'] ?? item) as Map<String, dynamic>;
        return JobPosting.fromJson(jobMap);
      }).toList();
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<bool> toggleSaveJob(int jobId, bool isSaved) async {
    try {
      if (isSaved) {
        await _apiService.dio.delete('/saved-jobs/$jobId');
        return false;
      } else {
        await _apiService.dio.post('/saved-jobs/$jobId');
        return true;
      }
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<List<JobPosting>> getMyJobs() async {
    try {
      final response = await _apiService.dio.get('/my-jobs');
      final data = response.data;

      List list = [];
      if (data is List) {
        list = data;
      } else if (data['data'] != null && data['data'] is List) {
        list = data['data'];
      } else if (data['jobs'] != null && data['jobs'] is List) {
        list = data['jobs'];
      }

      return list.map((item) => JobPosting.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<JobPosting> createJob(Map<String, dynamic> jobData) async {
    try {
      final response = await _apiService.dio.post('/jobs', data: jobData);
      final data = response.data;
      final created = (data['job'] ?? data['data'] ?? data) as Map<String, dynamic>;
      return JobPosting.fromJson(created);
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<void> deleteJob(int id) async {
    try {
      await _apiService.dio.delete('/jobs/$id');
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<List<User>> getCandidates({String? search, String? skill}) async {
    try {
      final Map<String, dynamic> query = {};
      if (search != null && search.isNotEmpty) query['search'] = search;
      if (skill != null && skill.isNotEmpty) query['skill'] = skill;

      final res = await _apiService.dio.get('/company/candidates', queryParameters: query);
      final data = res.data;
      List list = [];
      if (data is List) {
        list = data;
      } else if (data['data'] != null && data['data'] is List) {
        list = data['data'];
      } else if (data['candidates'] != null && data['candidates'] is List) {
        list = data['candidates'];
      }
      return list.map((c) => User.fromJson(c as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }
}
