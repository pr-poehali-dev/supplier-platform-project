import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const ContactSection = () => {
  const { toast } = useToast();

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: 'Заявка отправлена!',
      description: 'Мы свяжемся с вами в ближайшее время.',
    });
  };

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
            Оставьте заявку, и мы расскажем, как TourConnect поможет развивать ваш бизнес
          </p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-heading flex items-center gap-2">
              <Icon name="Send" className="text-primary" size={24} />
              Форма обратной связи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Имя</label>
                  <Input 
                    placeholder="Ваше имя" 
                    required 
                    className="border-gray-300 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <Input 
                    type="email" 
                    placeholder="your@email.com" 
                    required 
                    className="border-gray-300 focus:border-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Компания</label>
                <Input 
                  placeholder="Название компании" 
                  className="border-gray-300 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Сообщение</label>
                <Textarea 
                  placeholder="Расскажите о вашем бизнесе и целях сотрудничества" 
                  rows={5}
                  required
                  className="border-gray-300 focus:border-primary resize-none"
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg"
              >
                Отправить заявку
                <Icon name="ArrowRight" className="ml-2" size={20} />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-12 flex justify-center">
          <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow max-w-md w-full">
            <CardContent className="pt-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                <Icon name="Mail" className="text-white" size={24} />
              </div>
              <h4 className="font-bold mb-2">Email</h4>
              <p className="text-gray-600 text-sm">admin@tourconnect.ru</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;