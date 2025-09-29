import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, BookOpen, Home } from 'lucide-react';
import synagogueImage from '../assets/synagogue.png';
import tjcommunityLogo from '../assets/tjcommunity.png';
import { LandingTranslationButton } from './TranslationButton';

// Custom hook for responsive breakpoints
function useActiveBreakpoint() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { width };
}

// Glassy menu bar component
function MenuBar({ onStartLearning }) {
  const [open, setOpen] = useState(false);
  const [activePage, setActivePage] = useState("Home");

  const navItems = [
    { name: "Home", href: "#home", icon: Home }
  ];

  const handleNavClick = (pageName) => {
    setActivePage(pageName);
    setOpen(false);
  };

  const handleAuthClick = () => {
    onStartLearning();
    setOpen(false);
  };

  return (
    <nav className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-[90vw] max-w-[1280px]">
      {/* container */}
      <div className="flex items-center px-8 py-3 backdrop-blur-[30px] bg-white/25 rounded-2xl shadow-xl w-full">
        {/* Home Icon - Left Side */}
        <div className="flex items-center">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={() => handleNavClick(item.name)}
                className={`transition-colors p-2 rounded-lg ${
                  activePage === item.name
                  ? "text-white bg-white/20"
                  : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                aria-label={item.name}
              >
                <IconComponent className="w-5 h-5" />
              </a>
            );
          })}
        </div>
        {/* Auth buttons */}
        <div className="hidden md:flex gap-4 flex-shrink-0 ml-auto items-center">
          {/* Translation Button */}
          <LandingTranslationButton />

          <button
            onClick={handleAuthClick}
            className="text-white/80 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={handleAuthClick}
            className="px-4 py-1 rounded-md bg-white/90 text-black hover:bg-white transition-colors"
          >
            Start Learning
          </button>
        </div>
        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white ml-auto"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {/* Mobile dropdown */}
      {open && (
        <ul className="md:hidden flex flex-col gap-4 px-6 py-4 mt-2 backdrop-blur-[30px] bg-white/25 rounded-2xl shadow-xl">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.name}>
                <a
                  href={item.href}
                  onClick={() => handleNavClick(item.name)}
                  className={`flex items-center gap-3 transition-colors p-2 rounded-lg ${
                    activePage === item.name
                    ? "text-white bg-white/20"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </li>
            );
          })}
          <li className="border-t border-white/20 pt-4 mt-2 flex flex-col gap-3">
            {/* Mobile Translation Button */}
            <div className="flex justify-center">
              <LandingTranslationButton />
            </div>

            <button
              onClick={handleAuthClick}
              className="text-white/80 hover:text-white transition-colors text-left"
            >
              Sign In
            </button>
            <button
              onClick={handleAuthClick}
              className="px-4 py-2 rounded-md bg-white/90 text-black hover:bg-white transition-colors w-full text-center"
            >
              Start Learning
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}

function HeaderSubcontentDesktop() {
  return (
    <div className="content-stretch flex items-start justify-between leading-[0] relative shrink-0 text-[#f2f2f2] w-full" data-name="Header subcontent">
      <div className="font-['Inter:Medium',_sans-serif] font-medium relative shrink-0 text-[32px] tracking-[-1.6px] w-[623px]">
        <h2 className="block leading-[1.09]">AI-Powered Torah Learning Platform</h2>
      </div>
      <div className="font-['Inter:Regular',_sans-serif] font-normal relative shrink-0 text-[18px] tracking-[-0.36px] w-[370px]">
        <h3 className="block leading-[1.35]">Learn from the wisdom of classical Torah commentators through interactive conversations with AI rabbis, designed for the Turkish Jewish community.</h3>
      </div>
    </div>
  );
}

function HeaderContentDesktop() {
  return (
    <div className="aspect-[1180/236] content-stretch flex flex-col gap-[78px] items-start justify-end relative shrink-0 w-full" data-name="Header content">
      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#f2f2f2] text-[120px] text-nowrap tracking-[-3.6px]">
        <h1 className="block leading-[0.95] whitespace-pre">ChavrusaAI</h1>
      </div>
      <HeaderSubcontentDesktop />
    </div>
  );
}

