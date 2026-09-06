import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:recruitsense_mobile/models/company.dart';
import 'package:recruitsense_mobile/models/job_posting.dart';
import 'package:recruitsense_mobile/widgets/job_card.dart';
import 'package:recruitsense_mobile/widgets/score_badge.dart';
import 'package:recruitsense_mobile/widgets/status_badge.dart';

void main() {
  group('RecruitSense UI Widget Tests', () {
    testWidgets('ScoreBadge renders AI percentage correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ScoreBadge(score: 88),
          ),
        ),
      );

      expect(find.text('88% Match'), findsOneWidget);
    });

    testWidgets('StatusBadge renders Shortlisted status correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatusBadge(status: 'shortlisted'),
          ),
        ),
      );

      expect(find.text('Shortlisted'), findsOneWidget);
      expect(find.byIcon(Icons.verified_rounded), findsOneWidget);
    });

    testWidgets('JobCard renders title, company, tags and match score', (WidgetTester tester) async {
      final job = JobPosting(
        id: 1,
        companyId: 10,
        title: 'Lead Mobile Architect',
        description: 'Design enterprise Flutter architecture',
        skillsRequired: ['Flutter', 'Dart', 'Clean Architecture'],
        location: 'Remote',
        jobType: 'Full-time',
        salaryRange: '\$140k - \$180k',
        matchScore: 95,
        company: Company(id: 10, companyName: 'RecruitSense AI'),
      );

      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: JobCard(
              job: job,
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Lead Mobile Architect'), findsOneWidget);
      expect(find.text('RecruitSense AI'), findsOneWidget);
      expect(find.text('Remote'), findsOneWidget);
      expect(find.text('95% Match'), findsOneWidget);
      expect(find.text('Flutter'), findsOneWidget);

      await tester.tap(find.byType(JobCard));
      expect(tapped, true);
    });
  });
}
