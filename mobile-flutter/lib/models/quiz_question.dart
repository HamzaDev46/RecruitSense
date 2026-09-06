class QuizQuestion {
  final int id;
  final int? companyId;
  final String category;
  final String questionText;
  final List<String> options;
  final String? correctAnswer; // Only present for company admin view
  final String? difficulty;

  QuizQuestion({
    required this.id,
    this.companyId,
    required this.category,
    required this.questionText,
    required this.options,
    this.correctAnswer,
    this.difficulty,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    List<String> parsedOptions = [];

    if (json['options'] != null) {
      if (json['options'] is List) {
        parsedOptions = (json['options'] as List).map((e) => e.toString()).toList();
      } else if (json['options'] is Map) {
        parsedOptions = (json['options'] as Map).values.map((e) => e.toString()).toList();
      }
    } else {
      // Fallback for individual option fields
      if (json['option_a'] != null) parsedOptions.add(json['option_a'].toString());
      if (json['option_b'] != null) parsedOptions.add(json['option_b'].toString());
      if (json['option_c'] != null) parsedOptions.add(json['option_c'].toString());
      if (json['option_d'] != null) parsedOptions.add(json['option_d'].toString());
    }

    return QuizQuestion(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      companyId: json['company_id'] != null
          ? (json['company_id'] is int ? json['company_id'] : int.tryParse(json['company_id'].toString()))
          : null,
      category: json['category'] ?? 'General',
      questionText: json['question_text'] ?? json['question'] ?? '',
      options: parsedOptions,
      correctAnswer: json['correct_answer'] ?? json['correct_option'],
      difficulty: json['difficulty'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'company_id': companyId,
      'category': category,
      'question_text': questionText,
      'options': options,
      'correct_answer': correctAnswer,
      'difficulty': difficulty,
    };
  }
}
