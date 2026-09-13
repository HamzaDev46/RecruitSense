import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/application.dart';
import '../../providers/application_provider.dart';
import '../jobseeker/chat_detail_screen.dart';

class CompanyInterviewsScreen extends StatefulWidget {
  const CompanyInterviewsScreen({super.key});

  @override
  State<CompanyInterviewsScreen> createState() => _CompanyInterviewsScreenState();
}

class _CompanyInterviewsScreenState extends State<CompanyInterviewsScreen> {
  String _filter = 'All'; // 'All', 'Upcoming', 'Completed'

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ApplicationProvider>().fetchCompanyApplicants();
    });
  }

  void _showEvaluationDialog(Application app) {
    int rating = app.interviewRating ?? 4;
    String status = app.interviewStatus ?? 'completed';
    final feedbackController = TextEditingController(text: app.interviewFeedback ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                left: 20,
                right: 20,
                top: 16,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 44,
                        height: 5,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(2.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Interview Evaluation',
                      style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    Text(
                      'Candidate: ${app.candidate?.name ?? 'Applicant'} • ${app.job?.title ?? 'Role'}',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 18),

                    // Rating Picker
                    Text('Candidate Rating', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B))),
                    const SizedBox(height: 6),
                    Row(
                      children: List.generate(5, (index) {
                        final star = index + 1;
                        return IconButton(
                          icon: Icon(
                            star <= rating ? Icons.star_rounded : Icons.star_outline_rounded,
                            color: const Color(0xFFF59E0B),
                            size: 32,
                          ),
                          onPressed: () => setModalState(() => rating = star),
                        );
                      }),
                    ),
                    const SizedBox(height: 14),

                    // Interview Status
                    Text('Interview Status', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B))),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        ChoiceChip(
                          label: const Text('Completed'),
                          selected: status == 'completed',
                          onSelected: (val) => setModalState(() => status = 'completed'),
                          selectedColor: const Color(0xFF10B981),
                          labelStyle: TextStyle(color: status == 'completed' ? Colors.white : const Color(0xFF334155)),
                        ),
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('Scheduled'),
                          selected: status == 'scheduled',
                          onSelected: (val) => setModalState(() => status = 'scheduled'),
                          selectedColor: AppTheme.primary,
                          labelStyle: TextStyle(color: status == 'scheduled' ? Colors.white : const Color(0xFF334155)),
                        ),
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('Cancelled'),
                          selected: status == 'cancelled',
                          onSelected: (val) => setModalState(() => status = 'cancelled'),
                          selectedColor: const Color(0xFFEF4444),
                          labelStyle: TextStyle(color: status == 'cancelled' ? Colors.white : const Color(0xFF334155)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Feedback Notes
                    Text('Evaluator Feedback & Notes', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B))),
                    const SizedBox(height: 6),
                    TextField(
                      controller: feedbackController,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: 'Record technical observations, communication skills, culture fit, or next steps...',
                        hintStyle: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          minimumSize: const Size(double.infinity, 48),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          Navigator.pop(ctx);
                          final provider = context.read<ApplicationProvider>();
                          final messenger = ScaffoldMessenger.of(context);
                          final success = await provider.saveInterviewFeedback(
                            applicationId: app.id,
                            interviewStatus: status,
                            interviewFeedback: feedbackController.text.trim(),
                            interviewRating: rating,
                          );

                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(success ? 'Interview evaluation saved!' : 'Failed to save evaluation'),
                              backgroundColor: success ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                            ),
                          );
                        },
                        child: Text(
                          'Submit Evaluation',
                          style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final applicationProvider = context.watch<ApplicationProvider>();

    // Get all applicants with interview scheduled or in interview stage
    var interviews = applicationProvider.companyApplicants.where((a) {
      return a.status.toLowerCase() == 'interview' ||
          a.interviewDate != null ||
          a.interviewScheduledAt != null ||
          a.interviewStatus != null;
    }).toList();

    if (_filter == 'Upcoming') {
      interviews = interviews.where((i) => (i.interviewStatus ?? 'scheduled') == 'scheduled').toList();
    } else if (_filter == 'Completed') {
      interviews = interviews.where((i) => i.interviewStatus == 'completed').toList();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Interview Schedule & Reviews', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () => applicationProvider.fetchCompanyApplicants(),
        color: const Color(0xFF6366F1),
        child: Column(
          children: [
            // Filter Pills
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: Colors.white,
              child: Row(
                children: ['All', 'Upcoming', 'Completed'].map((f) {
                  final isSelected = _filter == f;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(f),
                      selected: isSelected,
                      onSelected: (_) => setState(() => _filter = f),
                      selectedColor: AppTheme.primary,
                      backgroundColor: const Color(0xFFF1F5F9),
                      labelStyle: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? Colors.white : const Color(0xFF475569),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // Interview Cards
            Expanded(
              child: applicationProvider.isLoading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                  : interviews.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.event_busy_rounded, size: 52, color: Color(0xFF94A3B8)),
                              const SizedBox(height: 12),
                              Text(
                                'No scheduled interviews found',
                                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF475569)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Schedule interviews from your Applicants Pipeline.',
                                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: interviews.length,
                          itemBuilder: (context, index) {
                            final app = interviews[index];
                            return _buildInterviewCard(app);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInterviewCard(Application app) {
    final name = app.candidate?.name ?? 'Applicant';
    final jobTitle = app.job?.title ?? 'Position';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'A';
    final interviewStatus = app.interviewStatus ?? (app.status.toLowerCase() == 'interview' ? 'scheduled' : 'scheduled');
    final isCompleted = interviewStatus == 'completed';

    String dateStr = 'Scheduled Date Pending';
    if (app.interviewScheduledAt != null) {
      dateStr = DateFormat('EEE, MMM d, yyyy • hh:mm a').format(app.interviewScheduledAt!);
    } else if (app.interviewDate != null) {
      dateStr = app.interviewDate!;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: const Color(0xFFEEF2FF),
                  child: Text(
                    initial,
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF6366F1)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                      Text(jobTitle, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isCompleted ? const Color(0xFFECFDF5) : const Color(0xFFEEF2FF),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: isCompleted ? const Color(0xFFA7F3D0) : const Color(0xFFC7D2FE)),
                  ),
                  child: Text(
                    interviewStatus.toUpperCase(),
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isCompleted ? const Color(0xFF059669) : const Color(0xFF4F46E5),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            const SizedBox(height: 10),

            // Date & Type Info
            Row(
              children: [
                const Icon(Icons.calendar_month_rounded, size: 15, color: Color(0xFF6366F1)),
                const SizedBox(width: 6),
                Text(dateStr, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B))),
              ],
            ),
            if (app.interviewType != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(app.interviewType == 'online' ? Icons.videocam_outlined : Icons.business_outlined, size: 15, color: const Color(0xFF64748B)),
                  const SizedBox(width: 6),
                  Text(
                    app.interviewType == 'online' ? 'Online Video Meeting' : 'On-site Office',
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                  ),
                ],
              ),
            ],

            if (app.interviewNotes != null && app.interviewNotes!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Link / Notes: ${app.interviewNotes}',
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF475569)),
                ),
              ),
            ],

            // Feedback & Rating if completed
            if (app.interviewRating != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  ...List.generate(5, (i) {
                    return Icon(
                      i < app.interviewRating! ? Icons.star_rounded : Icons.star_outline_rounded,
                      size: 16,
                      color: const Color(0xFFF59E0B),
                    );
                  }),
                  const SizedBox(width: 6),
                  Text('(${app.interviewRating}/5)', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF475569))),
                ],
              ),
            ],

            if (app.interviewFeedback != null && app.interviewFeedback!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                'Feedback: ${app.interviewFeedback}',
                style: GoogleFonts.inter(fontSize: 12, fontStyle: FontStyle.italic, color: const Color(0xFF475569)),
              ),
            ],

            const SizedBox(height: 12),

            // Action Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (app.candidate != null) ...[
                  IconButton(
                    icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18, color: Color(0xFF6366F1)),
                    tooltip: 'Message Candidate',
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => ChatDetailScreen(otherUser: app.candidate!)),
                      );
                    },
                  ),
                  const SizedBox(width: 6),
                ],
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6366F1),
                    minimumSize: const Size(0, 36),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.rate_review_outlined, size: 15),
                  label: Text(
                    isCompleted ? 'Edit Evaluation' : 'Evaluate & Review',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  onPressed: () => _showEvaluationDialog(app),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
