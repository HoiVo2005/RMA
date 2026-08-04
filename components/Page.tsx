import Header from './Header';
import Footer from './Footer';

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
