import 'user.dart';

class NetworkSummary {
  final int connectionsCount;
  final int invitationsCount;
  final int suggestionsCount;

  NetworkSummary({
    this.connectionsCount = 0,
    this.invitationsCount = 0,
    this.suggestionsCount = 0,
  });

  factory NetworkSummary.fromJson(Map<String, dynamic> json) {
    return NetworkSummary(
      connectionsCount: (json['connections_count'] ?? json['connections'] ?? 0) as int,
      invitationsCount: (json['invitations_count'] ?? json['invitations'] ?? 0) as int,
      suggestionsCount: (json['suggestions_count'] ?? json['suggestions'] ?? 0) as int,
    );
  }
}

class NetworkInvitation {
  final int id;
  final User sender;
  final String status;
  final DateTime? createdAt;

  NetworkInvitation({
    required this.id,
    required this.sender,
    required this.status,
    this.createdAt,
  });

  factory NetworkInvitation.fromJson(Map<String, dynamic> json) {
    return NetworkInvitation(
      id: (json['id'] ?? 0) as int,
      sender: json['sender'] != null
          ? User.fromJson(json['sender'] as Map<String, dynamic>)
          : (json['user'] != null
              ? User.fromJson(json['user'] as Map<String, dynamic>)
              : User(id: 0, name: 'User', email: '', role: 'jobseeker')),
      status: json['status']?.toString() ?? 'pending',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
    );
  }
}

class NetworkConnection {
  final int id;
  final User user;
  final DateTime? connectedAt;

  NetworkConnection({
    required this.id,
    required this.user,
    this.connectedAt,
  });

  factory NetworkConnection.fromJson(Map<String, dynamic> json) {
    return NetworkConnection(
      id: (json['id'] ?? 0) as int,
      user: json['user'] != null
          ? User.fromJson(json['user'] as Map<String, dynamic>)
          : User(id: 0, name: 'Connection', email: '', role: 'jobseeker'),
      connectedAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
    );
  }
}
