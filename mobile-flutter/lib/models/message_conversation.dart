import 'user.dart';

class ChatMessage {
  final int id;
  final int conversationId;
  final int senderId;
  final String body;
  final DateTime? readAt;
  final DateTime? createdAt;
  final User? sender;

  ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.body,
    this.readAt,
    this.createdAt,
    this.sender,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: (json['id'] ?? 0) as int,
      conversationId: (json['conversation_id'] ?? 0) as int,
      senderId: (json['sender_id'] ?? 0) as int,
      body: json['body']?.toString() ?? json['message']?.toString() ?? '',
      readAt: json['read_at'] != null ? DateTime.tryParse(json['read_at'].toString()) : null,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      sender: json['sender'] != null ? User.fromJson(json['sender'] as Map<String, dynamic>) : null,
    );
  }
}

class MessageConversation {
  final int id;
  final User otherUser;
  final ChatMessage? lastMessage;
  final int unreadCount;
  final DateTime? lastMessageAt;

  MessageConversation({
    required this.id,
    required this.otherUser,
    this.lastMessage,
    this.unreadCount = 0,
    this.lastMessageAt,
  });

  factory MessageConversation.fromJson(Map<String, dynamic> json) {
    return MessageConversation(
      id: (json['id'] ?? 0) as int,
      otherUser: json['other_user'] != null
          ? User.fromJson(json['other_user'] as Map<String, dynamic>)
          : (json['participant'] != null
              ? User.fromJson(json['participant'] as Map<String, dynamic>)
              : User(id: 0, name: 'User', email: '', role: 'jobseeker')),
      lastMessage: json['last_message'] != null
          ? (json['last_message'] is Map<String, dynamic>
              ? ChatMessage.fromJson(json['last_message'] as Map<String, dynamic>)
              : null)
          : null,
      unreadCount: (json['unread_count'] ?? 0) as int,
      lastMessageAt: json['last_message_at'] != null
          ? DateTime.tryParse(json['last_message_at'].toString())
          : null,
    );
  }
}
