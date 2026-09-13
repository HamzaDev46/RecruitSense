import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import 'applicants_pipeline_screen.dart';
import 'company_interviews_screen.dart';

class ActivityItemModel {
  final String id;
  final String type;
  final String title;
  final String description;
  final String? timestamp;
  final String? path;
  final String? candidateName;
  final String? jobTitle;
  final String? status;

  ActivityItemModel({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    this.timestamp,
    this.path,
    this.candidateName,
    this.jobTitle,
    this.status,
  });

  factory ActivityItemModel.fromJson(Map<String, dynamic> json) {
    return ActivityItemModel(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'applicant',
      title: json['title']?.toString() ?? 'Activity',
      description: json['description']?.toString() ?? '',
      timestamp: json['timestamp']?.toString(),
      path: json['path']?.toString(),
      candidateName: json['candidate_name']?.toString(),
      jobTitle: json['job_title']?.toString(),
      status: json['status']?.toString(),
    );
  }
}

class CompanyActivityLogScreen extends StatefulWidget {
  const CompanyActivityLogScreen({super.key});

  @override
  State<CompanyActivityLogScreen> createState() => _CompanyActivityLogScreenState();
}

class _CompanyActivityLogScreenState extends State<CompanyActivityLogScreen> {
  final ApiService _apiService = ApiService();
  List<ActivityItemModel> _allActivities = [];
  Map<String, int> _summary = {};
  String _selectedFilter = 'all';
  bool _isLoading = true;
  String? _error;

  final List<Map<String, String>> _filters = [
    {'key': 'all', 'label': 'All'},
    {'key': 'applicant', 'label': 'Applicants'},
    {'key': 'pipeline', 'label': 'Pipeline'},
    {'key': 'interview', 'label': 'Interviews'},
    {'key': 'offer', 'label': 'Offers'},
    {'key': 'hired', 'label': 'Hired'},
    {'key': 'job', 'label': 'Jobs'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchActivityLog();
  }

  Future<void> _fetchActivityLog() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await _apiService.dio.get('/company/activity-log');
      final data = res.data;

      final List<ActivityItemModel> items = [];
      if (data is Map<String, dynamic>) {
        if (data['activity'] != null && data['activity'] is List) {
          for (final a in data['activity']) {
            items.add(ActivityItemModel.fromJson(a as Map<String, dynamic>));
          }
        }
        if (data['summary'] != null && data['summary'] is Map<String, dynamic>) {
          final s = data['summary'] as Map<String, dynamic>;
          _summary = s.map((k, v) => MapEntry(k, (v as num).toInt()));
        }
      }

      if (mounted) {
        setState(() {
          _allActivities = items;
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

  List<ActivityItemModel> get _filteredActivities {
    if (_selectedFilter == 'all') return _allActivities;
    if (_selectedFilter == 'applicant') return _allActivities.where((a) => a.type == 'applicant').toList();
    if (_selectedFilter == 'interview') return _allActivities.where((a) => a.type == 'interview' || a.status == 'interview').toList();
    if (_selectedFilter == 'job') return _allActivities.where((a) => a.type == 'job').toList();
    if (_selectedFilter == 'offer') return _allActivities.where((a) => a.status == 'offered').toList();
    if (_selectedFilter == 'hired') return _allActivities.where((a) => a.status == 'hired').toList();
    if (_selectedFilter == 'pipeline') {
      return _allActivities.where((a) => a.type == 'status' || a.status == 'screening' || a.status == 'shortlisted').toList();
    }
    return _allActivities;
  }

  String _formatTimestamp(String? iso) {
    if (iso == null) return 'Recently';
    try {
      final dt = DateTime.parse(iso).toLocal();
      final now = DateTime.now();
      if (dt.year == now.year && dt.month == now.month && dt.day == now.day) {
        return 'Today at ${DateFormat.jm().format(dt)}';
      }
      final yesterday = now.subtract(const Duration(days: 1));
      if (dt.year == yesterday.year && dt.month == yesterday.month && dt.day == yesterday.day) {
        return 'Yesterday at ${DateFormat.jm().format(dt)}';
      }
      return DateFormat('MMM d, y h:mm a').format(dt);
    } catch (_) {
      return 'Recently';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'shortlisted':
        return const Color(0xFF10B981);
      case 'interview':
        return const Color(0xFF6366F1);
      case 'offered':
        return const Color(0xFF8B5CF6);
      case 'hired':
        return const Color(0xFF0D9488);
      case 'rejected':
        return const Color(0xFFEF4444);
      case 'active':
        return const Color(0xFF10B981);
      case 'screening':
        return const Color(0xFF06B6D4);
      default:
        return const Color(0xFFF59E0B);
    }
  }

  IconData _getTypeIcon(String type, String? status) {
    if (type == 'job') return Icons.work_outline_rounded;
    if (type == 'interview' || status == 'interview') return Icons.calendar_month_rounded;
    if (status == 'offered') return Icons.workspace_premium_rounded;
    if (status == 'hired') return Icons.how_to_reg_rounded;
    if (status == 'shortlisted') return Icons.verified_user_rounded;
    if (status == 'rejected') return Icons.cancel_outlined;
    return Icons.person_outline_rounded;
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
              child: const Icon(Icons.history_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            Text('Activity Log', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchActivityLog,
        color: const Color(0xFF6366F1),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Header summary cards
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hiring Activity Stream',
                      style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A)),
                    ),
                    Text(
                      'Track all candidate actions, pipeline movements, and hiring decisions in real time.',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 14),

                    // Filter chips horizontal list
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _filters.map((f) {
                          final isSelected = _selectedFilter == f['key'];
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(f['label']!),
                              selected: isSelected,
                              onSelected: (_) => setState(() => _selectedFilter = f['key']!),
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
                                side: BorderSide(
                                  color: isSelected ? const Color(0xFF6366F1) : const Color(0xFFE2E8F0),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
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
                        Text('Failed to load activity log', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 6),
                        Text(_error!, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)), textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _fetchActivityLog,
                          icon: const Icon(Icons.refresh_rounded, size: 16),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (_filteredActivities.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.history_toggle_off_rounded, size: 52, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        Text('No activities found', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(
                          'Activities will show up here as candidates apply and progress through your hiring pipeline.',
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
                      final item = _filteredActivities[index];
                      return _buildActivityCard(item);
                    },
                    childCount: _filteredActivities.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityCard(ActivityItemModel item) {
    final statusColor = _getStatusColor(item.status);
    final icon = _getTypeIcon(item.type, item.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: statusColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            item.title,
                            style: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                        ),
                        if (item.status != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                            ),
                            child: Text(
                              item.status!.toUpperCase(),
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: statusColor,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.description,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: const Color(0xFF334155),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 8),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.access_time_rounded, size: 12, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 4),
                  Text(
                    _formatTimestamp(item.timestamp),
                    style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                  ),
                ],
              ),
              if (item.type == 'interview')
                TextButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const CompanyInterviewsScreen()),
                    );
                  },
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('View Interview', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF6366F1))),
                      const SizedBox(width: 2),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 10, color: Color(0xFF6366F1)),
                    ],
                  ),
                )
              else if (item.type == 'applicant' || item.type == 'status')
                TextButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ApplicantsPipelineScreen()),
                    );
                  },
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Review Pipeline', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF6366F1))),
                      const SizedBox(width: 2),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 10, color: Color(0xFF6366F1)),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
