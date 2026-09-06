import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/application.dart';
import '../../providers/application_provider.dart';
import '../../widgets/status_badge.dart';
import 'ai_quiz_screen.dart';

class MyApplicationsScreen extends StatefulWidget {
  const MyApplicationsScreen({super.key});

  @override
  State<MyApplicationsScreen> createState() => _MyApplicationsScreenState();
}

class _MyApplicationsScreenState extends State<MyApplicationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ApplicationProvider>(context, listen: false).fetchMyApplications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final applicationProvider = Provider.of<ApplicationProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text('My Applications', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () => applicationProvider.fetchMyApplications(),
        child: applicationProvider.isLoading
            ? const Center(
                child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary)),
              )
            : applicationProvider.myApplications.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.assignment_outlined, size: 64, color: Colors.grey.shade400),
                        const SizedBox(height: 16),
                        Text(
                          'No applications submitted yet',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Explore open roles in the feed and apply with instant AI scoring!',
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                    itemCount: applicationProvider.myApplications.length,
                    itemBuilder: (context, index) {
                      final app = applicationProvider.myApplications[index];
                      return _buildApplicationCard(app);
                    },
                  ),
      ),
    );
  }

  Widget _buildApplicationCard(Application app) {
    final jobTitle = app.job?.title ?? 'Job Position';
    final companyName = app.job?.company?.companyName ?? 'Company';
    final companyId = app.job?.companyId ?? (app.job?.company?.id ?? 0);
    final dateStr = app.createdAt != null ? DateFormat('MMM dd, yyyy').format(app.createdAt!) : 'Recently';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Title + Status Badge
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        jobTitle,
                        style: GoogleFonts.outfit(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        companyName,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                StatusBadge(status: app.status),
              ],
            ),

            const SizedBox(height: 12),
            Text(
              'Applied on $dateStr',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
            ),

            const SizedBox(height: 14),
            const Divider(color: Color(0xFFF1F5F9)),
            const SizedBox(height: 10),

            // AI Scoring Breakdown Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildScoreColumn(
                    'Resume AI',
                    app.resumeScore,
                    Icons.description_outlined,
                  ),
                  Container(height: 30, width: 1, color: const Color(0xFFE2E8F0)),
                  _buildScoreColumn(
                    'Quiz Score',
                    app.quizScore,
                    Icons.quiz_outlined,
                  ),
                  Container(height: 30, width: 1, color: const Color(0xFFE2E8F0)),
                  _buildScoreColumn(
                    'Overall AI',
                    app.totalScore,
                    Icons.auto_awesome_rounded,
                    isTotal: true,
                  ),
                ],
              ),
            ),

            // Action Banner: Take AI Quiz if not completed yet
            if (app.needsQuiz && companyId > 0) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFEEF2FF), Color(0xFFF3E8FF)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFC7D2FE)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.stars_rounded, color: AppTheme.primary, size: 24),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Skill Assessment Pending',
                            style: GoogleFonts.outfit(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF1E1B4B),
                            ),
                          ),
                          Text(
                            'Take the 5-min quiz to boost your candidate ranking',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: const Color(0xFF4338CA),
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        minimumSize: const Size(80, 36),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () async {
                        await Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => AiQuizScreen(
                              applicationId: app.id,
                              companyId: companyId,
                              jobTitle: jobTitle,
                            ),
                          ),
                        );
                        if (mounted) {
                          Provider.of<ApplicationProvider>(context, listen: false).fetchMyApplications();
                        }
                      },
                      child: Text(
                        'Start Quiz',
                        style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildScoreColumn(String label, num? score, IconData icon, {bool isTotal = false}) {
    final scoreText = score != null ? '${score.toInt()}%' : '--';
    Color valueColor = const Color(0xFF64748B);
    if (score != null) {
      if (score >= 80) {
        valueColor = const Color(0xFF10B981);
      } else if (score >= 60) {
        valueColor = AppTheme.primary;
      } else {
        valueColor = const Color(0xFFF59E0B);
      }
    }

    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: isTotal ? AppTheme.primary : const Color(0xFF64748B)),
            const SizedBox(width: 4),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: isTotal ? FontWeight.w700 : FontWeight.w500,
                color: isTotal ? const Color(0xFF0F172A) : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          scoreText,
          style: GoogleFonts.outfit(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
