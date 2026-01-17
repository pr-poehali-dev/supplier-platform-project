import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_SETUP_URL = 'https://functions.poehali.dev/61d49d2c-cb8a-4629-ab2e-3f104ffd2a9f';

export default function WebhookSetup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<{
    is_configured: boolean;
    current_webhook: string;
    expected_webhook: string;
  } | null>(null);

  const checkWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch(WEBHOOK_SETUP_URL);
      const data = await response.json();
      setWebhookInfo(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось проверить статус вебхука',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const setupWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch(WEBHOOK_SETUP_URL, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно!',
          description: 'Вебхук настроен, бот начнет отвечать'
        });
        await checkWebhook();
      } else {
        toast({
          title: 'Ошибка',
          description: data.message || 'Не удалось настроить вебхук',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось настроить вебхук',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Settings" size={20} />
          Настройка Telegram бота
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {webhookInfo ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Статус бота:</span>
              {webhookInfo.is_configured ? (
                <Badge className="bg-green-500">
                  <Icon name="CheckCircle" size={14} className="mr-1" />
                  Настроен
                </Badge>
              ) : (
                <Badge className="bg-orange-500">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  Не настроен
                </Badge>
              )}
            </div>
            
            {!webhookInfo.is_configured && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Бот не отвечает, т.к. вебхук не настроен.</strong><br />
                  Нажмите кнопку ниже для автоматической настройки.
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Проверьте статус бота перед началом работы
          </p>
        )}

        <div className="flex gap-2">
          <Button
            onClick={checkWebhook}
            variant="outline"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <Icon name="Loader2" className="animate-spin mr-2" size={16} />
            ) : (
              <Icon name="RefreshCw" className="mr-2" size={16} />
            )}
            Проверить статус
          </Button>
          
          {webhookInfo && !webhookInfo.is_configured && (
            <Button
              onClick={setupWebhook}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
            >
              {loading ? (
                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
              ) : (
                <Icon name="Zap" className="mr-2" size={16} />
              )}
              Настроить вебхук
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
