import { ParsedIntent } from '../types/index.js';

export class LocalDeterministicParser {
  /**
   * Deterministically parses shopping requests into structured purchase intent.
   * Runs locally with zero network calls and zero external dependencies.
   */
  public parse(input: string): ParsedIntent {
    const text = input.trim();
    const lower = text.toLowerCase();

    // 1. Budget extraction
    // Match ₹150, Rs 150, Rs. 150, 150 rupees, under 150, below 150, around 150, approx 150, 150 me, etc.
    let maxBudgetPaise = 0;
    const budgetMatch =
      lower.match(/(?:under|below|max|budget|within|upto|less than|around|approx|approximately|about|for around|for approx)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i) ||
      lower.match(/(?:₹|rs\.?|inr)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i) ||
      lower.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rupees|rs|inr|rupaye|me|mein)/i);

    if (budgetMatch && budgetMatch[1]) {
      const cleanNum = parseFloat(budgetMatch[1].replace(/,/g, ''));
      maxBudgetPaise = Math.round(cleanNum * 100);
    }

    // 2. Quantity and unit extraction
    // Match "2 litres", "1 litre", "500 ml", "1 kg", "2 pairs", "1 unit", "3 packets"
    let quantity = 1;
    let unit = 'Unit';

    const qtyMatch = lower.match(
      /(\d+(?:\.\d+)?)\s*(litres?|liters?|ltrs?|l|ml|kgs?|kilos?|grams?|g|packets?|packs?|pairs?|units?|pieces?)/i
    );

    if (qtyMatch) {
      quantity = parseFloat(qtyMatch[1]);
      const rawUnit = qtyMatch[2].toLowerCase();
      if (rawUnit.startsWith('l') || rawUnit === 'ltr' || rawUnit === 'ltrs') {
        unit = 'Litre';
      } else if (rawUnit === 'ml') {
        quantity = quantity / 1000;
        unit = 'Litre';
      } else if (rawUnit.startsWith('k')) {
        unit = 'Kg';
      } else if (rawUnit.startsWith('g')) {
        quantity = quantity / 1000;
        unit = 'Kg';
      } else if (rawUnit.startsWith('pair')) {
        unit = 'Pair';
      } else {
        unit = 'Unit';
      }
    } else {
      // Look for standalone numbers like "buy 2 amul milk"
      const numberPrefixMatch = lower.match(/\b(buy|get|order|purchase)\s+(\d+)\b/i);
      if (numberPrefixMatch) {
        quantity = parseInt(numberPrefixMatch[2], 10);
      }
    }

    // 3. Category & Brand & Variant recognition
    let productCategory = 'Groceries';
    let productName = 'Grocery Item';
    let preferredBrand = 'Generic';
    let variantOrModel = 'Standard';
    const mandatoryRequirements: string[] = [];
    const optionalPreferences: string[] = [];
    const permittedSubstitutions: string[] = [];

    if (lower.includes('milk') || lower.includes('doodh')) {
      productCategory = 'Milk';
      unit = unit === 'Unit' ? 'Litre' : unit;

      if (lower.includes('amul')) {
        preferredBrand = 'Amul';
        permittedSubstitutions.push('Mother Dairy', 'Nandini');
      } else if (lower.includes('mother dairy')) {
        preferredBrand = 'Mother Dairy';
        permittedSubstitutions.push('Amul', 'Nandini');
      } else if (lower.includes('nandini')) {
        preferredBrand = 'Nandini';
        permittedSubstitutions.push('Amul', 'Mother Dairy');
      }

      if (lower.includes('taaza')) {
        variantOrModel = 'Taaza Toned';
        productName = `${preferredBrand} Taaza Toned Milk`;
        mandatoryRequirements.push('Toned milk pasteurized');
      } else if (lower.includes('gold')) {
        variantOrModel = 'Gold Full Cream';
        productName = `${preferredBrand} Gold Full Cream Milk`;
        mandatoryRequirements.push('Full cream milk');
      } else if (lower.includes('cow')) {
        variantOrModel = 'Cow Milk';
        productName = `${preferredBrand} Cow Milk`;
        mandatoryRequirements.push('Pure cow milk');
      } else if (lower.includes('toned')) {
        variantOrModel = 'Toned';
        productName = `${preferredBrand} Toned Milk`;
        mandatoryRequirements.push('Toned milk');
      } else {
        variantOrModel = 'Fresh Milk';
        productName = `${preferredBrand} Fresh Milk`;
      }

      if (maxBudgetPaise === 0) {
        // Do not silently invent a default budget — trigger clarification
      }
    } else if (lower.includes('laptop') || lower.includes('macbook') || lower.includes('thinkpad')) {
      productCategory = 'Laptop';
      unit = 'Unit';

      if (lower.includes('apple') || lower.includes('macbook')) {
        preferredBrand = 'Apple';
        variantOrModel = lower.includes('m3') ? 'MacBook Air M3' : lower.includes('m2') ? 'MacBook Air M2' : 'MacBook Air';
        productName = `${preferredBrand} ${variantOrModel} 8GB 256GB`;
        mandatoryRequirements.push('Apple Silicon processor', 'Official warranty');
      } else if (lower.includes('dell')) {
        preferredBrand = 'Dell';
        variantOrModel = 'XPS 13 / Inspiron';
        productName = 'Dell Inspiron 15 Core i5';
        mandatoryRequirements.push('Intel Core i5 or above', '16GB RAM');
      } else if (lower.includes('hp')) {
        preferredBrand = 'HP';
        variantOrModel = 'Pavilion';
        productName = 'HP Pavilion 14 Ryzen 5';
      } else if (lower.includes('lenovo')) {
        preferredBrand = 'Lenovo';
        variantOrModel = 'IdeaPad Slim';
        productName = 'Lenovo IdeaPad Slim 3';
      } else {
        preferredBrand = 'Standard';
        productName = 'Productivity Laptop';
      }

      if (maxBudgetPaise === 0) {
        // Do not invent budget for laptop
      }
    } else if (lower.includes('phone') || lower.includes('smartphone') || lower.includes('iphone') || lower.includes('galaxy')) {
      productCategory = 'Smartphone';
      unit = 'Unit';

      if (lower.includes('apple') || lower.includes('iphone')) {
        preferredBrand = 'Apple';
        variantOrModel = lower.includes('15') ? 'iPhone 15 128GB' : lower.includes('14') ? 'iPhone 14 128GB' : 'iPhone';
        productName = `${preferredBrand} ${variantOrModel}`;
        mandatoryRequirements.push('128GB storage minimum', 'Brand new in box');
      } else if (lower.includes('samsung') || lower.includes('galaxy')) {
        preferredBrand = 'Samsung';
        variantOrModel = lower.includes('s24') ? 'Galaxy S24' : 'Galaxy A-Series';
        productName = `${preferredBrand} ${variantOrModel}`;
      } else if (lower.includes('oneplus')) {
        preferredBrand = 'OnePlus';
        variantOrModel = 'Nord CE';
        productName = 'OnePlus Nord CE 4 5G';
      } else {
        preferredBrand = 'Smartphone';
        productName = '5G Smartphone';
      }

      if (maxBudgetPaise === 0) {
        // Do not invent budget for phone
      }
    } else if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('running')) {
      productCategory = 'Shoes';
      unit = 'Pair';

      if (lower.includes('nike')) {
        preferredBrand = 'Nike';
        variantOrModel = 'Revolution / Air Max';
        productName = 'Nike Revolution Running Shoes';
        permittedSubstitutions.push('Adidas', 'Puma');
      } else if (lower.includes('adidas')) {
        preferredBrand = 'Adidas';
        variantOrModel = 'Ultraboost / Runfalcon';
        productName = 'Adidas Runfalcon 3.0';
        permittedSubstitutions.push('Nike', 'Puma');
      } else if (lower.includes('puma')) {
        preferredBrand = 'Puma';
        variantOrModel = 'Smash / Velocity';
        productName = 'Puma Velocity Nitro';
        permittedSubstitutions.push('Nike', 'Adidas');
      } else {
        preferredBrand = 'Athletic';
        productName = 'Running Sneakers';
      }

      if (maxBudgetPaise === 0) {
        // Do not invent budget for shoes
      }
    } else if (lower.includes('bread') || lower.includes('egg') || lower.includes('rice') || lower.includes('butter') || lower.includes('coffee')) {
      productCategory = 'Groceries';
      if (lower.includes('butter')) {
        preferredBrand = 'Amul';
        productName = 'Amul Pasteurized Salted Butter 500g';
        variantOrModel = 'Salted Butter 500g';
        unit = 'Unit';
      } else if (lower.includes('bread')) {
        preferredBrand = 'Harvest Gold';
        productName = 'Harvest Gold White / Brown Bread';
        variantOrModel = '400g';
        unit = 'Unit';
      } else if (lower.includes('coffee')) {
        preferredBrand = 'Nescafe';
        productName = 'Nescafe Classic Instant Coffee';
        variantOrModel = 'Jar 100g';
        unit = 'Unit';
      } else {
        preferredBrand = 'Daily Essentials';
        productName = 'Grocery Basket';
      }

      if (maxBudgetPaise === 0) {
        // Do not invent budget for groceries
      }
    } else {
      // Ambiguous / unsupported query check
      if (text.length < 5 || (!lower.includes('buy') && !lower.includes('order') && !lower.includes('get'))) {
        return {
          productCategory: 'Unknown',
          productName: text,
          preferredBrand: 'Unknown',
          variantOrModel: 'Unknown',
          quantity: 1,
          unit: 'Unit',
          maxBudgetPaise: 0,
          mandatoryRequirements: [],
          optionalPreferences: [],
          permittedSubstitutions: [],
          confidence: 0.2,
          ambiguityQuestion: `Could you clarify which product, brand, and target budget you wish to purchase? (e.g. "Buy 2 litres of Amul Taaza milk under ₹150")`
        };
      }
    }

    // Check if essential fields are missing to formulate interactive clarification question
    let ambiguityQuestion: string | undefined = undefined;
    if (maxBudgetPaise === 0) {
      ambiguityQuestion = `What is your maximum budget limit for ${quantity} ${unit} of ${productName}? (e.g. "Maximum budget ₹${productCategory === 'Milk' ? '150' : productCategory === 'Laptop' ? '85000' : '500'}")`;
    }

    return {
      productCategory,
      productName,
      preferredBrand,
      variantOrModel,
      quantity,
      unit,
      maxBudgetPaise,
      mandatoryRequirements,
      optionalPreferences,
      permittedSubstitutions,
      confidence: maxBudgetPaise > 0 ? 1.0 : 0.7,
      ambiguityQuestion
    };
  }
}
