import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';

class JobAlertModel {
  final int id;
  final String? keyword;
  final String? skills;
  final String? location;
  final int minMatchScore;
  bool isActive;
  final int matchedJobsCount;
  final List<dynamic> latestMatches;
  final String? createdAt;

  JobAlertModel({
    required this.id,
    this.keyword,
    this.skills,
    this.location,
    required this.minMatchScore,
    required this.isActive,
    required this.matchedJobsCount,
    required this.latestMatches,
    this.createdAt,
  });

  factory JobAlertModel.fromJson(Map<String, dynamic> json) {
    return JobAlertModel(
      id: json['id'] as int,
      keyword: json['keyword'] as String?,
      skills: json['skills'] as String?,
      location: json['location'] as String?,
      minMatchScore: json['min_match_score'] != null ? (json['min_match_score'] as num).toInt() : 50,
      isActive: json['is_active'] == true || json['is_active'] == 1,
      matchedJobsCount: json['matched_jobs_count'] != null ? (json['matched_jobs_count'] as num).toInt() : 0,
      latestMatches: json['latest_matches'] as List? ?? [],
      createdAt: json['created_at'] as String?,
    );
  }
}

class JobAlertsScreen extends StatefulWidget {
  const JobAlertsScreen({super.key});

  @override
  State<JobAlertsScreen> createState() => _JobAlertsScreenState();
}

