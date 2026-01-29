import 'package:flutter/material.dart';

import '../../models/place.dart';
import '../../theme/app_theme.dart';

class PlaceCard extends StatelessWidget {
  const PlaceCard({
    super.key,
    required this.place,
    required this.onTap,
    this.index = 0,
  });

  final Place place;
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final typeLabel = _shortType(place.type);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image section
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Image with built-in caching
                  _PlaceImage(imageUrl: place.heroImage, placeType: place.type),

                  // Gradient overlay
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 100,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withAlpha(179),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Rank badge
                  Positioned(
                    top: 10,
                    right: 10,
                    child: _RankBadge(rank: place.rank),
                  ),

                  // Name at bottom
                  Positioned(
                    left: 12,
                    right: 12,
                    bottom: 12,
                    child: Text(
                      place.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Info bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  // Location
                  const Icon(
                    Icons.location_on_rounded,
                    size: 14,
                    color: AppColors.textMuted,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      place.location,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Type chip
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(
                      typeLabel,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Score
                  const Icon(
                    Icons.star_rounded,
                    size: 16,
                    color: AppColors.warning,
                  ),
                  const SizedBox(width: 2),
                  Text(
                    place.overallScore.toStringAsFixed(0),
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _shortType(String type) {
    final lower = type.toLowerCase();
    if (lower.contains('cafe')) return 'Cafe';
    if (lower.contains('restaurant')) return 'Restaurant';
    if (lower.contains('bar')) return 'Bar';
    if (lower.contains('pub')) return 'Pub';
    if (lower.contains('bakery')) return 'Bakery';
    if (lower.contains('brewery')) return 'Brewery';
    if (lower.contains('lounge')) return 'Lounge';
    if (lower.contains('bistro')) return 'Bistro';
    if (lower.contains('club')) return 'Club';
    final parts = type.split(RegExp(r'[\/,&]'));
    for (final part in parts) {
      final trimmed = part.trim();
      if (trimmed.isNotEmpty && trimmed.length <= 15) {
        return trimmed;
      }
    }
    return 'Place';
  }
}

class _PlaceImage extends StatelessWidget {
  const _PlaceImage({required this.imageUrl, required this.placeType});

  final String imageUrl;
  final String placeType;

  @override
  Widget build(BuildContext context) {
    if (imageUrl.isEmpty) {
      return _buildPlaceholder();
    }

    // Flutter's Image.network has built-in memory caching
    return Image.network(
      imageUrl,
      fit: BoxFit.cover,
      // Enable caching
      cacheWidth: 800,
      cacheHeight: 800,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return Container(
          color: AppColors.surfaceLight,
          child: Center(
            child: CircularProgressIndicator(
              strokeWidth: 2,
              value: loadingProgress.expectedTotalBytes != null
                  ? loadingProgress.cumulativeBytesLoaded /
                        loadingProgress.expectedTotalBytes!
                  : null,
              color: AppColors.primary,
            ),
          ),
        );
      },
      errorBuilder: (context, error, stack) => _buildPlaceholder(),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: AppColors.surfaceLight,
      child: Center(
        child: Icon(
          _getIconForType(placeType),
          size: 48,
          color: AppColors.textMuted.withAlpha(128),
        ),
      ),
    );
  }

  IconData _getIconForType(String type) {
    final lower = type.toLowerCase();
    if (lower.contains('cafe') || lower.contains('coffee')) {
      return Icons.coffee_rounded;
    }
    if (lower.contains('bar') || lower.contains('pub')) {
      return Icons.local_bar_rounded;
    }
    if (lower.contains('restaurant')) {
      return Icons.restaurant_rounded;
    }
    return Icons.store_rounded;
  }
}

class _RankBadge extends StatelessWidget {
  const _RankBadge({required this.rank});

  final int rank;

  @override
  Widget build(BuildContext context) {
    final isTop3 = rank <= 3;
    final isTop10 = rank <= 10;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isTop3
            ? AppColors.warning
            : isTop10
            ? AppColors.primary
            : AppColors.surface.withAlpha(230),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '#$rank',
        style: TextStyle(
          color: isTop3
              ? Colors.black
              : isTop10
              ? Colors.white
              : AppColors.textPrimary,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
