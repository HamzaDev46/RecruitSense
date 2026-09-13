import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/job_posting.dart';
import '../../providers/job_provider.dart';
import '../../widgets/app_text_field.dart';

class CreateJobScreen extends StatefulWidget {
  final JobPosting? jobToEdit;

  const CreateJobScreen({super.key, this.jobToEdit});

  @override
  State<CreateJobScreen> createState() => _CreateJobScreenState();
}

class _CreateJobScreenState extends State<CreateJobScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _titleController;
  late TextEditingController _locationController;
  late TextEditingController _salaryController;
  late TextEditingController _skillsController;
  late TextEditingController _descriptionController;
  late TextEditingController _requirementsController;

  late String _jobType;
  late String _experienceLevel;
  late String _status;

  final List<String> _jobTypes = ['Full-time', 'Part-time', 'Remote', 'Contract', 'Hybrid'];
  final List<String> _experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Director'];
  final List<String> _statuses = ['active', 'closed'];

  @override
  void initState() {
    super.initState();
    final job = widget.jobToEdit;
    _titleController = TextEditingController(text: job?.title ?? '');
    _locationController = TextEditingController(text: job?.location ?? 'Remote');
    _salaryController = TextEditingController(text: job?.salaryRange ?? '\$80,000 - \$120,000');
    _skillsController = TextEditingController(text: job?.skillsRequired.join(', ') ?? 'Flutter, Dart, REST APIs, Git');
    _descriptionController = TextEditingController(text: job?.description ?? '');
    _requirementsController = TextEditingController(text: job?.requirements ?? '');

    _jobType = (job != null && _jobTypes.contains(job.jobType)) ? job.jobType : 'Full-time';
    _experienceLevel = (job != null && job.experienceLevel != null && _experienceLevels.contains(job.experienceLevel))
        ? job.experienceLevel!
        : 'Mid Level';
    _status = (job != null && _statuses.contains(job.status.toLowerCase())) ? job.status.toLowerCase() : 'active';
  }

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

    final data = {
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'requirements': _requirementsController.text.trim(),
      'location': _locationController.text.trim(),
      'job_type': _jobType,
      'salary_range': _salaryController.text.trim(),
      'experience_level': _experienceLevel,
      'skills_required': skillsList,
      'status': _status,
    };

    bool success;
    if (widget.jobToEdit != null) {
      success = await jobProvider.updateJob(widget.jobToEdit!.id, data);
    } else {
      success = await jobProvider.createJob(data);
    }

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.jobToEdit != null ? 'Job updated successfully!' : 'Job posted successfully! Candidates can now apply.'),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(jobProvider.errorMessage ?? 'Failed to save job'),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final jobProvider = Provider.of<JobProvider>(context);
    final isEdit = widget.jobToEdit != null;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Job Posting' : 'Post New Job', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
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
                // Title
                AppTextField(
                  controller: _titleController,
                  label: 'Job Title',
                  hint: 'e.g. Senior Flutter Developer',
                  prefixIcon: Icons.work_outline_rounded,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Job title is required';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Location & Salary Row
                Row(
                  children: [
                    Expanded(
                      child: AppTextField(
                        controller: _locationController,
                        label: 'Location',
                        hint: 'e.g. Remote / New York, NY',
                        prefixIcon: Icons.location_on_outlined,
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Location is required';
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AppTextField(
                        controller: _salaryController,
                        label: 'Salary Range',
                        hint: 'e.g. \$90,000 - \$130,000',
                        prefixIcon: Icons.attach_money_rounded,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Job Type Selector
                Text(
                  'Job Type',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _jobTypes.map((type) {
                    final isSelected = _jobType == type;
                    return ChoiceChip(
                      label: Text(type),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) setState(() => _jobType = type);
                      },
                      selectedColor: AppTheme.primary,
                      backgroundColor: Colors.white,
                      labelStyle: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? Colors.white : const Color(0xFF475569),
                      ),
                      side: BorderSide(color: isSelected ? AppTheme.primary : const Color(0xFFCBD5E1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      showCheckmark: false,
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),

                // Experience Level
                Text(
                  'Experience Level',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _experienceLevels.map((level) {
                    final isSelected = _experienceLevel == level;
                    return ChoiceChip(
                      label: Text(level),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) setState(() => _experienceLevel = level);
                      },
                      selectedColor: const Color(0xFF06B6D4),
                      backgroundColor: Colors.white,
                      labelStyle: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? Colors.white : const Color(0xFF475569),
                      ),
                      side: BorderSide(color: isSelected ? const Color(0xFF06B6D4) : const Color(0xFFCBD5E1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      showCheckmark: false,
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),

                // Status if editing
                if (isEdit) ...[
                  Text(
                    'Listing Status',
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      ChoiceChip(
                        label: const Text('Active'),
                        selected: _status == 'active',
                        onSelected: (selected) {
                          if (selected) setState(() => _status = 'active');
                        },
                        selectedColor: const Color(0xFF10B981),
                        backgroundColor: Colors.white,
                        labelStyle: TextStyle(color: _status == 'active' ? Colors.white : const Color(0xFF475569)),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('Closed / Inactive'),
                        selected: _status == 'closed',
                        onSelected: (selected) {
                          if (selected) setState(() => _status = 'closed');
                        },
                        selectedColor: const Color(0xFFEF4444),
                        backgroundColor: Colors.white,
                        labelStyle: TextStyle(color: _status == 'closed' ? Colors.white : const Color(0xFF475569)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],

                // Required Skills
                AppTextField(
                  controller: _skillsController,
                  label: 'Required Skills (comma separated)',
                  hint: 'Flutter, Dart, Provider, REST APIs, Git',
                  prefixIcon: Icons.psychology_outlined,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'At least one skill is required';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Job Description
                AppTextField(
                  controller: _descriptionController,
                  label: 'Job Description',
                  hint: 'Describe the role responsibilities, team, and day-to-day work...',
                  maxLines: 4,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Description is required';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Requirements
                AppTextField(
                  controller: _requirementsController,
                  label: 'Candidate Requirements & Qualifications',
                  hint: 'e.g. 3+ years Flutter development, experience with state management...',
                  maxLines: 4,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Requirements are required';
                    return null;
                  },
                ),
                const SizedBox(height: 28),

                // Submit Button
                ElevatedButton(
                  onPressed: jobProvider.isLoading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    minimumSize: const Size(double.infinity, 52),
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
                          isEdit ? 'Update Job Listing' : 'Publish Job Listing',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
