import 'dart:io';
import 'package:dio/dio.dart';
import '../models/application.dart';
import 'api_service.dart';

class ApplicationService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> uploadResume(File resumeFile) async {
    try {
      final fileName = resumeFile.path.split(Platform.pathSeparator).last;
      final formData = FormData.fromMap({
        'resume': await MultipartFile.fromFile(
          resumeFile.path,
          filename: fileName,
        ),
      });

      final response = await _apiService.dio.post('/resume/upload', data: formData);
      return {
        'success': true,
        'data': response.data,
      };
    } catch (e) {
      return {
        'success': false,
        'error': _apiService.handleDioError(e),
      };
    }
  }

  Future<Map<String, dynamic>?> getMyResume() async {
    try {
      final response = await _apiService.dio.get('/my-resume');
      return response.data is Map<String, dynamic> ? response.data : null;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>> applyToJob({
    required int jobId,
    File? newResumeFile,
    String? coverLetter,
  }) async {
    try {
      if (newResumeFile != null) {
        final uploadResult = await uploadResume(newResumeFile);
        if (!uploadResult['success']) {
          return uploadResult;
        }
      }

      final response = await _apiService.dio.post(
        '/jobs/$jobId/apply',
        data: {
          if (coverLetter != null && coverLetter.isNotEmpty) 'cover_letter': coverLetter,
        },
      );

      final data = response.data;
      Application? app;
      if (data['application'] != null) {
        app = Application.fromJson(data['application']);
      }

      return {
        'success': true,
        'application': app,
        'message': data['message'] ?? 'Application submitted successfully',
      };
    } catch (e) {
      return {
        'success': false,
        'error': _apiService.handleDioError(e),
      };
    }
  }

  Future<List<Application>> getMyApplications() async {
    try {
      final response = await _apiService.dio.get('/my-applications');
      final data = response.data;

      List list = [];
      if (data is List) {
        list = data;
      } else if (data['data'] != null && data['data'] is List) {
        list = data['data'];
      } else if (data['applications'] != null && data['applications'] is List) {
        list = data['applications'];
      }

      return list.map((item) => Application.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<List<Application>> getCompanyApplicants({int? jobId}) async {
    try {
      final url = jobId != null ? '/jobs/$jobId/applicants' : '/company/applicants';
      final response = await _apiService.dio.get(url);
      final data = response.data;

      List list = [];
      if (data is List) {
        list = data;
      } else if (data['data'] != null && data['data'] is List) {
        list = data['data'];
      } else if (data['applicants'] != null && data['applicants'] is List) {
        list = data['applicants'];
      } else if (data['applications'] != null && data['applications'] is List) {
        list = data['applications'];
      }

      return list.map((item) => Application.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<void> updateApplicationStatus(int applicationId, String status) async {
    try {
      await _apiService.dio.put(
        '/applications/$applicationId/status',
        data: {'status': status},
      );
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<void> scheduleInterview({
    required int applicationId,
    required String interviewDate,
    required String interviewTime,
    String interviewType = 'online',
    String? interviewLocation,
    String? interviewNotes,
  }) async {
    try {
      await _apiService.dio.post(
        '/applications/$applicationId/interview',
        data: {
          'interview_date': interviewDate,
          'interview_time': interviewTime,
          'interview_type': interviewType,
          if (interviewLocation != null) 'interview_location': interviewLocation,
          if (interviewNotes != null) 'interview_notes': interviewNotes,
        },
      );
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<void> withdrawApplication(int applicationId) async {
    try {
      await _apiService.dio.post('/applications/$applicationId/withdraw');
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }
}
