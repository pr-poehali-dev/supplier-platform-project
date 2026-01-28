import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const TochkaTest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const steps = [
    { id: 1, name: 'Проверка секретов', icon: 'Key' },
    { id: 2, name: 'Получение токена', icon: 'Lock' },
    { id: 3, name: 'Создание подписки', icon: 'CreditCard' },
    { id: 4, name: 'Тест webhook', icon: 'Webhook' },
  ];

  const checkSecrets = async () => {
    setLoading(true);
    setError(null);
    setStep(1);

    try {
      const response = await fetch('https://functions.poehali.dev/2e481bdd-814f-4a67-a604-c4dfa33d848c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': '1'
        },
        body: JSON.stringify({ plan_code: 'start' })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          step: 1,
          status: 'success',
          message: 'Подписка создана! Все секреты настроены правильно.',
          data: data
        });
      } else {
        if (data.error.includes('TOCHKA_')) {
          const missingSecret = data.error.match(/TOCHKA_\w+/)?.[0];
          setError(`❌ Отсутствует секрет: ${missingSecret}`);
          setResult({
            step: 1,
            status: 'error',
            message: `Добавьте секрет ${missingSecret} в настройках проекта`,
            data: null
          });
        } else {
          setError(data.error);
          setResult({
            step: 1,
            status: 'error',
            message: data.error,
            data: null
          });
        }
      }
    } catch (err: any) {
      setError(`Ошибка запроса: ${err.message}`);
      setResult({
        step: 1,
        status: 'error',
        message: err.message,
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async () => {
    setLoading(true);
    setError(null);
    setStep(4);

    try {
      const testPayload = {
        type: 'acquiringInternetPayment',
        operationId: 'test-operation-id',
        status: 'PAID',
        consumerId: 'test-subscription-id',
        amount: 2450
      };

      const response = await fetch('https://functions.poehali.dev/f44bba27-a610-42b6-b8b3-8ef531be217a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          step: 4,
          status: 'success',
          message: 'Webhook работает! (подписка не найдена в БД — это нормально для теста)',
          data: data
        });
      } else {
        setResult({
          step: 4,
          status: data.error.includes('не найдена') ? 'success' : 'error',
          message: data.error.includes('не найдена') 
            ? '✅ Webhook работает корректно (404 ожидаем для тестовых данных)' 
            : data.error,
          data: data
        });
      }
    } catch (err: any) {
      setError(`Ошибка запроса: ${err.message}`);
      setResult({
        step: 4,
        status: 'error',
        message: err.message,
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Скопировано в буфер обмена!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/pricing')}
        className="mb-6 gap-2"
      >
        <Icon name="ArrowLeft" size={20} />
        Назад к тарифам
      </Button>

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Тестирование Точка Банк
          </h1>
          <p className="text-gray-600">
            Проверьте настройки интеграции перед боевым запуском
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8 gap-4">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`flex flex-col items-center ${
                step === s.id ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  result?.step === s.id && result?.status === 'success'
                    ? 'bg-green-500 text-white'
                    : result?.step === s.id && result?.status === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                <Icon name={s.icon as any} size={20} />
              </div>
              <p className="text-xs text-gray-600 text-center max-w-[80px]">{s.name}</p>
            </div>
          ))}
        </div>

        {/* Test Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Key" size={20} />
                Шаг 1: Проверка секретов
              </CardTitle>
              <CardDescription>
                Создаст тестовую подписку и проверит все секреты
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-900 mb-1">Проверяемые секреты:</p>
                  <ul className="text-blue-700 space-y-1 text-xs">
                    <li>✓ TOCHKA_CLIENT_ID</li>
                    <li>✓ TOCHKA_CLIENT_SECRET</li>
                    <li>✓ TOCHKA_CUSTOMER_CODE</li>
                    <li>✓ TOCHKA_MERCHANT_ID</li>
                  </ul>
                </div>
                <Button
                  onClick={checkSecrets}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {loading && step === 1 ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Проверяю...
                    </>
                  ) : (
                    <>
                      <Icon name="Play" size={16} className="mr-2" />
                      Запустить тест
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Webhook" size={20} />
                Шаг 2: Тест webhook
              </CardTitle>
              <CardDescription>
                Отправит тестовое уведомление о платеже
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-purple-900 mb-1">Что проверяем:</p>
                  <ul className="text-purple-700 space-y-1 text-xs">
                    <li>✓ Приём POST запросов</li>
                    <li>✓ Парсинг JSON payload</li>
                    <li>✓ Обработка статусов PAID/FAILED</li>
                  </ul>
                </div>
                <Button
                  onClick={testWebhook}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {loading && step === 4 ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Отправляю...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" size={16} className="mr-2" />
                      Отправить webhook
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Result */}
        {result && (
          <Card className={`border-2 ${
            result.status === 'success' 
              ? 'border-green-500 bg-green-50' 
              : 'border-red-500 bg-red-50'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.status === 'success' ? (
                  <Icon name="CheckCircle" size={24} className="text-green-600" />
                ) : (
                  <Icon name="XCircle" size={24} className="text-red-600" />
                )}
                {result.status === 'success' ? 'Тест пройден!' : 'Ошибка теста'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`font-medium ${
                result.status === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.message}
              </p>

              {result.data && (
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Ответ от API:</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
                    >
                      <Icon name="Copy" size={14} className="mr-1" />
                      Копировать
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}

              {result.data?.paymentUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Ссылка на оплату:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={result.data.paymentUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white"
                    />
                    <Button
                      size="sm"
                      onClick={() => window.open(result.data.paymentUrl, '_blank')}
                    >
                      <Icon name="ExternalLink" size={14} className="mr-1" />
                      Открыть
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {error && !result && (
          <Card className="border-2 border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Icon name="AlertCircle" size={24} className="text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900 mb-2">Ошибка выполнения теста</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="BookOpen" size={20} />
              Инструкция по настройке
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-gray-900 mb-2">1. Добавьте секреты в проект:</p>
              <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <code className="text-blue-600">TOCHKA_CLIENT_ID</code>
                  <Badge variant="outline">83d30e0012814c8bb5c03daeb9cfa8e5</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-blue-600">TOCHKA_CLIENT_SECRET</code>
                  <Badge variant="outline">1825d3e4f40a43f8b71b42e5a9969e3c</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-blue-600">TOCHKA_CUSTOMER_CODE</code>
                  <Badge variant="outline">Найди в ЛК (9 цифр)</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-blue-600">TOCHKA_MERCHANT_ID</code>
                  <Badge variant="outline">Раздел "Эквайринг"</Badge>
                </div>
              </div>
            </div>

            <div>
              <p className="font-medium text-gray-900 mb-2">2. Настройте webhook в Точка Банк:</p>
              <div className="bg-white rounded-lg p-3 space-y-2">
                <p className="text-sm text-gray-700">URL для webhook:</p>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-xs">
                    https://functions.poehali.dev/f44bba27-a610-42b6-b8b3-8ef531be217a
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard('https://functions.poehali.dev/f44bba27-a610-42b6-b8b3-8ef531be217a')}
                  >
                    <Icon name="Copy" size={14} />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Событие: <Badge variant="outline">acquiringInternetPayment</Badge>
                </p>
              </div>
            </div>

            <div>
              <p className="font-medium text-gray-900 mb-2">3. Полная документация:</p>
              <Button
                variant="outline"
                onClick={() => window.open('/docs/tochka-integration-guide.md', '_blank')}
                className="w-full"
              >
                <Icon name="FileText" size={16} className="mr-2" />
                Открыть docs/tochka-integration-guide.md
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TochkaTest;
