import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';
import '../../models/job_posting.dart';
import '../../providers/application_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/job_provider.dart';
import '../../providers/message_provider.dart';
import '../../providers/notification_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/company_drawer.dart';
import '../auth/login_screen.dart';
import '../jobseeker/messages_screen.dart';
import '../jobseeker/notifications_screen.dart';
import 'applicants_pipeline_screen.dart';
import 'candidate_discovery_screen.dart';
import 'company_activity_log_screen.dart';
import 'company_analytics_screen.dart';
import 'company_interviews_screen.dart';
import 'company_jobs_screen.dart';
import 'company_quiz_bank_screen.dart';
import 'company_settings_screen.dart';
import 'create_job_screen.dart';

class CompanyDashboardScreen extends StatefulWidget {
  const CompanyDashboardScreen({super.key});

  @override
  State<CompanyDashboardScreen> createState() => _CompanyDashboardScreenState();
}

class _CompanyDashboardScreenState extends State<CompanyDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<JobProvider>().fetchCompanyJobs();
      context.read<ApplicationProvider>().fetchCompanyApplicants();
      context.read<NotificationProvider>().fetchNotifications();
      context.read<MessageProvider>().fetchConversations();
    });
  }

  void _showServerSettings() {
    final apiService = ApiService();
    final controller = TextEditingController(text: apiService.baseUrl);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('API Host Settings', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Set custom backend API host (e.g. for physical devices on your LAN):',
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'http://192.168.100.9:8000/api',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              style: GoogleFonts.inter(fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            onPressed: () async {
              await apiService.updateBaseUrl(controller.text.trim());
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _handleDeleteJob(JobPosting job) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Job Listing', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete "${job.title}"? All associated applicants will be removed.', style: GoogleFonts.inter(fontSize: 14)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await Provider.of<JobProvider>(context, listen: false).deleteJob(job.id);
              if (mounted && success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Job listing deleted')),
                );
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Sign Out', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to sign out?', style: GoogleFonts.inter(fontSize: 14)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () async {
              Navigator.pop(ctx);
              await Provider.of<AuthProvider>(context, listen: false).logout();
              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Sign Out', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final jobProvider = Provider.of<JobProvider>(context);
    final applicationProvider = Provider.of<ApplicationProvider>(context);

    final companyName = authProvider.user?.companyProfile?.companyName ??
        authProvider.user?.name ??
        'Recruiter Portal';

    final totalJobs = jobProvider.myCompanyJobs.length;
    final totalApplicants = applicationProvider.companyApplicants.length;
    final shortlisted = applicationProvider.companyApplicants
        .where((a) => a.status.toLowerCase() == 'shortlisted' || (a.totalScore ?? 0) >= 80)
        .length;
    final interviews = applicationProvider.companyApplicants
        .where((a) => a.status.toLowerCase() == 'interview' || a.interviewDate != null)
        .length;

    final unreadNotifs = context.watch<NotificationProvider>().unreadCount;
    final unreadMsgs = context.watch<MessageProvider>().unreadCount;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const CompanyDrawer(currentRoute: 'dashboard'),
      appBar: AppBar(
        titleSpacing: 0,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu_rounded, color: Color(0xFF1E293B)),
            tooltip: 'Menu',
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.business_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                companyName,
                style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          // Notifications icon with badge
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_none_rounded, color: Color(0xFF475569)),
                tooltip: 'Notifications',
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                  );
                },
              ),
              if (unreadNotifs > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Color(0xFFEF4444),
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    alignment: Alignment.center,
                    child: Text(
                      '$unreadNotifs',
                      style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
            ],
          ),
          // Messages icon with badge
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF475569)),
                tooltip: 'Messages',
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MessagesScreen())),
              ),
              if (unreadMsgs > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Color(0xFF6366F1),
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    alignment: Alignment.center,
                    child: Text(
                      '$unreadMsgs',
                      style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: Color(0xFF64748B)),
            tooltip: 'Company Profile & Settings',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanySettingsScreen())),
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Color(0xFF64748B)),
            tooltip: 'Server Settings',
            onPressed: _showServerSettings,
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppTheme.error),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await jobProvider.fetchCompanyJobs();
          await applicationProvider.fetchCompanyApplicants();
          await context.read<NotificationProvider>().fetchNotifications();
          await context.read<MessageProvider>().fetchConversations();
        },
        color: const Color(0xFF6366F1),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Banner
              Text(
                'Recruitment Hub',
                style: GoogleFonts.outfit(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
              Text(
                'AI candidate ranking, RAG resume chat & pipeline management',
                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),

              // 4-Stat Metric Row
              Row(
                children: [
                  _buildStatCard(
                    'Jobs',
                    '$totalJobs',
                    Icons.work_outline_rounded,
                    AppTheme.primary,
                    AppTheme.primaryLight,
                    () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateJobScreen()))
                        .then((_) => jobProvider.fetchCompanyJobs()),
                  ),
                  const SizedBox(width: 10),
                  _buildStatCard(
                    'Applicants',
                    '$totalApplicants',
                    Icons.people_outline_rounded,
                    const Color(0xFF06B6D4),
                    const Color(0xFFECFEFF),
                    () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ApplicantsPipelineScreen())),
                  ),
                  const SizedBox(width: 10),
                  _buildStatCard(
                    'AI Shortlist',
                    '$shortlisted',
                    Icons.auto_awesome_rounded,
                    const Color(0xFF10B981),
                    const Color(0xFFECFDF5),
                    () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ApplicantsPipelineScreen())),
                  ),
                  const SizedBox(width: 10),
                  _buildStatCard(
                    'Interviews',
                    '$interviews',
                    Icons.event_available_rounded,
                    const Color(0xFFF59E0B),
                    const Color(0xFFFFFBEB),
                    () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyInterviewsScreen())),
                  ),
                ],
              ).animate().fadeIn(duration: 400.ms),

              const SizedBox(height: 20),

              // Quick Action Grid (6 Tool Cards)
              Text(
                'Management Tools',
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
              ),
              const SizedBox(height: 10),

              // Row 1: Post Job & Applicants Pipeline
              Row(
                children: [
                  Expanded(
                    child: _buildToolCard(
                      'Post Job',
                      'Create new listing',
                      Icons.add_circle_outline_rounded,
                      const Color(0xFF6366F1),
                      const Color(0xFFEEF2FF),
                      () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateJobScreen()))
                          .then((_) => jobProvider.fetchCompanyJobs()),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildToolCard(
                      'Applicants',
                      'Review pipeline & RAG',
                      Icons.view_kanban_outlined,
                      const Color(0xFF10B981),
                      const Color(0xFFECFDF5),
                      () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ApplicantsPipelineScreen())),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Row 2: Interviews Schedule & Analytics
              Row(
                children: [
                  Expanded(
                    child: _buildToolCard(
                      'Interviews',
                      'Schedule & Reviews',
                      Icons.calendar_month_rounded,
                      const Color(0xFFF59E0B),
                      const Color(0xFFFFFBEB),
                      () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyInterviewsScreen())),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildToolCard(
                      'Analytics',
                      'Hiring Funnel & Audit',
                      Icons.insights_rounded,
                      const Color(0xFF06B6D4),
                      const Color(0xFFECFEFF),
                      () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyAnalyticsScreen())),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Row 3: AI Quiz Bank & Candidate Discovery
              Row(
                children: [
                  Expanded(
                    child: _buildToolCard(
                      'AI Quiz Bank',
                      'Screening questions',
                      Icons.psychology_outlined,
                      const Color(0xFF8B5CF6),
                      const Color(0xFFF5F3FF),
                      () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyQuizBankScreen())),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildToolCard(
                      'Discovery',
                      'Search candidates',
                      Icons.person_search_outlined,
                      const Color(0xFFEC4899),
                      const Color(0xFFFDF2F8),
                      () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CandidateDiscoveryScreen())),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Row 4: Activity Log & Manage Jobs
              Row(
                children: [
                  Expanded(
                    child: _buildToolCard(
                      'Activity Log',
                      'Hiring timeline',
                      Icons.history_rounded,
                      const Color(0xFF0D9488),
                      const Color(0xFFF0FDFA),
                      () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyActivityLogScreen())),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildToolCard(
                      'Manage Jobs',
                      'Active & draft posts',
                      Icons.business_center_outlined,
                      const Color(0xFF4F46E5),
                      const Color(0xFFEEF2FF),
                      () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanyJobsScreen())),
                    ),
                  ),
                ],
              ).animate().fadeIn(delay: 200.ms, duration: 400.ms),

              const SizedBox(height: 24),

              // Active Job Listings Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Company Job Listings',
                    style: GoogleFonts.outfit(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    '$totalJobs Active',
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              if (jobProvider.isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary)),
                  ),
                )
              else if (jobProvider.myCompanyJobs.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.work_off_outlined, size: 48, color: Colors.grey.shade400),
                      const SizedBox(height: 12),
                      Text('No jobs posted yet', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(
                        'Create your first job listing to start receiving AI ranked applications.',
                        style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                )
              else
                ...jobProvider.myCompanyJobs.map((job) => _buildCompanyJobCard(job)),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color, Color bg, [VoidCallback? onTap]) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
                  child: Icon(icon, color: color, size: 16),
                ),
                const SizedBox(height: 8),
                Text(
                  value,
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  title,
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w500, color: const Color(0xFF64748B)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildToolCard(String title, String subtitle, IconData icon, Color color, Color bg, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, size: 10, color: Color(0xFF94A3B8)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCompanyJobCard(JobPosting job) {
    final isClosed = job.status.toLowerCase() == 'closed';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ApplicantsPipelineScreen(
                filterJobId: job.id,
                filterJobTitle: job.title,
              ),
            ),
          );
        },
        borderRadius: BorderRadius.circular(18),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        job.title,
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isClosed ? const Color(0xFFF1F5F9) : const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        isClosed ? 'Closed' : 'Active',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isClosed ? const Color(0xFF64748B) : const Color(0xFF059669),
                        ),
                      ),
                    ),
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert_rounded, color: Color(0xFF64748B), size: 20),
                      onSelected: (val) {
                        if (val == 'edit') {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => CreateJobScreen(jobToEdit: job)),
                          ).then((_) {
                            if (mounted) {
                              context.read<JobProvider>().fetchCompanyJobs();
                            }
                          });
                        } else if (val == 'delete') {
                          _handleDeleteJob(job);
                        }
                      },
                      itemBuilder: (ctx) => [
                        const PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(Icons.edit_outlined, size: 18, color: Color(0xFF6366F1)),
                              SizedBox(width: 8),
                              Text('Edit Listing'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(Icons.delete_outline_rounded, size: 18, color: Color(0xFFEF4444)),
                              SizedBox(width: 8),
                              Text('Delete Listing', style: TextStyle(color: Color(0xFFEF4444))),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Text(
                      job.location ?? 'Remote',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                    const SizedBox(width: 12),
                    const Icon(Icons.work_outline_rounded, size: 14, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Text(
                      job.jobType,
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Tap to view applicants pipeline',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primary,
                      ),
                    ),
                    const Icon(Icons.arrow_forward_rounded, size: 16, color: AppTheme.primary),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
