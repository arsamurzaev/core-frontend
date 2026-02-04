import { BackgroundImage } from "@/core/pages/home/_ui/background-image";
import { Header } from "@/core/widgets/header/ui/header";
import { ContentContainer } from "@/shared/ui/layout/content-container";

export default function Home() {
  return (
    <main>
      <ContentContainer>
        <BackgroundImage />
        <div rel="content" className="px-2.5">
          <Header />
        </div>
      </ContentContainer>
    </main>
  );
}
