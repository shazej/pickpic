import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-reviews.ts';
import '@/ai/flows/product-identification.ts';
import '@/ai/flows/extract-product-details.ts';
