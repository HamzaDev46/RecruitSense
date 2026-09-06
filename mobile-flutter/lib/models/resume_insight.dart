class ResumeInsightChecklist {
  final String key;
  final String label;
  final bool complete;
  final String impact;

  ResumeInsightChecklist({
    required this.key,
    required this.label,
    required this.complete,
    required this.impact,
  });

  factory ResumeInsightChecklist.fromJson(Map<String, dynamic> json) {
    return ResumeInsightChecklist(
      key: json['key']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
      complete: json['complete'] == true,
      impact: json['impact']?.toString() ?? '',
    );
  }
}

class ResumeSuggestion {
  final String type;
  final String title;
  final String body;

  ResumeSuggestion({
    required this.type,
    required this.title,
    required this.body,
  });

  factory ResumeSuggestion.fromJson(Map<String, dynamic> json) {
    return ResumeSuggestion(
      type: json['type']?.toString() ?? 'info',
      title: json['title']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
    );
  }
}

class TargetSkillItem {
  final String skill;
  final int count;

  TargetSkillItem({
    required this.skill,
    required this.count,
  });

  factory TargetSkillItem.fromJson(Map<String, dynamic> json) {
    return TargetSkillItem(
      skill: json['skill']?.toString() ?? '',
      count: (json['count'] ?? 0) as int,
    );
  }
}

class MissingKeywordItem {
  final String skill;
  final int count;

  MissingKeywordItem({
    required this.skill,
    required this.count,
  });

  factory MissingKeywordItem.fromJson(Map<String, dynamic> json) {
    return MissingKeywordItem(
      skill: json['skill']?.toString() ?? '',
      count: (json['count'] ?? 0) as int,
    );
  }
}

class ApplicationGapItem {
  final int applicationId;
  final String jobTitle;
  final String company;
  final double finalScore;
  final List<String> missingSkills;

  ApplicationGapItem({
    required this.applicationId,
    required this.jobTitle,
    required this.company,
    required this.finalScore,
    required this.missingSkills,
  });

  factory ApplicationGapItem.fromJson(Map<String, dynamic> json) {
    return ApplicationGapItem(
      applicationId: (json['application_id'] ?? 0) as int,
      jobTitle: json['job_title']?.toString() ?? '',
      company: json['company']?.toString() ?? '',
      finalScore: ((json['final_score'] ?? 0) as num).toDouble(),
      missingSkills: (json['missing_skills'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}

class ResumeInsightData {
  final bool resumeUploaded;
  final String? fileName;
  final int score;
  final String level;
  final List<String> candidateSkills;
  final List<TargetSkillItem> targetSkills;
  final List<MissingKeywordItem> missingKeywords;
  final List<ResumeInsightChecklist> checklist;
  final List<ResumeSuggestion> suggestions;
  final List<ApplicationGapItem> applicationGaps;

  ResumeInsightData({
    required this.resumeUploaded,
    this.fileName,
    required this.score,
    required this.level,
    this.candidateSkills = const [],
    this.targetSkills = const [],
    this.missingKeywords = const [],
    this.checklist = const [],
    this.suggestions = const [],
    this.applicationGaps = const [],
  });

  factory ResumeInsightData.fromJson(Map<String, dynamic> json) {
    final resumeInfo = json['resume'] as Map<String, dynamic>?;
    return ResumeInsightData(
      resumeUploaded: resumeInfo?['uploaded'] == true,
      fileName: resumeInfo?['file_name']?.toString(),
      score: (json['score'] ?? 0) as int,
      level: json['level']?.toString() ?? 'Incomplete',
      candidateSkills: (json['candidate_skills'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      targetSkills: (json['target_skills'] as List<dynamic>?)
              ?.map((t) => TargetSkillItem.fromJson(t as Map<String, dynamic>))
              .toList() ??
          [],
      missingKeywords: (json['missing_keywords'] as List<dynamic>?)
              ?.map((m) => MissingKeywordItem.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [],
      checklist: (json['checklist'] as List<dynamic>?)
              ?.map((c) => ResumeInsightChecklist.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      suggestions: (json['suggestions'] as List<dynamic>?)
              ?.map((s) => ResumeSuggestion.fromJson(s as Map<String, dynamic>))
              .toList() ??
          [],
      applicationGaps: (json['application_gaps'] as List<dynamic>?)
              ?.map((g) => ApplicationGapItem.fromJson(g as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
