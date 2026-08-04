import { crud } from '@/lib/admin-api';

const handlers = crud('news_sources');
export const GET = handlers.GET;
export const POST = handlers.POST;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
