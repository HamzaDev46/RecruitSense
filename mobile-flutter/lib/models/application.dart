import 'job_posting.dart';
import 'user.dart';

class Application {
  final int id;
  final int jobPostingId;
  final int jobSeekerId;
  final String? resumePath;
  final num? resumeScore;
  final num? quizScore;
  final num? totalScore;
  final String status; // 'pending', 'shortlisted', 'rejected', 'interview', 'hired', 'withdrawn'
  final DateTime? createdAt;
  final JobPosting? job;
  final User? candidate;
  final String? notes;
  final String? rejectionReason;
  final String? interviewDate;

  Application({
    required this.id,
    required this.jobPostingId,
    required this.jobSeekerId,
    this.resumePath,
    this.resumeScore,
    this.quizScore,
    this.totalScore,
    this.status = 'pending',
    this.createdAt,
    this.job,
    this.candidate,
    this.notes,
    this.rejectionReason,
    this.interviewDate,
  });

  bool get isShortlisted => status.toLowerCase() == 'shortlisted';
  bool get isRejected => status.toLowerCase() == 'rejected';
  bool get isPending => status.toLowerCase() == 'pending';
  bool get isHired => status.toLowerCase() == 'hired';
  bool get isInterview => status.toLowerCase() == 'interview';
  bool get isWithdrawn => status.toLowerCase() == 'withdrawn';

  JobPosting? get jobPosting => job;

  bool get needsQuiz => (quizScore == null || quizScore == 0) && !isRejected && !isWithdrawn;

  factory Application.fromJson(Map<String, dynamic> json) {
    JobPosting? jobObj;
    if (json['job_posting'] != null && json['job_posting'] is Map<String, dynamic>) {
      jobObj = JobPosting.fromJson(json['job_posting']);
    } else if (json['job'] != null && json['job'] is Map<String, dynamic>) {
      jobObj = JobPosting.fromJson(json['job']);
    }

    User? candidateObj;
    if (json['job_seeker'] != null && json['job_seeker'] is Map<String, dynamic>) {
      candidateObj = User.fromJson(json['job_seeker']);
    } else if (json['user'] != null && json['user'] is Map<String, dynamic>) {
      candidateObj = User.fromJson(json['user']);
    }

    DateTime? created;
    if (json['created_at'] != null) {
      created = DateTime.tryParse(json['created_at'].toString());
    }

    return Application(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      jobPostingId: json['job_posting_id'] is int
          ? json['job_posting_id']
          : int.tryParse(json['job_posting_id'].toString()) ?? 0,
      jobSeekerId: json['job_seeker_id'] is int
          ? json['job_seeker_id']
          : int.tryParse(json['job_seeker_id'].toString()) ?? 0,
      resumePath: json['resume_path'] ?? json['resume_url'],
      resumeScore: json['resume_score'] != null ? num.tryParse(json['resume_score'].toString()) : null,
      quizScore: json['quiz_score'] != null ? num.tryParse(json['quiz_score'].toString()) : null,
      totalScore: json['total_score'] != null ? num.tryParse(json['total_score'].toString()) : null,
      status: json['status'] ?? 'pending',
      createdAt: created,
      job: jobObj,
      candidate: candidateObj,
      notes: json['notes'],
      rejectionReason: json['rejection_reason'],
      interviewDate: json['interview_date'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'job_posting_id': jobPostingId,
      'job_seeker_id': jobSeekerId,
      'resume_path': resumePath,
      'resume_score': resumeScore,
      'quiz_score': quizScore,
      'total_score': totalScore,
      'status': status,
      'created_at': createdAt?.toIso8601String(),
      'job': job?.toJson(),
      'candidate': candidate?.toJson(),
      'notes': notes,
      'rejection_reason': rejectionReason,
      'interview_date': interviewDate,
    };
  }
}
