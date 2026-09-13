import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';
import '../../models/job_posting.dart';
import '../../services/api_service.dart';
import '../../services/job_service.dart';
import 'apply_dialog.dart';
import 'job_detail_screen.dart';

class RecommendedJobItem {
  final JobPosting job;
  final int matchScore;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final List<String> requiredSkills;
  bool isSaved;
  final bool hasApplied;

  RecommendedJobItem({
    required this.job,
    required this.matchScore,
    required this.matchedSkills,
    required this.missingSkills,
    required this.requiredSkills,
    required this.isSaved,
    required this.hasApplied,
  });

  factory RecommendedJobItem.fromJson(Map<String, dynamic> json) {
    final jobMap = (json['job'] ?? json) as Map<String, dynamic>;
    return RecommendedJobItem(
      job: JobPosting.fromJson(jobMap),
      matchScore: json['match_score'] != null ? (json['match_score'] as num).toInt() : 0,
      matchedSkills: (json['matched_skills'] as List? ?? []).map((e) => e.toString()).toList(),
      missingSkills: (json['missing_skills'] as List? ?? []).map((e) => e.toString()).toList(),
      requiredSkills: (json['required_skills'] as List? ?? []).map((e) => e.toString()).toList(),
      isSaved: json['is_saved'] == true,
      hasApplied: json['has_applied'] == true,
    );
  }
}

class RecommendedJobsScreen extends StatefulWidget {
  const RecommendedJobsScreen({super.key});

  @override
  State<RecommendedJobsScreen> createState() => _RecommendedJobsScreenState();
}

class _RecommendedJobsScreenState extends State<RecommendedJobsScreen> {
  final ApiService _apiService = ApiService();
  final JobService _jobService = JobService();
  final TextEditingController _searchController = TextEditingController();

  List<RecommendedJobItem> _allRecommendations = [];
  List<RecommendedJobItem> _filteredRecommendations = [];
  List<String> _candidateSkills = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchRecommendations();
    _searchController.addListener(_applyFilter);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchRecommendations() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _apiService.dio.get('/recommended-jobs');
      final data = response.data;

      final List<RecommendedJobItem> items = [];
      List rawList = [];
      if (data is Map<String, dynamic>) {
        if (data['recommendations'] != null && data['recommendations'] is List) {
          rawList = data['recommendations'];
        }
        if (data['candidate_skills'] != null && data['candidate_skills'] is List) {
          _candidateSkills = (data['candidate_skills'] as List).map((e) => e.toString()).toList();
        }
      } else if (data is List) {
        rawList = data;
      }

      for (final item in rawList) {
        if (item is Map<String, dynamic>) {
          items.add(RecommendedJobItem.fromJson(item));
        }
      }

