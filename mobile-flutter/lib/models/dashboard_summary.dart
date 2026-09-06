import 'job_posting.dart';
import 'application.dart';

class DashboardStats {
  final int totalJobs;
  final int myApplications;
  final int savedJobs;
  final int shortlisted;
  final int inProgress;
  final int pending;
  final int rejected;
  final int profileViews;
  final int postImpressions;
  final int searchAppearances;
  final int connections;
  final int pendingInvitations;
  final double averageScore;

  DashboardStats({
    this.totalJobs = 0,
    this.myApplications = 0,
    this.savedJobs = 0,
    this.shortlisted = 0,
    this.inProgress = 0,
    this.pending = 0,
    this.rejected = 0,
    this.profileViews = 0,
    this.postImpressions = 0,
    this.searchAppearances = 0,
    this.connections = 0,
    this.pendingInvitations = 0,
    this.averageScore = 0.0,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalJobs: (json['total_jobs'] ?? json['totalJobs'] ?? 0) as int,
      myApplications: (json['my_applications'] ?? json['myApplications'] ?? 0) as int,
      savedJobs: (json['saved_jobs'] ?? json['savedJobs'] ?? 0) as int,
      shortlisted: (json['shortlisted'] ?? 0) as int,
      inProgress: (json['in_progress'] ?? json['inProgress'] ?? 0) as int,
      pending: (json['pending'] ?? 0) as int,
      rejected: (json['rejected'] ?? 0) as int,
      profileViews: (json['profile_views'] ?? json['profileViews'] ?? 0) as int,
      postImpressions: (json['post_impressions'] ?? json['postImpressions'] ?? 0) as int,
      searchAppearances: (json['search_appearances'] ?? json['searchAppearances'] ?? 0) as int,
      connections: (json['connections'] ?? 0) as int,
      pendingInvitations: (json['pending_invitations'] ?? json['pendingInvitations'] ?? 0) as int,
      averageScore: ((json['average_score'] ?? json['averageScore'] ?? 0) as num).toDouble(),
    );
  }
}

class ProfileStrengthTask {
  final String key;
  final String label;
  final bool complete;
  final String? impact;

  ProfileStrengthTask({
    required this.key,
    required this.label,
    required this.complete,
    this.impact,
  });

  factory ProfileStrengthTask.fromJson(Map<String, dynamic> json) {
    return ProfileStrengthTask(
      key: json['key']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
      complete: json['complete'] == true,
      impact: json['impact']?.toString(),
    );
  }
}

class ProfileStrength {
  final int completion;
  final int completedTasks;
  final int totalTasks;
  final List<ProfileStrengthTask> tasks;
  final List<String> missingTasks;
  final String? nextTask;

  ProfileStrength({
    this.completion = 0,
    this.completedTasks = 0,
    this.totalTasks = 0,
    this.tasks = const [],
    this.missingTasks = const [],
    this.nextTask,
  });

  factory ProfileStrength.fromJson(Map<String, dynamic> json) {
    return ProfileStrength(
      completion: (json['completion'] ?? 0) as int,
      completedTasks: (json['completed_tasks'] ?? 0) as int,
      totalTasks: (json['total_tasks'] ?? 0) as int,
      tasks: (json['tasks'] as List<dynamic>?)
              ?.map((t) => ProfileStrengthTask.fromJson(t as Map<String, dynamic>))
              .toList() ??
          [],
      missingTasks: (json['missing_tasks'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      nextTask: json['next_task']?.toString(),
    );
  }
}

class JobSeekerDashboardSummary {
  final DashboardStats stats;
  final ProfileStrength profileStrength;
  final List<JobPosting> recentJobs;
  final List<Application> recentApplications;

  JobSeekerDashboardSummary({
    required this.stats,
    required this.profileStrength,
    this.recentJobs = const [],
    this.recentApplications = const [],
  });

  factory JobSeekerDashboardSummary.fromJson(Map<String, dynamic> json) {
    return JobSeekerDashboardSummary(
      stats: json['stats'] != null
          ? DashboardStats.fromJson(json['stats'] as Map<String, dynamic>)
          : DashboardStats(),
      profileStrength: json['profile_strength'] != null
          ? ProfileStrength.fromJson(json['profile_strength'] as Map<String, dynamic>)
          : ProfileStrength(),
      recentJobs: (json['recent_jobs'] as List<dynamic>?)
              ?.map((j) => JobPosting.fromJson(j as Map<String, dynamic>))
              .toList() ??
          [],
      recentApplications: (json['recent_applications'] as List<dynamic>?)
              ?.map((a) => Application.fromJson(a as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class CompanyDashboardSummary {
  final int activeJobs;
  final int totalApplicants;
  final int screening;
  final int shortlisted;
  final int interviewsScheduled;
  final int hired;
  final List<JobPosting> recentJobs;
  final List<Application> recentApplicants;
  final List<dynamic> activityLog;

  CompanyDashboardSummary({
    this.activeJobs = 0,
    this.totalApplicants = 0,
    this.screening = 0,
    this.shortlisted = 0,
    this.interviewsScheduled = 0,
    this.hired = 0,
    this.recentJobs = const [],
    this.recentApplicants = const [],
    this.activityLog = const [],
  });

  factory CompanyDashboardSummary.fromJson(Map<String, dynamic> json) {
    final stats = json['stats'] as Map<String, dynamic>? ?? json;
    return CompanyDashboardSummary(
      activeJobs: (stats['active_jobs'] ?? stats['activeJobs'] ?? 0) as int,
      totalApplicants: (stats['total_applicants'] ?? stats['totalApplicants'] ?? 0) as int,
      screening: (stats['screening'] ?? 0) as int,
      shortlisted: (stats['shortlisted'] ?? 0) as int,
      interviewsScheduled: (stats['interviews_scheduled'] ?? stats['interviewsScheduled'] ?? 0) as int,
      hired: (stats['hired'] ?? 0) as int,
      recentJobs: (json['recent_jobs'] as List<dynamic>?)
              ?.map((j) => JobPosting.fromJson(j as Map<String, dynamic>))
              .toList() ??
          [],
      recentApplicants: (json['recent_applicants'] as List<dynamic>?)
              ?.map((a) => Application.fromJson(a as Map<String, dynamic>))
              .toList() ??
          [],
      activityLog: (json['activity_log'] as List<dynamic>?) ?? [],
    );
  }
}
