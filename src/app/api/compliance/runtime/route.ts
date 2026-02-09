
import { NextResponse } from 'next/server';
import { ComplianceCountryContextResolver } from '@/lib/compliance-context';
import { ComplianceService } from '@/lib/services/compliance-service';
import { type NextRequest } from 'next/server';

// This is a public or semi-protected endpoint used by the App Shell / Context Provider
export async function GET(req: NextRequest) {
    try {
        // 1. Resolve Country
        const countryIso = await ComplianceCountryContextResolver.resolve(req);

        // 2. Load Active Context
        const context = await ComplianceService.getRuntimeContext(countryIso);

        // Cache Headers (e.g., Cache-Control)
        // We can cache this for e.g. 5 minutes, and invalidate on publish
        // For now, no-store for safety during dev.

        return NextResponse.json(context);

    } catch (error) {
        console.error('Compliance Runtime Error:', error);
        // Fallback to safe default? Or 500?
        // Better return empty safe context
        return NextResponse.json({
            countryIso: 'KW',
            policyVersion: 0,
            rules: {},
            kbSnippets: []
        });
    }
}
