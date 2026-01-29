import '../models/filter_state.dart';
import '../models/place.dart';

enum SortMode {
  rank('Rank', const []),
  work('Work Friendly', const [
    'wifiSpeed',
    'powerOutlets',
    'laptopWorkFriendliness',
    'noiseLevel',
    'seatingComfort',
  ]),
  budget('Budget', const ['valueForMoney']),
  coffee('Coffee', const ['drinkQuality']),
  dateNight('Date Night', const ['ambiance', 'lighting', 'musicQuality']),
  safeInclusive('Safe & Inclusive', const [
    'safety',
    'inclusionForeigners',
    'racismFreeEnvironment',
  ]);

  const SortMode(this.label, this.metrics);

  final String label;
  final List<String> metrics;
}

List<Place> applyFilters(
  List<Place> places,
  FilterState state, {
  SortMode sortMode = SortMode.rank,
}) {
  final query = state.searchQuery.trim().toLowerCase();
  final filtered = <Place>[];

  for (final place in places) {
    if (query.isNotEmpty) {
      final haystack = '${place.name} ${place.location} ${place.type}'
          .toLowerCase();
      if (!haystack.contains(query)) {
        continue;
      }
    }

    if (state.selectedTypes.isNotEmpty) {
      final hasType = place.typeTags.any(state.selectedTypes.contains);
      if (!hasType) {
        continue;
      }
    }

    if (state.selectedLocations.isNotEmpty) {
      final hasLocation = place.locationTags.any(
        state.selectedLocations.contains,
      );
      if (!hasLocation) {
        continue;
      }
    }

    if (place.rank < state.rankRange.start ||
        place.rank > state.rankRange.end) {
      continue;
    }
    if (place.aestheticScore < state.minAesthetic) {
      continue;
    }

    var matchesRatings = true;
    for (final entry in state.thresholds.entries) {
      final threshold = entry.value;
      if (threshold == RatingThreshold.any) {
        continue;
      }
      final rating = place.ratings[entry.key];
      final score = ratingScore(rating);
      if (score == null) {
        if (!state.includeUnknown) {
          matchesRatings = false;
          break;
        }
      } else if (score < threshold.minScore) {
        matchesRatings = false;
        break;
      }
    }
    if (!matchesRatings) {
      continue;
    }

    filtered.add(place);
  }

  filtered.sort((a, b) => _comparePlaces(a, b, sortMode));

  return filtered;
}

int _comparePlaces(Place a, Place b, SortMode sortMode) {
  if (sortMode == SortMode.rank) {
    return a.rank.compareTo(b.rank);
  }

  final scoreA = _metricScore(a, sortMode.metrics);
  final scoreB = _metricScore(b, sortMode.metrics);
  if (scoreA != scoreB) {
    return scoreB.compareTo(scoreA);
  }

  return a.rank.compareTo(b.rank);
}

double _metricScore(Place place, List<String> metrics) {
  if (metrics.isEmpty) return -1;

  final scores = <int>[];
  for (final key in metrics) {
    final score = ratingScore(place.ratings[key]);
    if (score != null) scores.add(score);
  }

  if (scores.isEmpty) return -1;
  final total = scores.reduce((a, b) => a + b);
  return total / scores.length;
}
