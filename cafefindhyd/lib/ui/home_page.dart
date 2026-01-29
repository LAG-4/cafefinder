import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/filter_state.dart';
import '../models/place.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/filtering.dart';
import 'filter_page.dart';
import 'place_detail_page.dart';
import 'widgets/animated_background.dart';
import 'widgets/place_card.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  bool _showSearch = false;
  bool _showScrollToTop = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    final show = _scrollController.offset > 500;
    if (show != _showScrollToTop) {
      setState(() => _showScrollToTop = show);
    }
  }

  void _scrollToTop() {
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeInOutCubic,
    );
  }

  void _applyPreset(_PresetData preset) {
    final filterNotifier = ref.read(filterStateProvider.notifier);
    final activePresetNotifier = ref.read(activePresetProvider.notifier);
    final sortModeNotifier = ref.read(sortModeProvider.notifier);
    final currentPreset = ref.read(activePresetProvider);

    if (currentPreset == preset.label) {
      filterNotifier.reset();
      activePresetNotifier.state = null;
      sortModeNotifier.state = SortMode.rank;
      return;
    }

    final searchQuery = ref.read(filterStateProvider).searchQuery;
    final updated = FilterState.empty().copyWith(
      thresholds: preset.thresholds,
      selectedTypes: preset.selectedTypes,
      rankRange: preset.rankRange,
      minAesthetic: preset.minAesthetic ?? 0,
      includeUnknown: preset.includeUnknown,
      searchQuery: searchQuery,
    );

    filterNotifier.update(updated);
    activePresetNotifier.state = preset.label;
    sortModeNotifier.state = preset.sortMode;
  }

  Future<void> _openFilters(
    List<Place> places,
    List<String> types,
    List<String> locations,
  ) async {
    final currentState = ref.read(filterStateProvider);
    final updated = await showModalBottomSheet<FilterState>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FilterPage(
        initialState: currentState,
        places: places,
        availableTypes: types,
        availableLocations: locations,
      ),
    );

    if (updated != null) {
      ref.read(filterStateProvider.notifier).update(updated);
      ref.read(activePresetProvider.notifier).state = null;
      ref.read(sortModeProvider.notifier).state = SortMode.rank;
    }
  }

  int _activeFilterCount(FilterState state) {
    var count = 0;
    count += state.selectedTypes.length;
    count += state.selectedLocations.length;
    count += state.thresholds.values
        .where((t) => t != RatingThreshold.any)
        .length;
    if (state.minAesthetic > 0) count++;
    if (state.rankRange.start != 1 || state.rankRange.end != 100) count++;
    return count;
  }

  @override
  Widget build(BuildContext context) {
    final filterState = ref.watch(filterStateProvider);
    final activePreset = ref.watch(activePresetProvider);
    final sortMode = ref.watch(sortModeProvider);
    final filterCount = _activeFilterCount(filterState);
    final placesAsync = ref.watch(placesProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: AnimatedOpacity(
        opacity: _showScrollToTop ? 1.0 : 0.0,
        duration: const Duration(milliseconds: 200),
        child: _showScrollToTop
            ? FloatingActionButton.small(
                onPressed: _scrollToTop,
                backgroundColor: AppColors.surfaceElevated,
                foregroundColor: AppColors.textPrimary,
                elevation: 4,
                child: const Icon(Icons.arrow_upward_rounded),
              )
            : null,
      ),
      body: AnimatedBackground(
        child: SafeArea(
          child: placesAsync.when(
            loading: () => const _LoadingState(),
            error: (error, _) => _ErrorState(
              message: error.toString(),
              onRetry: () => ref.invalidate(placesProvider),
            ),
            data: (places) {
              final filtered = applyFilters(
                places,
                filterState,
                sortMode: sortMode,
              );
              final types = ref.watch(availableTypesProvider);
              final locations = ref.watch(availableLocationsProvider);

              return RefreshIndicator(
                onRefresh: () => ref.refresh(placesProvider.future),
                child: Scrollbar(
                  controller: _scrollController,
                  thumbVisibility: true,
                  interactive: true,
                  radius: const Radius.circular(8),
                  thickness: 6,
                  child: CustomScrollView(
                    controller: _scrollController,
                    physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics(),
                    ),
                    slivers: [
                      SliverToBoxAdapter(
                        child: _buildHeader(context, filterCount),
                      ),
                      SliverToBoxAdapter(
                        child: _buildPresets(context, activePreset),
                      ),
                      SliverToBoxAdapter(
                        child: _buildResultsBar(
                          context,
                          filtered,
                          activePreset,
                          sortMode,
                        ),
                      ),
                      if (filterCount > 0 && activePreset == null)
                        SliverToBoxAdapter(
                          child: _buildActiveFilters(context, filterState),
                        ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                        sliver: SliverLayoutBuilder(
                          builder: (context, constraints) {
                            final width = constraints.crossAxisExtent;
                            final crossAxisCount = width > 600 ? 2 : 1;
                            return SliverGrid(
                              delegate: SliverChildBuilderDelegate((
                                context,
                                index,
                              ) {
                                final place = filtered[index];
                                return PlaceCard(
                                  place: place,
                                  index: index,
                                  onTap: () => _openPlaceDetail(place),
                                );
                              }, childCount: filtered.length),
                              gridDelegate:
                                  SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: crossAxisCount,
                                    crossAxisSpacing: 12,
                                    mainAxisSpacing: 12,
                                    childAspectRatio: 1.0,
                                  ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, int filterCount) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [AppColors.primary, AppColors.secondary],
                      ).createShader(bounds),
                      child: Text(
                        'CafeCompas',
                        style: theme.textTheme.displayLarge?.copyWith(
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Discover the best spots in Hyderabad',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              _HeaderButton(
                icon: Icons.search_rounded,
                isActive: _showSearch,
                onTap: () {
                  setState(() => _showSearch = !_showSearch);
                  if (!_showSearch) {
                    _searchController.clear();
                    ref.read(filterStateProvider.notifier).setSearchQuery('');
                  }
                },
              ),
              const SizedBox(width: 8),
              _HeaderButton(
                icon: Icons.tune_rounded,
                badge: filterCount > 0 ? filterCount : null,
                onTap: () {
                  final places = ref.read(placesProvider).value ?? [];
                  final types = ref.read(availableTypesProvider);
                  final locations = ref.read(availableLocationsProvider);
                  if (places.isEmpty) return;
                  _openFilters(places, types, locations);
                },
              ),
            ],
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
            child: _showSearch
                ? Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: TextField(
                      controller: _searchController,
                      autofocus: true,
                      onChanged: (value) => ref
                          .read(filterStateProvider.notifier)
                          .setSearchQuery(value),
                      decoration: InputDecoration(
                        hintText: 'Search cafes, restaurants, areas...',
                        prefixIcon: const Icon(Icons.search_rounded),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.close_rounded, size: 20),
                                onPressed: () {
                                  _searchController.clear();
                                  ref
                                      .read(filterStateProvider.notifier)
                                      .setSearchQuery('');
                                },
                              )
                            : null,
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _buildPresets(BuildContext context, String? activePreset) {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: _presets.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final preset = _presets[index];
          final isActive = activePreset == preset.label;

          return GestureDetector(
            onTap: () => _applyPreset(preset),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: isActive ? preset.color : AppColors.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isActive ? preset.color : AppColors.border,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    preset.icon,
                    size: 16,
                    color: isActive ? Colors.white : preset.color,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    preset.label,
                    style: TextStyle(
                      color: isActive ? Colors.white : AppColors.textPrimary,
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildResultsBar(
    BuildContext context,
    List<Place> filtered,
    String? activePreset,
    SortMode sortMode,
  ) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Row(
        children: [
          Text(
            '${filtered.length} places',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          if (activePreset != null) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(26),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                activePreset,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
          const Spacer(),
          Flexible(
            child: Text(
              'Sorted by ${sortMode.label}',
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.textMuted),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveFilters(BuildContext context, FilterState state) {
    final filters = <String>[];
    filters.addAll(state.selectedTypes);
    filters.addAll(state.selectedLocations);
    if (state.minAesthetic > 0) {
      filters.add('Score ${state.minAesthetic.round()}+');
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: SizedBox(
              height: 32,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount:
                    filters.take(3).length + (filters.length > 3 ? 1 : 0),
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (context, index) {
                  if (index == 3) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '+${filters.length - 3}',
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    );
                  }
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(26),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      filters[index],
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () {
              _searchController.clear();
              ref.read(filterStateProvider.notifier).reset();
              ref.read(activePresetProvider.notifier).state = null;
              ref.read(sortModeProvider.notifier).state = SortMode.rank;
            },
            child: const Icon(
              Icons.close_rounded,
              size: 20,
              color: AppColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  void _openPlaceDetail(Place place) {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => PlaceDetailPage(place: place)));
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(
            'Loading places...',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 32),
            const SizedBox(height: 12),
            Text(
              'Could not load places',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class _HeaderButton extends StatelessWidget {
  const _HeaderButton({
    required this.icon,
    required this.onTap,
    this.isActive = false,
    this.badge,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool isActive;
  final int? badge;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isActive ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(
              icon,
              size: 22,
              color: isActive ? Colors.white : AppColors.textSecondary,
            ),
            if (badge != null)
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  width: 16,
                  height: 16,
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '$badge',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _PresetData {
  const _PresetData({
    required this.label,
    required this.icon,
    required this.color,
    required this.sortMode,
    this.thresholds = const {},
    this.selectedTypes = const {},
    this.rankRange = const RangeValues(1, 100),
    this.minAesthetic,
    this.includeUnknown = true,
  });

  final String label;
  final IconData icon;
  final Color color;
  final SortMode sortMode;
  final Map<String, RatingThreshold> thresholds;
  final Set<String> selectedTypes;
  final RangeValues rankRange;
  final double? minAesthetic;
  final bool includeUnknown;
}

final List<_PresetData> _presets = [
  _PresetData(
    label: 'Top Picks',
    icon: Icons.emoji_events_rounded,
    color: AppColors.warning,
    sortMode: SortMode.rank,
    rankRange: RangeValues(1, 20),
  ),
  _PresetData(
    label: 'Work-Friendly',
    icon: Icons.laptop_mac_rounded,
    color: AppColors.primary,
    sortMode: SortMode.work,
    thresholds: {
      'wifiSpeed': RatingThreshold.okay,
      'powerOutlets': RatingThreshold.okay,
      'laptopWorkFriendliness': RatingThreshold.okay,
      'noiseLevel': RatingThreshold.okay,
      'seatingComfort': RatingThreshold.okay,
    },
  ),
  _PresetData(
    label: 'Budget',
    icon: Icons.savings_rounded,
    color: AppColors.success,
    sortMode: SortMode.budget,
    thresholds: {'valueForMoney': RatingThreshold.okay},
  ),
  _PresetData(
    label: 'Coffee',
    icon: Icons.coffee_rounded,
    color: AppColors.secondary,
    sortMode: SortMode.coffee,
    thresholds: {'drinkQuality': RatingThreshold.okay},
  ),
  _PresetData(
    label: 'Date Night',
    icon: Icons.nightlife_rounded,
    color: AppColors.tertiary,
    sortMode: SortMode.dateNight,
  ),
  _PresetData(
    label: 'Safe & Inclusive',
    icon: Icons.shield_rounded,
    color: AppColors.error,
    sortMode: SortMode.safeInclusive,
    thresholds: {
      'safety': RatingThreshold.okay,
      'inclusionForeigners': RatingThreshold.okay,
      'racismFreeEnvironment': RatingThreshold.okay,
    },
  ),
];
