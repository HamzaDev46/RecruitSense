import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/job_provider.dart';
import '../../widgets/app_text_field.dart';

class CreateJobScreen extends StatefulWidget {
  const CreateJobScreen({super.key});

  @override
  State<CreateJobScreen> createState() => _CreateJobScreenState();
}

class _CreateJobScreenState extends State<CreateJobScreen> {
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _locationController = TextEditingController(text: 'Remote');
  final _salaryController = TextEditingController(text: '\$80,000 - \$120,000');
  final _skillsController = TextEditingController(text: 'Flutter, Dart, REST APIs, Git');
  final _descriptionController = TextEditingController();
  final _requirementsController = TextEditingController();

  String _jobType = 'Full-time';
  String _experienceLevel = 'Mid Level';

  final List<String> _jobTypes = ['Full-time', 'Part-time', 'Remote', 'Contract', 'Hybrid'];
  final List<String> _experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Director'];

  @override
  void dispose() {
    _titleController.dispose();
    _locationController.dispose();
    _salaryController.dispose();
    _skillsController.dispose();
    _descriptionController.dispose();
    _requirementsController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final jobProvider = Provider.of<JobProvider>(context, listen: false);

    final skillsList = _skillsController.text
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();

    final success = await jobProvider.createJob({
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'requirements': _requirementsController.text.trim(),
      'location': _locationController.text.trim(),
      'job_type': _jobType,
      'salary_range': _salaryController.text.trim(),
      'experience_level': _experienceLevel,
      'skills_required': skillsList,
      'status': 'active',
    });

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Job posted successfully! Candidates can now apply.'),
          backgroundColor: Color(0xFF10B981),
        ),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(jobProvider.errorMessage ?? 'Failed to post job'),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final jobProvider = Provider.of<JobProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text('Post New Job', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Job Details',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                Text(
                  'Post an open position to receive instant AI-ranked applicants',
                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                ),
                const SizedBox(height: 20),

                // Job Title
                AppTextField(
                  controller: _titleController,
                  label: 'Job Title',
                  hint: 'e.g. Senior Flutter Developer',
                  prefixIcon: Icons.work_outline_rounded,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Job title is required' : null,
                ),

                const SizedBox(height: 14),

                // Location
                AppTextField(
                  controller: _locationController,
                  label: 'Location / Workstyle',
                  hint: 'e.g. Remote, San Francisco, CA',
                  prefixIcon: Icons.location_on_outlined,
                ),

                const SizedBox(height: 14),

                // Job Type & Experience Grid
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Job Type', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            initialValue: _jobType,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            items: _jobTypes.map((type) => DropdownMenuItem(value: type, child: Text(type, style: GoogleFonts.inter(fontSize: 13)))).toList(),
                            onChanged: (v) {
                              if (v != null) setState(() => _jobType = v);
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Experience', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            initialValue: _experienceLevel,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            items: _experienceLevels.map((lvl) => DropdownMenuItem(value: lvl, child: Text(lvl, style: GoogleFonts.inter(fontSize: 13)))).toList(),
                            onChanged: (v) {
                              if (v != null) setState(() => _experienceLevel = v);
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // Salary Range
                AppTextField(
                  controller: _salaryController,
                  label: 'Salary Range',
                  hint: 'e.g. \$80,000 - \$110,000 / year',
                  prefixIcon: Icons.payments_outlined,
                ),

                const SizedBox(height: 14),

                // Required Skills
                AppTextField(
                  controller: _skillsController,
                  label: 'Required Skills (comma separated)',
                  hint: 'Flutter, Dart, Provider, REST API',
                  prefixIcon: Icons.psychology_outlined,
                ),

                const SizedBox(height: 14),

                // Job Description
                AppTextField(
                  controller: _descriptionController,
                  label: 'Job Description',
                  hint: 'Describe the key responsibilities and expectations...',
                  maxLines: 4,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Description is required' : null,
                ),

                const SizedBox(height: 14),

                // Requirements
                AppTextField(
                  controller: _requirementsController,
                  label: 'Requirements & Qualifications',
                  hint: '3+ years with Flutter, solid state management experience...',
                  maxLines: 3,
                ),

                const SizedBox(height: 28),

                // Submit Button
                ElevatedButton(
                  onPressed: jobProvider.isLoading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    minimumSize: const Size(double.infinity, 52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: jobProvider.isLoading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          'Publish Job Posting',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
