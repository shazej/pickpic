import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/auth';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
    try {
        // 1. Verify authentication
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 3. Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
                { status: 400 }
            );
        }

        // 4. Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        // 5. Ensure upload directory exists
        if (!existsSync(UPLOAD_DIR)) {
            await mkdir(UPLOAD_DIR, { recursive: true });
        }

        // 6. Generate unique filename
        const fileExtension = path.extname(file.name);
        const timestamp = Date.now();
        const uniqueId = uuidv4();
        const filename = `${uniqueId}-${timestamp}${fileExtension}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        // 7. Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // 8. Return public URL
        const publicUrl = `/uploads/products/${filename}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: filename,
            size: file.size,
            type: file.type
        }, { status: 201 });

    } catch (error) {
        console.error('Image upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}
