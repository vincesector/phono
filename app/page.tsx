import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { TTSStudio } from "@/components/TTSStudio";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <TTSStudio />
      <HowItWorks />
      <Footer />
    </main>
  );
}
