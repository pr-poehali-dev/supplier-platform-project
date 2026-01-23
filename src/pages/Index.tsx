import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '@/components/sections/HeroSection';
import BlogSection from '@/components/sections/BlogSection';

import AboutSection from '@/components/sections/AboutSection';
import ContactSection from '@/components/sections/ContactSection';
import MainNav from '@/components/navigation/MainNav';
import { usePageMeta } from '@/hooks/usePageMeta';
import JsonLd from '@/components/seo/JsonLd';
import { organizationSchema, websiteSchema, serviceSchema, faqSchema } from '@/utils/seo';

const Index = () => {
  usePageMeta({
    title: 'Главная',
    description: 'TOURCONNECT — комплексная платформа для развития туристического бизнеса. Симулятор бизнеса, календарь бронирований, диагностика проектов и инструменты управления.',
    keywords: 'турбизнес, туризм России, календарь бронирований, глэмпинг, турбаза, гостиница, симулятор бизнеса'
  });
  
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const faqs = [
    {
      question: "Что такое TOURCONNECT?",
      answer: "TOURCONNECT — это комплексная платформа для предпринимателей в сфере туризма, включающая симулятор бизнеса, календарь бронирований, диагностику проектов и закрытое сообщество профессионалов."
    },
    {
      question: "Для кого подходит платформа?",
      answer: "Платформа создана для владельцев и управляющих турбаз, глэмпингов, баз отдыха, гостиниц и других объектов размещения в России."
    },
    {
      question: "Какие тарифы доступны?",
      answer: "Доступны три тарифа: Старт (2990₽/мес) для начинающих, Про (5990₽/мес) для растущего бизнеса, Бизнес (14990₽/мес) с полным набором инструментов."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema(faqs)} />
      
      <MainNav
        activeSection={activeSection}
        user={user}
        onScrollToSection={scrollToSection}
        onNavigate={navigate}
      />

      <div id="home">
        <HeroSection />
      </div>

      <div id="blog">
        <BlogSection />
      </div>

      <div id="about">
        <AboutSection />
      </div>

      <div id="contact">
        <ContactSection />
      </div>
    </div>
  );
};

export default Index;