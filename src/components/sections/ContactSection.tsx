import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const ContactSection = () => {
  return (
    <section id="contact" className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            📧 Свяжитесь с нами
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold font-heading mb-4">
            Начните сотрудничество
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Свяжитесь с нами любым удобным способом
          </p>
        </div>

        <div className="mt-12 flex justify-center gap-6 flex-wrap">
          <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow max-w-sm w-full">
            <CardContent className="pt-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                <Icon name="Mail" className="text-white" size={24} />
              </div>
              <h4 className="font-bold mb-2">Email</h4>
              <a 
                href="mailto:admin@tourconnect.ru"
                className="text-gray-600 text-sm hover:text-primary transition-colors"
              >
                admin@tourconnect.ru
              </a>
            </CardContent>
          </Card>

          <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow max-w-sm w-full">
            <CardContent className="pt-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                <Icon name="Send" className="text-white" size={24} />
              </div>
              <h4 className="font-bold mb-2">Telegram</h4>
              <Button
                asChild
                variant="outline"
                className="mt-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <a 
                  href="https://t.me/Maxim_Romantsov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Icon name="Send" size={16} />
                  Написать в Telegram
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center space-y-2">
          <a 
            href="/oferta" 
            className="text-sm text-gray-500 hover:text-primary transition-colors underline block"
          >
            Публичная оферта
          </a>
          <p className="text-xs text-gray-400">
            ИП Романцов М.С. ИНН 682971175787
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;