function HeaderSectionDesktop({ onStartLearning }) {
  return (
    <header className="relative h-screen w-full" data-name="Header section">
      <MenuBar onStartLearning={onStartLearning} />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-900 to-red-900" />
        <div className="absolute bg-[rgba(0,0,0,0.4)] inset-0" />
      </div>
      <div className="flex flex-col justify-end relative h-full w-full">
        <div className="box-border content-stretch flex flex-col gap-[86px] items-start justify-end pb-[70px] pt-[25px] px-[50px] relative h-full">
          <HeaderContentDesktop />
        </div>
      </div>
    </header>
  );
}

function HeaderSubcontentTablet() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start leading-[0] relative shrink-0 text-[#f2f2f2] w-full" data-name="Header subcontent">
      <div className="font-['Inter:Medium',_sans-serif] font-medium relative shrink-0 text-[28px] tracking-[-1.4px] w-full max-w-[600px]">
        <h2 className="block leading-[1.09]">AI-Powered Torah Learning Platform</h2>
      </div>
      <div className="font-['Inter:Regular',_sans-serif] font-normal relative shrink-0 text-[16px] tracking-[-0.32px] w-full max-w-[400px]">
        <h3 className="block leading-[1.35]">Learn from the wisdom of classical Torah commentators through interactive conversations with AI rabbis, designed for the Turkish Jewish community.</h3>
      </div>
    </div>
  );
}

function HeaderContentTablet() {
  return (
    <div className="content-stretch flex flex-col gap-[60px] items-start justify-end relative shrink-0 w-full" data-name="Header content">
      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#f2f2f2] text-[80px] text-nowrap tracking-[-2.4px]">
        <h1 className="block leading-[0.95] whitespace-pre">ChavrusaAI</h1>
      </div>
      <HeaderSubcontentTablet />
    </div>
  );
}

function HeaderSectionTablet({ onStartLearning }) {
  return (
    <header className="relative h-screen w-full" data-name="Header section">
      <MenuBar onStartLearning={onStartLearning} />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-900 to-red-900" />
        <div className="absolute bg-[rgba(0,0,0,0.4)] inset-0" />
      </div>
      <div className="flex flex-col justify-end relative h-full w-full">
        <div className="box-border content-stretch flex flex-col gap-[60px] items-start justify-end pb-[50px] pt-[25px] px-[40px] relative h-full">
          <HeaderContentTablet />
        </div>
      </div>
    </header>
  );
}

function HeaderSubcontentMobile() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start leading-[0] relative shrink-0 text-[#f2f2f2] w-full" data-name="Header subcontent">
      <div className="font-['Inter:Medium',_sans-serif] font-medium relative shrink-0 text-[24px] tracking-[-1.2px] w-full">
        <h2 className="block leading-[1.09]">AI-Powered Torah Learning</h2>
      </div>
      <div className="font-['Inter:Regular',_sans-serif] font-normal relative shrink-0 text-[14px] tracking-[-0.28px] w-full">
        <h3 className="block leading-[1.35]">Learn from classical Torah commentators through interactive AI conversations, designed for the Turkish Jewish community.</h3>
      </div>
    </div>
  );
}

function HeaderContentMobile() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-start justify-end relative shrink-0 w-full" data-name="Header content">
      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#f2f2f2] text-[48px] tracking-[-1.8px]">
        <h1 className="block leading-[0.95]">ChavrusaAI</h1>
      </div>
      <HeaderSubcontentMobile />
    </div>
  );
}

function HeaderSectionMobile({ onStartLearning }) {
  return (
    <header className="relative h-screen w-full" data-name="Header section">
      <MenuBar onStartLearning={onStartLearning} />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-900 to-red-900" />
        <div className="absolute bg-[rgba(0,0,0,0.4)] inset-0" />
      </div>
      <div className="flex flex-col justify-end relative h-full w-full">
        <div className="box-border content-stretch flex flex-col gap-[40px] items-start justify-end pb-[40px] pt-[25px] px-[24px] relative h-full">
          <HeaderContentMobile />
        </div>
      </div>
    </header>
  );
}

