class RatingMetric {
  const RatingMetric({
    required this.key,
    required this.label,
    required this.category,
    required this.headers,
  });

  final String key;
  final String label;
  final String category;
  final List<String> headers;
}

class Place {
  const Place({
    required this.rank,
    required this.name,
    required this.location,
    required this.type,
    required this.imageUrls,
    required this.aestheticScore,
    required this.ratings,
    required this.slug,
    required this.typeTags,
    required this.locationTags,
    required this.zomato,
    required this.swiggy,
    required this.dineout,
  });

  final int rank;
  final String name;
  final String location;
  final String type;
  final List<String> imageUrls;
  final double aestheticScore;
  final Map<String, String> ratings;
  final String slug;
  final List<String> typeTags;
  final List<String> locationTags;
  final String? zomato;
  final String? swiggy;
  final String? dineout;

  String get heroImage => imageUrls.isNotEmpty ? imageUrls.first : '';
  double get overallScore => aestheticScore;
}

const List<RatingMetric> ratingMetrics = [
  RatingMetric(
    key: 'wifiSpeed',
    label: 'Wi-Fi Speed and Reliability',
    category: 'Work',
    headers: ['Wi-Fi Speed and Reliability'],
  ),
  RatingMetric(
    key: 'laptopWorkFriendliness',
    label: 'Laptop/Work Friendliness',
    category: 'Work',
    headers: ['Laptop/Work Friendliness (For Cafes)'],
  ),
  RatingMetric(
    key: 'powerOutlets',
    label: 'Availability of Power Outlets',
    category: 'Work',
    headers: ['Availability of Power Outlets'],
  ),
  RatingMetric(
    key: 'noiseLevel',
    label: 'Noise Level',
    category: 'Work',
    headers: ['Noise Level'],
  ),
  RatingMetric(
    key: 'seatingComfort',
    label: 'Seating Comfort',
    category: 'Work',
    headers: ['Seating Comfort'],
  ),
  RatingMetric(
    key: 'ambiance',
    label: 'Ambiance and Interior Comfort',
    category: 'Vibe',
    headers: ['Ambiance and Interior Comfort'],
  ),
  RatingMetric(
    key: 'crowdVibe',
    label: 'Crowd Vibe',
    category: 'Vibe',
    headers: ['Crowd Vibe (Chill, Lively, Too Rowdy, etc.)'],
  ),
  RatingMetric(
    key: 'crowdDensity',
    label: 'Crowd Density',
    category: 'Vibe',
    headers: ['Crowd Density (Not Too Crowded / Overcrowded)'],
  ),
  RatingMetric(
    key: 'communityVibe',
    label: 'Community Vibe',
    category: 'Vibe',
    headers: ['Community Vibe (Welcoming, Regulars, Neutral Ground Feel)'],
  ),
  RatingMetric(
    key: 'socialMediaFriendliness',
    label: 'Social Media Friendliness',
    category: 'Vibe',
    headers: ['Social Media Friendliness'],
  ),
  RatingMetric(
    key: 'funFactor',
    label: 'Fun Factor / Nightlife',
    category: 'Vibe',
    headers: ['Fun Factor/Nightlife Quality (For Bars/Pubs)'],
  ),
  RatingMetric(
    key: 'lighting',
    label: 'Lighting',
    category: 'Vibe',
    headers: ['Lighting (Brightness & Mood Suitability)'],
  ),
  RatingMetric(
    key: 'musicQuality',
    label: 'Music Quality and Volume',
    category: 'Vibe',
    headers: ['Music Quality and Volume'],
  ),
  RatingMetric(
    key: 'temperatureComfort',
    label: 'Temperature Comfort',
    category: 'Vibe',
    headers: ['Temperature Comfort (A/C effectiveness)'],
  ),
  RatingMetric(
    key: 'lineOfSight',
    label: 'Personal Space at Tables',
    category: 'Vibe',
    headers: ['Line of Sight/Personal Space at Tables'],
  ),
  RatingMetric(
    key: 'foodQuality',
    label: 'Food Quality and Taste',
    category: 'Food & Drink',
    headers: ['Food Quality and Taste'],
  ),
  RatingMetric(
    key: 'drinkQuality',
    label: 'Drink Quality and Selection',
    category: 'Food & Drink',
    headers: ['Drink Quality and Selection'],
  ),
  RatingMetric(
    key: 'valueForMoney',
    label: 'Value for Money / Pricing',
    category: 'Food & Drink',
    headers: ['Value for Money / Pricing'],
  ),
  RatingMetric(
    key: 'menuClarity',
    label: 'Menu Clarity and Usability',
    category: 'Food & Drink',
    headers: ['Menu Clarity and Usability'],
  ),
  RatingMetric(
    key: 'serviceSpeed',
    label: 'Service Speed',
    category: 'Service & Hygiene',
    headers: ['Service Speed'],
  ),
  RatingMetric(
    key: 'staffFriendliness',
    label: 'Staff Friendliness and Attentiveness',
    category: 'Service & Hygiene',
    headers: ['Staff Friendliness and Attentiveness'],
  ),
  RatingMetric(
    key: 'cleanliness',
    label: 'Cleanliness and Hygiene',
    category: 'Service & Hygiene',
    headers: ['Cleanliness and Hygiene'],
  ),
  RatingMetric(
    key: 'restroomCleanliness',
    label: 'Restroom Cleanliness',
    category: 'Service & Hygiene',
    headers: ['Restroom Cleanliness'],
  ),
  RatingMetric(
    key: 'foodSafety',
    label: 'Food Safety',
    category: 'Service & Hygiene',
    headers: ['Food Safety (Visible Practices & Perceived Trust)'],
  ),
  RatingMetric(
    key: 'proactiveService',
    label: 'Proactive Service',
    category: 'Service & Hygiene',
    headers: ['Proactive Service (Order Accuracy & Refills Without Prompting)'],
  ),
  RatingMetric(
    key: 'waitTimes',
    label: 'Wait Times / Queue Management',
    category: 'Service & Hygiene',
    headers: ['Wait Times / Queue Management'],
  ),
  RatingMetric(
    key: 'easeOfReservations',
    label: 'Ease of Reservations / Bookings',
    category: 'Service & Hygiene',
    headers: ['Ease of Reservations/Bookings'],
  ),
  RatingMetric(
    key: 'paymentConvenience',
    label: 'Payment Convenience',
    category: 'Service & Hygiene',
    headers: [
      'Payment Convenience (Multiple Digital Options/No Cash-Only Hassle)',
    ],
  ),
  RatingMetric(
    key: 'safety',
    label: 'Safety (General Safety and Safe for Women/LGBTQ+)',
    category: 'Safety & Inclusion',
    headers: ['Safety (General Safety and Safe for Women/LGBTQ+)'],
  ),
  RatingMetric(
    key: 'inclusionForeigners',
    label: 'Inclusion / Friendliness to Foreigners',
    category: 'Safety & Inclusion',
    headers: ['Inclusion/Friendliness to Foreigners'],
  ),
  RatingMetric(
    key: 'racismFreeEnvironment',
    label: 'Racism-Free Environment',
    category: 'Safety & Inclusion',
    headers: ['Racism-Free Environment'],
  ),
  RatingMetric(
    key: 'airQuality',
    label: 'Air Quality',
    category: 'Practical',
    headers: ['Air Quality (Indoors and Immediate Surroundings)'],
  ),
  RatingMetric(
    key: 'walkabilityAccessibility',
    label: 'Walkability / Accessibility',
    category: 'Practical',
    headers: ['Walkability/Accessibility'],
  ),
];

