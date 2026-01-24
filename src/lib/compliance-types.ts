
export interface ComplianceCountry {
    id: number;
    isoCode: string; // 'KW', 'QA', etc.
    name: string;
    isActive: boolean;
}

export interface CompliancePolicy {
    id: string;
    countryId: number;
    version: number;
    status: 'Draft' | 'Active' | 'Archived';
    effectiveFrom?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum RuleType {
    Text = 'Text',
    JSON = 'JSON',
    Boolean = 'Boolean',
    Enum = 'Enum',
    Number = 'Number'
}

export interface ComplianceRule {
    id: string;
    policyId: string;
    ruleKey: string; // e.g., 'LEGAL_DISCLAIMER'
    ruleType: RuleType;
    ruleValue: any;
    priority: number;
    isEnabled: boolean;
}

export interface ComplianceKB {
    id: string;
    countryId: number;
    policyId?: string;
    title: string;
    content: string;
    sourceRefs?: string[]; // JSON parsed
    tags?: string[]; // JSON parsed
    version: number;
    status: 'Draft' | 'Active' | 'Archived';
    createdAt: Date;
    updatedAt: Date;
}

export interface ComplianceRuntimeContext {
    countryIso: string;
    policyVersion?: number;
    rules: Record<string, any>;
    kbSnippets: ComplianceKB[];
    disclaimerText?: string;
}
