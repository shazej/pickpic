// Seller Profile API - Prisma-based
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: user.userId },
      include: {
        user: {
          select: {
            name: true,
            nameAr: true,
            email: true,
            phone: true,
            avatarUrl: true,
            countryCode: true,
            regionId: true,
          },
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: {
        userId: seller.userId,
        businessName: seller.businessName,
        bio: seller.bio,
        bioAr: seller.bioAr,
        phonePublic: seller.phonePublic,
        whatsappNumber: seller.whatsappNumber,
        rating: seller.rating,
        totalReviews: seller.totalReviews,
        totalSales: seller.totalSales,
        isVerified: seller.isVerified,
        user: seller.user,
      },
    });
  } catch (error) {
    console.error('Seller Profile API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessName, bio, bioAr, phonePublic, whatsappNumber } = await request.json();

    const seller = await prisma.seller.upsert({
      where: { userId: user.userId },
      update: { businessName, bio, bioAr, phonePublic, whatsappNumber },
      create: { userId: user.userId, businessName, bio, bioAr, phonePublic, whatsappNumber },
    });

    await prisma.user.update({
      where: { id: user.userId },
      data: { role: 'seller' },
    });

    return NextResponse.json({ message: 'Profile updated', profile: seller });
  } catch (error) {
    console.error('Seller Profile API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
