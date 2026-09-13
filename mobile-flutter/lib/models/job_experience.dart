class JobExperience {
  final int id;
  final int jobSeekerId;
  final String title;
  final String companyName;
  final String? location;
  final String? startDate;
  final String? endDate;
  final bool isCurrent;
  final String? description;

  JobExperience({
    required this.id,
    required this.jobSeekerId,
    required this.title,
    required this.companyName,
    this.location,
    this.startDate,
    this.endDate,
    this.isCurrent = false,
    this.description,
  });

  factory JobExperience.fromJson(Map<String, dynamic> json) {
    return JobExperience(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      jobSeekerId: json['job_seeker_id'] is int
          ? json['job_seeker_id']
          : int.tryParse(json['job_seeker_id'].toString()) ?? 0,
      title: json['title'] ?? '',
      companyName: json['company_name'] ?? json['company'] ?? '',
      location: json['location'],
      startDate: json['start_date'],
      endDate: json['end_date'],
      isCurrent: json['is_current'] == true || json['is_current'] == 1 || json['is_current'] == '1',
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'job_seeker_id': jobSeekerId,
      'title': title,
      'company_name': companyName,
      'location': location,
      'start_date': startDate,
      'end_date': endDate,
      'is_current': isCurrent,
      'description': description,
    };
  }
}
