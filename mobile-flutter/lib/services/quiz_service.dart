import '../models/quiz_question.dart';
import 'api_service.dart';

class QuizService {
  final ApiService _apiService = ApiService();

  Future<List<QuizQuestion>> getQuestionsForCompany(int companyId) async {
    try {
      final response = await _apiService.dio.get('/companies/$companyId/quiz-questions');
      final data = response.data;

      List list = [];
      if (data is List) {
        list = data;
      } else if (data['questions'] != null && data['questions'] is List) {
        list = data['questions'];
      }

      return list.map((item) => QuizQuestion.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<Map<String, dynamic>> submitQuizAnswers({
    required int applicationId,
    required List<Map<String, dynamic>> answers,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/applications/$applicationId/submit-quiz',
        data: {'answers': answers},
      );

      return {
        'success': true,
        'data': response.data,
        'message': response.data['message'] ?? 'Quiz submitted successfully',
      };
    } catch (e) {
      return {
        'success': false,
        'error': _apiService.handleDioError(e),
      };
    }
  }

  Future<List<QuizQuestion>> getMyQuestions() async {
    try {
      final response = await _apiService.dio.get('/my-quiz-questions');
      final data = response.data;

      List list = [];
      if (data is List) {
        list = data;
      } else if (data['questions'] != null && data['questions'] is List) {
        list = data['questions'];
      }

      return list.map((item) => QuizQuestion.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<List<QuizQuestion>> generateQuestions({
    required String category,
    int count = 5,
    String? jobTitle,
    String? requiredSkills,
  }) async {
    try {
      final response = await _apiService.dio.post('/quiz-questions/generate', data: {
        'category': category,
        'count': count,
        if (jobTitle != null) 'job_title': jobTitle,
        if (requiredSkills != null) 'required_skills': requiredSkills,
      });

      final data = response.data;
      List list = [];
      if (data is List) {
        list = data;
      } else if (data['questions'] != null && data['questions'] is List) {
        list = data['questions'];
      } else if (data['data'] != null && data['data'] is List) {
        list = data['data'];
      }

      return list.map((item) => QuizQuestion.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }

  Future<void> deleteQuestion(int id) async {
    try {
      await _apiService.dio.delete('/quiz-questions/$id');
    } catch (e) {
      throw Exception(_apiService.handleDioError(e));
    }
  }
}
