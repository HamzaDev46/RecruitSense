import 'company.dart';

class JobPosting {
  final int id;
  final int companyId;
  final String title;
  final String description;
  final String? requirements;
  final List<String> skillsRequired;
  final String? location;
  final String jobType; // Full-time, Part-time, Remote, etc.
  final String? salaryRange;
  final String? experienceLevel;
  final String status;
  final DateTime? createdAt;
  final Company? company;
  final num? matchScore; // Dynamic AI match score calculated for user
  final int? applicantsCount;

  JobPosting({
    required this.id,
    required this.companyId,
    required this.title,
    required this.description,
    this.requirements,
    this.skillsRequired = const [],
    this.location,
    this.jobType = 'Full-time',
    this.salaryRange,
    this.experienceLevel,
    this.status = 'active',
    this.createdAt,
    this.company,
    this.matchScore,
    this.applicantsCount,
  });

  factory JobPosting.fromJson(Map<String, dynamic> json) {
    List<String> skills = [];
    if (json['skills_required'] != null) {
      final s = json['skills_required'];
      if (s is List) {
        skills = s.map((e) => e.toString()).toList();
      } else if (s is String) {
        skills = s.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
      }
    }

    DateTime? created;
    if (json['created_at'] != null) {
      created = DateTime.tryParse(json['created_at'].toString());
    }

    Company? companyObj;
    if (json['company'] != null && json['company'] is Map<String, dynamic>) {
      companyObj = Company.fromJson(json['company']);
    }

    return JobPosting(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      companyId: json['company_id'] is int ? json['company_id'] : int.tryParse(json['company_id'].toString()) ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      requirements: json['requirements']?.toString(),
      skillsRequired: skills,
      location: json['location'],
      jobType: json['job_type'] ?? 'Full-time',
      salaryRange: json['salary_range'],
      experienceLevel: json['experience_level'],
      status: json['status'] ?? 'active',
      createdAt: created,
      company: companyObj,
      matchScore: json['match_score'] != null ? num.tryParse(json['match_score'].toString()) : null,
      applicantsCount: json['applications_count'] ?? json['applicants_count'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'company_id': companyId,
      'title': title,
      'description': description,
      'requirements': requirements,
      'skills_required': skillsRequired,
      'location': location,
      'job_type': jobType,
      'salary_range': salaryRange,
      'experience_level': experienceLevel,
      'status': status,
      'created_at': createdAt?.toIso8601String(),
      'company': company?.toJson(),
      'match_score': matchScore,
    };
  }
}
