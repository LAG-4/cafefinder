import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:cafefindhyd/data/place_repository.dart';
import 'package:cafefindhyd/models/place.dart';
import 'package:cafefindhyd/state/app_state.dart';
import 'package:cafefindhyd/ui/home_page.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class FakePlaceRepository implements PlaceRepository {
  @override
  Future<List<Place>> loadPlaces() async => [];
}

void main() {
  testWidgets('Home page renders', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          placeRepositoryProvider.overrideWithValue(FakePlaceRepository()),
        ],
        child: const MaterialApp(home: HomePage()),
      ),
    );

    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('CafeCompas'), findsOneWidget);
  });
}
