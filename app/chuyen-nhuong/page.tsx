import Page from '@/components/Page';
import ArticleList from '@/components/ArticleList';
import { getArticles } from '@/lib/data';

export const revalidate = 120;

export default async function ChuyenNhuongPage() {
  const items = await getArticles({ category: 'Chuyển nhượng', limit: 60 });
  return (
    <Page>
      <ArticleList title="Chuyển nhượng Real Madrid" subtitle="Tin đồn và xác nhận chuyển nhượng mới nhất" items={items} />
    </Page>
  );
}