      if (mounted) {
        setState(() {
          _allRecommendations = items;
          _filteredRecommendations = items;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = _apiService.handleDioError(e);
          _isLoading = false;
        });
      }
    }
  }

  void _applyFilter() {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) {
      setState(() => _filteredRecommendations = _allRecommendations);
      return;
    }

    setState(() {
      _filteredRecommendations = _allRecommendations.where((item) {
        final job = item.job;
        final title = job.title.toLowerCase();
        final company = (job.company?.companyName ?? job.company?.name ?? '').toLowerCase();
        final location = (job.location ?? '').toLowerCase();
        final matched = item.matchedSkills.any((s) => s.toLowerCase().contains(query));
        final missing = item.missingSkills.any((s) => s.toLowerCase().contains(query));
        return title.contains(query) || company.contains(query) || location.contains(query) || matched || missing;
      }).toList();
    });
  }

  Future<void> _toggleSave(RecommendedJobItem item) async {
    final oldState = item.isSaved;
    setState(() => item.isSaved = !oldState);

    try {
      await _jobService.toggleSaveJob(item.job.id, oldState);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(oldState ? 'Removed from saved jobs' : 'Job saved to your bookmarks'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        setState(() => item.isSaved = oldState);
      }
    }
  }

  void _handleApply(RecommendedJobItem item) {
    showDialog(
      context: context,
      builder: (ctx) => ApplyDialog(job: item.job),
    ).then((applied) {
      if (applied == true && mounted) {
        _fetchRecommendations();
      }
    });
  }

  Color _getScoreColor(int score) {
    if (score >= 70) return const Color(0xFF10B981);
    if (score >= 40) return const Color(0xFFF59E0B);
    return const Color(0xFFEF4444);
  }

  Color _getScoreBg(int score) {
    if (score >= 70) return const Color(0xFFECFDF5);
    if (score >= 40) return const Color(0xFFFFFBEB);
    return const Color(0xFFFEF2F2);
  }

  @override
  Widget build(BuildContext context) {
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
              child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            Text(
              'Recommended Jobs',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchRecommendations,
        color: const Color(0xFF6366F1),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Header Banner & Detected Skills
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF6366F1).withValues(alpha: 0.25),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.psychology_rounded, color: Colors.white, size: 22),
                              const SizedBox(width: 8),
                              Text(
                                'AI Match Insights',
                                style: GoogleFonts.outfit(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Jobs automatically ranked based on your resume, experiences, and skill proficiencies.',
                            style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withValues(alpha: 0.85)),
                          ),
                          if (_candidateSkills.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(
                              'DETECTED CANDIDATE SKILLS:',
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: Colors.white.withValues(alpha: 0.75),
                                letterSpacing: 0.8,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: _candidateSkills.take(8).map((skill) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                                  ),
                                  child: Text(
                                    skill,
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white,
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ],
                      ),
                    ).animate().fadeIn(duration: 400.ms),

                    const SizedBox(height: 14),

                    // Search Bar
                    TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Search recommended roles or skills...',
                        hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                        prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF64748B), size: 20),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18),
                                onPressed: () => _searchController.clear(),
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
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Recommended Matches',
                          style: GoogleFonts.outfit(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          '${_filteredRecommendations.length} available',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Content Body
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary)),
                ),
              )
            else if (_error != null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 48),
                        const SizedBox(height: 12),
                        Text('Failed to load recommendations', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 6),
                        Text(_error!, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)), textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _fetchRecommendations,
                          icon: const Icon(Icons.refresh_rounded, size: 16),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (_filteredRecommendations.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.work_outline_rounded, size: 52, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        Text(
                          _searchController.text.isNotEmpty ? 'No matches for "${_searchController.text}"' : 'No recommendations yet',
                          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Complete your profile and upload a resume to get AI-matched jobs.',
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
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final item = _filteredRecommendations[index];
                      return _buildRecommendationCard(item);
                    },
                    childCount: _filteredRecommendations.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendationCard(RecommendedJobItem item) {
    final job = item.job;
    final scoreColor = _getScoreColor(item.matchScore);
    final scoreBg = _getScoreBg(item.matchScore);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => JobDetailScreen(job: job)),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Title, Company, Match Score Badge & Bookmark
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
                            job.company?.name ?? 'Company',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Match Score Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: scoreBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: scoreColor.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.auto_awesome_rounded, size: 12, color: scoreColor),
                          const SizedBox(width: 4),
                          Text(
                            '${item.matchScore}% Match',
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: scoreColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 4),
                    IconButton(
                      icon: Icon(
                        item.isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                        color: item.isSaved ? const Color(0xFF6366F1) : const Color(0xFF94A3B8),
                        size: 22,
                      ),
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                      onPressed: () => _toggleSave(item),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                // Job Details Badges (Location, Type, Work mode, Salary)
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    if (job.location != null && job.location!.isNotEmpty)
                      _buildMetaChip(Icons.location_on_outlined, job.location!),
                    if (job.jobType.isNotEmpty)
                      _buildMetaChip(Icons.work_outline_rounded, job.jobType),
                    if (job.experienceLevel != null && job.experienceLevel!.isNotEmpty)
                      _buildMetaChip(Icons.trending_up_rounded, job.experienceLevel!),
                    if (job.salaryRange != null && job.salaryRange!.isNotEmpty)
                      _buildMetaChip(Icons.payments_outlined, job.salaryRange!),
                  ],
                ),

                const SizedBox(height: 12),

                // Skills Breakdown Section
                if (item.matchedSkills.isNotEmpty || item.missingSkills.isNotEmpty) ...[
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 10),

                  if (item.matchedSkills.isNotEmpty) ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle_outline_rounded, size: 14, color: Color(0xFF10B981)),
                        const SizedBox(width: 6),
                        Text(
                          'Matched Skills (${item.matchedSkills.length}):',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      children: item.matchedSkills.take(6).map((skill) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFA7F3D0)),
                          ),
                          child: Text(
                            skill,
                            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: const Color(0xFF065F46)),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 6),
                  ],

                  if (item.missingSkills.isNotEmpty) ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Icon(Icons.info_outline_rounded, size: 14, color: Color(0xFFF59E0B)),
                        const SizedBox(width: 6),
                        Text(
                          'Skill Gaps (${item.missingSkills.length}):',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      children: item.missingSkills.take(5).map((skill) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Text(
                            skill,
                            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w500, color: const Color(0xFF64748B)),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],

                const SizedBox(height: 12),

                // Bottom Action: Apply Button
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (item.hasApplied)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.done_all_rounded, size: 14, color: Color(0xFF64748B)),
                            const SizedBox(width: 4),
                            Text(
                              'Applied',
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      )
                    else
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        onPressed: () => _handleApply(item),
                        icon: const Icon(Icons.send_rounded, size: 14),
                        label: Text('Apply Now', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700)),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetaChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: const Color(0xFF64748B)),
          const SizedBox(width: 4),
          Text(
            text,
            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: const Color(0xFF475569)),
          ),
        ],
      ),
    );
  }
}
