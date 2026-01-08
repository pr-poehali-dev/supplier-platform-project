import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const AboutSection = () => {

  return (
    <section id="about" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="animate-fade-in">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              🎯 Наша миссия
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold font-heading mb-6">
              О проекте TourConnect
            </h2>
            <div className="space-y-4 text-lg text-gray-600">
              <p>
                TourConnect — это платформа для предпринимателей, которые хотят открыть или развить бизнес в сфере туризма России. 
                Наша цель — создать комьюнити и базу знаний для помощи на всех этапах развития.
              </p>
              <p>
                Мы предоставляем инструменты, гайды и экспертные советы по открытию баз отдыха, глэмпингов, 
                туристических маршрутов и других направлений внутреннего туризма РФ.
              </p>
              <p className="font-semibold text-primary">
                Присоединяйтесь к сообществу предпринимателей-единомышленников и развивайте свой бизнес!
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-3xl blur-3xl"></div>
            <img
              src="https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/d28ac7d5-4a4c-4b01-873b-a8a6bad4ccd3.jpg"
              alt="Работа над бизнесом"
              className="relative rounded-3xl shadow-2xl w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;