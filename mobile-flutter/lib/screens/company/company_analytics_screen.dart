import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class CompanyAnalyticsScreen extends StatefulWidget {
  const CompanyAnalyticsScreen({super.key});

  @override
  State<CompanyAnalyticsScreen> createState() => _CompanyAnalyticsScreenState();
}

class _CompanyAnalyticsScreenState extends State<CompanyAnalyticsScreen> {
  final ApiService _apiService = ApiService();

  bool _isLoading = true;
  Map<String, dynamic>? _summary;
  List<dynamic> _activityLog = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final summaryRes = await _apiService.dio.get('/dashboard/company');
      final logRes = await _apiService.dio.get('/company/activity-log');

      final summaryData = summaryRes.data is Map<String, dynamic> ? summaryRes.data : <String, dynamic>{};
      List logList = [];
      if (logRes.data is List) {
        logList = logRes.data;
      } else if (logRes.data['logs'] is List) {
        logList = logRes.data['logs'];
      } else if (logRes.data['data'] is List) {
        logList = logRes.data['data'];
      }

      if (mounted) {
        setState(() {
          _summary = summaryData;
          _activityLog = logList;
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

  @override
  Widget build(BuildContext context) {
    final stats = _summary?['stats'] ?? _summary ?? {};
    final totalJobs = stats['total_jobs'] ?? stats['jobs_count'] ?? 0;
    final totalApplicants = stats['total_applicants'] ?? stats['applicants_count'] ?? 0;
    final shortlisted = stats['shortlisted_count'] ?? stats['shortlisted'] ?? 0;
    final interviews = stats['interview_count'] ?? stats['interviews'] ?? 0;
    final hired = stats['hired_count'] ?? stats['hired'] ?? 0;
    final avgScore = (stats['average_score'] ?? stats['avg_match'] ?? 0) as num;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Recruitment Analytics & Log', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: const Color(0xFF6366F1),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_error != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFFCA5A5)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444)),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_error!, style: const TextStyle(color: Color(0xFFB91C1C)))),
                          ],
                        ),
                      ),
                    // Overview Metric Cards
                    Row(
                      children: [
                        _buildMetricCard('Total Jobs', '$totalJobs', Icons.work_outline_rounded, const Color(0xFF6366F1), const Color(0xFFEEF2FF)),
                        const SizedBox(width: 10),
                        _buildMetricCard('Applicants', '$totalApplicants', Icons.people_outline_rounded, const Color(0xFF06B6D4), const Color(0xFFECFEFF)),
                        const SizedBox(width: 10),
                        _buildMetricCard('Avg Match', '${avgScore.toInt()}%', Icons.auto_awesome_rounded, const Color(0xFF10B981), const Color(0xFFECFDF5)),
                      ],
                    ),

                    const SizedBox(height: 18),

                    // Hiring Conversion Funnel Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Pipeline Conversion Funnel',
                                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                              ),
                              const Icon(Icons.filter_alt_outlined, color: Color(0xFF6366F1), size: 20),
                            ],
                          ),
                          const SizedBox(height: 16),
                          _buildFunnelStage('1. Received Applications', totalApplicants, totalApplicants > 0 ? 1.0 : 0.0, const Color(0xFF6366F1)),
                          const SizedBox(height: 10),
                          _buildFunnelStage('2. AI Auto-Shortlisted', shortlisted, totalApplicants > 0 ? (shortlisted / totalApplicants) : 0.0, const Color(0xFF06B6D4)),
                          const SizedBox(height: 10),
                          _buildFunnelStage('3. Interview Round', interviews, totalApplicants > 0 ? (interviews / totalApplicants) : 0.0, const Color(0xFFF59E0B)),
                          const SizedBox(height: 10),
                          _buildFunnelStage('4. Hired / Offers Sent', hired, totalApplicants > 0 ? (hired / totalApplicants) : 0.0, const Color(0xFF10B981)),
                        ],
                      ),
                    ),

                    const SizedBox(height: 18),

                    // Recruiter Activity Log Audit
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Activity Audit Log',
                                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                              ),
                              Text(
                                '${_activityLog.length} Actions',
                                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          if (_activityLog.isEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              child: Center(
                                child: Text(
                                  'No recent activity records found',
                                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                                ),
                              ),
                            )
                          else
                            ..._activityLog.take(15).map((log) {
                              final action = log['action'] ?? log['description'] ?? 'Activity performed';
                              final created = log['created_at'] != null ? DateFormat('MMM d, hh:mm a').format(DateTime.parse(log['created_at'].toString())) : '';

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Icon(Icons.history_rounded, size: 16, color: Color(0xFF6366F1)),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            action,
                                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                                          ),
                                          if (created.isNotEmpty)
                                            Text(
                                              created,
                                              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                        ],
                      ),
                    ),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color, Color bg) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A)),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFunnelStage(String label, dynamic count, double percent, Color color) {
    final clampedPercent = percent.clamp(0.0, 1.0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
            Text('$count candidates (${(clampedPercent * 100).toInt()}%)', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: clampedPercent,
            minHeight: 8,
            backgroundColor: const Color(0xFFF1F5F9),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
