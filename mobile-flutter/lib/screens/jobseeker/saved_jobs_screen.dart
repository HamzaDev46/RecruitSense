import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/job_posting.dart';
import '../../providers/job_provider.dart';
import '../../widgets/job_card.dart';
import 'job_detail_screen.dart';

class SavedJobsScreen extends StatefulWidget {
  const SavedJobsScreen({super.key});

  @override
  State<SavedJobsScreen> createState() => _SavedJobsScreenState();
}

class _SavedJobsScreenState extends State<SavedJobsScreen> {
  List<JobPosting> _savedJobs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSavedJobs();
  }

  Future<void> _loadSavedJobs() async {
    setState(() => _isLoading = true);
    try {
      final jobs = await context.read<JobProvider>().fetchSavedJobs();
      if (mounted) {
        setState(() {
          _savedJobs = jobs;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleToggleSave(JobPosting job) async {
    final success = await context.read<JobProvider>().toggleSaveJob(job.id, true);
    if (success && mounted) {
      setState(() {
        _savedJobs.removeWhere((j) => j.id == job.id);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Removed "${job.title}" from saved jobs')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Saved Jobs (${_savedJobs.length})',
          style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadSavedJobs,
        color: const Color(0xFF6366F1),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
            : _savedJobs.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.bookmark_border_rounded, size: 52, color: Color(0xFF94A3B8)),
                          const SizedBox(height: 12),
                          Text(
                            'No saved jobs yet',
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Bookmark jobs while exploring to quickly review and apply later.',
                            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _savedJobs.length,
                    itemBuilder: (ctx, i) {
                      final job = _savedJobs[i];
                      return JobCard(
                        job: job,
                        isSaved: true,
                        onBookmarkTap: () => _handleToggleSave(job),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => JobDetailScreen(job: job)),
                          );
                        },
                      );
                    },
                  ),
      ),
    );
  }
}
