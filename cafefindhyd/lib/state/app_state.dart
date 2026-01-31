import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/offers_repository.dart';
import '../data/place_repository.dart';
import '../data/review_repository.dart';
import '../models/filter_state.dart';
import '../models/place.dart';
import '../models/place_offers.dart';
import '../models/review.dart';
import '../utils/filtering.dart';

final firestoreProvider = Provider<FirebaseFirestore>((ref) {
  return FirebaseFirestore.instance;
});

final placeRepositoryProvider = Provider<PlaceRepository>((ref) {
  return PlaceRepository(firestore: ref.watch(firestoreProvider));
});

final reviewRepositoryProvider = Provider<ReviewRepository>((ref) {
  return ReviewRepository(firestore: ref.watch(firestoreProvider));
});

final offersRepositoryProvider = Provider<OffersRepository>((ref) {
  return OffersRepository(firestore: ref.watch(firestoreProvider));
});

final placesProvider = FutureProvider<List<Place>>((ref) async {
  final repository = ref.watch(placeRepositoryProvider);
  return repository.loadPlaces();
});

final availableTypesProvider = Provider<List<String>>((ref) {
  final places = ref
      .watch(placesProvider)
      .maybeWhen(data: (data) => data, orElse: () => const <Place>[]);
  final types = <String>{};
  for (final place in places) {
    types.addAll(place.typeTags);
  }
  final list = types.toList()..sort();
  return list;
});

final availableLocationsProvider = Provider<List<String>>((ref) {
  final places = ref
      .watch(placesProvider)
      .maybeWhen(data: (data) => data, orElse: () => const <Place>[]);
  final locations = <String>{};
  for (final place in places) {
    locations.addAll(place.locationTags);
  }
  final list = locations.toList()..sort();
  return list;
});

class FilterStateNotifier extends Notifier<FilterState> {
  @override
  FilterState build() => FilterState.empty();

  void update(FilterState updated) => state = updated;

  void reset() => state = FilterState.empty();

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }
}

final filterStateProvider = NotifierProvider<FilterStateNotifier, FilterState>(
  FilterStateNotifier.new,
);

final activePresetProvider = StateProvider<String?>((ref) => null);

final sortModeProvider = StateProvider<SortMode>((ref) => SortMode.rank);

final filteredPlacesProvider = Provider<List<Place>>((ref) {
  final places = ref
      .watch(placesProvider)
      .maybeWhen(data: (data) => data, orElse: () => const <Place>[]);
  final filterState = ref.watch(filterStateProvider);
  final sortMode = ref.watch(sortModeProvider);
  return applyFilters(places, filterState, sortMode: sortMode);
});

final reviewsProvider = FutureProvider.family<List<Review>, String>((
  ref,
  placeSlug,
) async {
  final repository = ref.watch(reviewRepositoryProvider);
  return repository.getReviewsForPlace(placeSlug);
});

final placeOffersProvider = StreamProvider.family<PlaceOffers?, String>((
  ref,
  placeId,
) {
  final repository = ref.watch(offersRepositoryProvider);
  return repository.watchPlaceOffers(placeId);
});
