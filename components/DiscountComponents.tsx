import { Discount } from "../lib/types";

interface DiscountBadgeProps {
  discount: Discount;
  isCompact?: boolean;
}

export function DiscountBadge({ discount, isCompact = false }: DiscountBadgeProps) {
  const getPlatformColor = (platform: string) => {
    const colors = {
      zomato: 'bg-red-500 text-white',
      swiggy: 'bg-orange-500 text-white', 
      ubereats: 'bg-black text-white',
      dunzo: 'bg-blue-500 text-white',
      direct: 'bg-green-600 text-white'
    };
    return colors[platform as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      zomato: '🍽️',
      swiggy: '🛵',
      ubereats: '🚗',
      dunzo: '📦',
      direct: '🏪'
    };
    return icons[platform as keyof typeof icons] || '💰';
  };

  const getDiscountText = () => {
    if (discount.percentage) {
      return `${discount.percentage}% OFF`;
    }
    if (discount.amount) {
      return `₹${discount.amount} OFF`;
    }
    return 'OFFER';
  };

  if (isCompact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPlatformColor(discount.platform)}`}>
        <span>{getPlatformIcon(discount.platform)}</span>
        <span>{getDiscountText()}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-3 border-l-4 ${getPlatformColor(discount.platform)} bg-opacity-10 border-current`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPlatformColor(discount.platform)}`}>
              {getPlatformIcon(discount.platform)}
              {discount.platform.charAt(0).toUpperCase() + discount.platform.slice(1)}
            </span>
            <span className="text-lg font-bold text-green-600">{getDiscountText()}</span>
          </div>
          <h4 className="font-medium text-sm mb-1">{discount.title}</h4>
          <p className="text-xs text-gray-600 mb-2">{discount.description}</p>
          
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {discount.code && (
              <span className="bg-gray-100 px-2 py-1 rounded font-mono">
                Code: {discount.code}
              </span>
            )}
            {discount.minOrder && (
              <span>Min: ₹{discount.minOrder}</span>
            )}
            {discount.maxDiscount && (
              <span>Max: ₹{discount.maxDiscount}</span>
            )}
            {discount.validUntil && (
              <span>
                Valid till: {new Date(discount.validUntil).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        {discount.url && discount.url !== '#' && (
          <a 
            href={discount.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
          >
            Order Now
          </a>
        )}
      </div>
    </div>
  );
}

interface DiscountListProps {
  discounts: Discount[];
  maxVisible?: number;
}

export function DiscountList({ discounts, maxVisible = 3 }: DiscountListProps) {
  const activeDiscounts = discounts.filter(d => d.isActive);
  const displayDiscounts = maxVisible ? activeDiscounts.slice(0, maxVisible) : activeDiscounts;
  const hasMore = activeDiscounts.length > maxVisible;

  if (!activeDiscounts.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        <span className="text-2xl">🔍</span>
        <p className="text-sm mt-1">No active discounts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayDiscounts.map((discount) => (
        <DiscountBadge key={discount.id} discount={discount} />
      ))}
      
      {hasMore && (
        <div className="text-center py-2">
          <span className="text-xs text-gray-500">
            +{activeDiscounts.length - maxVisible} more offers available
          </span>
        </div>
      )}
    </div>
  );
}

interface BestDiscountBadgeProps {
  discount: Discount | null;
}

export function BestDiscountBadge({ discount }: BestDiscountBadgeProps) {
  if (!discount) return null;

  const getDiscountText = () => {
    if (discount.percentage) {
      return `${discount.percentage}% OFF`;
    }
    if (discount.amount) {
      return `₹${discount.amount} OFF`;
    }
    return 'OFFER';
  };

  return (
    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-10">
      🎉 {getDiscountText()}
    </div>
  );
}