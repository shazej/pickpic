
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-reviews.ts';
import '@/ai/flows/product-identification.ts';
import '@/ai/flows/extract-product-details.ts';
import '@/ai/flows/create-product-chat.ts';
import '@/ai/flows/vision-chat.ts';
import '@/ai/flows/generate-images.ts';
import '@/ai/flows/find-similar-products.ts';
