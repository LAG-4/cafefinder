import 'dart:ui';
import 'package:flutter/material.dart';

import '../models/filter_state.dart';
import '../models/place.dart';
import '../theme/app_theme.dart';
import '../utils/filtering.dart';

class FilterPage extends StatefulWidget {
  const FilterPage({
    super.key,
    required this.initialState,
    required this.places,
    required this.availableTypes,
    required this.availableLocations,
  });

  final FilterState initialState;
  final List<Place> places;
  final List<String> availableTypes;
  final List<String> availableLocations;

  @override
  State<FilterPage> createState() => _FilterPageState();
}

class _FilterPageState extends State<FilterPage>
    with SingleTickerProviderStateMixin {
  late FilterState _state;
  late final TabController _tabController;
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    _state = widget.initialState;
    _tabController = TabController(length: 4, vsync: this)
      ..addListener(() {
        setState(() => _selectedTab = _tabController.index);
      });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final matchCount = applyFilters(widget.places, _state).length;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: MediaQuery.of(context).size.height * 0.85,
          color: AppColors.surface,
          child: Column(
            children: [
              // Handle and header
              _buildHeader(context),

              // Tab bar
              _buildTabBar(context),

              // Content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _BasicFiltersTab(
                      state: _state,
                      types: widget.availableTypes,
                      locations: widget.availableLocations,
                      onStateChanged: (newState) =>
                          setState(() => _state = newState),
                    ),
                    _RatingsFilterTab(
                      state: _state,
                      category: 'Work',
                      onStateChanged: (newState) =>
                          setState(() => _state = newState),
                    ),
                    _RatingsFilterTab(
                      state: _state,
                      category: 'Vibe',
                      onStateChanged: (newState) =>
                          setState(() => _state = newState),
                    ),
                    _AllRatingsTab(
                      state: _state,
                      onStateChanged: (newState) =>
                          setState(() => _state = newState),
                    ),
                  ],
                ),
              ),

              // Bottom action bar
              Container(
                padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + bottomPadding),
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  border: const Border(
                    top: BorderSide(color: AppColors.border),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '$matchCount places',
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(
                                  color: matchCount > 0
                                      ? AppColors.success
                                      : AppColors.error,
                                ),
                          ),
                          Text(
                            'match your filters',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    TextButton(
                      onPressed: () =>
                          setState(() => _state = FilterState.empty()),
                      child: const Text('Reset'),
                    ),
                    const SizedBox(width: 12),
                    FilledButton(
                      onPressed: () => Navigator.of(context).pop(_state),
                      child: const Text('Apply Filters'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: Column(
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Title row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.tune_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Filters',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    Text(
                      'Find your perfect spot',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Icon(
                    Icons.close_rounded,
                    color: AppColors.textSecondary,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar(BuildContext context) {
    final tabs = ['Basic', 'Work', 'Vibe', 'More'];

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: List.generate(tabs.length, (index) {
          final isSelected = _selectedTab == index;
          return Expanded(
            child: GestureDetector(
              onTap: () => _tabController.animateTo(index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    tabs[index],
                    style: TextStyle(
                      color: isSelected
                          ? Colors.white
                          : AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _BasicFiltersTab extends StatelessWidget {
  const _BasicFiltersTab({
    required this.state,
    required this.types,
    required this.locations,
    required this.onStateChanged,
  });

  final FilterState state;
  final List<String> types;
  final List<String> locations;
  final ValueChanged<FilterState> onStateChanged;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Rank range
        _FilterCard(
          title: 'Rank Range',
          icon: Icons.emoji_events_rounded,
          iconColor: AppColors.warning,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _RankLabel(rank: state.rankRange.start.round()),
                  Text('to', style: Theme.of(context).textTheme.bodySmall),
                  _RankLabel(rank: state.rankRange.end.round()),
                ],
              ),
              const SizedBox(height: 12),
              SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  rangeThumbShape: const RoundRangeSliderThumbShape(
                    enabledThumbRadius: 10,
                  ),
                ),
                child: RangeSlider(
                  values: state.rankRange,
                  min: 1,
                  max: 100,
                  divisions: 99,
                  onChanged: (values) =>
                      onStateChanged(state.copyWith(rankRange: values)),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Aesthetic score
        _FilterCard(
          title: 'Aesthetic Score',
          icon: Icons.star_rounded,
          iconColor: AppColors.tertiary,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Minimum ${state.minAesthetic.round()}',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.tertiary.withAlpha(26),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${state.minAesthetic.round()}+',
                      style: const TextStyle(
                        color: AppColors.tertiary,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Slider(
                value: state.minAesthetic,
                min: 0,
                max: 100,
                onChanged: (value) =>
                    onStateChanged(state.copyWith(minAesthetic: value)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Types
        _FilterCard(
          title: 'Type',
          icon: Icons.category_rounded,
          iconColor: AppColors.primary,
          child: Wrap(
            spacing: 10,
            runSpacing: 10,
            children: types.map((type) {
              final selected = state.selectedTypes.contains(type);
              return _SelectableChip(
                label: type,
                selected: selected,
                onTap: () {
                  final updated = Set<String>.from(state.selectedTypes);
                  if (selected) {
                    updated.remove(type);
                  } else {
                    updated.add(type);
                  }
                  onStateChanged(state.copyWith(selectedTypes: updated));
                },
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 16),

        // Locations
        _FilterCard(
          title: 'Location',
          icon: Icons.location_on_rounded,
          iconColor: AppColors.secondary,
          child: Wrap(
            spacing: 10,
            runSpacing: 10,
            children: locations.take(12).map((location) {
              final selected = state.selectedLocations.contains(location);
              return _SelectableChip(
                label: location,
                selected: selected,
                onTap: () {
                  final updated = Set<String>.from(state.selectedLocations);
                  if (selected) {
                    updated.remove(location);
                  } else {
                    updated.add(location);
                  }
                  onStateChanged(state.copyWith(selectedLocations: updated));
                },
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 16),

        // Include unknown toggle
        _FilterCard(
          title: 'Data Options',
          icon: Icons.tune_rounded,
          iconColor: AppColors.textMuted,
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Include unknown ratings',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Keep places with missing data',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Switch(
                value: state.includeUnknown,
                onChanged: (value) =>
                    onStateChanged(state.copyWith(includeUnknown: value)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RankLabel extends StatelessWidget {
  const _RankLabel({required this.rank});

  final int rank;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Text('#$rank', style: Theme.of(context).textTheme.titleSmall),
    );
  }
}

class _RatingsFilterTab extends StatelessWidget {
  const _RatingsFilterTab({
    required this.state,
    required this.category,
    required this.onStateChanged,
  });

  final FilterState state;
  final String category;
  final ValueChanged<FilterState> onStateChanged;

  @override
  Widget build(BuildContext context) {
    final metrics = ratingMetrics.where((m) => m.category == category).toList();

    return ListView(
      padding: const EdgeInsets.all(20),
      children: metrics.map((metric) {
        final current = state.thresholds[metric.key] ?? RatingThreshold.any;
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _ThresholdCard(
            metric: metric,
            value: current,
            onChanged: (threshold) {
              final updated = Map<String, RatingThreshold>.from(
                state.thresholds,
              );
              updated[metric.key] = threshold;
              onStateChanged(state.copyWith(thresholds: updated));
            },
          ),
        );
      }).toList(),
    );
  }
}

class _AllRatingsTab extends StatelessWidget {
  const _AllRatingsTab({required this.state, required this.onStateChanged});

  final FilterState state;
  final ValueChanged<FilterState> onStateChanged;

  @override
  Widget build(BuildContext context) {
    final grouped = <String, List<RatingMetric>>{};
    for (final metric in ratingMetrics) {
      grouped.putIfAbsent(metric.category, () => []).add(metric);
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: grouped.entries.map((entry) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                entry.key,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(color: AppColors.primary),
              ),
            ),
            ...entry.value.map((metric) {
              final current =
                  state.thresholds[metric.key] ?? RatingThreshold.any;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _CompactThresholdRow(
                  metric: metric,
                  value: current,
                  onChanged: (threshold) {
                    final updated = Map<String, RatingThreshold>.from(
                      state.thresholds,
                    );
                    updated[metric.key] = threshold;
                    onStateChanged(state.copyWith(thresholds: updated));
                  },
                ),
              );
            }),
            const SizedBox(height: 12),
          ],
        );
      }).toList(),
    );
  }
}

class _FilterCard extends StatelessWidget {
  const _FilterCard({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.child,
  });

  final String title;
  final IconData icon;
  final Color iconColor;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withAlpha(26),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: 12),
              Text(title, style: Theme.of(context).textTheme.titleSmall),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _SelectableChip extends StatelessWidget {
  const _SelectableChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withAlpha(26)
              : AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? AppColors.primary : AppColors.textSecondary,
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}

class _ThresholdCard extends StatelessWidget {
  const _ThresholdCard({
    required this.metric,
    required this.value,
    required this.onChanged,
  });

  final RatingMetric metric;
  final RatingThreshold value;
  final ValueChanged<RatingThreshold> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(metric.label, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 14),
          Row(
            children: RatingThreshold.values.map((threshold) {
              final selected = value == threshold;
              return Expanded(
                child: GestureDetector(
                  onTap: () => onChanged(threshold),
                  child: Container(
                    margin: EdgeInsets.only(
                      right: threshold != RatingThreshold.veryGood ? 8 : 0,
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: selected
                          ? AppColors.primary
                          : AppColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: selected ? AppColors.primary : AppColors.border,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        threshold.label,
                        style: TextStyle(
                          color: selected
                              ? Colors.white
                              : AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _CompactThresholdRow extends StatelessWidget {
  const _CompactThresholdRow({
    required this.metric,
    required this.value,
    required this.onChanged,
  });

  final RatingMetric metric;
  final RatingThreshold value;
  final ValueChanged<RatingThreshold> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              metric.label,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 3,
            child: Row(
              children:
                  [
                    RatingThreshold.any,
                    RatingThreshold.okay,
                    RatingThreshold.good,
                  ].map((threshold) {
                    final selected = value == threshold;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => onChanged(threshold),
                        child: Container(
                          margin: EdgeInsets.only(
                            right: threshold != RatingThreshold.good ? 6 : 0,
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: selected
                                ? AppColors.primary
                                : AppColors.surfaceElevated,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              threshold.label,
                              style: TextStyle(
                                color: selected
                                    ? Colors.white
                                    : AppColors.textMuted,
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