int? ratingScore(String? rating) {
  if (rating == null) return null;
  final normalized = rating.trim().toLowerCase();
  const map = {
    'very bad': 1,
    'bad': 2,
    'okay': 3,
    'good': 4,
    'very good': 5,
    'great': 5,
  };
  return map[normalized];
}

String slugify(String text) {
  final lower = text.toLowerCase();
  final cleaned = lower.replaceAll(RegExp(r'[^a-z0-9\s-]'), '');
  final dashed = cleaned.replaceAll(RegExp(r'\s+'), '-');
  return dashed.replaceAll(RegExp(r'-+'), '-').replaceAll(RegExp(r'^-|-$'), '');
}

List<String> splitTypeTags(String type) {
  // Remove parenthetical content like "(LGBTQ+ Safe Space)"
  final cleaned = type.replaceAll(RegExp(r'\(.*?\)'), '');
  // Split on common delimiters
  final parts = cleaned.split(RegExp(r'[\/,&]'));

  final result = <String>{};
  for (final part in parts) {
    final trimmed = part.trim();
    if (trimmed.isEmpty) continue;

    // Only add if it looks like a valid type (contains letters, reasonable length)
    // and doesn't look like garbage data (hex codes, URLs, etc.)
    if (_isValidType(trimmed)) {
      result.add(_normalizeType(trimmed));
    }
  }

  return result.toList();
}

bool _isValidType(String text) {
  // Reject if too short or too long
  if (text.length < 2 || text.length > 30) return false;

  // Reject if it looks like a hex code
  if (RegExp(r'^[0-9a-f]+$', caseSensitive: false).hasMatch(text)) return false;

  // Reject if it contains URL-like patterns
  if (text.contains('http') ||
      text.contains('.jpg') ||
      text.contains('.png') ||
      text.contains('?') ||
      text.contains('=')) {
    return false;
  }

  // Reject if it's mostly numbers
  final letterCount = text.replaceAll(RegExp(r'[^a-zA-Z]'), '').length;
  if (letterCount < text.length * 0.5) return false;

  // Must start with a letter
  if (!RegExp(r'^[a-zA-Z]').hasMatch(text)) return false;

  return true;
}

String _normalizeType(String text) {
  // Capitalize first letter of each word
  return text
      .split(' ')
      .map((word) {
        if (word.isEmpty) return word;
        return word[0].toUpperCase() + word.substring(1).toLowerCase();
      })
      .join(' ');
}

List<String> splitLocationTags(String location) {
  final parts = location.split(RegExp(r'[,&]'));
  final tokens = <String>{};
  for (final part in parts) {
    final trimmed = part.trim();
    if (trimmed.isEmpty) continue;
    tokens.add(trimmed);
  }
  return tokens.toList();
}
