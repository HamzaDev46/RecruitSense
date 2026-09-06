import 'package:dio/dio.dart';
import '../models/resume_insight.dart';
import 'api_service.dart';

class ResumeCoachService {
  final ApiService _apiService = ApiService();

  Future<ResumeInsightData> getInsights() async {
    try {
      final res = await _apiService.dio.get('/resume-insights');
      return ResumeInsightData.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> uploadResume({
    required String filePath,
    required String fileName,
  }) async {
    try {
      final formData = FormData.fromMap({
        'resume': await MultipartFile.fromFile(filePath, filename: fileName),
      });

      final res = await _apiService.dio.post(
        '/resume/upload',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      return res.data as Map<String, dynamic>;
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<void> deleteResume() async {
    try {
      await _apiService.dio.delete('/resume');
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }
}
