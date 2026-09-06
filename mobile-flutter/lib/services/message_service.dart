import '../models/message_conversation.dart';
import 'api_service.dart';

class MessageService {
  final ApiService _apiService = ApiService();

  Future<List<MessageConversation>> getConversations() async {
    try {
      final res = await _apiService.dio.get('/messages/conversations');
      final data = res.data;
      if (data is List) {
        return data.map((json) => MessageConversation.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final res = await _apiService.dio.get('/messages/unread-count');
      return (res.data['unread_count'] ?? 0) as int;
    } catch (e) {
      return 0;
    }
  }

  Future<MessageConversation> startConversation(int userId) async {
    try {
      final res = await _apiService.dio.post('/messages/start/$userId');
      final data = res.data['conversation'] ?? res.data;
      return MessageConversation.fromJson(data as Map<String, dynamic>);
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<List<ChatMessage>> getConversationMessages(int conversationId) async {
    try {
      final res = await _apiService.dio.get('/messages/conversations/$conversationId');
      final data = res.data;
      if (data is Map && data['messages'] is List) {
        return (data['messages'] as List)
            .map((json) => ChatMessage.fromJson(json as Map<String, dynamic>))
            .toList();
      } else if (data is List) {
        return data.map((json) => ChatMessage.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<ChatMessage> sendMessage(int conversationId, String body) async {
    try {
      final res = await _apiService.dio.post(
        '/messages/conversations/$conversationId',
        data: {'body': body},
      );
      final msgData = res.data['message'] ?? res.data;
      return ChatMessage.fromJson(msgData as Map<String, dynamic>);
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }
}
