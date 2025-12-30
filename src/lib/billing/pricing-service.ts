
// Removed static import to prevent database initialization in unit tests
// import { query, sql } from '@/lib/db';

export interface CountryPricingInfo {
    country_code: string;
    country_name: string;
    ppp_multiplier: number;
    currency_code: string;
    rounding_rule: string;
}

export class PricingService {
    /**
     * Get pricing info for a country. Defaults to US if not found.
     */
    static async getCountryInfo(countryCode: string | null): Promise<CountryPricingInfo> {
        if (!countryCode) return this.getDefaultInfo();

        try {
            const { query, sql } = await import('@/lib/db');
            const result = await query(
                'SELECT country_code, country_name, ppp_multiplier, currency_code, rounding_rule FROM billing.country_pricing WHERE country_code = @code AND is_active = 1',
                [{ name: 'code', value: countryCode.toUpperCase(), type: sql.Char(2) }]
            );

            if (result.recordset.length > 0) {
                const row = result.recordset[0];
                return {
                    country_code: row.country_code,
                    country_name: row.country_name,
                    ppp_multiplier: parseFloat(row.ppp_multiplier),
                    currency_code: row.currency_code,
                    rounding_rule: row.rounding_rule
                };
            }
        } catch (error) {
            console.error('Failed to fetch country pricing info:', error);
        }

        return this.getDefaultInfo();
    }

    private static getDefaultInfo(): CountryPricingInfo {
        return {
            country_code: 'US',
            country_name: 'United States',
            ppp_multiplier: 1.0,
            currency_code: 'USD',
            rounding_rule: 'round'
        };
    }

    /**
     * Calculate localized price based on base price and country info.
     */
    static calculateLocalizedPrice(basePrice: number, info: CountryPricingInfo): number {
        const localized = basePrice * info.ppp_multiplier;

        switch (info.rounding_rule.toLowerCase()) {
            case 'floor':
                return Math.floor(localized);
            case 'ceil':
                return Math.ceil(localized);
            case 'round':
            default:
                // Round to 2 decimal places first to avoid floating point issues, then to nearest whole if requested?
                // The prompt says "round, floor, ceil". Usually for prices we might want to round to 2 decimals or whole numbers.
                // Let's assume whole numbers for now as per common PPP implementations, or keep 2 decimals if it's more precise.
                // The prompt example US -> 1.00, India -> 0.35 suggests we might want decimals.
                // But "round" usually implies nearest integer in this context.
                // Let's do 2 decimal places for accuracy unless it's a "round" to whole number rule.
                return Math.round(localized * 100) / 100;
        }
    }

    /**
     * Get localized plans for a specific user.
     */
    static async getLocalizedPlans(userId: string | null) {
        let countryCode = 'US';

        const { query, sql } = await import('@/lib/db');

        if (userId) {
            const userRes = await query('SELECT country_code FROM auth.Users WHERE id = @id', [
                { name: 'id', value: userId, type: sql.UniqueIdentifier }
            ]);
            if (userRes.recordset.length > 0) {
                countryCode = userRes.recordset[0].country_code || 'US';
            }
        }

        const info = await this.getCountryInfo(countryCode);
        const plansRes = await query('SELECT id, name, price_id, amount, currency, listings_limit, ai_scans_limit, features_json FROM billing.Plans ORDER BY amount ASC');

        const plans = plansRes.recordset.map(plan => {
            const baseAmount = parseFloat(plan.amount);
            const localizedAmount = this.calculateLocalizedPrice(baseAmount, info);

            return {
                ...plan,
                amount: localizedAmount,
                base_amount: baseAmount,
                currency: info.currency_code,
                ppp_multiplier: info.ppp_multiplier,
                is_localized: info.country_code !== 'US',
                features: JSON.parse(plan.features_json || '[]')
            };
        });

        return {
            plans,
            country: info
        };
    }
}
