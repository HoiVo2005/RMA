import Page from '@/components/Page';
import ArticleList from '@/components/ArticleList';
import { getArticlesPage } from '@/lib/data';
import { getSiteSettings } from '@/lib/site-settings';

export const revalidate = 120;

export default async function TinMoiPage({ searchParams }: { searchParams: Promise<{ trang?: string }> }) {
  const { trang } = await searchParams;
  const page = Math.max(1, parseInt(trang || '1', 10) || 1);

  const settings = await getSiteSettings();
  const pageSize = settings.articlesPerPage || 20;

  const { items, total } = await getArticlesPage({ page, pageSize });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Page>
      <ArticleList
        title="Tin mới Real Madrid"
        subtitle="Cập nhật liên tục, dịch tự động sang tiếng Việt"
        items={items}
        pagination={{ page, totalPages, basePath: '/tin-moi' }}
      />
    </Page>
  );
}
