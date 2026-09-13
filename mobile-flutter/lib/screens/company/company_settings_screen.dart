import 'dart:io';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_text_field.dart';

class CompanySettingsScreen extends StatefulWidget {
  const CompanySettingsScreen({super.key});

  @override
  State<CompanySettingsScreen> createState() => _CompanySettingsScreenState();
}

class _CompanySettingsScreenState extends State<CompanySettingsScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();

  bool _isLoading = true;
  bool _isSaving = false;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _industryController = TextEditingController();
  final TextEditingController _sizeController = TextEditingController();
  final TextEditingController _foundedController = TextEditingController();
  final TextEditingController _websiteController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  File? _pickedLogoFile;
  String? _existingLogoUrl;

  @override
  void initState() {
    super.initState();
    _loadCompanyProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _industryController.dispose();
    _sizeController.dispose();
    _foundedController.dispose();
    _websiteController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _locationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadCompanyProfile() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiService.dio.get('/company/profile');
      final data = res.data is Map<String, dynamic> ? res.data : <String, dynamic>{};

      _nameController.text = data['name'] ?? data['company_name'] ?? '';
      _industryController.text = data['industry'] ?? '';
      _sizeController.text = data['company_size'] ?? '';
      _foundedController.text = data['founded_year']?.toString() ?? '';
      _websiteController.text = data['website'] ?? '';
      _emailController.text = data['contact_email'] ?? '';
      _phoneController.text = data['phone'] ?? '';
      _locationController.text = data['location'] ?? '';
      _descriptionController.text = data['description'] ?? '';
      _existingLogoUrl = data['logo_url'] ?? data['logo'];

      if (mounted) setState(() => _isLoading = false);
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickLogoFile() async {
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
            const SnackBar(content: Text('Logo image must be smaller than 3MB')),
          );
        }
        return;
      }
      setState(() => _pickedLogoFile = file);
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    final messenger = ScaffoldMessenger.of(context);

    try {
      final Map<String, dynamic> dataMap = {
        'name': _nameController.text.trim(),
        'industry': _industryController.text.trim(),
        'company_size': _sizeController.text.trim(),
        if (_foundedController.text.trim().isNotEmpty) 'founded_year': int.tryParse(_foundedController.text.trim()),
        'website': _websiteController.text.trim(),
        'contact_email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'location': _locationController.text.trim(),
        'description': _descriptionController.text.trim(),
      };

      if (_pickedLogoFile != null) {
        dataMap['logo'] = await MultipartFile.fromFile(
          _pickedLogoFile!.path,
          filename: _pickedLogoFile!.path.split(Platform.pathSeparator).last,
        );
      }

      final formData = FormData.fromMap(dataMap);

      await _apiService.dio.post('/company/profile', data: formData);

      if (mounted) {
        await context.read<AuthProvider>().refreshProfile();
        setState(() => _isSaving = false);
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Company profile & branding updated successfully!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        messenger.showSnackBar(
          SnackBar(
            content: Text(_apiService.handleDioError(e)),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final companyInitial = (_nameController.text.isNotEmpty ? _nameController.text[0] : 'C').toUpperCase();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Company Profile & Branding', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Company Logo & Brand Header Box
                    Center(
                      child: Column(
                        children: [
                          Stack(
                            alignment: Alignment.bottomRight,
                            children: [
                              GestureDetector(
                                onTap: _pickLogoFile,
                                child: Container(
                                  width: 88,
                                  height: 88,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white, width: 3),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.08),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(17),
                                    child: _pickedLogoFile != null
                                        ? Image.file(_pickedLogoFile!, fit: BoxFit.cover)
                                        : (_existingLogoUrl != null && _existingLogoUrl!.isNotEmpty
                                            ? Image.network(
                                                _existingLogoUrl!,
                                                fit: BoxFit.cover,
                                                errorBuilder: (_, __, ___) => Center(
                                                  child: Text(
                                                    companyInitial,
                                                    style: GoogleFonts.outfit(fontSize: 34, fontWeight: FontWeight.bold, color: Colors.white),
                                                  ),
                                                ),
                                              )
                                            : Center(
                                                child: Text(
                                                  companyInitial,
                                                  style: GoogleFonts.outfit(fontSize: 34, fontWeight: FontWeight.bold, color: Colors.white),
                                                ),
                                              )),
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: _pickLogoFile,
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
                            onPressed: _pickLogoFile,
                            icon: const Icon(Icons.business_rounded, size: 16, color: Color(0xFF6366F1)),
                            label: Text(
                              _pickedLogoFile != null ? 'Change Logo' : 'Upload Company Logo',
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF6366F1)),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    Text('Organization Information', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                    const SizedBox(height: 12),

                    AppTextField(
                      controller: _nameController,
                      label: 'Company Name',
                      hint: 'e.g. Acme Innovations Inc.',
                      prefixIcon: Icons.business_rounded,
                      validator: (v) => v == null || v.trim().isEmpty ? 'Company name is required' : null,
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            controller: _industryController,
                            label: 'Industry / Domain',
                            hint: 'e.g. Software & AI',
                            prefixIcon: Icons.category_outlined,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: AppTextField(
                            controller: _sizeController,
                            label: 'Company Size',
                            hint: 'e.g. 50-200 employees',
                            prefixIcon: Icons.groups_outlined,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            controller: _locationController,
                            label: 'Headquarters Location',
                            hint: 'e.g. Austin, TX',
                            prefixIcon: Icons.location_on_outlined,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: AppTextField(
                            controller: _foundedController,
                            label: 'Founded Year',
                            hint: 'e.g. 2021',
                            prefixIcon: Icons.calendar_today_outlined,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    AppTextField(
                      controller: _websiteController,
                      label: 'Official Website',
                      hint: 'https://acme.com',
                      prefixIcon: Icons.language_rounded,
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            controller: _emailController,
                            label: 'Contact / HR Email',
                            hint: 'hr@acme.com',
                            prefixIcon: Icons.email_outlined,
                            keyboardType: TextInputType.emailAddress,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: AppTextField(
                            controller: _phoneController,
                            label: 'Phone Contact',
                            hint: '+1 555 987 6543',
                            prefixIcon: Icons.phone_outlined,
                            keyboardType: TextInputType.phone,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    AppTextField(
                      controller: _descriptionController,
                      label: 'About Company & Culture',
                      hint: 'Describe your mission, values, work culture, and perks...',
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
                        onPressed: _isSaving ? null : _handleSave,
                        child: _isSaving
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : Text('Save Company Settings', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }
}
