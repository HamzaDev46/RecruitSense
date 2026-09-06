import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/job_posting.dart';
import '../../providers/job_provider.dart';
import '../../widgets/job_card.dart';
import 'job_detail_screen.dart';

class BrowseJobsScreen extends StatefulWidget {
  const BrowseJobsScreen({super.key});

  @override
  State<BrowseJobsScreen> createState() => _BrowseJobsScreenState();
}

class _BrowseJobsScreenState extends State<BrowseJobsScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  late TabController _tabController;
  String _selectedType = 'All';
  String _selectedLevel = 'All';

  final List<String> _jobTypes = ['All', 'Full-time', 'Part-time', 'Remote', 'Contract', 'Internship'];
  final List<String> _experienceLevels = ['All', 'Entry Level', 'Mid Level', 'Senior', 'Lead'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<JobProvider>();
      provider.fetchJobs();
      provider.fetchRecommendations();
      provider.fetchSavedJobs();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _showFilterModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Filter Jobs',
                        style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                      TextButton(
                        onPressed: () {
                          setModalState(() {
                            _selectedType = 'All';
                            _selectedLevel = 'All';
                          });
                        },
                        child: Text(
                          'Reset',
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6366F1), fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text('Job Type', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: _jobTypes.map((t) {
                      final isSelected = _selectedType == t;
                      return ChoiceChip(
                        label: Text(t),
                        selected: isSelected,
                        onSelected: (val) {
                          setModalState(() => _selectedType = val ? t : 'All');
                        },
                        selectedColor: const Color(0xFF6366F1),
                        labelStyle: GoogleFonts.inter(
                          fontSize: 12,
                          color: isSelected ? Colors.white : const Color(0xFF475569),
                          fontWeight: FontWeight.w600,
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  Text('Experience Level', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: _experienceLevels.map((lvl) {
                      final isSelected = _selectedLevel == lvl;
                      return ChoiceChip(
                        label: Text(lvl),
                        selected: isSelected,
                        onSelected: (val) {
                          setModalState(() => _selectedLevel = val ? lvl : 'All');
                        },
                        selectedColor: const Color(0xFF6366F1),
                        labelStyle: GoogleFonts.inter(
                          fontSize: 12,
                          color: isSelected ? Colors.white : const Color(0xFF475569),
                          fontWeight: FontWeight.w600,
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        context.read<JobProvider>().fetchJobs(
                          search: _searchController.text.trim(),
                          jobType: _selectedType,
                          refresh: true,
                        );
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1)),
                      child: Text('Apply Filters', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final jobProvider = context.watch<JobProvider>();
    final savedIds = jobProvider.savedJobIds;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Explore Jobs',
          style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF6366F1),
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: const Color(0xFF6366F1),
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
          tabs: [
            Tab(text: 'All Jobs (${jobProvider.jobs.length})'),
            Tab(text: 'AI Match (${jobProvider.recommendedJobs.length})'),
            Tab(text: 'Saved (${jobProvider.savedJobs.length})'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search title, tech stack, company...',
                      prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                    ),
                    onSubmitted: (query) {
                      jobProvider.fetchJobs(search: query.trim(), refresh: true);
                    },
                  ),
                ),
                const SizedBox(width: 10),
                InkWell(
                  onTap: _showFilterModal,
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFC7D2FE)),
                    ),
                    child: const Icon(Icons.tune_rounded, color: Color(0xFF6366F1), size: 20),
                  ),
                ),
              ],
            ),
          ),

          // Tab views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // All Jobs
                _buildJobList(jobProvider.jobs, savedIds, jobProvider.isLoading),

                // AI Recommended
                _buildJobList(jobProvider.recommendedJobs, savedIds, false),

                // Saved Jobs
                _buildJobList(jobProvider.savedJobs, savedIds, false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJobList(List<JobPosting> jobs, Set<int> savedIds, bool loading) {
    if (loading && jobs.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)));
    }

    if (jobs.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.work_off_outlined, size: 48, color: Color(0xFF94A3B8)),
              const SizedBox(height: 12),
              Text(
                'No jobs found',
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
              ),
              const SizedBox(height: 4),
              Text(
                'Try adjusting your search keywords or filters.',
                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: jobs.length,
      itemBuilder: (ctx, i) {
        final job = jobs[i];
        final isSaved = savedIds.contains(job.id);

        return JobCard(
          job: job,
          isSaved: isSaved,
          onBookmarkTap: () {
            context.read<JobProvider>().toggleSaveJob(job.id, isSaved);
          },
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => JobDetailScreen(job: job)),
            );
          },
        );
      },
    );
  }
}
