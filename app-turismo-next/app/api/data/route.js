import { NextResponse } from 'next/server';
import { getSmartCollection, getSmartDocument } from '@/lib/smartCache';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const documentId = searchParams.get('documentId');

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection parameter is required' },
        { status: 400 }
      );
    }

    let data;
    if (documentId) {
      data = await getSmartDocument(collection, documentId, { forceRefresh: true });
    } else {
      data = await getSmartCollection(collection, { forceRefresh: true });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Cache-Status': 'miss'
      }
    });
  } catch (error) {
    console.error('[API/data] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}