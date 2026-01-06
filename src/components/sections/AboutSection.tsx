import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const AboutSection = () => {
  const teamMembers = [
    {
      name: 'Анна Петрова',
      role: 'CEO & Основатель',
      description: '15+ лет в туристической индустрии',
    },
    {
      name: 'Дмитрий Соколов',
      role: 'CTO',
      description: 'Эксперт по цифровым решениям',
    },
    {
      name: 'Елена Морозова',
      role: 'Head of Partnerships',
      description: 'Связующее звено экосистемы',
    },
  ];

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
              src="https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/e0352ee6-00e4-480a-8fca-7da4fd51358d.jpg"
              alt="About TourConnect"
              className="relative rounded-3xl shadow-2xl w-full"
            />
          </div>
        </div>

        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            👥 Наша команда
          </Badge>
          <h3 className="text-3xl lg:text-4xl font-bold font-heading mb-4">
            Профессионалы, которые создают будущее
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            За TourConnect стоит команда экспертов с многолетним опытом в туризме и технологиях
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <Card 
              key={index}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-none overflow-hidden text-center"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
              <CardContent className="pt-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Icon name="User" className="text-white" size={32} />
                </div>
                <h4 className="text-xl font-bold font-heading mb-2">{member.name}</h4>
                <p className="text-primary font-semibold mb-2">{member.role}</p>
                <p className="text-gray-600">{member.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;