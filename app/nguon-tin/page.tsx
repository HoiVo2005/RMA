import Page from "@/components/Page";
import { getSources } from "@/lib/data";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NguonTinPage() {
  const sources = await getSources();
  return (
    <Page>
      <div className="list-page-header">
        <h1>Nguồn tin</h1>
        <p>Danh sách các trang báo quốc tế được tổng hợp tin tức</p>
      </div>
      <div className="sources-table">
        {sources.length ? (
          sources.map((s) => (
            <div className="source-row" key={s.id}>
              <span className="s-name">{s.name}</span>
              <span className="s-country">{s.country}</span>
              <span className="badge badge-category">{s.reliability}</span>
              {s.website_url && (
                <a
                  className="s-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={s.website_url}
                >
                  Mở nguồn{" "}
                  <ExternalLink size={12} style={{ verticalAlign: -1 }} />
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="empty">Chưa có nguồn tin.</div>
        )}
      </div>
    </Page>
  );
}
