import 'package:cloud_firestore/cloud_firestore.dart';

class OfferSource {
  const OfferSource({required this.providerKey, required this.sourceUrl});

  final String providerKey;
  final String sourceUrl;

  Map<String, dynamic> toJson() {
    return {'providerKey': providerKey, 'sourceUrl': sourceUrl};
  }

  static OfferSource fromJson(Map<String, dynamic> json) {
    return OfferSource(
      providerKey: json['providerKey']?.toString() ?? '',
      sourceUrl: json['sourceUrl']?.toString() ?? '',
    );
  }
}

class Offer {
  const Offer({
    required this.title,
    required this.mode,
    required this.type,
    required this.value,
    required this.currency,
    required this.minSpend,
    required this.maxDiscount,
    required this.couponCode,
    required this.paymentInstrument,
    required this.validityText,
    required this.terms,
    required this.source,
  });

  final String title;
  final String mode;
  final String type;
  final double? value;
  final String? currency;
  final double? minSpend;
  final double? maxDiscount;
  final String? couponCode;
  final String? paymentInstrument;
  final String? validityText;
  final String? terms;
  final OfferSource source;

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'mode': mode,
      'type': type,
      'value': value,
      'currency': currency,
      'minSpend': minSpend,
      'maxDiscount': maxDiscount,
      'couponCode': couponCode,
      'paymentInstrument': paymentInstrument,
      'validityText': validityText,
      'terms': terms,
      'source': source.toJson(),
    };
  }

  static Offer fromJson(Map<String, dynamic> json) {
    return Offer(
      title: json['title']?.toString() ?? '',
      mode: json['mode']?.toString() ?? 'unknown',
      type: json['type']?.toString() ?? 'unknown',
      value: _parseDouble(json['value']),
      currency: json['currency']?.toString(),
      minSpend: _parseDouble(json['minSpend']),
      maxDiscount: _parseDouble(json['maxDiscount']),
      couponCode: json['couponCode']?.toString(),
      paymentInstrument: json['paymentInstrument']?.toString(),
      validityText: json['validityText']?.toString(),
      terms: json['terms']?.toString(),
      source: OfferSource.fromJson(
        Map<String, dynamic>.from((json['source'] as Map?) ?? const {}),
      ),
    );
  }
}

class ProviderOffers {
  const ProviderOffers({
    required this.sourceUrl,
    required this.fetchedAt,
    required this.status,
    required this.stale,
    required this.parserVersion,
    required this.offers,
    required this.rawOfferTexts,
    required this.errorMessage,
    required this.hash,
  });

  final String sourceUrl;
  final DateTime? fetchedAt;
  final String status;
  final bool stale;
  final String parserVersion;
  final List<Offer> offers;
  final List<String> rawOfferTexts;
  final String? errorMessage;
  final String? hash;

  bool get isOk => status == 'ok';
}

class PlaceOffers {
  const PlaceOffers({
    required this.placeId,
    required this.updatedAt,
    required this.providers,
  });

  final String placeId;
  final DateTime? updatedAt;
  final Map<String, ProviderOffers> providers;

  List<ProviderOffers> get providerList => providers.values.toList();
}

DateTime? parseFirestoreTimestamp(dynamic value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  if (value is num) return DateTime.fromMillisecondsSinceEpoch(value.toInt());
  return null;
}

double? _parseDouble(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}
