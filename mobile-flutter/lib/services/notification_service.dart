import '../models/notification_item.dart';
import 'api_service.dart';

class NotificationService {
  final ApiService _apiService = ApiService();

  Future<List<NotificationItem>> getNotifications() async {
    try {
      final res = await _apiService.dio.get('/notifications');
      final data = res.data;
      if (data is List) {
        return data.map((json) => NotificationItem.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final res = await _apiService.dio.get('/notifications/unread-count');
      return (res.data['unread_count'] ?? 0) as int;
    } catch (e) {
      return 0;
    }
  }

  Future<void> markRead(int notificationId) async {
    try {
      await _apiService.dio.post('/notifications/$notificationId/read');
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<void> markAllRead() async {
    try {
      await _apiService.dio.post('/notifications/read-all');
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<void> clearAll() async {
    try {
      await _apiService.dio.delete('/notifications');
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<void> deleteNotification(int notificationId) async {
    try {
      await _apiService.dio.delete('/notifications/$notificationId');
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }
}
