import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/job_experience.dart';
import '../../models/user.dart';
import '../../providers/network_provider.dart';
import '../../services/profile_service.dart';
import 'chat_detail_screen.dart';

class PublicProfileScreen extends StatefulWidget {
  final int userId;
  final User? initialUser;

  const PublicProfileScreen({
    super.key,
    required this.userId,
    this.initialUser,
  });

  @override
  State<PublicProfileScreen> createState() => _PublicProfileScreenState();
}

class _PublicProfileScreenState extends State<PublicProfileScreen> {
  final ProfileService _profileService = ProfileService();

  bool _isLoading = true;
  Map<String, dynamic>? _profile;
  List<JobExperience> _experiences = [];
  List<dynamic> _posts = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPublicProfile();
  }

  Future<void> _loadPublicProfile() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await _profileService.getPublicProfile(widget.userId);
      final postsRes = await _profileService.getUserPosts(widget.userId);

      List expList = [];
      if (res['experiences'] is List) {
        expList = res['experiences'];
      } else if (res['job_seeker'] != null && res['job_seeker']['experiences'] is List) {
        expList = res['job_seeker']['experiences'];
      }

      if (mounted) {
        setState(() {
          _profile = res;
          _experiences = expList.map((e) => JobExperience.fromJson(e as Map<String, dynamic>)).toList();
          _posts = postsRes;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _profile?['name'] ?? widget.initialUser?.name ?? 'Candidate';
    final headline = _profile?['headline'] ?? _profile?['job_seeker']?['headline'] ?? 'Candidate Profile';
    final location = _profile?['location'] ?? _profile?['job_seeker']?['location'] ?? '';
    final about = _profile?['about'] ?? _profile?['job_seeker']?['about'] ?? '';
    final email = _profile?['email'] ?? widget.initialUser?.email ?? '';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'C';

    List<String> skills = [];
    if (_profile?['skills'] != null) {
      if (_profile!['skills'] is List) {
        skills = List<String>.from(_profile!['skills']);
      } else if (_profile!['skills'] is String) {
        skills = (_profile!['skills'] as String).split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
      }
    } else if (widget.initialUser?.skills != null) {
      skills = widget.initialUser!.skills;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 48, color: Color(0xFFEF4444)),
                      const SizedBox(height: 12),
                      Text(_error!, style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B))),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadPublicProfile,
                        child: const Text('Try Again'),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Candidate Card Header
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 64,
                                  height: 64,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                                    ),
                                    borderRadius: BorderRadius.circular(18),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    initial,
                                    style: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Flexible(
                                            child: Text(
                                              name,
                                              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          const Icon(Icons.verified_rounded, size: 16, color: Color(0xFF10B981)),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        headline,
                                        style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569), fontWeight: FontWeight.w500),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      if (location.isNotEmpty) ...[
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF94A3B8)),
                                            const SizedBox(width: 4),
                                            Text(location, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                                          ],
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 16),
                            const Divider(height: 1, color: Color(0xFFF1F5F9)),
                            const SizedBox(height: 12),

                            // Action Buttons: Connect / Message
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.primary,
                                      minimumSize: const Size(0, 42),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    icon: const Icon(Icons.person_add_rounded, size: 18),
                                    label: Text('Connect', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700)),
                                    onPressed: () async {
                                      final net = context.read<NetworkProvider>();
                                      final messenger = ScaffoldMessenger.of(context);
                                      final success = await net.sendConnectRequest(widget.userId);
                                      messenger.showSnackBar(
                                        SnackBar(
                                          content: Text(success ? 'Connection invitation sent!' : 'Could not send invitation'),
                                          backgroundColor: success ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: OutlinedButton.icon(
                                    style: OutlinedButton.styleFrom(
                                      minimumSize: const Size(0, 42),
                                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18, color: Color(0xFF6366F1)),
                                    label: Text('Message', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B))),
                                    onPressed: () {
                                      final targetUser = widget.initialUser ??
                                          User(
                                            id: widget.userId,
                                            name: name,
                                            email: email,
                                            role: 'jobseeker',
                                            skills: skills,
                                          );
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => ChatDetailScreen(otherUser: targetUser),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // About Section
                      if (about.isNotEmpty) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('About', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                              const SizedBox(height: 8),
                              Text(about, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569), height: 1.5)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Skills Section
                      if (skills.isNotEmpty) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Skills & Technologies', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: skills.map((s) {
                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEEF2FF),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFFC7D2FE)),
                                    ),
                                    child: Text(
                                      s,
                                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF4F46E5)),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Experience Section
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Work Experience', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                            const SizedBox(height: 14),
                            if (_experiences.isEmpty)
                              Text('No work experiences listed yet.', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)))
                            else
                              ..._experiences.map((exp) {
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 14),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: const Icon(Icons.work_outline_rounded, size: 18, color: Color(0xFF6366F1)),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(exp.title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                                            Text('${exp.companyName}${exp.location != null ? ' • ${exp.location}' : ''}', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569))),
                                            if (exp.startDate != null)
                                              Text(
                                                '${exp.startDate} - ${exp.isCurrent ? 'Present' : (exp.endDate ?? '')}',
                                                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                                              ),
                                            if (exp.description != null && exp.description!.isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Text(exp.description!, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                                            ],
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
                      if (_posts.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Recent Activity & Posts', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                              const SizedBox(height: 14),
                              ..._posts.take(3).map((post) {
                                final content = post['content'] ?? post['title'] ?? '';
                                final likes = post['likes_count'] ?? 0;
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFFF1F5F9)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(content, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF334155)), maxLines: 3, overflow: TextOverflow.ellipsis),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          const Icon(Icons.thumb_up_alt_outlined, size: 13, color: Color(0xFF64748B)),
                                          const SizedBox(width: 4),
                                          Text('$likes likes', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
    );
  }
}
