import 'package:flutter/material.dart';
import '../models/network_user.dart';
import '../models/user.dart';
import '../services/network_service.dart';

class NetworkProvider extends ChangeNotifier {
  final NetworkService _networkService = NetworkService();

  NetworkSummary _summary = NetworkSummary();
  List<User> _suggestions = [];
  List<NetworkInvitation> _invitations = [];
  List<NetworkConnection> _connections = [];
  bool _isLoading = false;
  String? _error;

  NetworkSummary get summary => _summary;
  List<User> get suggestions => _suggestions;
  List<NetworkInvitation> get invitations => _invitations;
  List<NetworkConnection> get connections => _connections;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchNetworkData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _networkService.getSummary(),
        _networkService.getSuggestions(),
        _networkService.getInvitations(),
        _networkService.getConnections(),
      ]);

      _summary = results[0] as NetworkSummary;
      _suggestions = results[1] as List<User>;
      _invitations = results[2] as List<NetworkInvitation>;
      _connections = results[3] as List<NetworkConnection>;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> sendConnectRequest(int userId) async {
    try {
      await _networkService.sendConnectRequest(userId);
      _suggestions.removeWhere((u) => u.id == userId);
      notifyListeners();
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> acceptInvitation(int connectionId) async {
    try {
      await _networkService.acceptInvitation(connectionId);
      _invitations.removeWhere((inv) => inv.id == connectionId);
      notifyListeners();
      fetchNetworkData(); // Refresh summary and connections
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> rejectInvitation(int connectionId) async {
    try {
      await _networkService.rejectInvitation(connectionId);
      _invitations.removeWhere((inv) => inv.id == connectionId);
      notifyListeners();
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> removeConnection(int connectionId) async {
    try {
      await _networkService.removeConnection(connectionId);
      _connections.removeWhere((conn) => conn.id == connectionId);
      notifyListeners();
      return true;
    } catch (e) {
      return false;
    }
  }
}
