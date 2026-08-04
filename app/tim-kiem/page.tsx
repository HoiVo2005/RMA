import Page from '@/components/Page';
import ArticleList from '@/components/ArticleList';
import { getArticles } from '@/lib/data';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const items = q ? await getArticles({ q, limit: 60 }) : [];
  return (
    <Page>
      <ArticleList
        title={q ? `Kết quả tìm kiếm: "${q}"` : 'Tìm kiếm'}
        subtitle={q ? `${items.length} bài viết phù hợp` : 'Nhập từ khóa ở ô tìm kiếm phía trên'}
        items={items}
      />
    </Page>
  );
}
