import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  { value: 'avito', label: 'Авито', icon: '🟠', color: 'bg-orange-50 border-orange-300', iconBg: 'from-orange-500 to-red-500' },
  { value: 'yandex', label: 'Яндекс Путешествия', icon: '🟡', color: 'bg-yellow-50 border-yellow-300', iconBg: 'from-yellow-500 to-orange-500' },
];

export default function CalendarSyncCard({ units }: { units: Unit[] }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [syncs, setSyncs] = useState<CalendarSync[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSync, setNewSync] = useState({ unit_id: 0, platform: 'avito', calendar_url: '' });
  const [syncing, setSyncing] = useState<number | null>(null);
  const [editingUrl, setEditingUrl] = useState<number | null>(null);
  const [tempUrl, setTempUrl] = useState('');

  useEffect(() => {
    loadSyncs();
    const interval = setInterval(() => {
      autoSync();
    }, 30 * 60 * 1000);

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
    if (!newSync.unit_id || !newSync.platform || !newSync.calendar_url) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}?action=calendar-sync-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSync)
      });

      if (response.ok) {
        toast({ title: 'Синхронизация добавлена!' });
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
        toast({ title: 'Ссылка обновлена' });
        loadSyncs();
        setEditingUrl(null);
      }
    } catch (error) {
      toast({ title: 'Ошибка обновления', variant: 'destructive' });
    }
  };

  const deleteSync = async (id: number) => {
    if (!confirm('Удалить синхронизацию?')) return;
    
    try {
      const response = await fetch(`${API_URL}?action=calendar-sync-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        toast({ title: 'Синхронизация удалена' });
        loadSyncs();
      }
    } catch (error) {
      toast({ title: 'Ошибка удаления', variant: 'destructive' });
    }
  };

  const getExportUrl = (unitId: number) => {
    return `${API_URL}?action=calendar-export&unit_id=${unitId}`;
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Ссылка скопирована!' });
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="space-y-4 p-0">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Icon name="Info" size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Как подключить синхронизацию?</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Получите iCal ссылку от Авито или Яндекс Путешествий и вставьте её ниже.
                  Календари синхронизируются автоматически каждые 30 минут.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/sync-guide')}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 flex-shrink-0"
            >
              <Icon name="Book" size={16} className="mr-2" />
              Инструкция
            </Button>
          </div>
        </div>

        {!showAdd && (
          <Button
            onClick={() => setShowAdd(true)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90"
            size="lg"
          >
            <Icon name="Plus" size={20} className="mr-2" />
            Добавить синхронизацию
          </Button>
        )}

        {showAdd && (
          <div className="bg-white p-5 rounded-xl border-2 border-green-300 shadow-md space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Plus" size={20} className="text-green-600" />
              <h4 className="font-semibold text-lg">Новая синхронизация</h4>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Выберите объект:</label>
              <select
                value={newSync.unit_id}
                onChange={(e) => setNewSync({ ...newSync, unit_id: Number(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value={0}>-- Выберите объект --</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Площадка:</label>
              <select
                value={newSync.platform}
                onChange={(e) => setNewSync({ ...newSync, platform: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">iCal ссылка:</label>
              <Input
                placeholder="https://calendar.example.com/ical/..."
                value={newSync.calendar_url}
                onChange={(e) => setNewSync({ ...newSync, calendar_url: e.target.value })}
                className="border-2"
              />
              <p className="text-xs text-gray-500 mt-1">Получите ссылку в личном кабинете площадки</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={addSync} className="flex-1 bg-green-600 hover:bg-green-700">
                <Icon name="Check" size={16} className="mr-2" />
                Добавить
              </Button>
              <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1">
                Отмена
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {syncs.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Icon name="Calendar" size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 font-medium">Синхронизации еще не настроены</p>
              <p className="text-sm text-gray-500 mt-1">Нажмите "Добавить синхронизацию" выше</p>
            </div>
          ) : (
            syncs.map(sync => {
              const platform = PLATFORMS.find(p => p.value === sync.platform);
              const unit = units.find(u => u.id === sync.unit_id);

              return (
                <div key={sync.id} className={`p-4 rounded-xl border-2 ${platform?.color || 'bg-gray-50 border-gray-300'} shadow-sm`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${platform?.iconBg} flex items-center justify-center text-2xl flex-shrink-0`}>
                        {platform?.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{platform?.label}</div>
                        <div className="text-sm text-gray-600">{unit?.name || `Объект #${sync.unit_id}`}</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteSync(sync.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {editingUrl === sync.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={tempUrl}
                          onChange={(e) => setTempUrl(e.target.value)}
                          placeholder="https://calendar.example.com/ical/..."
                          className="flex-1"
                        />
                        <Button size="sm" onClick={() => updateUrl(sync.id, tempUrl)}>
                          <Icon name="Check" size={14} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingUrl(null)}>
                          <Icon name="X" size={14} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/60 px-3 py-2 rounded-lg text-sm font-mono truncate">
                          {sync.calendar_url || 'Ссылка не указана'}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingUrl(sync.id);
                            setTempUrl(sync.calendar_url);
                          }}
                        >
                          <Icon name="Edit" size={14} />
                        </Button>
                      </div>
                    )}

                    {sync.last_sync_at && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Icon name="Clock" size={12} />
                        Последняя синхронизация: {new Date(sync.last_sync_at).toLocaleString('ru-RU')}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => syncNow(sync.id)}
                        disabled={syncing === sync.id || !sync.calendar_url}
                        size="sm"
                        className="flex-1"
                      >
                        {syncing === sync.id ? (
                          <>
                            <Icon name="Loader" className="mr-2 animate-spin" size={14} />
                            Синхронизация...
                          </>
                        ) : (
                          <>
                            <Icon name="RefreshCw" size={14} className="mr-2" />
                            Синхронизировать
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => copyUrl(getExportUrl(sync.unit_id))}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Icon name="Download" size={14} className="mr-2" />
                        Экспорт iCal
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Icon name="Zap" className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <strong className="text-amber-900 block mb-1">Автоматическая синхронизация</strong>
              <p className="text-sm text-amber-800">
                Календари обновляются каждые 30 минут. Новые брони с площадок появятся в вашем календаре автоматически.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
