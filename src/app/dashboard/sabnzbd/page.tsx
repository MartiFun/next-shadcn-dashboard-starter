import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard : Sabnzbd view'
};

export default function page() {
  return (
    <PageContainer scrollable={false}>
          <iframe src="http://192.168.1.128:38735/" width="100%" title="Iframe Example" allowFullScreen frameBorder='0'></iframe>
    </PageContainer>
  );
}
