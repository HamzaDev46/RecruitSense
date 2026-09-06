import 'user.dart';

class NotificationItem {
  final int id;
  final String type;
  final String title;
  final String message;
  final Map<String, dynamic>? data;
  final DateTime? readAt;
  final DateTime? createdAt;
  final User? actor;

  NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.data,
    this.readAt,
    this.createdAt,
    this.actor,
  });

  bool get isRead => readAt != null;

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: (json['id'] ?? 0) as int,
      type: json['type']?.toString() ?? 'general',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      data: json['data'] as Map<String, dynamic>?,
      readAt: json['read_at'] != null ? DateTime.tryParse(json['read_at'].toString()) : null,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      actor: json['actor'] != null ? User.fromJson(json['actor'] as Map<String, dynamic>) : null,
    );
  }
}
