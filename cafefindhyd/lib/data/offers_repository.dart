import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/place_offers.dart';

class OffersRepository {
  OffersRepository({FirebaseFirestore? firestore})
    : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  Stream<PlaceOffers?> watchPlaceOffers(String placeId) {
    return _firestore.collection('placeOffers').doc(placeId).snapshots().map((
      doc,
    ) {
      if (!doc.exists) return null;
      return _fromFirestore(doc.id, doc.data() ?? const {});
    });
  }

  PlaceOffers _fromFirestore(String id, Map<String, dynamic> data) {
    final updatedAt = parseFirestoreTimestamp(data['updatedAt']);
    final providersRaw = _extractProvidersRaw(data);

    final providers = <String, ProviderOffers>{};
    for (final entry in providersRaw.entries) {
      final providerKey = entry.key;
      final providerData = entry.value;
      final providerOffers = _parseProvider(providerData);
      if (providerOffers != null) {
        providers[providerKey] = providerOffers;
      }
    }

    return PlaceOffers(placeId: id, updatedAt: updatedAt, providers: providers);
  }

  Map<String, Map<String, dynamic>> _extractProvidersRaw(
    Map<String, dynamic> data,
  ) {
    final providers = <String, Map<String, dynamic>>{};

    final nested = data['providers'];
    if (nested is Map) {
      nested.forEach((key, value) {
        if (key is! String) return;
        if (value is Map) {
          providers[key] = Map<String, dynamic>.from(value);
        }
      });
    }

    // Back-compat: some docs may contain literal keys like "providers.zomato.offers".
    for (final entry in data.entries) {
      final key = entry.key;
      final value = entry.value;
      if (!key.startsWith('providers.') || key == 'providers') {
        continue;
      }
      final parts = key.split('.');
      if (parts.length < 3) continue;
      final providerKey = parts[1];
      final field = parts.sublist(2).join('.');
      final map = providers.putIfAbsent(providerKey, () => <String, dynamic>{});
      map[field] = value;
    }

    return providers;
  }

  ProviderOffers? _parseProvider(Map<String, dynamic> data) {
    final sourceUrl = data['sourceUrl']?.toString() ?? '';
    final status = data['status']?.toString() ?? 'unknown';
    final stale = (data['stale'] is bool)
        ? (data['stale'] as bool)
        : status != 'ok';
    final parserVersion = data['parserVersion']?.toString() ?? '';
    final fetchedAt = parseFirestoreTimestamp(data['fetchedAt']);
    final errorMessage = data['errorMessage']?.toString();
    final hash = data['hash']?.toString();

    final offers = <Offer>[];
    final rawOffers = data['offers'];
    if (rawOffers is List) {
      for (final item in rawOffers) {
        if (item is Map) {
          offers.add(Offer.fromJson(Map<String, dynamic>.from(item)));
        }
      }
    }

    final rawOfferTexts = <String>[];
    final rawTexts = data['rawOfferTexts'];
    if (rawTexts is List) {
      for (final item in rawTexts) {
        final text = item?.toString() ?? '';
        if (text.trim().isNotEmpty) {
          rawOfferTexts.add(text.trim());
        }
      }
    }

    return ProviderOffers(
      sourceUrl: sourceUrl,
      fetchedAt: fetchedAt,
      status: status,
      stale: stale,
      parserVersion: parserVersion,
      offers: offers,
      rawOfferTexts: rawOfferTexts,
      errorMessage: errorMessage,
      hash: hash,
    );
  }
}
