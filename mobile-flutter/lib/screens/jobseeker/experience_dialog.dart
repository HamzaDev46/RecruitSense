import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/job_experience.dart';
import '../../providers/profile_provider.dart';
import '../../widgets/app_text_field.dart';

class ExperienceDialog extends StatefulWidget {
  final JobExperience? experienceToEdit;

  const ExperienceDialog({super.key, this.experienceToEdit});

  static Future<bool?> show(BuildContext context, {JobExperience? experience}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ExperienceDialog(experienceToEdit: experience),
    );
  }

  @override
  State<ExperienceDialog> createState() => _ExperienceDialogState();
}

class _ExperienceDialogState extends State<ExperienceDialog> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _titleController;
  late TextEditingController _companyController;
  late TextEditingController _locationController;
  late TextEditingController _descriptionController;

  DateTime? _startDate;
  DateTime? _endDate;
  bool _isCurrent = false;

  @override
  void initState() {
    super.initState();
    final exp = widget.experienceToEdit;
    _titleController = TextEditingController(text: exp?.title ?? '');
    _companyController = TextEditingController(text: exp?.companyName ?? '');
    _locationController = TextEditingController(text: exp?.location ?? '');
    _descriptionController = TextEditingController(text: exp?.description ?? '');

    if (exp?.startDate != null) {
      _startDate = DateTime.tryParse(exp!.startDate!);
    }
    if (exp?.endDate != null) {
      _endDate = DateTime.tryParse(exp!.endDate!);
    }
    _isCurrent = exp?.isCurrent ?? false;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _companyController.dispose();
    _locationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<ProfileProvider>();

    final startDateStr = _startDate != null ? DateFormat('yyyy-MM-dd').format(_startDate!) : null;
    final endDateStr = !_isCurrent && _endDate != null ? DateFormat('yyyy-MM-dd').format(_endDate!) : null;

    final data = {
      'title': _titleController.text.trim(),
      'company_name': _companyController.text.trim(),
      'location': _locationController.text.trim(),
      if (startDateStr != null) 'start_date': startDateStr,
      if (endDateStr != null) 'end_date': endDateStr,
      'is_current': _isCurrent,
      'description': _descriptionController.text.trim(),
    };

    bool success;
    if (widget.experienceToEdit != null) {
      success = await provider.updateExperience(widget.experienceToEdit!.id, data);
    } else {
      success = await provider.addExperience(data);
    }

    if (!mounted) return;

    if (success) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.experienceToEdit != null ? 'Experience updated' : 'Experience added to profile'),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Failed to save experience'),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProfileProvider>();
    final isEdit = widget.experienceToEdit != null;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag Handle
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
                  isEdit ? 'Edit Work Experience' : 'Add Work Experience',
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
                    AppTextField(
                      controller: _titleController,
                      label: 'Job Title',
                      hint: 'e.g. Senior Flutter Developer',
                      prefixIcon: Icons.work_outline_rounded,
                      validator: (v) => v == null || v.trim().isEmpty ? 'Job title is required' : null,
                    ),
                    const SizedBox(height: 14),

                    AppTextField(
                      controller: _companyController,
                      label: 'Company Name',
                      hint: 'e.g. Google, TechCorp',
                      prefixIcon: Icons.business_rounded,
                      validator: (v) => v == null || v.trim().isEmpty ? 'Company name is required' : null,
                    ),
                    const SizedBox(height: 14),

                    AppTextField(
                      controller: _locationController,
                      label: 'Location (optional)',
                      hint: 'e.g. Remote / New York, NY',
                      prefixIcon: Icons.location_on_outlined,
                    ),
                    const SizedBox(height: 14),

                    // Date Selectors
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Start Date', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                              const SizedBox(height: 6),
                              OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  minimumSize: const Size(double.infinity, 48),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                                  backgroundColor: Colors.white,
                                ),
                                icon: const Icon(Icons.calendar_month_rounded, size: 16, color: Color(0xFF6366F1)),
                                label: Text(
                                  _startDate != null ? DateFormat('MMM yyyy').format(_startDate!) : 'Select Date',
                                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF1E293B)),
                                ),
                                onPressed: () async {
                                  final picked = await showDatePicker(
                                    context: context,
                                    initialDate: _startDate ?? DateTime.now(),
                                    firstDate: DateTime(1970),
                                    lastDate: DateTime.now(),
                                  );
                                  if (picked != null) {
                                    setState(() => _startDate = picked);
                                  }
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        if (!_isCurrent)
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('End Date', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                                const SizedBox(height: 6),
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    minimumSize: const Size(double.infinity, 48),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                                    backgroundColor: Colors.white,
                                  ),
                                  icon: const Icon(Icons.calendar_month_rounded, size: 16, color: Color(0xFF6366F1)),
                                  label: Text(
                                    _endDate != null ? DateFormat('MMM yyyy').format(_endDate!) : 'Select Date',
                                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF1E293B)),
                                  ),
                                  onPressed: () async {
                                    final picked = await showDatePicker(
                                      context: context,
                                      initialDate: _endDate ?? DateTime.now(),
                                      firstDate: _startDate ?? DateTime(1970),
                                      lastDate: DateTime.now(),
                                    );
                                    if (picked != null) {
                                      setState(() => _endDate = picked);
                                    }
                                  },
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Is Current Checkbox
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        'I currently work here',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                      ),
                      value: _isCurrent,
                      activeColor: AppTheme.primary,
                      onChanged: (val) {
                        setState(() => _isCurrent = val ?? false);
                      },
                    ),
                    const SizedBox(height: 8),

                    AppTextField(
                      controller: _descriptionController,
                      label: 'Role Description & Key Achievements',
                      hint: 'Describe your responsibilities, team size, tools used, and notable milestones...',
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
                        onPressed: provider.isSaving ? null : _handleSave,
                        child: provider.isSaving
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : Text(
                                isEdit ? 'Update Experience' : 'Save Experience',
                                style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
                              ),
                      ),
                    ),
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
