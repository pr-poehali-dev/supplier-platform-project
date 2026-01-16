import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { fetchWithAuth } from '@/lib/api';

interface Unit {
  id: number;
  name: string;
  type: string;
}

interface CalendarSync {
  id: number;
  unit_id: number;
  unit_name?: string;
  platform: string;
  calendar_url: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

const PLATFORMS = [
  { value: 'avito', label: 'Авито', icon: '🏠' },
  { value: 'yandex', label: 'Яндекс.Путешествия', icon: '🗺️' },
  { value: 'booking', label: 'Booking.com', icon: '🌍' },
  { value: 'airbnb', label: 'Airbnb', icon: '🏡' },
  { value: 'other', label: 'Другое', icon: '📅' }
];

export default function CalendarSyncManager() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [syncs, setSyncs] = useState<CalendarSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Форма добавления
  const [newSync, setNewSync] = useState({
    unit_id: 0,
    platform: 'avito',
    calendar_url: ''
  });

  const API_URL = 'https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [unitsRes, syncsRes] = await Promise.all([
        fetchWithAuth(`${API_URL}?action=get-units`),
        fetchWithAuth(`${API_URL}?action=calendar-sync-list`)
      ]);

      if (unitsRes.ok) {
        const data = await unitsRes.json();
        setUnits(data.units || []);
      }

      if (syncsRes.ok) {
        const data = await syncsRes.json();
        setSyncs(data.syncs || []);
      }
    } catch (error) {
      // Error loading data
    } finally {
      setLoading(false);
    }
  };

  const addSync = async () => {
    if (!newSync.unit_id || !newSync.platform) {
      alert('Выберите объект и площадку');
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_URL}?action=calendar-sync-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSync)
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewSync({ unit_id: 0, platform: 'avito', calendar_url: '' });
        loadData();
      } else {
        alert('Ошибка добавления синхронизации');
      }
    } catch (error) {
      alert('Ошибка добавления синхронизации');
    }
  };

  const toggleActive = async (sync: CalendarSync) => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=calendar-sync-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sync.id,
          is_active: !sync.is_active
        })
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      // Toggle error
    }
  };

  const updateUrl = async (sync: CalendarSync, newUrl: string) => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=calendar-sync-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sync.id,
          calendar_url: newUrl
        })
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      // Update error
    }
  };

  const deleteSync = async (id: number) => {
    if (!confirm('Удалить синхронизацию?')) return;

    try {
      const response = await fetchWithAuth(`${API_URL}?action=calendar-sync-delete&id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      // Delete error
    }
  };

  const syncNow = async (id: number) => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=calendar-sync-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Синхронизация завершена. Импортировано событий: ${data.imported_events}`);
        loadData();
      } else {
        const data = await response.json();
        alert(`Ошибка синхронизации: ${data.error}`);
      }
    } catch (error) {
      alert('Ошибка синхронизации');
    }
  };

  const getExportUrl = (unitId: number) => {
    return `${API_URL}?action=calendar-export&unit_id=${unitId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Скопировано в буфер обмена');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  const filteredSyncs = selectedUnit 
    ? syncs.filter(s => s.unit_id === selectedUnit)
    : syncs;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Синхронизация календарей</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Icon name="Plus" size={20} />
          Добавить синхронизацию
        </button>
      </div>

      {/* Фильтр по объектам */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedUnit(null)}
          className={`px-4 py-2 rounded-lg ${
            selectedUnit === null 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Все объекты
        </button>
        {units.map(unit => (
          <button
            key={unit.id}
            onClick={() => setSelectedUnit(unit.id)}
            className={`px-4 py-2 rounded-lg ${
              selectedUnit === unit.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {unit.name}
          </button>
        ))}
      </div>

      {/* Форма добавления */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg border-2 border-blue-200 space-y-4">
          <h3 className="font-semibold text-lg">Новая синхронизация</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Объект размещения
            </label>
            <select
              value={newSync.unit_id}
              onChange={(e) => setNewSync({ ...newSync, unit_id: Number(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value={0}>Выберите объект</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Площадка
            </label>
            <select
              value={newSync.platform}
              onChange={(e) => setNewSync({ ...newSync, platform: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {PLATFORMS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.icon} {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL календаря для импорта (необязательно)
            </label>
            <input
              type="url"
              value={newSync.calendar_url}
              onChange={(e) => setNewSync({ ...newSync, calendar_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              iCalendar URL от внешней площадки для автоматического импорта занятых дат
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addSync}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Добавить
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список синхронизаций */}
      <div className="space-y-4">
        {filteredSyncs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Синхронизации не настроены</p>
            <p className="text-sm mt-2">Добавьте первую синхронизацию с внешней площадкой</p>
          </div>
        ) : (
          filteredSyncs.map(sync => {
            const platform = PLATFORMS.find(p => p.value === sync.platform);
            const unit = units.find(u => u.id === sync.unit_id);
            
            return (
              <div
                key={sync.id}
                className={`bg-white p-6 rounded-lg border-2 ${
                  sync.is_active ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{platform?.icon}</span>
                      <h3 className="font-semibold text-lg">{platform?.label}</h3>
                      {!selectedUnit && unit && (
                        <span className="text-sm text-gray-500">• {unit.name}</span>
                      )}
                    </div>
                    {sync.last_sync_at && (
                      <p className="text-sm text-gray-500">
                        Последняя синхронизация: {new Date(sync.last_sync_at).toLocaleString('ru')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(sync)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        sync.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {sync.is_active ? 'Включено' : 'Выключено'}
                    </button>
                    <button
                      onClick={() => deleteSync(sync.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Icon name="Trash2" size={20} />
                    </button>
                  </div>
                </div>

                {/* Экспорт */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Upload" size={16} />
                    <span className="font-medium text-sm">Экспорт в {platform?.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Используйте эту ссылку в настройках календаря на площадке для импорта ваших броней:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={getExportUrl(sync.unit_id)}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border rounded text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(getExportUrl(sync.unit_id))}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Копировать
                    </button>
                  </div>
                </div>

                {/* Импорт */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Download" size={16} />
                    <span className="font-medium text-sm">Импорт с {platform?.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Укажите ссылку на календарь с площадки для автоматического блокирования занятых дат:
                  </p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={sync.calendar_url}
                      onChange={(e) => updateUrl(sync, e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 bg-white border rounded text-sm"
                    />
                    {sync.calendar_url && (
                      <button
                        onClick={() => syncNow(sync.id)}
                        disabled={!sync.is_active}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 text-sm flex items-center gap-2"
                      >
                        <Icon name="RefreshCw" size={16} />
                        Синхронизировать
                      </button>
                    )}
                  </div>
                  {!sync.calendar_url && (
                    <p className="text-xs text-gray-500">
                      💡 Найдите ссылку на календарь в настройках объявления на площадке
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Инструкции */}
      <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={24} className="text-amber-600 flex-shrink-0 mt-1" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-amber-900">Как настроить синхронизацию:</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-800">
              <li><strong>Экспорт:</strong> Скопируйте ссылку и вставьте её в настройки календаря на площадке (Авито/Яндекс)</li>
              <li><strong>Импорт:</strong> Найдите ссылку на календарь в личном кабинете площадки и вставьте её сюда</li>
              <li>После настройки нажмите "Синхронизировать" для первой загрузки данных</li>
              <li>Дальше система будет автоматически обновлять календарь каждые 6 часов</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}