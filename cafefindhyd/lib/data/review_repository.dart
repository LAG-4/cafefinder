import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/review.dart';

class ReviewRepository {
  ReviewRepository({FirebaseFirestore? firestore})
    : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  Future<List<Review>> getReviewsForPlace(String placeSlug) async {
    final snapshot = await _firestore
        .collection('reviews')
        .where('placeSlug', isEqualTo: placeSlug)
        .get();

    final reviews = snapshot.docs
        .map((doc) => _fromFirestore(doc.id, doc.data()))
        .toList();

    reviews.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return reviews;
  }

  Future<void> addReview(Review review) async {
    await _firestore.collection('reviews').add({
      'placeSlug': review.placeSlug,
      'comment': review.comment,
      'ratings': review.ratings,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  Review _fromFirestore(String id, Map<String, dynamic> data) {
    return Review(
      id: id,
      placeSlug: data['placeSlug']?.toString() ?? '',
      createdAt: _parseDate(data['createdAt']),
      comment: data['comment']?.toString() ?? '',
      ratings: _parseRatings(data['ratings']),
    );
  }

  DateTime _parseDate(dynamic value) {
    if (value is Timestamp) {
      return value.toDate();
    }
    if (value is String) {
      return DateTime.tryParse(value) ?? DateTime.now();
    }
    if (value is int) {
      return DateTime.fromMillisecondsSinceEpoch(value);
    }
    if (value is num) {
      return DateTime.fromMillisecondsSinceEpoch(value.toInt());
    }
    return DateTime.now();
  }

  Map<String, int> _parseRatings(dynamic value) {
    if (value is! Map) return {};
    final result = <String, int>{};
    value.forEach((key, raw) {
      final rating = raw is int
          ? raw
          : raw is num
          ? raw.toInt()
          : int.tryParse(raw.toString());
      if (rating != null) {
        result[key.toString()] = rating;
      }
    });
    return result;
  }
}
