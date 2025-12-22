import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeProduct(url) {
  try {
    // Enhanced headers to bypass bot detection
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
      timeout: 15000, // Increased to 15 seconds
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Accept any status < 500
    });

    const $ = cheerio.load(data);
    const hostname = new URL(url).hostname.toLowerCase();

    let productData = {
      productName: null,
      currentPrice: null,
      currencyCode: 'INR',
      productImageUrl: null,
    };

    // Amazon India scraper
    if (hostname.includes('amazon')) {
      productData.productName = $('#productTitle').text().trim() || 
                                 $('h1.a-size-large').first().text().trim() ||
                                 $('#title').text().trim();
      
      // Multiple price selectors for Amazon
      let priceText = $('.a-price-whole').first().text().trim() ||
                      $('#priceblock_ourprice').text().trim() ||
                      $('#priceblock_dealprice').text().trim() ||
                      $('.a-price .a-offscreen').first().text().trim() ||
                      $('span.a-price-whole').first().text().trim() ||
                      $('.apexPriceToPay .a-offscreen').first().text().trim();
      
      productData.currentPrice = extractPrice(priceText);
      
      productData.productImageUrl = $('#landingImage').attr('src') ||
                                    $('#imgBlkFront').attr('src') ||
                                    $('.a-dynamic-image').first().attr('src') ||
                                    $('#main-image').attr('src');
      
      productData.currencyCode = priceText.includes('$') ? 'USD' : 'INR';
    }
    
    // Flipkart scraper
    else if (hostname.includes('flipkart')) {
      productData.productName = $('span.VU-ZEz').text().trim() ||
                                $('._35KyD6').text().trim() ||
                                $('h1.yhB1nd').text().trim() ||
                                $('h1 span').first().text().trim();
      
      let priceText = $('.Nx9bqj').first().text().trim() ||
                      $('._30jeq3').first().text().trim() ||
                      $('._1vC4OE').first().text().trim() ||
                      $('div._16Jk6d').first().text().trim();
      
      productData.currentPrice = extractPrice(priceText);
      
      productData.productImageUrl = $('._396cs4').attr('src') ||
                                    $('._2r_T1I').first().attr('src') ||
                                    $('img._53J4C-').attr('src');
      
      productData.currencyCode = 'INR';
    }
    
    // Myntra scraper
    else if (hostname.includes('myntra')) {
      productData.productName = $('h1.pdp-title').text().trim() ||
                                $('.pdp-name').text().trim();
      
      let priceText = $('.pdp-price strong').text().trim() ||
                      $('span.pdp-price').text().trim();
      
      productData.currentPrice = extractPrice(priceText);
      
      productData.productImageUrl = $('.image-grid-image').first().attr('src') ||
                                    $('img.img-responsive').first().attr('src');
      
      productData.currencyCode = 'INR';
    }
    
    // Generic scraper (for other sites)
    else {
      // Try common price selectors
      let priceText = $('.price').first().text().trim() ||
                      $('[itemprop="price"]').text().trim() ||
                      $('.product-price').first().text().trim() ||
                      $('span[class*="price"]').first().text().trim() ||
                      $('div[class*="price"]').first().text().trim() ||
                      $('.amount').first().text().trim();
      
      productData.currentPrice = extractPrice(priceText);
      
      // Try common name selectors
      productData.productName = $('h1').first().text().trim() ||
                                $('.product-title').text().trim() ||
                                $('[itemprop="name"]').text().trim() ||
                                $('.product-name').text().trim();
      
      // Try common image selectors
      productData.productImageUrl = $('.product-image img').attr('src') ||
                                    $('[itemprop="image"]').attr('src') ||
                                    $('.main-image').attr('src') ||
                                    $('img.product-img').attr('src');
      
      productData.currencyCode = 'INR';
    }

    // Validation
    if (!productData.productName || !productData.currentPrice) {
      console.error('Extraction failed. HTML preview:', $('body').text().substring(0, 200));
      throw new Error('Could not extract product data. The website may be blocking automated access or the structure has changed.');
    }

    console.log(`✓ Successfully scraped: ${productData.productName} - ${productData.currencyCode} ${productData.currentPrice}`);
    return productData;

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - website took too long to respond');
    }
    if (error.response?.status === 403) {
      throw new Error('Access denied (403) - website is blocking automated requests. Consider adding delays between requests or using a proxy.');
    }
    if (error.response?.status === 503) {
      throw new Error('Service unavailable (503) - website may be down or rate limiting requests');
    }
    
    console.error('Scraping error:', error.message);
    throw new Error(`Failed to scrape product: ${error.message}`);
  }
}

// Helper function to extract numeric price from text
function extractPrice(priceText) {
  if (!priceText) return null;
  
  // Remove currency symbols and extract numbers
  const numericPrice = priceText
    .replace(/[₹$€£,\s]/g, '') // Remove currency symbols and commas
    .replace(/[^0-9.]/g, '');   // Keep only numbers and decimal
  
  // Convert to number
  const price = parseFloat(numericPrice);
  
  return isNaN(price) ? null : price;
}


// credit limit reached of firecrawl

// import FirecrawlApp from "@mendable/firecrawl-js";

// const firecrawl = new FirecrawlApp({
//   apiKey: process.env.FIRECRAWL_API_KEY,
// });

// export async function scrapeProduct(url) {
//   try {
//     const result = await firecrawl.scrapeUrl(url, {
//       formats: ["extract"],
//       extract: {
//         prompt:
//           "Extract the product name as 'productName', current price as a number as 'currentPrice', currency code (USD, EUR, etc) as 'currencyCode', and product image URL as 'productImageUrl' if available",
//         schema: {
//           type: "object",
//           properties: {
//             productName: { type: "string" },
//             currentPrice: { type: "number" },
//             currencyCode: { type: "string" },
//             productImageUrl: { type: "string" },
//           },
//           required: ["productName", "currentPrice"],
//         },
//       },
//     });

//     // Firecrawl returns data in result.extract
//     const extractedData = result.extract;

//     if (!extractedData || !extractedData.productName) {
//       throw new Error("No data extracted from URL");
//     }

//     return extractedData;
//   } catch (error) {
//     console.error("Firecrawl scrape error:", error);
//     throw new Error(`Failed to scrape product: ${error.message}`);
//   }
// }
