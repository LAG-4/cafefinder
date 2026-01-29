import 'dart:math' as math;
import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

/// An animated gradient background that slowly shifts colors
/// for a dynamic, modern look.
class AnimatedBackground extends StatefulWidget {
  const AnimatedBackground({super.key, required this.child});

  final Widget child;

  @override
  State<AnimatedBackground> createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = _controller.value;
        // Slowly oscillate the gradient alignment
        final angle = t * 2 * math.pi;
        final dx = math.cos(angle) * 0.5;
        final dy = math.sin(angle) * 0.5;

        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment(-0.5 + dx, -1.0 + dy * 0.5),
              end: Alignment(0.5 - dx, 1.0 - dy * 0.5),
              colors: const [
                Color(0xFF0A0A0B), // base dark
                Color(0xFF12121A), // slightly purple tint
                Color(0xFF0D1117), // github-like dark
                Color(0xFF0A0A0B), // back to base
              ],
              stops: const [0.0, 0.4, 0.7, 1.0],
            ),
          ),
          child: child,
        );
      },
      child: Stack(
        children: [
          // Subtle accent glow orbs
          ..._buildGlowOrbs(),
          widget.child,
        ],
      ),
    );
  }

  List<Widget> _buildGlowOrbs() {
    return [
      // Primary color glow - top right
      AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final t = _controller.value;
          final offset = math.sin(t * 2 * math.pi) * 20;
          return Positioned(
            top: -80 + offset,
            right: -60 - offset * 0.5,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.primary.withAlpha(25),
                    AppColors.primary.withAlpha(8),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          );
        },
      ),
      // Secondary color glow - bottom left
      AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final t = _controller.value;
          final offset = math.cos(t * 2 * math.pi) * 15;
          return Positioned(
            bottom: -100 - offset,
            left: -80 + offset * 0.5,
            child: Container(
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.secondary.withAlpha(20),
                    AppColors.secondary.withAlpha(5),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.4, 1.0],
                ),
              ),
            ),
          );
        },
      ),
      // Tertiary accent - middle
      AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final t = _controller.value;
          final offsetX = math.sin(t * 2 * math.pi + 1) * 30;
          final offsetY = math.cos(t * 2 * math.pi + 1) * 20;
          return Positioned(
            top: 200 + offsetY,
            left: 50 + offsetX,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.tertiary.withAlpha(12),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 1.0],
                ),
              ),
            ),
          );
        },
      ),
    ];
  }
}
