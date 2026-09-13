import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/job_experience.dart';
import '../../providers/auth_provider.dart';
import '../../providers/profile_provider.dart';
import '../common/settings_screen.dart';
import 'edit_profile_dialog.dart';
import 'experience_dialog.dart';
import 'my_network_screen.dart';
import 'resume_coach_screen.dart';
import 'saved_jobs_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isUploadingPhoto = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProfileProvider>().fetchProfile();
      context.read<ProfileProvider>().fetchViewers();
    });
  }

  Future<void> _handlePickAndUploadPhoto() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    );

    if (result != null && result.files.isNotEmpty && result.files.first.path != null) {
      final file = File(result.files.first.path!);
      final size = await file.length();
      if (size > 3 * 1024 * 1024) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile photo must be smaller than 3MB')),
          );
        }
        return;
      }

      setState(() => _isUploadingPhoto = true);

      final authUser = context.read<AuthProvider>().user;
      final prof = context.read<ProfileProvider>();

      final success = await prof.updateProfile(
        {
          'name': authUser?.name ?? '',
          'email': authUser?.email ?? '',
          'headline': prof.headline,
          'location': prof.location,
          'phone': prof.phone,
          'website': prof.website,
          'education': prof.education,
          'about': prof.about,
          'skills': (authUser?.skills ?? []).join(', '),
        },
        profileImage: file,
      );

      if (!mounted) return;

      setState(() => _isUploadingPhoto = false);

      if (success) {
        await context.read<AuthProvider>().refreshProfile();
        await prof.fetchProfile(silent: true);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile photo updated successfully!'),
              backgroundColor: Color(0xFF10B981),
            ),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(prof.error ?? 'Failed to upload profile photo'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  void _showDeleteExperienceConfirm(JobExperience exp) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Experience', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to remove "${exp.title}" from your profile?', style: GoogleFonts.inter(fontSize: 14)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<ProfileProvider>().deleteExperience(exp.id);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final profileProvider = context.watch<ProfileProvider>();
    final user = authProvider.user;

    final name = user?.name ?? 'Candidate';
    final email = user?.email ?? '';
    final headline = profileProvider.headline.isNotEmpty ? profileProvider.headline : 'Candidate Profile';
    final location = profileProvider.location;
    final phone = profileProvider.phone;
    final website = profileProvider.website;
    final about = profileProvider.about;
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'U';
    final experiences = profileProvider.experiences;
    final viewersCount = profileProvider.viewersCount;
    final profileImageUrl = user?.profileImageUrl ?? profileProvider.profileData?['profile_image_url'] ?? profileProvider.profileData?['job_seeker']?['profile_image_url'];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Profile & Career Hub', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 19)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Color(0xFF475569)),
            tooltip: 'Account Settings',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await profileProvider.fetchProfile();
          await authProvider.refreshProfile();
        },
        color: const Color(0xFF6366F1),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Avatar Card with Edit Profile CTA
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Avatar with Camera Tap & Loading State
                        Stack(
                          alignment: Alignment.bottomRight,
                          children: [
                            GestureDetector(
                              onTap: _isUploadingPhoto ? null : _handlePickAndUploadPhoto,
                              child: Container(
                                width: 72,
                                height: 72,
                                decoration: BoxDecoration(
                                  gradient: AppTheme.primaryGradient,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2.5),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.08),
                                      blurRadius: 8,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: ClipOval(
                                  child: _isUploadingPhoto
                                      ? const Center(
                                          child: SizedBox(
                                            width: 24,
                                            height: 24,
                                            child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                                          ),
                                        )
                                      : (profileImageUrl != null && profileImageUrl.isNotEmpty
                                          ? Image.network(
                                              profileImageUrl,
                                              fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) => Center(
                                                child: Text(
                                                  initial,
                                                  style: GoogleFonts.outfit(
                                                    fontSize: 28,
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ),
                                            )
                                          : Center(
                                              child: Text(
                                                initial,
                                                style: GoogleFonts.outfit(
                                                  fontSize: 28,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.white,
                                                ),
                                              ),
                                            )),
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: _isUploadingPhoto ? null : _handlePickAndUploadPhoto,
                              child: Container(
                                padding: const EdgeInsets.all(5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF6366F1),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                ),
                                child: const Icon(Icons.camera_alt_rounded, size: 14, color: Colors.white),
                              ),
                            ),
                          ],
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
                                      style: GoogleFonts.outfit(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF0F172A),
                                      ),
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
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(0xFF475569),
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                email,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: const Color(0xFF94A3B8),
                                ),
                              ),
                              if (location.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on_outlined, size: 12, color: Color(0xFF94A3B8)),
                                    const SizedBox(width: 4),
                                    Text(location, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                                  ],
                                ),
                              ],
                              if (phone.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    const Icon(Icons.phone_outlined, size: 12, color: Color(0xFF94A3B8)),
                                    const SizedBox(width: 4),
                                    Text(phone, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                                  ],
                                ),
                              ],
                              if (website.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    const Icon(Icons.language_rounded, size: 12, color: Color(0xFF94A3B8)),
                                    const SizedBox(width: 4),
                                    Text(website, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF6366F1))),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Edit Profile Action Button
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 40),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          side: const BorderSide(color: Color(0xFFC7D2FE)),
                          backgroundColor: const Color(0xFFEEF2FF),
                        ),
                        icon: const Icon(Icons.edit_outlined, size: 16, color: Color(0xFF6366F1)),
                        label: Text(
                          'Edit Profile & Details',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF4F46E5)),
                        ),
                        onPressed: () => EditProfileDialog.show(context),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Profile Views Stat Banner
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFEEF2FF), Color(0xFFF3E8FF)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFC7D2FE)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.visibility_rounded, color: Color(0xFF6366F1), size: 18),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$viewersCount Profile Views',
                            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF1E1B4B)),
                          ),
                          Text(
                            'Recruiters and peers discovered your profile',
                            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF4338CA)),
                          ),
                        ],
                      ),
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
                      Text(
                        'About',
                        style: GoogleFonts.outfit(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        about,
                        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569), height: 1.5),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Work Experience Timeline with Add Experience CTA
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Work Experience',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        TextButton.icon(
                          onPressed: () => ExperienceDialog.show(context),
                          icon: const Icon(Icons.add_circle_outline_rounded, size: 16, color: Color(0xFF6366F1)),
                          label: Text(
                            'Add',
                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF6366F1)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    if (experiences.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Center(
                          child: Text(
                            'No work experience added yet. Tap Add to list your roles.',
                            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      )
                    else
                      ...experiences.map((exp) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEEF2FF),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(Icons.work_outline_rounded, size: 18, color: Color(0xFF6366F1)),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          exp.title,
                                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                                        ),
                                        Text(
                                          '${exp.companyName}${exp.location != null && exp.location!.isNotEmpty ? ' • ${exp.location}' : ''}',
                                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
                                        ),
                                        if (exp.startDate != null)
                                          Text(
                                            '${exp.startDate} - ${exp.isCurrent ? 'Present' : (exp.endDate ?? '')}',
                                            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                                          ),
                                      ],
                                    ),
                                  ),
                                  // Edit & Delete icons
                                  IconButton(
                                    icon: const Icon(Icons.edit_outlined, size: 18, color: Color(0xFF64748B)),
                                    onPressed: () => ExperienceDialog.show(context, experience: exp),
                                    constraints: const BoxConstraints(),
                                    padding: const EdgeInsets.all(6),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Color(0xFFEF4444)),
                                    onPressed: () => _showDeleteExperienceConfirm(exp),
                                    constraints: const BoxConstraints(),
                                    padding: const EdgeInsets.all(6),
                                  ),
                                ],
                              ),
                              if (exp.description != null && exp.description!.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Text(
                                  exp.description!,
                                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), height: 1.4),
                                ),
                              ],
                            ],
                          ),
                        );
                      }),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Skills Section
              if (user != null && user.skills.isNotEmpty) ...[
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
                      Row(
                        children: [
                          const Icon(Icons.psychology_outlined, color: AppTheme.primary, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Verified Skills',
                            style: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: user.skills.map((s) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              s,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF334155),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Features Dock Section
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.description_rounded, color: Color(0xFF6366F1), size: 20),
                      ),
                      title: Text('AI Resume Coach & ATS', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                      subtitle: Text('Score analysis, skill gaps, PDF uploads', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                      trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ResumeCoachScreen())),
                    ),
                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                    ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: const Color(0xFFECFEFF), borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.people_alt_rounded, color: Color(0xFF06B6D4), size: 20),
                      ),
                      title: Text('My Network & Connections', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                      subtitle: Text('Invitations, suggestions, peers', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                      trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyNetworkScreen())),
                    ),
                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                    ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.bookmark_rounded, color: Color(0xFFF59E0B), size: 20),
                      ),
                      title: Text('Saved Jobs Bookmarks', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                      subtitle: Text('View and apply to bookmarked listings', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                      trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SavedJobsScreen())),
                    ),
                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                    ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.settings_outlined, color: Color(0xFF475569), size: 20),
                      ),
                      title: Text('Account Settings', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                      subtitle: Text('Password, preferences, blocking', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                      trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())),
                    ),
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
}
