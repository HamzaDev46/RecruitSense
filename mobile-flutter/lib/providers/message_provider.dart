import 'package:flutter/material.dart';
import '../models/message_conversation.dart';
import '../services/message_service.dart';

class MessageProvider extends ChangeNotifier {
  final MessageService _messageService = MessageService();

  List<MessageConversation> _conversations = [];
  List<ChatMessage> _activeMessages = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  bool _isSending = false;
  String? _error;

  List<MessageConversation> get conversations => _conversations;
  List<ChatMessage> get activeMessages => _activeMessages;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;
  bool get isSending => _isSending;
  String? get error => _error;

  Future<void> fetchConversations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _conversations = await _messageService.getConversations();
      _unreadCount = await _messageService.getUnreadCount();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchConversationMessages(int conversationId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _activeMessages = await _messageService.getConversationMessages(conversationId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> sendMessage(int conversationId, String body) async {
    if (body.trim().isEmpty) return false;
    _isSending = true;
    notifyListeners();

    try {
      final newMsg = await _messageService.sendMessage(conversationId, body.trim());
      _activeMessages.add(newMsg);
      _isSending = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isSending = false;
      notifyListeners();
      return false;
    }
  }

  Future<MessageConversation?> startConversation(int userId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final conv = await _messageService.startConversation(userId);
      await fetchConversations();
      return conv;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }
}
