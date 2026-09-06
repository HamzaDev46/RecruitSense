class Company {
  final int id;
  final int? userId;
  final String companyName;
  final String? industry;
  final String? location;
  final String? website;
  final String? companySize;
  final String? contactEmail;
  final String? description;
  final String? logo;

  Company({
    required this.id,
    this.userId,
    required this.companyName,
    this.industry,
    this.location,
    this.website,
    this.companySize,
    this.contactEmail,
    this.description,
    this.logo,
  });

  factory Company.fromJson(Map<String, dynamic> json) {
    return Company(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      userId: json['user_id'] != null
          ? (json['user_id'] is int ? json['user_id'] : int.tryParse(json['user_id'].toString()))
          : null,
      companyName: json['company_name'] ?? json['name'] ?? 'Company',
      industry: json['industry'],
      location: json['location'],
      website: json['website'],
      companySize: json['company_size'],
      contactEmail: json['contact_email'],
      description: json['description'],
      logo: json['logo'] ?? json['logo_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'company_name': companyName,
      'industry': industry,
      'location': location,
      'website': website,
      'company_size': companySize,
      'contact_email': contactEmail,
      'description': description,
      'logo': logo,
    };
  }
}
