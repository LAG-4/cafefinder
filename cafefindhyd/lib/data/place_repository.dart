import 'package:csv/csv.dart';
import 'package:flutter/services.dart';

import '../models/place.dart';

class PlaceRepository {
  PlaceRepository({required this.assetPath});

  final String assetPath;

  Future<List<Place>> loadPlaces() async {
    try {
      final csvString = await rootBundle.loadString(assetPath);
      final rows = _parseCsv(csvString);
      if (rows.isEmpty) return [];

      final headerRow = rows.first
          .map((cell) => cell.toString().trim())
          .toList();
      final headerIndices = <String, List<int>>{};
      for (var i = 0; i < headerRow.length; i++) {
        headerIndices.putIfAbsent(headerRow[i], () => []).add(i);
      }

      String? getValue(List<dynamic> row, String header) {
        final indices = headerIndices[header] ?? [];
        for (final index in indices) {
          if (index >= row.length) continue;
          final raw = row[index]?.toString().trim();
          if (raw != null && raw.isNotEmpty) return raw;
        }
        return null;
      }

      final places = <Place>[];
      for (var i = 1; i < rows.length; i++) {
        final row = rows[i];
        if (row.isEmpty) continue;

        final name = getValue(row, 'Name') ?? '';
        final location = getValue(row, 'Location') ?? '';
        final type = getValue(row, 'Type') ?? '';
        if (name.isEmpty || location.isEmpty || type.isEmpty) continue;

        final rankValue = getValue(row, 'Rank') ?? '0';
        final rank = int.tryParse(rankValue) ?? 0;
        final aestheticValue = getValue(row, 'Aesthetic_Score') ?? '0';
        final aestheticScore = double.tryParse(aestheticValue) ?? 0;

        final imagesRaw = getValue(row, 'Images') ?? '';
        final imageUrls = _splitImageUrls(imagesRaw);

        final ratings = <String, String>{};
        for (final metric in ratingMetrics) {
          String? value;
          for (final header in metric.headers) {
            value ??= getValue(row, header);
          }
          if (value != null && value.isNotEmpty) {
            ratings[metric.key] = value;
          }
        }

        final place = Place(
          rank: rank,
          name: name,
          location: location,
          type: type,
          imageUrls: imageUrls,
          aestheticScore: aestheticScore,
          ratings: ratings,
          slug: slugify('$name-$location'),
          typeTags: splitTypeTags(type),
          locationTags: splitLocationTags(location),
          zomato: getValue(row, 'Zomato'),
          swiggy: getValue(row, 'Swiggy'),
          dineout: getValue(row, 'Dineout'),
        );
        places.add(place);
      }

      return places;
    } catch (error) {
      throw PlaceLoadException('Failed to load places data: $error');
    }
  }

  List<String> _splitImageUrls(String raw) {
    if (raw.trim().isEmpty) return [];
    final parts = raw.split(RegExp(r',\s*(?=https?://)'));
    return parts
        .map((part) => part.trim())
        .where((part) => part.isNotEmpty)
        .toList();
  }

  List<List<dynamic>> _parseCsv(String csvString) {
    final converters = [
      const CsvToListConverter(eol: '\n'),
      const CsvToListConverter(eol: '\r\n'),
      const CsvToListConverter(eol: '\r'),
    ];

    for (final converter in converters) {
      final rows = converter.convert(csvString);
      if (rows.length > 1) return rows;
    }

    return const CsvToListConverter(eol: '\n').convert(csvString);
  }
}

class PlaceLoadException implements Exception {
  PlaceLoadException(this.message);

  final String message;

  @override
  String toString() => message;
}
