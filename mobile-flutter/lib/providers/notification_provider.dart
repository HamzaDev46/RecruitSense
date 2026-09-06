import 'package:flutter/material.dart';
import '../models/notification_item.dart';
import '../services/notification_service.dart';

class NotificationProvider extends ChangeNotifier {
  final NotificationService _notificationService = NotificationService();

  List<NotificationItem> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  String? _error;

  List<NotificationItem> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchNotifications() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _notificationService.getNotifications(),
        _notificationService.getUnreadCount(),
      ]);

      _notifications = results[0] as List<NotificationItem>;
      _unreadCount = results[1] as int;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAsRead(int notificationId) async {
    final index = _notifications.indexWhere((n) => n.id == notificationId);
    if (index != -1 && !_notifications[index].isRead) {
      try {
        await _notificationService.markRead(notificationId);
        if (_unreadCount > 0) _unreadCount--;
        notifyListeners();
      } catch (_) {}
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _notificationService.markAllRead();
      _unreadCount = 0;
      await fetchNotifications();
    } catch (_) {}
  }

  Future<void> clearAll() async {
    try {
      await _notificationService.clearAll();
      _notifications.clear();
      _unreadCount = 0;
      notifyListeners();
    } catch (_) {}
  }
}
