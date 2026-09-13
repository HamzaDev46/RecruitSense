import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';
import '../../models/job_posting.dart';
import '../../providers/job_provider.dart';
import 'applicants_pipeline_screen.dart';
import 'create_job_screen.dart';

class CompanyJobsScreen extends StatefulWidget {
  const CompanyJobsScreen({super.key});

  @override
  State<CompanyJobsScreen> createState() => _CompanyJobsScreenState();
}

class _CompanyJobsScreenState extends State<CompanyJobsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedStatus = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<JobProvider>().fetchCompanyJobs();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _handleDeleteJob(JobPosting job) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Job Listing', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete "${job.title}"? Associated applicants will also be removed.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context.read<JobProvider>().deleteJob(job.id);
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

  List<JobPosting> _filterJobs(List<JobPosting> allJobs) {
    final query = _searchController.text.trim().toLowerCase();

    return allJobs.where((job) {
      final matchesQuery = query.isEmpty ||
          job.title.toLowerCase().contains(query) ||
          (job.location ?? '').toLowerCase().contains(query) ||
          job.jobType.toLowerCase().contains(query);

      final status = job.status.toLowerCase();
      final matchesStatus = _selectedStatus == 'all' ||
          (_selectedStatus == 'active' && status == 'active') ||
          (_selectedStatus == 'draft' && status == 'draft') ||
          (_selectedStatus == 'closed' && status == 'closed');

      return matchesQuery && matchesStatus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final jobProvider = context.watch<JobProvider>();
    final allJobs = jobProvider.myCompanyJobs;
    final filteredJobs = _filterJobs(allJobs);

    final activeCount = allJobs.where((j) => j.status.toLowerCase() == 'active').length;
    final draftCount = allJobs.where((j) => j.status.toLowerCase() == 'draft').length;
    final closedCount = allJobs.where((j) => j.status.toLowerCase() == 'closed').length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.business_center_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            Text('Manage Jobs', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CreateJobScreen()),
          ).then((_) => context.read<JobProvider>().fetchCompanyJobs());
        },
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: Text('Post Job', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white)),
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<JobProvider>().fetchCompanyJobs(),
        color: const Color(0xFF6366F1),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Stats & Search header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Stats Row
                    Row(
                      children: [
                        _buildStatBox('Total', '${allJobs.length}', Icons.work_outline_rounded, const Color(0xFF6366F1), const Color(0xFFEEF2FF)),
                        const SizedBox(width: 10),
                        _buildStatBox('Active', '$activeCount', Icons.check_circle_outline_rounded, const Color(0xFF10B981), const Color(0xFFECFDF5)),
                        const SizedBox(width: 10),
                        _buildStatBox('Drafts', '$draftCount', Icons.edit_note_rounded, const Color(0xFF64748B), const Color(0xFFF1F5F9)),
                        const SizedBox(width: 10),
                        _buildStatBox('Closed', '$closedCount', Icons.archive_outlined, const Color(0xFFEF4444), const Color(0xFFFEF2F2)),
                      ],
                    ).animate().fadeIn(duration: 400.ms),

                    const SizedBox(height: 16),

                    // Search input
                    TextField(
                      controller: _searchController,
                      onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(
                        hintText: 'Search posted jobs...',
                        hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                        prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF64748B), size: 20),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {});
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Filter chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildFilterChip('all', 'All (${allJobs.length})'),
                          const SizedBox(width: 8),
                          _buildFilterChip('active', 'Active ($activeCount)'),
                          const SizedBox(width: 8),
                          _buildFilterChip('draft', 'Drafts ($draftCount)'),
                          const SizedBox(width: 8),
                          _buildFilterChip('closed', 'Closed ($closedCount)'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            if (jobProvider.isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary)),
                ),
              )
            else if (filteredJobs.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.work_off_outlined, size: 52, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        Text('No job listings found', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(
                          _searchController.text.isNotEmpty
                              ? 'No jobs match your search query.'
                              : 'Create your first job listing to start receiving applications.',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final job = filteredJobs[index];
                      return _buildJobCard(job);
                    },
                    childCount: filteredJobs.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBox(String title, String count, IconData icon, Color color, Color bg) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 14),
            ),
            const SizedBox(height: 4),
            Text(count, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A))),
            Text(title, style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B))),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _selectedStatus == key;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _selectedStatus = key),
      selectedColor: const Color(0xFFEEF2FF),
      checkmarkColor: const Color(0xFF6366F1),
      labelStyle: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        color: isSelected ? const Color(0xFF6366F1) : const Color(0xFF64748B),
      ),
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: isSelected ? const Color(0xFF6366F1) : const Color(0xFFE2E8F0)),
      ),
    );
  }

  Widget _buildJobCard(JobPosting job) {
    final status = job.status.toLowerCase();
    final isActive = status == 'active';
    final applicantsCount = job.applicantsCount ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      job.title,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${job.location} • ${job.jobType}',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isActive ? const Color(0xFFECFDF5) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isActive ? const Color(0xFFA7F3D0) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: isActive ? const Color(0xFF065F46) : const Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Meta details row
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              if (job.location != null && job.location!.isNotEmpty)
                _buildMetaBadge(Icons.location_on_outlined, job.location!),
              if (job.jobType.isNotEmpty)
                _buildMetaBadge(Icons.work_outline_rounded, job.jobType),
              if (job.experienceLevel != null && job.experienceLevel!.isNotEmpty)
                _buildMetaBadge(Icons.trending_up_rounded, job.experienceLevel!),
              if (job.salaryRange != null && job.salaryRange!.isNotEmpty)
                _buildMetaBadge(Icons.payments_outlined, job.salaryRange!),
            ],
          ),

          const SizedBox(height: 14),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 10),

          // Action buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.people_outline_rounded, size: 14, color: Color(0xFF6366F1)),
                    const SizedBox(width: 4),
                    Text(
                      '$applicantsCount Applicants',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF6366F1)),
                    ),
                  ],
                ),
              ),

              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFFEF4444), size: 20),
                    tooltip: 'Delete Job',
                    onPressed: () => _handleDeleteJob(job),
                  ),
                  const SizedBox(width: 4),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ApplicantsPipelineScreen()),
                      );
                    },
                    child: Text('Review Pipeline', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetaBadge(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: const Color(0xFF64748B)),
          const SizedBox(width: 4),
          Text(text, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF475569))),
        ],
      ),
    );
  }
}
