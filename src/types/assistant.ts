export interface SessionContext {
    title?: string;
    category?: string;
    condition?: string;
    price?: number;
    currency?: string;
    description?: string;
    attributes?: Record<string, any>;
    images?: string[];
}
