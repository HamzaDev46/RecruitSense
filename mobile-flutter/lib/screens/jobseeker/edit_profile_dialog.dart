import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/profile_provider.dart';
import '../../widgets/app_text_field.dart';

class EditProfileDialog extends StatefulWidget {
  const EditProfileDialog({super.key});

  static Future<bool?> show(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const EditProfileDialog(),
    );
  }

  @override
  State<EditProfileDialog> createState() => _EditProfileDialogState();
}

class _EditProfileDialogState extends State<EditProfileDialog> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _headlineController;
  late TextEditingController _locationController;
  late TextEditingController _phoneController;
  late TextEditingController _websiteController;
  late TextEditingController _educationController;
  late TextEditingController _aboutController;
  late TextEditingController _skillsController;

  File? _pickedImageFile;
  String? _existingImageUrl;

  @override
  void initState() {
    super.initState();
    final authUser = context.read<AuthProvider>().user;
    final prof = context.read<ProfileProvider>();

    _nameController = TextEditingController(text: authUser?.name ?? '');
    _emailController = TextEditingController(text: authUser?.email ?? '');
    _headlineController = TextEditingController(text: prof.headline);
    _locationController = TextEditingController(text: prof.location);
    _phoneController = TextEditingController(text: prof.phone);
    _websiteController = TextEditingController(text: prof.website);
    _educationController = TextEditingController(text: prof.education);
    _aboutController = TextEditingController(text: prof.about);

    _existingImageUrl = authUser?.profileImageUrl ?? prof.profileData?['profile_image_url'] ?? prof.profileData?['job_seeker']?['profile_image_url'];

    final currentSkills = authUser?.skills ?? [];
    _skillsController = TextEditingController(text: currentSkills.join(', '));
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _headlineController.dispose();
    _locationController.dispose();
    _phoneController.dispose();
    _websiteController.dispose();
    _educationController.dispose();
    _aboutController.dispose();
    _skillsController.dispose();
    super.dispose();
  }

  Future<void> _pickProfileImage() async {
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
      setState(() => _pickedImageFile = file);
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final profileProvider = context.read<ProfileProvider>();
    final authProvider = context.read<AuthProvider>();

    final skillsText = _skillsController.text.trim();

    final success = await profileProvider.updateProfile(
      {
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'headline': _headlineController.text.trim(),
        'location': _locationController.text.trim(),
        'phone': _phoneController.text.trim(),
        'website': _websiteController.text.trim(),
        'education': _educationController.text.trim(),
        'about': _aboutController.text.trim(),
        'skills': skillsText,
      },
      profileImage: _pickedImageFile,
    );

    if (!mounted) return;

    if (success) {
      await authProvider.refreshProfile();
      await profileProvider.fetchProfile(silent: true);
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile & photo updated successfully!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(profileProvider.error ?? 'Failed to update profile'),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileProvider = context.watch<ProfileProvider>();
    final authUser = context.watch<AuthProvider>().user;
    final initial = (_nameController.text.isNotEmpty ? _nameController.text[0] : 'U').toUpperCase();

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle
          const SizedBox(height: 10),
          Container(
            width: 44,
            height: 5,
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(2.5),
            ),
          ),
          const SizedBox(height: 12),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Edit Candidate Profile',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Form
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Profile Photo Picker Section
                    Center(
                      child: Column(
                        children: [
                          Stack(
                            alignment: Alignment.bottomRight,
                            children: [
                              GestureDetector(
                                onTap: _pickProfileImage,
                                child: Container(
                                  width: 84,
                                  height: 84,
                                  decoration: BoxDecoration(
                                    gradient: AppTheme.primaryGradient,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 3),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.08),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: ClipOval(
                                    child: _pickedImageFile != null
                                        ? Image.file(_pickedImageFile!, fit: BoxFit.cover)
                                        : (_existingImageUrl != null && _existingImageUrl!.isNotEmpty
                                            ? Image.network(
                                                _existingImageUrl!,
                                                fit: BoxFit.cover,
                                                errorBuilder: (_, __, ___) => Center(
                                                  child: Text(
                                                    initial,
                                                    style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                                                  ),
                                                ),
                                              )
                                            : Center(
                                                child: Text(
                                                  initial,
                                                  style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                                                ),
                                              )),
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: _pickProfileImage,
                                child: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF6366F1),
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2),
                                  ),
                                  child: const Icon(Icons.camera_alt_rounded, size: 16, color: Colors.white),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          TextButton.icon(
                            onPressed: _pickProfileImage,
                            icon: const Icon(Icons.image_rounded, size: 16, color: Color(0xFF6366F1)),
                            label: Text(
                              _pickedImageFile != null ? 'Change Photo' : 'Upload Profile Photo',
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF6366F1)),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    AppTextField(
                      controller: _nameController,
                      label: 'Full Name',
                      hint: 'e.g. John Doe',
                      prefixIcon: Icons.person_outline_rounded,
                      validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 14),

                    AppTextField(
                      controller: _emailController,
                      label: 'Email Address',
                      hint: 'you@example.com',
                      prefixIcon: Icons.mail_outline_rounded,
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) => v == null || !v.contains('@') ? 'Valid email required' : null,
                    ),
                    const SizedBox(height: 14),

                    AppTextField(
                      controller: _headlineController,
                      label: 'Professional Headline',
                      hint: 'e.g. Senior Full-Stack Engineer | AI Enthusiast',
                      prefixIcon: Icons.badge_outlined,
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            controller: _locationController,
                            label: 'Location',
                            hint: 'e.g. San Francisco, CA',
                            prefixIcon: Icons.location_on_outlined,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: AppTextField(
                            controller: _phoneController,
                            label: 'Phone Number',
                            hint: 'e.g. +1 555 123 4567',
                            prefixIcon: Icons.phone_outlined,
                            keyboardType: TextInputType.phone,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    AppTextField(
                      controller: _educationController,
                      label: 'Education / Degree',
                      hint: 'e.g. BS Computer Science - Stanford',
                      prefixIcon: Icons.school_outlined,
                    ),
                    const SizedBox(height: 14),

                    AppTextField(
                      controller: _websiteController,
                      label: 'Portfolio / Website / LinkedIn',
                      hint: 'https://linkedin.com/in/username',
                      prefixIcon: Icons.link_rounded,
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: 14),

                    AppTextField(
                      controller: _skillsController,
                      label: 'Skills (comma-separated)',
                      hint: 'Flutter, Python, React, PyTorch, Docker',
                      prefixIcon: Icons.psychology_outlined,
                    ),
                    const SizedBox(height: 14),

                    AppTextField(
                      controller: _aboutController,
                      label: 'About / Summary',
                      hint: 'Tell recruiters about your background, career highlights, and goals...',
                      maxLines: 4,
                    ),
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          minimumSize: const Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        onPressed: profileProvider.isSaving ? null : _handleSave,
                        child: profileProvider.isSaving
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : Text(
                                'Save Profile Changes',
                                style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
                              ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
