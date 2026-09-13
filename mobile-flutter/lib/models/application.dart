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
  final DateTime? interviewScheduledAt;
  final String? interviewTime;
  final String? interviewType;
  final String? interviewLocation;
  final String? interviewNotes;
  final String? interviewStatus;
  final String? interviewFeedback;
  final int? interviewRating;
  final String? coverLetter;

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
    this.interviewScheduledAt,
    this.interviewTime,
    this.interviewType,
    this.interviewLocation,
    this.interviewNotes,
    this.interviewStatus,
    this.interviewFeedback,
    this.interviewRating,
    this.coverLetter,
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
    } else if (json['jobPosting'] != null && json['jobPosting'] is Map<String, dynamic>) {
      jobObj = JobPosting.fromJson(json['jobPosting']);
    } else if (json['job'] != null && json['job'] is Map<String, dynamic>) {
      jobObj = JobPosting.fromJson(json['job']);
    }

    User? candidateObj;
    if (json['job_seeker'] != null && json['job_seeker'] is Map<String, dynamic>) {
      final js = json['job_seeker'] as Map<String, dynamic>;
      if (js['user'] != null && js['user'] is Map<String, dynamic>) {
        final u = js['user'] as Map<String, dynamic>;
        List<String> skills = [];
        if (js['skills'] is List) {
          skills = (js['skills'] as List).map((e) => e.toString()).toList();
        } else if (js['skills'] is String) {
          skills = (js['skills'] as String).split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
        }
        candidateObj = User(
          id: u['id'] is int ? u['id'] : int.tryParse(u['id']?.toString() ?? '0') ?? (js['user_id'] is int ? js['user_id'] : int.tryParse(js['user_id']?.toString() ?? '0') ?? 0),
          name: u['name']?.toString() ?? js['name']?.toString() ?? 'Candidate',
          email: u['email']?.toString() ?? js['email']?.toString() ?? '',
          role: u['role']?.toString() ?? 'jobseeker',
          profilePicture: u['profile_picture']?.toString(),
          location: js['location']?.toString() ?? u['location']?.toString(),
          title: js['headline']?.toString() ?? u['title']?.toString(),
          bio: js['about']?.toString() ?? u['bio']?.toString(),
          skills: skills,
        );
      } else {
        candidateObj = User.fromJson(js);
      }
    } else if (json['candidate'] != null && json['candidate'] is Map<String, dynamic>) {
      candidateObj = User.fromJson(json['candidate']);
    } else if (json['user'] != null && json['user'] is Map<String, dynamic>) {
      candidateObj = User.fromJson(json['user']);
    }

    DateTime? created;
    if (json['created_at'] != null) {
      created = DateTime.tryParse(json['created_at'].toString());
    }

    DateTime? scheduledAt;
    if (json['interview_scheduled_at'] != null) {
      scheduledAt = DateTime.tryParse(json['interview_scheduled_at'].toString());
    }

    final rawJobId = json['job_id'] ?? json['job_posting_id'] ?? 0;
    final rawJobSeekerId = json['job_seeker_id'] ?? json['jobSeekerId'] ?? 0;

    final rawResumeScore = json['similarity_score'] ?? json['resume_score'];
    final rawTotalScore = json['final_score'] ?? json['total_score'] ?? json['match_score'];
    final rawQuizScore = json['quiz_score'] ?? json['skill_gap_score'];

    return Application(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      jobPostingId: rawJobId is int ? rawJobId : int.tryParse(rawJobId.toString()) ?? 0,
      jobSeekerId: rawJobSeekerId is int ? rawJobSeekerId : int.tryParse(rawJobSeekerId.toString()) ?? 0,
      resumePath: json['resume_path'] ?? json['resume_url'],
      resumeScore: rawResumeScore != null ? num.tryParse(rawResumeScore.toString()) : null,
      quizScore: rawQuizScore != null ? num.tryParse(rawQuizScore.toString()) : null,
      totalScore: rawTotalScore != null ? num.tryParse(rawTotalScore.toString()) : null,
      status: json['status']?.toString().toLowerCase() ?? 'pending',
      createdAt: created,
      job: jobObj,
      candidate: candidateObj,
      notes: json['company_notes']?.toString() ?? json['notes']?.toString(),
      rejectionReason: json['rejection_reason']?.toString(),
      interviewDate: json['interview_date']?.toString() ?? json['interview_scheduled_at']?.toString(),
      interviewScheduledAt: scheduledAt,
      interviewTime: json['interview_time']?.toString(),
      interviewType: json['interview_type']?.toString(),
      interviewLocation: json['interview_location']?.toString(),
      interviewNotes: json['interview_notes']?.toString(),
      interviewStatus: json['interview_status']?.toString(),
      interviewFeedback: json['interview_feedback']?.toString(),
      interviewRating: json['interview_rating'] != null ? int.tryParse(json['interview_rating'].toString()) : null,
      coverLetter: json['cover_letter']?.toString(),
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
      'interview_scheduled_at': interviewScheduledAt?.toIso8601String(),
      'interview_time': interviewTime,
      'interview_type': interviewType,
      'interview_location': interviewLocation,
      'interview_notes': interviewNotes,
      'interview_status': interviewStatus,
      'interview_feedback': interviewFeedback,
      'interview_rating': interviewRating,
      'cover_letter': coverLetter,
    };
  }
}
