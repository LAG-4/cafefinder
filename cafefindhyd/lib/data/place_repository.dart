import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/place.dart';

class PlaceRepository {
  PlaceRepository({FirebaseFirestore? firestore})
    : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  Future<List<Place>> loadPlaces() async {
    try {
      final snapshot = await _firestore
          .collection('places')
          .orderBy('rank')
          .get();

      return snapshot.docs
          .map((doc) => _fromFirestore(doc.id, doc.data()))
          .toList();
    } catch (error) {
      throw PlaceLoadException('Failed to load places data: $error');
    }
  }

  Place _fromFirestore(String id, Map<String, dynamic> data) {
    final rawScores = Map<String, dynamic>.from(
      (data['rawScores'] as Map?) ?? const {},
    );

    final name = data['name']?.toString() ?? '';
    final location = data['area']?.toString() ?? '';
    final type = data['type']?.toString() ?? '';
    final image = data['image']?.toString() ?? '';
    final imageUrl = _isHttpUrl(image) ? image : '';

    final ratings = <String, String>{};
    for (final entry in _ratingKeyMap.entries) {
      final value = rawScores[entry.value];
      if (value is String && value.trim().isNotEmpty) {
        ratings[entry.key] = value;
      }
    }

    final fallbackOverall = _parseDouble((data['scores'] as Map?)?['overall']);
    final aestheticScore = _parseDouble(rawScores['aestheticScore']);

    final zomatoUrl = _getPlatformUrl(data, 'zomato');
    final swiggyUrl =
        _getPlatformUrl(data, 'swiggy_dineout') ??
        _getPlatformUrl(data, 'swiggy');
    final dineoutUrl = _getPlatformUrl(data, 'dineout');

    return Place(
      rank: _parseInt(data['rank']),
      name: name,
      location: location,
      type: type,
      imageUrls: imageUrl.isNotEmpty ? [imageUrl] : const [],
      aestheticScore: aestheticScore > 0 ? aestheticScore : fallbackOverall,
      ratings: ratings,
      slug: data['slug']?.toString() ?? id,
      typeTags: splitTypeTags(type),
      locationTags: splitLocationTags(location),
      zomato: zomatoUrl,
      swiggy: swiggyUrl,
      dineout: dineoutUrl,
    );
  }

  String? _getPlatformUrl(Map<String, dynamic> data, String providerKey) {
    final platforms = data['platforms'];
    if (platforms is Map) {
      final entry = platforms[providerKey];
      if (entry is Map) {
        final url = entry['url']?.toString() ?? '';
        if (_isHttpUrl(url)) return url;
      }
    }

    final flat = data['platforms.$providerKey.url']?.toString() ?? '';
    if (_isHttpUrl(flat)) return flat;
    return null;
  }

  int _parseInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.round();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  double _parseDouble(dynamic value) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
    return 0;
  }

  bool _isHttpUrl(String value) {
    final uri = Uri.tryParse(value);
    if (uri == null) return false;
    return uri.scheme == 'http' || uri.scheme == 'https';
  }
}

const Map<String, String> _ratingKeyMap = {
  'wifiSpeed': 'wifiSpeedAndReliability',
  'laptopWorkFriendliness': 'laptopWorkFriendliness',
  'powerOutlets': 'availabilityOfPowerOutlets',
  'noiseLevel': 'noiseLevel',
  'seatingComfort': 'seatingComfort',
  'ambiance': 'ambianceAndInteriorComfort',
  'crowdVibe': 'crowdVibe',
  'crowdDensity': 'crowdDensity',
  'communityVibe': 'communityVibe',
  'socialMediaFriendliness': 'socialMediaFriendliness',
  'funFactor': 'funFactor',
  'lighting': 'lighting',
  'musicQuality': 'musicQualityAndVolume',
  'temperatureComfort': 'temperatureComfort',
  'lineOfSight': 'lineOfSight',
  'foodQuality': 'foodQualityAndTaste',
  'drinkQuality': 'drinkQualityAndSelection',
  'valueForMoney': 'valueForMoney',
  'menuClarity': 'menuClarityAndUsability',
  'serviceSpeed': 'serviceSpeed',
  'staffFriendliness': 'staffFriendliness',
  'cleanliness': 'cleanlinessAndHygiene',
  'restroomCleanliness': 'restroomCleanliness',
  'foodSafety': 'foodSafety',
  'proactiveService': 'proactiveService',
  'waitTimes': 'waitTimes',
  'easeOfReservations': 'easeOfReservations',
  'paymentConvenience': 'paymentConvenience',
  'safety': 'safety',
  'inclusionForeigners': 'inclusionForeigners',
  'racismFreeEnvironment': 'racismFreeEnvironment',
  'airQuality': 'airQuality',
  'walkabilityAccessibility': 'walkabilityAccessibility',
};

class PlaceLoadException implements Exception {
  PlaceLoadException(this.message);

  final String message;

  @override
  String toString() => message;
}
