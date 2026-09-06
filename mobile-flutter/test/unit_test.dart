import 'package:flutter_test/flutter_test.dart';
import 'package:recruitsense_mobile/models/user.dart';
import 'package:recruitsense_mobile/models/company.dart';
import 'package:recruitsense_mobile/models/job_posting.dart';
import 'package:recruitsense_mobile/models/application.dart';
import 'package:recruitsense_mobile/models/quiz_question.dart';
import 'package:recruitsense_mobile/models/post.dart';
import 'package:recruitsense_mobile/models/dashboard_summary.dart';
import 'package:recruitsense_mobile/models/resume_insight.dart';
import 'package:recruitsense_mobile/models/network_user.dart';
import 'package:recruitsense_mobile/models/message_conversation.dart';
import 'package:recruitsense_mobile/models/notification_item.dart';

void main() {
  group('RecruitSense Models Serialization Tests', () {
    test('Company model fromJson & toJson', () {
      final json = {
        'id': 1,
        'company_name': 'TechCorp Solutions',
        'industry': 'Software',
        'location': 'San Francisco, CA',
        'website': 'https://techcorp.com',
        'company_size': '51-200 employees',
        'contact_email': 'hr@techcorp.com',
      };

      final company = Company.fromJson(json);
      expect(company.id, 1);
      expect(company.companyName, 'TechCorp Solutions');
      expect(company.industry, 'Software');
      expect(company.toJson()['company_name'], 'TechCorp Solutions');
    });

    test('User model fromJson for job seeker & company', () {
      final seekerJson = {
        'id': 10,
        'name': 'Hamza Candidate',
        'email': 'hamza@recruitsense.com',
        'role': 'job_seeker',
        'skills': ['Flutter', 'Dart', 'Laravel'],
      };

      final user = User.fromJson(seekerJson);
      expect(user.id, 10);
      expect(user.isJobSeeker, true);
      expect(user.isCompany, false);
      expect(user.skills.length, 3);
      expect(user.skills.contains('Flutter'), true);
    });

    test('JobPosting model parsing with match score', () {
      final jobJson = {
        'id': 5,
        'company_id': 1,
        'title': 'Senior Flutter Engineer',
        'description': 'Build mobile applications with AI integration',
        'requirements': '3+ years experience',
        'skills_required': ['Flutter', 'Dart', 'REST API'],
        'location': 'Remote',
        'job_type': 'Full-time',
        'salary_range': '\$90,000 - \$120,000',
        'match_score': 92.5,
        'company': {
          'id': 1,
          'company_name': 'TechCorp',
        },
      };

      final job = JobPosting.fromJson(jobJson);
      expect(job.id, 5);
      expect(job.title, 'Senior Flutter Engineer');
      expect(job.matchScore, 92.5);
      expect(job.company?.companyName, 'TechCorp');
      expect(job.skillsRequired.length, 3);
    });

    test('Application model score and status logic', () {
      final appJson = {
        'id': 20,
        'job_posting_id': 5,
        'job_seeker_id': 10,
        'resume_score': 88,
        'quiz_score': 90,
        'total_score': 89,
        'status': 'shortlisted',
      };

      final app = Application.fromJson(appJson);
      expect(app.id, 20);
      expect(app.isShortlisted, true);
      expect(app.isPending, false);
      expect(app.totalScore, 89);
    });

    test('QuizQuestion model option parsing', () {
      final questionJson = {
        'id': 101,
        'category': 'Communication',
        'question_text': 'What is the best way to report progress?',
        'options': ['Regular concise updates', 'Wait till the deadline', 'Ignore questions'],
        'correct_answer': 'Regular concise updates',
      };

      final q = QuizQuestion.fromJson(questionJson);
      expect(q.id, 101);
      expect(q.category, 'Communication');
      expect(q.options.length, 3);
      expect(q.correctAnswer, 'Regular concise updates');
    });

    test('CommunityPost model and comment parsing', () {
      final postJson = {
        'id': 1,
        'user_id': 10,
        'content': 'Excited to announce my new certification in Flutter development! #flutter #mobile',
        'likes_count': 15,
        'comments_count': 2,
        'is_liked': true,
        'comments': [
          {'id': 101, 'post_id': 1, 'user_id': 2, 'content': 'Congrats!'}
        ],
      };

      final post = CommunityPost.fromJson(postJson);
      expect(post.id, 1);
      expect(post.likesCount, 15);
      expect(post.isLiked, true);
      expect(post.comments.length, 1);
      expect(post.comments.first.content, 'Congrats!');
    });

    test('JobSeekerDashboardSummary and ProfileStrength model parsing', () {
      final summaryJson = {
        'stats': {
          'total_jobs': 45,
          'my_applications': 5,
          'shortlisted': 2,
          'average_score': 87.5,
        },
        'profile_strength': {
          'completion': 85,
          'next_task': 'Add your certifications',
          'tasks': [
            {'key': 'resume', 'label': 'Upload Resume', 'complete': true},
            {'key': 'skills', 'label': 'Add Skills', 'complete': true},
          ],
        },
      };

      final summary = JobSeekerDashboardSummary.fromJson(summaryJson);
      expect(summary.stats.myApplications, 5);
      expect(summary.stats.shortlisted, 2);
      expect(summary.profileStrength.completion, 85);
      expect(summary.profileStrength.tasks.length, 2);
    });

    test('ResumeInsightData ATS scoring and suggestions model parsing', () {
      final insightJson = {
        'resume': {'uploaded': true, 'file_name': 'My_Resume.pdf'},
        'score': 84,
        'level': 'Strong',
        'candidate_skills': ['Flutter', 'Dart', 'Laravel'],
        'missing_keywords': [
          {'skill': 'Docker', 'count': 8}
        ],
        'suggestions': [
          {'type': 'keywords', 'title': 'Add missing skills', 'body': 'Include Docker in your resume'}
        ],
      };

      final insights = ResumeInsightData.fromJson(insightJson);
      expect(insights.resumeUploaded, true);
      expect(insights.score, 84);
      expect(insights.level, 'Strong');
      expect(insights.missingKeywords.first.skill, 'Docker');
      expect(insights.suggestions.first.type, 'keywords');
    });

    test('NetworkSummary and MessageConversation model parsing', () {
      final netJson = {
        'connections_count': 12,
        'invitations_count': 3,
        'suggestions_count': 25,
      };

      final net = NetworkSummary.fromJson(netJson);
      expect(net.connectionsCount, 12);
      expect(net.invitationsCount, 3);

      final msgJson = {
        'id': 50,
        'other_user': {'id': 2, 'name': 'Recruiter Sarah', 'email': 'sarah@company.com', 'role': 'company'},
        'unread_count': 1,
        'last_message': {'id': 100, 'conversation_id': 50, 'sender_id': 2, 'body': 'When can you interview?'},
      };

      final conv = MessageConversation.fromJson(msgJson);
      expect(conv.id, 50);
      expect(conv.otherUser.name, 'Recruiter Sarah');
      expect(conv.lastMessage?.body, 'When can you interview?');
      expect(conv.unreadCount, 1);
    });

    test('NotificationItem model parsing', () {
      final notifJson = {
        'id': 88,
        'type': 'interview_scheduled',
        'title': 'Interview Scheduled',
        'message': 'Your interview with TechCorp is set for tomorrow at 2:00 PM.',
        'read_at': null,
      };

      final notif = NotificationItem.fromJson(notifJson);
      expect(notif.id, 88);
      expect(notif.isRead, false);
      expect(notif.title, 'Interview Scheduled');
    });
  });
}
