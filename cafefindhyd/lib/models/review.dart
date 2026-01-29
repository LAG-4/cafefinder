class Review {
  const Review({
    required this.id,
    required this.placeSlug,
    required this.createdAt,
    required this.comment,
    required this.ratings,
  });

  final String id;
  final String placeSlug;
  final DateTime createdAt;
  final String comment;
  final Map<String, int> ratings;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'placeSlug': placeSlug,
      'createdAt': createdAt.toIso8601String(),
      'comment': comment,
      'ratings': ratings,
    };
  }

  static Review fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] as String,
      placeSlug: json['placeSlug'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      comment: (json['comment'] as String?) ?? '',
      ratings: Map<String, int>.from(json['ratings'] as Map),
    );
  }
}
