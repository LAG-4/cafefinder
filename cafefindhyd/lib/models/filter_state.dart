import 'package:flutter/material.dart';

enum RatingThreshold {
  any('Any', 0),
  okay('Okay+', 3),
  good('Good+', 4),
  veryGood('Very good+', 5);

  const RatingThreshold(this.label, this.minScore);

  final String label;
  final int minScore;
}

class FilterState {
  const FilterState({
    required this.searchQuery,
    required this.selectedTypes,
    required this.selectedLocations,
    required this.thresholds,
    required this.rankRange,
    required this.minAesthetic,
    required this.includeUnknown,
  });

  final String searchQuery;
  final Set<String> selectedTypes;
  final Set<String> selectedLocations;
  final Map<String, RatingThreshold> thresholds;
  final RangeValues rankRange;
  final double minAesthetic;
  final bool includeUnknown;

  FilterState copyWith({
    String? searchQuery,
    Set<String>? selectedTypes,
    Set<String>? selectedLocations,
    Map<String, RatingThreshold>? thresholds,
    RangeValues? rankRange,
    double? minAesthetic,
    bool? includeUnknown,
  }) {
    return FilterState(
      searchQuery: searchQuery ?? this.searchQuery,
      selectedTypes: selectedTypes ?? this.selectedTypes,
      selectedLocations: selectedLocations ?? this.selectedLocations,
      thresholds: thresholds ?? this.thresholds,
      rankRange: rankRange ?? this.rankRange,
      minAesthetic: minAesthetic ?? this.minAesthetic,
      includeUnknown: includeUnknown ?? this.includeUnknown,
    );
  }

  static FilterState empty() {
    return const FilterState(
      searchQuery: '',
      selectedTypes: {},
      selectedLocations: {},
      thresholds: {},
      rankRange: RangeValues(1, 100),
      minAesthetic: 0,
      includeUnknown: false,
    );
  }
}

class FilterPreset {
  const FilterPreset({
    required this.label,
    this.thresholds = const {},
    this.selectedTypes = const {},
    this.minAesthetic,
  });

  final String label;
  final Map<String, RatingThreshold> thresholds;
  final Set<String> selectedTypes;
  final double? minAesthetic;
}
