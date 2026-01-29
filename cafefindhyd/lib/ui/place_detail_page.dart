import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/place.dart';
import '../models/review.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';

class PlaceDetailPage extends ConsumerStatefulWidget {
  const PlaceDetailPage({super.key, required this.place});

  final Place place;

  @override
  ConsumerState<PlaceDetailPage> createState() => _PlaceDetailPageState();
}

class _PlaceDetailPageState extends ConsumerState<PlaceDetailPage> {
  Future<void> _addReview() async {
    final review = await showModalBottomSheet<Review>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => _ReviewSheet(place: widget.place),
    );

    if (!mounted || review == null) return;
    await ref.read(reviewRepositoryProvider).addReview(review);
    ref.invalidate(reviewsProvider(widget.place.slug));
  }

  @override
  Widget build(BuildContext context) {
    final place = widget.place;
    final sections = _groupMetrics();
    final reviewsAsync = ref.watch(reviewsProvider(place.slug));
    final reviews = reviewsAsync.value ?? [];
    final hasReviewError = reviewsAsync.hasError;

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addReview,
        icon: const Icon(Icons.edit_rounded),
        label: const Text('Review'),
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // App bar with image
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: AppColors.background,
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: CircleAvatar(
                backgroundColor: AppColors.surface,
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  if (place.heroImage.isNotEmpty)
                    Image.network(
                      place.heroImage,
                      fit: BoxFit.cover,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Container(
                          color: AppColors.surfaceLight,
                          child: const Center(
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        );
                      },
                      errorBuilder: (_, __, ___) => _buildPlaceholder(),
                    )
                  else
                    _buildPlaceholder(),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          AppColors.background.withAlpha(230),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: place.rank <= 3
                            ? AppColors.warning
                            : AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '#${place.rank}',
                        style: TextStyle(
                          color: place.rank <= 3
                              ? Colors.black
                              : AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    place.name,
                    style: Theme.of(context).textTheme.headlineLarge,
                  ),
                  const SizedBox(height: 8),

                  // Type and location
                  Row(
                    children: [
                      if (_getDisplayType(place).isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withAlpha(26),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _getDisplayType(place),
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w500,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      if (_getDisplayType(place).isNotEmpty)
                        const SizedBox(width: 8),
                      const Icon(
                        Icons.location_on_outlined,
                        size: 16,
                        color: AppColors.textMuted,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          place.location,
                          style: Theme.of(context).textTheme.bodyMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Score card
                  _ScoreCard(place: place),
                  const SizedBox(height: 20),

                  // Action buttons
                  _ActionButtons(place: place),
                  const SizedBox(height: 24),

                  // Community ratings
                  _Section(
                    title: 'Community Ratings',
                    child: reviewsAsync.isLoading
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.all(20),
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : hasReviewError
                        ? Text(
                            'Could not load reviews yet.',
                            style: Theme.of(context).textTheme.bodyMedium,
                          )
                        : _CommunitySummary(reviews: reviews),
                  ),
                  const SizedBox(height: 16),

                  // Rating sections
                  ...sections.entries.map(
                    (entry) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _Section(
                        title: entry.key,
                        child: Column(
                          children: entry.value.map((metric) {
                            return _RatingRow(
                              label: metric.label,
                              value: place.ratings[metric.key],
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ),

                  // Recent reviews
                  _Section(
                    title: 'Recent Reviews',
                    child: reviewsAsync.isLoading
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.all(20),
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : hasReviewError
                        ? Text(
                            'Could not load reviews yet.',
                            style: Theme.of(context).textTheme.bodyMedium,
                          )
                        : _ReviewList(reviews: reviews),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: AppColors.surfaceLight,
      child: const Center(
        child: Icon(Icons.store_rounded, size: 64, color: AppColors.textMuted),
      ),
    );
  }

  String _getDisplayType(Place place) {
    // First try the type field
    if (place.type.isNotEmpty) return place.type;
    // Fallback to first valid typeTag
    for (final tag in place.typeTags) {
      if (tag.isNotEmpty && !tag.contains('.') && tag.length > 2) {
        return tag;
      }
    }
    return '';
  }

  Map<String, List<RatingMetric>> _groupMetrics() {
    final map = <String, List<RatingMetric>>{};
    for (final metric in ratingMetrics) {
      map.putIfAbsent(metric.category, () => []).add(metric);
    }
    return map;
  }
}

class _ScoreCard extends StatelessWidget {
  const _ScoreCard({required this.place});

  final Place place;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatItem(
            icon: Icons.star_rounded,
            value: place.overallScore.toStringAsFixed(0),
            label: 'Score',
            color: AppColors.warning,
          ),
          Container(width: 1, height: 40, color: AppColors.border),
          _StatItem(
            icon: Icons.emoji_events_rounded,
            value: '#${place.rank}',
            label: 'Rank',
            color: AppColors.primary,
          ),
          Container(width: 1, height: 40, color: AppColors.border),
          _StatItem(
            icon: Icons.thumb_up_rounded,
            value: _getGrade(place),
            label: 'Grade',
            color: AppColors.success,
          ),
        ],
      ),
    );
  }

  String _getGrade(Place place) {
    final scores = <int>[];
    for (final rating in place.ratings.values) {
      final score = ratingScore(rating);
      if (score != null) scores.add(score);
    }
    if (scores.isEmpty) return '-';
    final avg = scores.reduce((a, b) => a + b) / scores.length;
    if (avg >= 4.5) return 'A+';
    if (avg >= 4) return 'A';
    if (avg >= 3.5) return 'B+';
    if (avg >= 3) return 'B';
    return 'C';
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 6),
        Text(
          value,
          style: Theme.of(
            context,
          ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _ActionButtons extends StatelessWidget {
  const _ActionButtons({required this.place});

  final Place place;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _ActionButton(
          icon: Icons.map_rounded,
          label: 'Maps',
          onTap: () => _openUrl(
            context,
            'https://maps.google.com/maps?q=${Uri.encodeComponent('${place.name} ${place.location} Hyderabad')}',
          ),
        ),
        if ((place.zomato ?? '').isNotEmpty)
          _ActionButton(
            icon: Icons.restaurant_rounded,
            label: 'Zomato',
            onTap: () => _openUrl(context, place.zomato!),
          ),
        if ((place.swiggy ?? '').isNotEmpty)
          _ActionButton(
            icon: Icons.delivery_dining_rounded,
            label: 'Swiggy',
            onTap: () => _openUrl(context, place.swiggy!),
          ),
        if ((place.dineout ?? '').isNotEmpty)
          _ActionButton(
            icon: Icons.local_offer_rounded,
            label: 'Dineout',
            onTap: () => _openUrl(context, place.dineout!),
          ),
      ],
    );
  }

  Future<void> _openUrl(BuildContext context, String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null || uri.scheme != 'https') {
      _showMessage(context, 'Invalid link');
      return;
    }

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && context.mounted) {
      _showMessage(context, 'Could not open link');
    }
  }

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _RatingRow extends StatelessWidget {
  const _RatingRow({required this.label, required this.value});

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    final score = ratingScore(value) ?? 0;
    final color = _colorForScore(score);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Text(
                value ?? 'Unknown',
                style: TextStyle(
                  color: color,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: score / 5,
              minHeight: 4,
              backgroundColor: AppColors.surfaceElevated,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Color _colorForScore(int score) {
    if (score >= 5) return AppColors.success;
    if (score >= 4) return const Color(0xFF84CC16);
    if (score >= 3) return AppColors.warning;
    if (score >= 2) return const Color(0xFFF97316);
    return AppColors.error;
  }
}

class _CommunitySummary extends StatelessWidget {
  const _CommunitySummary({required this.reviews});

  final List<Review> reviews;

  @override
  Widget build(BuildContext context) {
    if (reviews.isEmpty) {
      return Text(
        'No reviews yet. Be the first to share your experience!',
        style: Theme.of(context).textTheme.bodyMedium,
      );
    }

    final averages = <String, double>{};
    final counts = <String, int>{};

    for (final review in reviews) {
      review.ratings.forEach((key, value) {
        averages[key] = (averages[key] ?? 0) + value;
        counts[key] = (counts[key] ?? 0) + 1;
      });
    }

    final entries =
        averages.entries
            .map((e) => MapEntry(e.key, e.value / (counts[e.key] ?? 1)))
            .toList()
          ..sort((a, b) => b.value.compareTo(a.value));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${reviews.length} ${reviews.length == 1 ? 'review' : 'reviews'}',
          style: const TextStyle(
            color: AppColors.success,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        ...entries
            .take(5)
            .map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(child: Text(_friendlyKey(entry.key))),
                    Text(
                      entry.value.toStringAsFixed(1),
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
      ],
    );
  }

  String _friendlyKey(String key) {
    final match = ratingMetrics.firstWhere(
      (metric) => metric.key == key,
      orElse: () => const RatingMetric(
        key: '',
        label: 'Rating',
        category: '',
        headers: [],
      ),
    );
    return match.label;
  }
}

class _ReviewList extends StatelessWidget {
  const _ReviewList({required this.reviews});

  final List<Review> reviews;

  @override
  Widget build(BuildContext context) {
    if (reviews.isEmpty) {
      return Text(
        'No reviews yet.',
        style: Theme.of(context).textTheme.bodyMedium,
      );
    }

    final sorted = List<Review>.from(reviews)
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    return Column(
      children: sorted
          .take(5)
          .map((review) => _ReviewCard(review: review))
          .toList(),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.review});

  final Review review;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _formatDate(review.createdAt),
            style: Theme.of(context).textTheme.bodySmall,
          ),
          if (review.comment.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(review.comment),
          ],
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: review.ratings.entries
                .map(
                  (entry) => Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${_shortLabel(entry.key)} ${entry.value}/5',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    return '${date.day}/${date.month}/${date.year}';
  }

  String _shortLabel(String key) {
    final match = ratingMetrics.firstWhere(
      (metric) => metric.key == key,
      orElse: () => const RatingMetric(
        key: '',
        label: 'Rating',
        category: '',
        headers: [],
      ),
    );
    return match.label.split(' ').first;
  }
}

class _ReviewSheet extends StatefulWidget {
  const _ReviewSheet({required this.place});

  final Place place;

  @override
  State<_ReviewSheet> createState() => _ReviewSheetState();
}

class _ReviewSheetState extends State<_ReviewSheet> {
  final _commentController = TextEditingController();
  final Map<String, int> _ratings = {};

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, viewInsets + 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
          Text(
            'Rate ${widget.place.name}',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          Flexible(
            child: SingleChildScrollView(
              child: Column(
                children: _reviewMetrics.map((metric) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          metric.label,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: List.generate(5, (index) {
                            final rating = index + 1;
                            final selected =
                                (_ratings[metric.key] ?? 0) >= rating;
                            return Expanded(
                              child: GestureDetector(
                                onTap: () => setState(
                                  () => _ratings[metric.key] = rating,
                                ),
                                child: Container(
                                  margin: EdgeInsets.only(
                                    right: index < 4 ? 6 : 0,
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    color: selected
                                        ? AppColors.primary
                                        : AppColors.surfaceLight,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: selected
                                          ? AppColors.primary
                                          : AppColors.border,
                                    ),
                                  ),
                                  child: Center(
                                    child: Text(
                                      '$rating',
                                      style: TextStyle(
                                        color: selected
                                            ? Colors.white
                                            : AppColors.textSecondary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _commentController,
            maxLines: 2,
            decoration: const InputDecoration(
              hintText: 'Add a note (optional)',
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () {
                final review = Review(
                  id: DateTime.now().millisecondsSinceEpoch.toString(),
                  placeSlug: widget.place.slug,
                  createdAt: DateTime.now(),
                  comment: _commentController.text.trim(),
                  ratings: Map<String, int>.from(_ratings)
                    ..removeWhere((_, value) => value == 0),
                );
                Navigator.of(context).pop(review);
              },
              child: const Text('Submit Review'),
            ),
          ),
        ],
      ),
    );
  }
}

const List<RatingMetric> _reviewMetrics = [
  RatingMetric(key: 'wifiSpeed', label: 'Wi-Fi', category: '', headers: []),
  RatingMetric(
    key: 'laptopWorkFriendliness',
    label: 'Work Friendly',
    category: '',
    headers: [],
  ),
  RatingMetric(
    key: 'noiseLevel',
    label: 'Noise Level',
    category: '',
    headers: [],
  ),
  RatingMetric(key: 'ambiance', label: 'Ambiance', category: '', headers: []),
  RatingMetric(
    key: 'foodQuality',
    label: 'Food Quality',
    category: '',
    headers: [],
  ),
  RatingMetric(key: 'valueForMoney', label: 'Value', category: '', headers: []),
  RatingMetric(
    key: 'cleanliness',
    label: 'Cleanliness',
    category: '',
    headers: [],
  ),
  RatingMetric(
    key: 'serviceSpeed',
    label: 'Service',
    category: '',
    headers: [],
  ),
];
