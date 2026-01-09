import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Unit {
  id: number;
  name: string;
}

interface CalendarSync {
  id: number;
  unit_id: number;
  platform: string;
  calendar_url: string;
  is_active: boolean;
  last_sync_at: string | null;
}

const API_URL = 'https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d';

const PLATFORMS = [
  { value: 'avito', label: 'Авито', icon: '🏠', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'yandex', label: 'Яндекс', icon: '🗺️', color: 'bg-red-50 border-red-200 text-red-700' },
  { value: 'booking', label: 'Booking', icon: '🌍', color: 'bg-green-50 border-green-200 text-green-700' },
];

export default function CalendarSyncCard({ units }: { units: Unit[] }) {
  const { toast } = useToast();
  const [syncs, setSyncs] = useState<CalendarSync[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSync, setNewSync] = useState({ unit_id: 0, platform: 'avito', calendar_url: '' });
  const [syncing, setSyncing] = useState<number | null>(null);

  useEffect(() => {
    loadSyncs();
    // Автоматическая синхронизация каждые 5 минут
    const interval = setInterval(() => {
      autoSync();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadSyncs = async () => {
    try {
      const response = await fetch(`${API_URL}?action=calendar-sync-list`);
      if (response.ok) {
        const data = await response.json();
        setSyncs(data.syncs || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки синхронизаций:', error);
    }
  };

  const autoSync = async () => {
    const activeSyncs = syncs.filter(s => s.is_active && s.calendar_url);
    for (const sync of activeSyncs) {
      try {
        await fetch(`${API_URL}?action=calendar-sync-now`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sync.id })
        });
      } catch (error) {
        console.error(`Ошибка автосинхронизации ${sync.platform}:`, error);
      }
    }
    await loadSyncs();
  };

  const addSync = async () => {
    if (!newSync.unit_id || !newSync.platform) {
      toast({ title: 'Выберите объект и площадку', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}?action=calendar-sync-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSync)
      });

      if (response.ok) {
        toast({ title: 'Синхронизация добавлена' });
        setShowAdd(false);
        setNewSync({ unit_id: 0, platform: 'avito', calendar_url: '' });
        loadSyncs();
      }
    } catch (error) {
      toast({ title: 'Ошибка добавления', variant: 'destructive' });
    }
  };

  const syncNow = async (id: number) => {
    setSyncing(id);
    try {
      const response = await fetch(`${API_URL}?action=calendar-sync-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Синхронизация завершена',
          description: `Импортировано: ${data.imported_events} событий`
        });
        loadSyncs();
      } else {
        const data = await response.json();
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка синхронизации', variant: 'destructive' });
    } finally {
      setSyncing(null);
    }
  };

  const updateUrl = async (id: number, url: string) => {
    try {
      const response = await fetch(`${API_URL}?action=calendar-sync-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, calendar_url: url })
      });

      if (response.ok) {
        loadSyncs();
      }
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const toggleActive = async (sync: CalendarSync) => {
    try {
      const response = await fetch(`${API_URL}?action=calendar-sync-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sync.id, is_active: !sync.is_active })
      });

      if (response.ok) {
        loadSyncs();
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const getExportUrl = (unitId: number) => {
    return `${API_URL}?action=calendar-export&unit_id=${unitId}`;
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Ссылка скопирована' });
  };

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/30">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Icon name="RefreshCw" size={24} className="text-indigo-600" />
            Синхронизация календарей
          </CardTitle>
          <Button onClick={() => setShowAdd(!showAdd)} variant="outline" size="sm">
            <Icon name="Plus" size={16} className="mr-1" />
            Добавить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <Icon name="Zap" className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <strong className="text-amber-900">Автосинхронизация каждые 5 минут</strong>
              <p className="text-amber-700 mt-1">Система автоматически проверяет новые брони с внешних площадок</p>
            </div>
          </div>
        </div>

        {showAdd && (
          <div className="bg-white p-4 rounded-lg border-2 border-blue-200 space-y-3">
            <h4 className="font-semibold">Новая синхронизация</h4>
            <select
              value={newSync.unit_id}
              onChange={(e) => setNewSync({ ...newSync, unit_id: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value={0}>Выберите объект</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select
              value={newSync.platform}
              onChange={(e) => setNewSync({ ...newSync, platform: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
            </select>
            <Input
              placeholder="URL календаря для импорта (опционально)"
              value={newSync.calendar_url}
              onChange={(e) => setNewSync({ ...newSync, calendar_url: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={addSync} size="sm">Добавить</Button>
              <Button onClick={() => setShowAdd(false)} variant="outline" size="sm">Отмена</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {syncs.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Синхронизации не настроены</p>
          ) : (
            syncs.map(sync => {
              const platform = PLATFORMS.find(p => p.value === sync.platform);
              const unit = units.find(u => u.id === sync.unit_id);

              return (
                <div key={sync.id} className={`p-4 rounded-lg border-2 ${platform?.color || 'bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        <span className="text-xl">{platform?.icon}</span>
                        {platform?.label} — {unit?.name}
                      </div>
                      {sync.last_sync_at && (
                        <p className="text-xs mt-1 opacity-75">
                          Обновлено: {new Date(sync.last_sync_at).toLocaleString('ru')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => toggleActive(sync)}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                      >
                        {sync.is_active ? (
                          <Badge variant="outline" className="bg-green-100 border-green-300">✓ Вкл</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100">✗ Выкл</Badge>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <strong className="block mb-1">📤 Экспорт на {platform?.label}:</strong>
                      <div className="flex gap-1">
                        <Input
                          value={getExportUrl(sync.unit_id)}
                          readOnly
                          className="text-xs h-8"
                        />
                        <Button
                          onClick={() => copyUrl(getExportUrl(sync.unit_id))}
                          size="sm"
                          className="h-8 px-3"
                        >
                          <Icon name="Copy" size={14} />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <strong className="block mb-1">📥 Импорт с {platform?.label}:</strong>
                      <div className="flex gap-1">
                        <Input
                          value={sync.calendar_url}
                          onChange={(e) => updateUrl(sync.id, e.target.value)}
                          placeholder="Вставьте ссылку на календарь"
                          className="text-xs h-8"
                        />
                        {sync.calendar_url && (
                          <Button
                            onClick={() => syncNow(sync.id)}
                            disabled={!sync.is_active || syncing === sync.id}
                            size="sm"
                            className="h-8 px-3"
                          >
                            {syncing === sync.id ? (
                              <Icon name="Loader2" size={14} className="animate-spin" />
                            ) : (
                              <Icon name="RefreshCw" size={14} />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
