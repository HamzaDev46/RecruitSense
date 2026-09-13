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
  String _selectedStatus = 'All';
  final List<String> _filters = ['All', 'Screening', 'Shortlisted', 'Interview', 'Hired', 'Rejected', 'Withdrawn'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ApplicationProvider>(context, listen: false).fetchMyApplications();
    });
  }

  void _showWithdrawDialog(Application app) {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Withdraw Application', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Are you sure you want to withdraw your application for "${app.job?.title ?? 'this role'}" at ${app.job?.company?.companyName ?? 'the company'}?',
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              decoration: InputDecoration(
                hintText: 'Reason for withdrawal (optional)',
                hintStyle: GoogleFonts.inter(fontSize: 12),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () async {
              Navigator.pop(ctx);
              final provider = Provider.of<ApplicationProvider>(context, listen: false);
              final messenger = ScaffoldMessenger.of(context);
              final success = await provider.withdrawApplication(app.id, reasonController.text.trim());
              messenger.showSnackBar(
                SnackBar(
                  content: Text(success ? 'Application withdrawn' : 'Could not withdraw application'),
                  backgroundColor: success ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                ),
              );
            },
            child: const Text('Confirm Withdraw', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final applicationProvider = Provider.of<ApplicationProvider>(context);

    var apps = applicationProvider.myApplications;
    if (_selectedStatus != 'All') {
      apps = apps.where((a) {
        if (_selectedStatus == 'Screening') {
          return a.status.toLowerCase() == 'pending' || a.status.toLowerCase() == 'screening';
        }
        return a.status.toLowerCase() == _selectedStatus.toLowerCase();
      }).toList();
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text('My Applications', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () => applicationProvider.fetchMyApplications(),
        child: Column(
          children: [
            // Status Filter Chips
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _filters.map((f) {
                    final isSelected = _selectedStatus == f;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(f),
                        selected: isSelected,
                        onSelected: (_) => setState(() => _selectedStatus = f),
                        selectedColor: AppTheme.primary,
                        backgroundColor: Colors.white,
                        labelStyle: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? Colors.white : const Color(0xFF475569),
                        ),
                        side: BorderSide(color: isSelected ? AppTheme.primary : const Color(0xFFE2E8F0)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        showCheckmark: false,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            Expanded(
              child: applicationProvider.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary)),
                    )
                  : apps.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.assignment_outlined, size: 56, color: Colors.grey.shade400),
                              const SizedBox(height: 12),
                              Text(
                                'No applications found in this filter',
                                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                          itemCount: apps.length,
                          itemBuilder: (context, index) {
                            final app = apps[index];
                            return _buildApplicationCard(app);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildApplicationCard(Application app) {
    final jobTitle = app.job?.title ?? 'Job Position';
    final companyName = app.job?.company?.companyName ?? 'Company';
    final companyId = app.job?.companyId ?? (app.job?.company?.id ?? 0);
    final dateStr = app.createdAt != null ? DateFormat('MMM dd, yyyy').format(app.createdAt!) : 'Recently';
    final isInterview = app.status.toLowerCase() == 'interview' || app.interviewScheduledAt != null;
    final canWithdraw = app.status.toLowerCase() == 'pending' || app.status.toLowerCase() == 'screening';

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

            const SizedBox(height: 8),
            Text(
              'Applied on $dateStr',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
            ),

            const SizedBox(height: 12),
            const Divider(color: Color(0xFFF1F5F9)),
            const SizedBox(height: 8),

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
                  _buildScoreColumn('Resume AI', app.resumeScore, Icons.description_outlined),
                  Container(height: 30, width: 1, color: const Color(0xFFE2E8F0)),
                  _buildScoreColumn('Quiz Score', app.quizScore, Icons.quiz_outlined),
                  Container(height: 30, width: 1, color: const Color(0xFFE2E8F0)),
                  _buildScoreColumn('Overall AI', app.totalScore, Icons.auto_awesome_rounded, isTotal: true),
                ],
              ),
            ),

            // Scheduled Interview Alert Card
            if (isInterview) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.event_available_rounded, color: Color(0xFF16A34A), size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'Interview Scheduled!',
                          style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF14532D)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    if (app.interviewScheduledAt != null)
                      Text(
                        'Date: ${DateFormat('EEE, MMM d, yyyy • hh:mm a').format(app.interviewScheduledAt!)}',
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF166534)),
                      )
                    else if (app.interviewDate != null)
                      Text(
                        'Date: ${app.interviewDate}',
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF166534)),
                      ),
                    if (app.interviewType != null)
                      Text(
                        'Format: ${app.interviewType == 'online' ? 'Online Video Meeting' : 'In-person Office'}',
                        style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF15803D)),
                      ),
                    if (app.interviewNotes != null && app.interviewNotes!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Notes / Link: ${app.interviewNotes}',
                        style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF166534)),
                      ),
                    ],
                  ],
                ),
              ),
            ],

            // Action Banner: Take AI Quiz if not completed yet
            if (app.needsQuiz && companyId > 0) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFEEF2FF), Color(0xFFF3E8FF)],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFC7D2FE)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.stars_rounded, color: AppTheme.primary, size: 22),
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

            // Withdraw Button for pending applications
            if (canWithdraw) ...[
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () => _showWithdrawDialog(app),
                  icon: const Icon(Icons.cancel_outlined, size: 14, color: Color(0xFFEF4444)),
                  label: Text(
                    'Withdraw Application',
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFFEF4444)),
                  ),
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
