import 'company.dart';

class User {
  final int id;
  final String name;
  final String email;
  final String role; // 'job_seeker', 'company', 'admin'
  final String? profilePicture;
  final String? emailVerifiedAt;
  final Company? companyProfile;
  final String? title;
  final String? bio;
  final String? location;
  final List<String> skills;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.profilePicture,
    this.emailVerifiedAt,
    this.companyProfile,
    this.title,
    this.bio,
    this.location,
    this.skills = const [],
  });

  bool get isJobSeeker => role == 'job_seeker';
  bool get isCompany => role == 'company';
  bool get isAdmin => role == 'admin';

  factory User.fromJson(Map<String, dynamic> json) {
    List<String> parsedSkills = [];
    if (json['profile'] != null && json['profile']['skills'] != null) {
      final s = json['profile']['skills'];
      if (s is List) {
        parsedSkills = s.map((e) => e.toString()).toList();
      } else if (s is String) {
        parsedSkills = s.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
      }
    } else if (json['skills'] != null) {
      final s = json['skills'];
      if (s is List) {
        parsedSkills = s.map((e) => e.toString()).toList();
      } else if (s is String) {
        parsedSkills = s.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
      }
    }

    Company? company;
    if (json['company_profile'] != null && json['company_profile'] is Map<String, dynamic>) {
      company = Company.fromJson(json['company_profile']);
    } else if (json['company'] != null && json['company'] is Map<String, dynamic>) {
      company = Company.fromJson(json['company']);
    }

    return User(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'job_seeker',
      profilePicture: json['profile_picture'] ?? json['avatar'],
      emailVerifiedAt: json['email_verified_at'],
      companyProfile: company,
      title: json['profile']?['title'] ?? json['title'],
      bio: json['profile']?['bio'] ?? json['bio'],
      location: json['profile']?['location'] ?? json['location'],
      skills: parsedSkills,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'profile_picture': profilePicture,
      'email_verified_at': emailVerifiedAt,
      'company_profile': companyProfile?.toJson(),
      'title': title,
      'bio': bio,
      'location': location,
      'skills': skills,
    };
  }
}
