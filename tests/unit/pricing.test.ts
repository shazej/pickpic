import { describe, test, expect } from 'vitest';
import { PricingService, CountryPricingInfo } from '../../src/lib/billing/pricing-service';

describe('PricingService', () => {
    const usInfo: CountryPricingInfo = {
        country_code: 'US',
        country_name: 'United States',
        ppp_multiplier: 1.0,
        currency_code: 'USD',
        rounding_rule: 'round'
    };

    const indiaInfo: CountryPricingInfo = {
        country_code: 'IN',
        country_name: 'India',
        ppp_multiplier: 0.35,
        currency_code: 'INR',
        rounding_rule: 'round'
    };

    const egyptInfo: CountryPricingInfo = {
        country_code: 'EG',
        country_name: 'Egypt',
        ppp_multiplier: 0.3,
        currency_code: 'EGP',
        rounding_rule: 'floor'
    };

    test('calculates standard US price correctly', () => {
        const price = PricingService.calculateLocalizedPrice(29, usInfo);
        expect(price).toBe(29);
    });

    test('calculates India PPP price correctly (0.35x)', () => {
        const price = PricingService.calculateLocalizedPrice(29, indiaInfo);
        // 29 * 0.35 = 10.15
        expect(price).toBe(10.15);
    });

    test('calculates Egypt PPP price with floor rule (0.3x)', () => {
        const price = PricingService.calculateLocalizedPrice(29, egyptInfo);
        // 29 * 0.3 = 8.7
        // floor(8.7) = 8
        expect(price).toBe(8);
    });

    test('calculates rounding for high precision multipliers', () => {
        const complexInfo = { ...usInfo, ppp_multiplier: 0.3333 };
        const price = PricingService.calculateLocalizedPrice(10, complexInfo);
        // 10 * 0.3333 = 3.333
        // round to 2 decimals = 3.33
        expect(price).toBe(3.33);
    });
});
