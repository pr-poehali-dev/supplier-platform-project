import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface BotSettings {
  bot_name: string;
  greeting_message: string;
  communication_style: string;
  reminder_enabled: boolean;
  reminder_days: number;
  production_calendar_enabled: boolean;
}

interface BotSettingsFormProps {
  settings: BotSettings;
  onChange: (settings: BotSettings) => void;
}

export default function BotSettingsForm({ settings, onChange }: BotSettingsFormProps) {
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Основные настройки</CardTitle>
          <CardDescription>Настройте имя и стиль общения бота</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Имя бота</Label>
            <Input
              value={settings.bot_name}
              onChange={(e) => onChange({ ...settings, bot_name: e.target.value })}
              placeholder="Ассистент"
            />
          </div>
          <div>
            <Label>Приветственное сообщение</Label>
            <Textarea
              value={settings.greeting_message}
              onChange={(e) => onChange({ ...settings, greeting_message: e.target.value })}
              placeholder="Привет! Я ваш AI-помощник. Чем могу помочь?"
              rows={3}
            />
          </div>
          <div>
            <Label>Стиль общения</Label>
            <Textarea
              value={settings.communication_style}
              onChange={(e) => onChange({ ...settings, communication_style: e.target.value })}
              placeholder="Дружелюбный и профессиональный"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Например: "Деловой и краткий" или "Дружелюбный с юмором"
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Напоминания клиентам</CardTitle>
          <CardDescription>Автоматические напоминания о возможности повторного бронирования</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Включить напоминания</Label>
              <p className="text-sm text-gray-500">
                Бот будет напоминать клиентам о возможности отдохнуть снова
              </p>
            </div>
            <Switch
              checked={settings.reminder_enabled}
              onCheckedChange={(checked) => onChange({ ...settings, reminder_enabled: checked })}
            />
          </div>
          {settings.reminder_enabled && (
            <div>
              <Label>Через сколько дней напоминать</Label>
              <Input
                type="number"
                value={settings.reminder_days}
                onChange={(e) => onChange({ ...settings, reminder_days: parseInt(e.target.value) || 30 })}
                min={7}
                max={365}
              />
              <p className="text-xs text-gray-500 mt-1">
                Бот отправит напоминание через {settings.reminder_days} дней после последнего визита
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Производственный календарь</CardTitle>
          <CardDescription>Учёт государственных праздников России</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Учитывать праздники</Label>
              <p className="text-sm text-gray-500">
                Бот будет предлагать акции и напоминать о праздничных периодах
              </p>
            </div>
            <Switch
              checked={settings.production_calendar_enabled}
              onCheckedChange={(checked) => onChange({ ...settings, production_calendar_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
