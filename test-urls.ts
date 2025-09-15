import axios from 'axios';

// Test some known restaurant URLs to verify patterns
const testUrls = [
  'https://www.zomato.com/hyderabad/hard-rock-cafe-banjara-hills',
  'https://www.zomato.com/hyderabad/one8-commune-hitech-city', 
  'https://www.zomato.com/hyderabad/social-hitech-city',
  'https://www.zomato.com/hyderabad/social-jubilee-hills',
  'https://www.zomato.com/hyderabad/ministry-of-beer-film-nagar',
  'https://www.zomato.com/hyderabad/aqua-the-park-somajiguda',
  'https://www.zomato.com/hyderabad/roast-coffee-banjara-hills',
  'https://www.zomato.com/hyderabad/starbucks-coffee-hitech-city',
  'https://www.zomato.com/hyderabad/echoes-cafe-madhapur',
  'https://www.zomato.com/hyderabad/echoes-cafe-kokapet'
];

async function testUrl(url: string): Promise<{ url: string; status: number; hasOffers: boolean }> {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const hasOffers = response.data.includes('Dining Offers') || response.data.includes('DINING OFFERS');
    
    return {
      url,
      status: response.status,
      hasOffers
    };
  } catch (error: any) {
    return {
      url,
      status: error.response?.status || 0,
      hasOffers: false
    };
  }
}

async function testAllUrls() {
  console.log('Testing known Zomato URLs to verify patterns...\n');
  
  for (const url of testUrls) {
    const result = await testUrl(url);
    const statusColor = result.status === 200 ? '✅' : '❌';
    const offersIndicator = result.hasOffers ? '🎯' : '📄';
    
    console.log(`${statusColor} ${offersIndicator} ${result.status} - ${url}`);
    
    // Be respectful with requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testAllUrls().catch(console.error);