import '../models/network_user.dart';
import '../models/user.dart';
import 'api_service.dart';

class NetworkService {
  final ApiService _apiService = ApiService();

  Future<NetworkSummary> getSummary() async {
    try {
      final res = await _apiService.dio.get('/network/summary');
      return NetworkSummary.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<List<User>> getSuggestions() async {
    try {
      final res = await _apiService.dio.get('/network/suggestions');
      final data = res.data;
      if (data is List) {
        return data.map((json) => User.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<List<NetworkInvitation>> getInvitations() async {
    try {
      final res = await _apiService.dio.get('/network/invitations');
      final data = res.data;
      if (data is List) {
        return data.map((json) => NetworkInvitation.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<List<NetworkConnection>> getConnections() async {
    try {
      final res = await _apiService.dio.get('/network/connections');
      final data = res.data;
      if (data is List) {
        return data.map((json) => NetworkConnection.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<void> sendConnectRequest(int userId) async {
    try {
      await _apiService.dio.post('/network/connect/$userId');
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<void> acceptInvitation(int connectionId) async {
    try {
      await _apiService.dio.post('/network/accept/$connectionId');
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<void> rejectInvitation(int connectionId) async {
    try {
      await _apiService.dio.post('/network/reject/$connectionId');
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }

  Future<void> removeConnection(int connectionId) async {
    try {
      await _apiService.dio.delete('/network/remove/$connectionId');
    } catch (e) {
      throw _apiService.handleDioError(e);
    }
  }
}