class _JobAlertsScreenState extends State<JobAlertsScreen> {
  final ApiService _apiService = ApiService();
  List<JobAlertModel> _alerts = [];
  String _profileSkills = '';
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchAlerts();
  }

  Future<void> _fetchAlerts() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await _apiService.dio.get('/job-alerts');
      final data = res.data;

      final List<JobAlertModel> list = [];
      if (data is Map<String, dynamic>) {
        if (data['alerts'] != null && data['alerts'] is List) {
          for (final a in data['alerts']) {
            list.add(JobAlertModel.fromJson(a as Map<String, dynamic>));
          }
        }
        _profileSkills = data['profile_skills']?.toString() ?? '';
      }

      if (mounted) {
        setState(() {
          _alerts = list;
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

  Future<void> _toggleAlertStatus(JobAlertModel alert) async {
    final oldState = alert.isActive;
    setState(() => alert.isActive = !oldState);

    try {
      await _apiService.dio.put('/job-alerts/${alert.id}', data: {
        'is_active': !oldState,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(!oldState ? 'Alert activated' : 'Alert paused'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => alert.isActive = oldState);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_apiService.handleDioError(e))),
        );
      }
    }
  }

  Future<void> _deleteAlert(JobAlertModel alert) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Job Alert', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to remove this job alert?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _apiService.dio.delete('/job-alerts/${alert.id}');
      if (mounted) {
        setState(() => _alerts.removeWhere((a) => a.id == alert.id));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Job alert deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_apiService.handleDioError(e))),
        );
      }
    }
  }

  void _showAlertFormDialog([JobAlertModel? alertToEdit]) {
    final isEditing = alertToEdit != null;
    final keywordCtrl = TextEditingController(text: alertToEdit?.keyword ?? '');
    final skillsCtrl = TextEditingController(text: alertToEdit?.skills ?? '');
    final locationCtrl = TextEditingController(text: alertToEdit?.location ?? '');
    double minScore = (alertToEdit?.minMatchScore ?? 50).toDouble();
    bool isActive = alertToEdit?.isActive ?? true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isEditing ? 'Edit Job Alert' : 'Create New Job Alert',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF64748B)),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Keyword
              Text('Job Keyword / Title', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
              const SizedBox(height: 6),
              TextField(
                controller: keywordCtrl,
                decoration: InputDecoration(
                  hintText: 'e.g. Flutter Developer, React, Frontend',
                  hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
              const SizedBox(height: 12),

              // Skills
              Text('Target Skills (comma separated)', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
              const SizedBox(height: 6),
              TextField(
                controller: skillsCtrl,
                decoration: InputDecoration(
                  hintText: _profileSkills.isNotEmpty ? 'e.g. $_profileSkills' : 'e.g. Dart, Flutter, REST API',
                  hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
              const SizedBox(height: 12),

              // Location
              Text('Preferred Location', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
              const SizedBox(height: 6),
              TextField(
                controller: locationCtrl,
                decoration: InputDecoration(
                  hintText: 'e.g. Remote, New York, London',
                  hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
              const SizedBox(height: 14),

              // Match Score Slider
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Minimum Match Threshold', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(8)),
                    child: Text('${minScore.toInt()}%', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: const Color(0xFF6366F1))),
                  ),
                ],
              ),
              Slider(
                value: minScore,
                min: 30,
                max: 95,
                divisions: 13,
                activeColor: const Color(0xFF6366F1),
                inactiveColor: const Color(0xFFE2E8F0),
                label: '${minScore.toInt()}%',
                onChanged: (val) => setModalState(() => minScore = val),
              ),

              // Active Switch
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Active Alert Status', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                  Switch(
                    value: isActive,
                    activeColor: const Color(0xFF6366F1),
                    onChanged: (val) => setModalState(() => isActive = val),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () async {
                    final kw = keywordCtrl.text.trim();
                    final sk = skillsCtrl.text.trim();
                    final loc = locationCtrl.text.trim();

                    if (kw.isEmpty && sk.isEmpty && _profileSkills.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please provide at least a keyword or skill')),
                      );
                      return;
                    }

                    final payload = {
                      'keyword': kw.isNotEmpty ? kw : null,
                      'skills': sk.isNotEmpty ? sk : null,
                      'location': loc.isNotEmpty ? loc : null,
                      'min_match_score': minScore.toInt(),
                      'is_active': isActive,
                    };

                    try {
                      if (isEditing) {
                        await _apiService.dio.put('/job-alerts/${alertToEdit.id}', data: payload);
                      } else {
                        await _apiService.dio.post('/job-alerts', data: payload);
                      }
                      if (mounted) {
                        Navigator.pop(ctx);
                        _fetchAlerts();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(isEditing ? 'Job alert updated!' : 'Job alert created!')),
                        );
                      }
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(_apiService.handleDioError(e))),
                        );
                      }
                    }
                  },
                  child: Text(
                    isEditing ? 'Save Changes' : 'Create Job Alert',
                    style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeCount = _alerts.where((a) => a.isActive).length;
    final totalMatches = _alerts.fold<int>(0, (sum, a) => sum + a.matchedJobsCount);

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
              child: const Icon(Icons.notifications_active_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            Text('Job Alerts', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAlertFormDialog(),
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: Text('New Alert', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white)),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchAlerts,
        color: const Color(0xFF6366F1),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Stats Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _buildStatBox('Total Alerts', '${_alerts.length}', Icons.notifications_none_rounded, const Color(0xFF6366F1), const Color(0xFFEEF2FF)),
                        const SizedBox(width: 10),
                        _buildStatBox('Active', '$activeCount', Icons.check_circle_outline_rounded, const Color(0xFF10B981), const Color(0xFFECFDF5)),
                        const SizedBox(width: 10),
                        _buildStatBox('Matches', '$totalMatches', Icons.work_outline_rounded, const Color(0xFFF59E0B), const Color(0xFFFFFBEB)),
                      ],
                    ).animate().fadeIn(duration: 400.ms),

                    const SizedBox(height: 16),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Configured Alerts',
                          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                        ),
                        Text(
                          'Instant AI matching',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

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
                        Text('Failed to load alerts', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 6),
                        Text(_error!, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)), textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _fetchAlerts,
                          icon: const Icon(Icons.refresh_rounded, size: 16),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (_alerts.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.notifications_off_outlined, size: 52, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        Text('No job alerts yet', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(
                          'Create custom alerts for roles or skills you want to track automatically.',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                          onPressed: () => _showAlertFormDialog(),
                          icon: const Icon(Icons.add_rounded, size: 16),
                          label: const Text('Create First Alert'),
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
                      final alert = _alerts[index];
                      return _buildAlertCard(alert);
                    },
                    childCount: _alerts.length,
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
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
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
            const SizedBox(height: 6),
            Text(count, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A))),
            Text(title, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
          ],
        ),
      ),
    );
  }

  Widget _buildAlertCard(JobAlertModel alert) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: alert.isActive ? const Color(0xFFE2E8F0) : const Color(0xFFF1F5F9),
        ),
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
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: alert.isActive ? const Color(0xFFEEF2FF) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.notifications_active_outlined,
                  color: alert.isActive ? const Color(0xFF6366F1) : const Color(0xFF94A3B8),
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      alert.keyword?.isNotEmpty == true ? alert.keyword! : (alert.skills ?? 'Skill-based Alert'),
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: alert.isActive ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                      ),
                    ),
                    Text(
                      'Threshold: ${alert.minMatchScore}% match',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              Switch(
                value: alert.isActive,
                activeColor: const Color(0xFF6366F1),
                onChanged: (_) => _toggleAlertStatus(alert),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Chips for details
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              if (alert.location != null && alert.location!.isNotEmpty)
                _buildChip(Icons.location_on_outlined, alert.location!),
              if (alert.skills != null && alert.skills!.isNotEmpty)
                _buildChip(Icons.code_rounded, alert.skills!),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: alert.matchedJobsCount > 0 ? const Color(0xFFECFDF5) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: alert.matchedJobsCount > 0 ? const Color(0xFFA7F3D0) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.work_outline_rounded,
                      size: 12,
                      color: alert.matchedJobsCount > 0 ? const Color(0xFF065F46) : const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${alert.matchedJobsCount} Matched Jobs',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: alert.matchedJobsCount > 0 ? const Color(0xFF065F46) : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 8),

          // Actions
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                onPressed: () => _showAlertFormDialog(alert),
                icon: const Icon(Icons.edit_outlined, size: 14, color: Color(0xFF64748B)),
                label: Text('Edit', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
              ),
              const SizedBox(width: 4),
              TextButton.icon(
                onPressed: () => _deleteAlert(alert),
                icon: const Icon(Icons.delete_outline_rounded, size: 14, color: Color(0xFFEF4444)),
                label: Text('Delete', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFEF4444))),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChip(IconData icon, String text) {
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
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
