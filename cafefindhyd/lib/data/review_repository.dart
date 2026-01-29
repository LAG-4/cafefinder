import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/review.dart';

class ReviewRepository {
  static const _storageKey = 'cafecompas.reviews';

  Future<List<Review>> loadReviews() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) return [];
    final decoded = jsonDecode(raw) as List<dynamic>;
    return decoded
        .map((item) => Review.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<Review>> getReviewsForPlace(String placeSlug) async {
    final all = await loadReviews();
    return all.where((review) => review.placeSlug == placeSlug).toList();
  }

  Future<void> addReview(Review review) async {
    final prefs = await SharedPreferences.getInstance();
    final all = await loadReviews();
    all.add(review);
    final encoded = jsonEncode(all.map((item) => item.toJson()).toList());
    await prefs.setString(_storageKey, encoded);
  }
}
