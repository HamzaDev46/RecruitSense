import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/application.dart';
import '../../providers/application_provider.dart';
import '../../widgets/status_badge.dart';
import '../jobseeker/chat_detail_screen.dart';

class ApplicantsPipelineScreen extends StatefulWidget {
  final int? filterJobId;
  final String? filterJobTitle;

  const ApplicantsPipelineScreen({
    super.key,
    this.filterJobId,
    this.filterJobTitle,
  });

  @override
  State<ApplicantsPipelineScreen> createState() => _ApplicantsPipelineScreenState();
}

class _ApplicantsPipelineScreenState extends State<ApplicantsPipelineScreen> {
  String _selectedFilter = 'All';
  final List<String> _filters = ['All', 'Shortlisted', 'Interview', 'Screening', 'Hired', 'Rejected'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ApplicationProvider>(context, listen: false).fetchCompanyApplicants(
        jobId: widget.filterJobId,
      );
    });
  }

  void _showScheduleInterviewDialog(Application applicant) {
    DateTime selectedDate = DateTime.now().add(const Duration(days: 1));
    TimeOfDay selectedTime = const TimeOfDay(hour: 14, minute: 0);
    String interviewType = 'online';
    final notesController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                left: 20,
                right: 20,
                top: 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Schedule Interview',
                      style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Candidate: ${applicant.candidate?.name ?? 'Applicant'}',
                      style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: selectedDate,
                                firstDate: DateTime.now(),
                                lastDate: DateTime.now().add(const Duration(days: 90)),
                              );
                              if (picked != null) {
                                setModalState(() => selectedDate = picked);
                              }
                            },
                            icon: const Icon(Icons.calendar_month_rounded, size: 18),
                            label: Text(
                              DateFormat('MMM d, yyyy').format(selectedDate),
                              style: GoogleFonts.inter(fontSize: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              final picked = await showTimePicker(
                                context: context,
                                initialTime: selectedTime,
                              );
                              if (picked != null) {
                                setModalState(() => selectedTime = picked);
                              }
                            },
                            icon: const Icon(Icons.access_time_rounded, size: 18),
                            label: Text(
                              selectedTime.format(context),
                              style: GoogleFonts.inter(fontSize: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text('Interview Type', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        ChoiceChip(
                          label: const Text('Online Meeting'),
                          selected: interviewType == 'online',
                          onSelected: (val) => setModalState(() => interviewType = 'online'),
                        ),
                        const SizedBox(width: 10),
                        ChoiceChip(
                          label: const Text('On-site Office'),
                          selected: interviewType == 'in_person',
                          onSelected: (val) => setModalState(() => interviewType = 'in_person'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesController,
                      maxLines: 2,
                      decoration: InputDecoration(
                        hintText: 'Notes / Meeting Link (optional)',
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () async {
                          final provider = context.read<ApplicationProvider>();
                          final messenger = ScaffoldMessenger.of(context);
                          Navigator.pop(ctx);
                          final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
                          final timeStr = '${selectedTime.hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')}:00';

                          final success = await provider.scheduleInterview(
                            applicationId: applicant.id,
                            interviewDate: dateStr,
                            interviewTime: timeStr,
                            interviewType: interviewType,
                            interviewNotes: notesController.text.trim(),
                          );

                          if (mounted && success) {
                            messenger.showSnackBar(
                              const SnackBar(
                                content: Text('Interview scheduled and email invitation sent!'),
                                backgroundColor: Color(0xFF10B981),
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1)),
                        child: Text(
                          'Confirm & Send Invitation',
                          style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700),
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

  void _showStatusUpdateDialog(Application applicant) {
    final applicationProvider = Provider.of<ApplicationProvider>(context, listen: false);

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Update Candidate Pipeline',
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              Text(
                'Candidate: ${applicant.candidate?.name ?? 'Applicant'}',
                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              _buildStatusOption(ctx, applicationProvider, applicant, 'shortlisted', 'Shortlist Candidate', Icons.verified_rounded, const Color(0xFF10B981)),
              _buildStatusOption(ctx, applicationProvider, applicant, 'interview', 'Move to Interview Stage', Icons.calendar_month_rounded, const Color(0xFF6366F1)),
              _buildStatusOption(ctx, applicationProvider, applicant, 'hired', 'Mark as Hired / Offer', Icons.celebration_rounded, const Color(0xFF059669)),
              _buildStatusOption(ctx, applicationProvider, applicant, 'rejected', 'Reject Application', Icons.cancel_rounded, const Color(0xFFEF4444)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusOption(
    BuildContext ctx,
    ApplicationProvider provider,
    Application applicant,
    String status,
    String label,
    IconData icon,
    Color color,
  ) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(label, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
      onTap: () async {
        Navigator.pop(ctx);
        final success = await provider.updateStatus(applicant.id, status);
        if (mounted && success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Updated to ${status.toUpperCase()}')),
          );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final applicationProvider = Provider.of<ApplicationProvider>(context);

    var applicants = applicationProvider.companyApplicants;
    if (_selectedFilter != 'All') {
      applicants = applicants.where((a) => a.status.toLowerCase() == _selectedFilter.toLowerCase()).toList();
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text(
          widget.filterJobTitle != null ? 'Applicants • ${widget.filterJobTitle}' : 'Applicant Pipeline',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () => applicationProvider.fetchCompanyApplicants(jobId: widget.filterJobId),
        child: Column(
          children: [
            // Filter Pills
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _filters.map((f) {
                    final isSelected = _selectedFilter == f;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(f),
                        selected: isSelected,
                        onSelected: (_) => setState(() => _selectedFilter = f),
                        selectedColor: AppTheme.primary,
                        backgroundColor: Colors.white,
                        labelStyle: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? Colors.white : const Color(0xFF475569),
                        ),
                        side: BorderSide(color: isSelected ? AppTheme.primary : const Color(0xFFE2E8F0)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        showCheckmark: false,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            // Applicant List
            Expanded(
              child: applicationProvider.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary)),
                    )
                  : applicants.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.people_outline_rounded, size: 56, color: Colors.grey.shade400),
                              const SizedBox(height: 12),
                              Text(
                                'No candidates found in this stage',
                                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF475569)),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                          itemCount: applicants.length,
                          itemBuilder: (context, index) {
                            final applicant = applicants[index];
                            return _buildApplicantCard(applicant);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildApplicantCard(Application applicant) {
    final name = applicant.candidate?.name ?? 'Candidate';
    final jobTitle = applicant.job?.title ?? 'Position';
    final dateStr = applicant.createdAt != null ? DateFormat('MMM d').format(applicant.createdAt!) : '';

    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'C';
    final isTopMatch = (applicant.totalScore ?? 0) >= 80;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isTopMatch ? const Color(0xFFA7F3D0) : const Color(0xFFE2E8F0),
          width: isTopMatch ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Avatar + Candidate Info + Status
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF2FF),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFC7D2FE)),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    initial,
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primary),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              name,
                              style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (isTopMatch) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFA7F3D0)),
                              ),
                              child: Text(
                                'AI Auto-Shortlisted',
                                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF059669)),
                              ),
                            ),
                          ],
                        ],
                      ),
                      Text(
                        '$jobTitle • $dateStr',
                        style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
                StatusBadge(status: applicant.status),
              ],
            ),

            const SizedBox(height: 14),

            // AI Scoring Pills Row
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildMetric('Resume AI', applicant.resumeScore),
                  Container(height: 24, width: 1, color: const Color(0xFFE2E8F0)),
                  _buildMetric('Quiz Score', applicant.quizScore),
                  Container(height: 24, width: 1, color: const Color(0xFFE2E8F0)),
                  _buildMetric('Total AI Score', applicant.totalScore, isHighlight: true),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Action Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (applicant.candidate != null) ...[
                  IconButton(
                    icon: const Icon(Icons.chat_bubble_outline_rounded, size: 20, color: Color(0xFF6366F1)),
                    tooltip: 'Message Candidate',
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ChatDetailScreen(otherUser: applicant.candidate!),
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: 4),
                ],
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 36),
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.calendar_month_rounded, size: 16),
                  label: Text('Schedule', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                  onPressed: () => _showScheduleInterviewDialog(applicant),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6366F1),
                    minimumSize: const Size(0, 36),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.swap_horiz_rounded, size: 16),
                  label: Text('Stage', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                  onPressed: () => _showStatusUpdateDialog(applicant),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetric(String label, num? score, {bool isHighlight = false}) {
    final text = score != null ? '${score.toInt()}%' : '--';
    Color color = const Color(0xFF64748B);
    if (score != null) {
      if (score >= 80) {
        color = const Color(0xFF10B981);
      } else if (score >= 60) {
        color = AppTheme.primary;
      } else {
        color = const Color(0xFFF59E0B);
      }
    }

    return Column(
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF94A3B8))),
        const SizedBox(height: 2),
        Text(
          text,
          style: GoogleFonts.outfit(
            fontSize: 14,
            fontWeight: isHighlight ? FontWeight.w800 : FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }
}