function HeaderSection({ onStartLearning }) {
  const { width } = useActiveBreakpoint();

  if (width < 800) {
    return <HeaderSectionMobile onStartLearning={onStartLearning} />;
  }
  if (width < 1280) {
    return <HeaderSectionTablet onStartLearning={onStartLearning} />;
  }
  return <HeaderSectionDesktop onStartLearning={onStartLearning} />;
}

// Main Content Sections
function MainContent({ onStartLearning }) {
  const { width } = useActiveBreakpoint();

  if (width < 800) {
    return <MainContentMobile onStartLearning={onStartLearning} />;
  }
  if (width < 1280) {
    return <MainContentTablet onStartLearning={onStartLearning} />;
  }
  return <MainContentDesktop onStartLearning={onStartLearning} />;
}

// Desktop Main Content
function MainContentDesktop({ onStartLearning }) {
  return (
    <main className="flex flex-col items-center w-full">
      {/* Welcome Section */}
      <section className="flex flex-col items-start px-[152px] pt-[135px] pb-[178px] gap-[60px] w-full bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="flex flex-col justify-center items-center gap-[60px] w-[942px] max-w-[1180px]">
          <h2 className="w-full font-medium text-[32px] leading-[109%] tracking-[-0.05em] text-black">
            About ChavrusaAI
          </h2>

          <div className="flex flex-col items-start gap-[50px] w-full">
            <div className="flex flex-row flex-wrap items-start gap-[48px] w-full">
              <p className="flex-1 min-w-[447px] font-normal text-[18px] leading-[135%] tracking-[-0.02em] text-black">
                ChavrusaAI brings together the Turkish Jewish community through the power of Torah learning. Our platform connects you with AI rabbis who understand both our rich Sephardic traditions and the universal wisdom of Jewish texts. This is a space where our community can grow together in knowledge and faith.
              </p>
              <p className="flex-1 min-w-[447px] font-normal text-[18px] leading-[135%] tracking-[-0.02em] text-black">
                Built with deep respect for our Turkish Jewish heritage, ChavrusaAI offers personalized learning experiences that honor classical commentaries while embracing modern technology. Whether you're exploring your first page of Talmud or deepening lifelong study, our community is here to support your journey.
              </p>
            </div>

            <button
              onClick={onStartLearning}
              className="flex items-center justify-center px-6 py-4 bg-[#31110F] text-white rounded-full font-normal text-[18px] leading-[120%] tracking-[-0.02em]"
            >
              Begin Learning
            </button>
          </div>
        </div>
      </section>

      {/* Image Breaker Section */}
      <section className="flex items-start p-[10px] gap-[10px] w-full h-[625px] bg-gradient-to-br from-amber-100 to-amber-200">
        <div className="w-full h-full rounded-lg overflow-hidden">
          <img
            src={synagogueImage}
            alt="Turkish Synagogue Interior"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Torah Learning Areas Section */}
      <section className="flex flex-col items-center px-[50px] pt-[93px] pb-[126px] w-full bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="flex flex-col items-center gap-[64px] w-full max-w-[1200px]">
          <h2 className="font-medium text-[32px] leading-[109%] tracking-[-0.05em] text-gray-800 text-center">
            Torah Learning Areas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            <div className="flex flex-col items-center text-center p-6 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[18px] text-[#31110F] mb-3">Torah Commentary</h3>
              <p className="text-sm text-gray-700 leading-relaxed">Study classical commentaries from Rashi, Ramban, and other great sages</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[18px] text-[#31110F] mb-3">Talmudic Study</h3>
              <p className="text-sm text-gray-700 leading-relaxed">Explore the depths of Talmudic wisdom and rabbinic discussions</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[18px] text-[#31110F] mb-3">Halachic Studies</h3>
              <p className="text-sm text-gray-700 leading-relaxed">Learn practical Jewish law and its applications in daily life</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[18px] text-[#31110F] mb-3">Midrash & Aggadah</h3>
              <p className="text-sm text-gray-700 leading-relaxed">Discover the stories and ethical teachings of our sages</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[18px] text-[#31110F] mb-3">Tanach Study</h3>
              <p className="text-sm text-gray-700 leading-relaxed">Deep study of Torah, Nevi'im, and Ketuvim with traditional insights</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[18px] text-[#31110F] mb-3">Chassidic Teachings</h3>
              <p className="text-sm text-gray-700 leading-relaxed">Explore mystical and spiritual dimensions of Torah study</p>
            </div>
          </div>

          <button
            onClick={onStartLearning}
            className="flex items-center justify-center px-8 py-4 bg-[#31110F] text-white rounded-full font-normal text-[18px] leading-[120%] tracking-[-0.02em] transition-colors shadow-lg"
          >
            Begin Torah Learning
          </button>
        </div>
      </section>

      {/* Community Heritage Section */}
      <section className="flex items-center justify-center w-full bg-white">
        <div className="flex flex-col items-center px-[50px] py-[116px] gap-[64px] w-full max-w-[1200px]">
          <div className="flex flex-col items-center gap-[48px] w-full">
            <div className="flex flex-col items-center gap-[32px] w-full">
              <h2 className="font-medium text-[32px] leading-[109%] text-center tracking-[-0.05em] text-black">
                Our Turkish Jewish Heritage
              </h2>
              <p className="font-normal text-[18px] leading-[135%] text-center tracking-[-0.02em] text-black max-w-[800px]">
                The Turkish Jewish community has a rich history spanning over 500 years, preserving ancient traditions while embracing modernity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-[20px] text-black mb-4">Sephardic Legacy</h3>
                <p className="text-[16px] text-gray-700 leading-[140%]">
                  Our ancestors brought the rich traditions of medieval Spain to Ottoman lands, preserving Ladino language and customs through generations.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-[20px] text-black mb-4">Ottoman Welcome</h3>
                <p className="text-[16px] text-gray-700 leading-[140%]">
                  When Spain expelled Jews in 1492, the Ottoman Empire opened its doors, allowing our community to flourish in Istanbul, Izmir, and beyond.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-[20px] text-black mb-4">Modern Community</h3>
                <p className="text-[16px] text-gray-700 leading-[140%]">
                  Today, we continue to balance our ancestral traditions with contemporary life, maintaining synagogues, schools, and cultural institutions.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-[20px] text-black mb-4">Torah Scholarship</h3>
                <p className="text-[16px] text-gray-700 leading-[140%]">
                  Our rabbis and scholars have contributed significantly to Jewish learning, producing commentaries and responsa recognized worldwide.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-[20px] text-black mb-4">Cultural Traditions</h3>
                <p className="text-[16px] text-gray-700 leading-[140%]">
                  From traditional Meze Shabbat meals to unique holiday customs, our community maintains distinctive practices that blend Jewish and Turkish elements.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-[20px] text-black mb-4">Future Generations</h3>
                <p className="text-[16px] text-gray-700 leading-[140%]">
                  We are committed to passing down our heritage through education, community engagement, and innovative approaches to Torah learning.
                </p>
              </div>
            </div>

            <div className="flex justify-center items-center gap-[16px] w-full">
              <button
                onClick={onStartLearning}
                className="flex items-center justify-center px-8 py-4 bg-[#31110F] text-white rounded-full font-normal text-[18px] leading-[120%] tracking-[-0.02em]"
              >
                Join Our Learning Community
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-[#31110F] text-white py-16">
        <div className="w-full px-[50px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src={tjcommunityLogo} alt="Turkish Jewish Community" className="w-10 h-10 rounded-lg" />
                <h3 className="text-xl font-bold">ChavrusaAI</h3>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                Connecting the Turkish Jewish community through Torah learning and AI-powered rabbinical guidance. Preserving our heritage while embracing the future of Jewish education.
              </p>
              <p className="text-sm text-gray-400">
                Developed with love for our community by Turkish Jewish educators and technologists.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Learning</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Torah Commentary</li>
                <li>Talmudic Study</li>
                <li>Jewish Philosophy</li>
                <li>Halachic Guidance</li>
                <li>Turkish Customs</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Sephardic Heritage</li>
                <li>Turkish Traditions</li>
                <li>Community Support</li>
                <li>Cultural Preservation</li>
                <li>Educational Resources</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} ChavrusaAI. Built for the Turkish Jewish Community.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <button
                onClick={onStartLearning}
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Start Learning
              </button>
              <span className="text-gray-300 text-sm">Community Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Tablet Main Content
function MainContentTablet({ onStartLearning }) {
  return (
    <main className="flex flex-col items-center w-full">
      {/* Welcome Section */}
      <section className="flex flex-col items-start px-[64px] pt-[135px] pb-[178px] gap-[60px] w-full bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="flex flex-col justify-center items-center gap-[60px] w-[672px] max-w-[1180px]">
          <h2 className="w-full font-medium text-[32px] leading-[109%] tracking-[-0.05em] text-black">
            About ChavrusaAI
          </h2>

          <div className="flex flex-col items-start gap-[50px] w-full">
            <div className="flex flex-row flex-wrap items-start gap-[48px] w-full">
              <p className="flex-1 min-w-[312px] font-normal text-[18px] leading-[135%] tracking-[-0.02em] text-black">
                ChavrusaAI brings together the Turkish Jewish community through the power of Torah learning. Our platform connects you with AI rabbis who understand both our rich Sephardic traditions and the universal wisdom of Jewish texts.
              </p>
              <p className="flex-1 min-w-[312px] font-normal text-[18px] leading-[135%] tracking-[-0.02em] text-black">
                Built with deep respect for our Turkish Jewish heritage, ChavrusaAI offers personalized learning experiences that honor classical commentaries while embracing modern technology.
              </p>
            </div>

            <button
              onClick={onStartLearning}
              className="flex items-center justify-center px-6 py-4 bg-[#31110F] text-white rounded-full font-normal text-[18px] leading-[120%] tracking-[-0.02em]"
            >
              Begin Learning
            </button>
          </div>
        </div>
      </section>

      {/* Image Breaker Section */}
      <section className="flex flex-col items-start p-[10px] gap-[10px] w-full h-[480px] bg-gradient-to-br from-amber-100 to-amber-200">
        <div className="w-full h-full rounded-lg overflow-hidden">
          <img
            src={synagogueImage}
            alt="Turkish Synagogue Interior"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Torah Learning Areas Section */}
      <section className="flex flex-col items-center px-[40px] pt-[80px] pb-[100px] w-full bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="flex flex-col items-center gap-[48px] w-full max-w-[700px]">
          <h2 className="font-medium text-[28px] leading-[109%] tracking-[-0.05em] text-gray-800 text-center">
            Torah Learning Areas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col items-center text-center p-4 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[16px] text-[#31110F] mb-2">Torah Commentary</h3>
              <p className="text-sm text-gray-700">Study with Rashi, Ramban, and classical sages</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[16px] text-[#31110F] mb-2">Talmudic Study</h3>
              <p className="text-sm text-gray-700">Explore Talmudic wisdom and discussions</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[16px] text-[#31110F] mb-2">Halachic Studies</h3>
              <p className="text-sm text-gray-700">Learn practical Jewish law applications</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[16px] text-[#31110F] mb-2">Tanach Study</h3>
              <p className="text-sm text-gray-700">Deep study of Torah, Nevi'im, and Ketuvim</p>
            </div>
          </div>

          <button
            onClick={onStartLearning}
            className="flex items-center justify-center px-6 py-4 bg-[#31110F] text-white rounded-full font-normal text-[16px] leading-[120%] tracking-[-0.02em] transition-colors shadow-lg"
          >
            Begin Torah Learning
          </button>
        </div>
      </section>

      {/* Community Heritage Section */}
      <section className="flex items-center justify-center w-full bg-white">
        <div className="flex flex-col items-center px-[40px] py-[80px] gap-[48px] w-full max-w-[700px]">
          <div className="flex flex-col items-center gap-[32px] w-full">
            <h2 className="font-medium text-[28px] leading-[109%] text-center tracking-[-0.05em] text-black">
              Our Turkish Jewish Heritage
            </h2>
            <p className="font-normal text-[16px] leading-[135%] text-center tracking-[-0.02em] text-black">
              The Turkish Jewish community has a rich history spanning over 500 years, preserving ancient traditions while embracing modernity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[700px]">
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-[18px] text-black mb-3">Sephardic Legacy</h3>
              <p className="text-[14px] text-gray-700 leading-[140%]">
                Our ancestors brought rich Spanish traditions to Ottoman lands, preserving Ladino language and customs.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-[18px] text-black mb-3">Ottoman Welcome</h3>
              <p className="text-[14px] text-gray-700 leading-[140%]">
                When Spain expelled Jews in 1492, the Ottoman Empire opened its doors to our community.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-[18px] text-black mb-3">Torah Scholarship</h3>
              <p className="text-[14px] text-gray-700 leading-[140%]">
                Our rabbis have contributed significantly to Jewish learning worldwide.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-[18px] text-black mb-3">Modern Community</h3>
              <p className="text-[14px] text-gray-700 leading-[140%]">
                We balance ancestral traditions with contemporary life in Turkey today.
              </p>
            </div>
          </div>

          <button
            onClick={onStartLearning}
            className="flex items-center justify-center px-6 py-4 bg-[#31110F] text-white rounded-full font-normal text-[16px] leading-[120%] tracking-[-0.02em]"
          >
            Join Our Learning Community
          </button>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-[#31110F] text-white py-12">
        <div className="max-w-[700px] mx-auto px-[40px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={tjcommunityLogo} alt="Turkish Jewish Community" className="w-8 h-8 rounded-lg" />
                <h3 className="text-lg font-bold">ChavrusaAI</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm mb-4">
                Connecting the Turkish Jewish community through Torah learning and AI-powered guidance.
              </p>
            </div>

            <div>
              <h4 className="text-md font-semibold mb-3">Community</h4>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>Sephardic Heritage</li>
                <li>Turkish Traditions</li>
                <li>Torah Learning</li>
                <li>Cultural Preservation</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <p className="text-gray-400 text-xs mb-3">
              © {new Date().getFullYear()} ChavrusaAI. Built for the Turkish Jewish Community.
            </p>
            <button
              onClick={onStartLearning}
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              Start Learning
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Mobile Main Content
function MainContentMobile({ onStartLearning }) {
  return (
    <main className="flex flex-col items-center w-full">
      {/* Welcome Section */}
      <section className="flex flex-col items-start px-[24px] pt-[48px] pb-[80px] gap-[60px] w-full bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="flex flex-col justify-center items-center gap-[40px] w-[327px]">
          <h2 className="w-full font-medium text-[22px] leading-[109%] tracking-[-0.05em] text-black">
            About ChavrusaAI
          </h2>

          <div className="flex flex-col items-start gap-[50px] w-full">
            <div className="flex flex-col items-start gap-[24px] w-full">
              <p className="w-full font-normal text-[18px] leading-[135%] tracking-[-0.02em] text-black">
                ChavrusaAI brings together the Turkish Jewish community through the power of Torah learning. Our platform connects you with AI rabbis who understand both our rich Sephardic traditions and the universal wisdom of Jewish texts.
              </p>
              <p className="w-full font-normal text-[18px] leading-[135%] tracking-[-0.02em] text-black">
                Built with deep respect for our Turkish Jewish heritage, ChavrusaAI offers personalized learning experiences that honor classical commentaries while embracing modern technology.
              </p>
            </div>

            <button
              onClick={onStartLearning}
              className="flex items-center justify-center px-6 py-4 bg-[#31110F] text-white rounded-full font-normal text-[18px] leading-[120%] tracking-[-0.02em] w-full"
            >
              Begin Learning
            </button>
          </div>
        </div>
      </section>

      {/* Image Breaker Section */}
      <section className="flex flex-col items-start p-[10px] gap-[10px] w-full h-[280px] bg-gradient-to-br from-amber-100 to-amber-200">
        <div className="w-full h-full rounded-lg overflow-hidden">
          <img
            src={synagogueImage}
            alt="Turkish Synagogue Interior"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Torah Learning Areas Section */}
      <section className="flex flex-col items-center px-[20px] pt-[60px] pb-[60px] w-full bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="flex flex-col items-center gap-[32px] w-full max-w-[350px]">
          <h2 className="font-medium text-[20px] leading-[109%] tracking-[-0.05em] text-gray-800 text-center">
            Torah Learning Areas
          </h2>

          <div className="grid grid-cols-1 gap-3 w-full">
            <div className="flex flex-col items-center text-center p-3 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[14px] text-[#31110F] mb-1">Torah Commentary</h3>
              <p className="text-xs text-gray-700">Study with classical sages</p>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[14px] text-[#31110F] mb-1">Talmudic Study</h3>
              <p className="text-xs text-gray-700">Explore Talmudic wisdom</p>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[14px] text-[#31110F] mb-1">Halachic Studies</h3>
              <p className="text-xs text-gray-700">Learn practical Jewish law</p>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-amber-200">
              <h3 className="font-medium text-[14px] text-[#31110F] mb-1">Tanach Study</h3>
              <p className="text-xs text-gray-700">Deep Torah study</p>
            </div>
          </div>

          <button
            onClick={onStartLearning}
            className="flex items-center justify-center px-6 py-4 bg-[#31110F] text-white rounded-full font-normal text-[16px] leading-[120%] tracking-[-0.02em] w-full transition-colors shadow-lg"
          >
            Begin Torah Learning
          </button>
        </div>
      </section>

      {/* Community Heritage Section */}
      <section className="flex items-center justify-center w-full bg-white">
        <div className="flex flex-col items-center px-[20px] py-[60px] gap-[40px] w-full max-w-[350px]">
          <div className="flex flex-col items-center gap-[24px] w-full">
            <h2 className="font-medium text-[20px] leading-[109%] text-center tracking-[-0.05em] text-black">
              Our Turkish Jewish Heritage
            </h2>
            <p className="font-normal text-[14px] leading-[135%] text-center tracking-[-0.02em] text-black">
              The Turkish Jewish community has a rich history spanning over 500 years.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-[16px] text-black mb-2">Sephardic Legacy</h3>
              <p className="text-[12px] text-gray-700 leading-[140%]">
                Our ancestors preserved Spanish traditions and Ladino language in Ottoman lands.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-[16px] text-black mb-2">Ottoman Welcome</h3>
              <p className="text-[12px] text-gray-700 leading-[140%]">
                The Ottoman Empire welcomed Spanish Jews in 1492, allowing our community to flourish.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-[16px] text-black mb-2">Modern Community</h3>
              <p className="text-[12px] text-gray-700 leading-[140%]">
                Today we balance ancient traditions with contemporary Turkish life.
              </p>
            </div>
          </div>

          <button
            onClick={onStartLearning}
            className="flex items-center justify-center px-6 py-4 bg-[#31110F] text-white rounded-full font-normal text-[16px] leading-[120%] tracking-[-0.02em] w-full"
          >
            Join Our Learning Community
          </button>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-[#31110F] text-white py-8">
        <div className="mx-auto px-[20px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 mb-2">
              <img src={tjcommunityLogo} alt="Turkish Jewish Community" className="w-6 h-6 rounded-lg" />
              <h3 className="text-md font-bold">ChavrusaAI</h3>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed max-w-[280px]">
              Connecting the Turkish Jewish community through Torah learning and AI-powered guidance.
            </p>
            <p className="text-gray-400 text-xs">
              © {new Date().getFullYear()} Built for our community
            </p>
            <button
              onClick={onStartLearning}
              className="text-gray-300 hover:text-white transition-colors text-sm px-4 py-2 border border-gray-600 rounded-full"
            >
              Start Learning
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}

const LandingPage = ({ onStartLearning }) => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <HeaderSection onStartLearning={onStartLearning} />
      <MainContent onStartLearning={onStartLearning} />
    </div>
  );
};

export default LandingPage;