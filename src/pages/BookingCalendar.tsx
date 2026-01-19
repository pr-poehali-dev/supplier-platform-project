import SubscriptionGuard from '@/components/SubscriptionGuard';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/utils/seo';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useBookingCalendar } from '@/hooks/useBookingCalendar';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import PendingRequestsDialog from '@/components/calendar/PendingRequestsDialog';
import UnitsManagement from '@/components/booking/UnitsManagement';
import CalendarView from '@/components/booking/CalendarView';
import CreateBookingDialog from '@/components/booking/CreateBookingDialog';
import IntegrationAccordion from '@/components/booking/IntegrationAccordion';
import PricingAccordion from '@/components/pricing/PricingAccordion';
import SBPSettings from '@/components/payment/SBPSettings';

export default function BookingCalendar() {
  usePageMeta({
    title: 'Календарь бронирований',
    description: 'Управление бронированиями объектов размещения: календарь загрузки, цены, автоматизация через Telegram',
    keywords: 'календарь бронирований, управление объектами, турбаза, глэмпинг, бронирование онлайн'
  });

  const {
    units,
    bookings,
    currentDate,
    selectedUnit,
    user,
    botLink,
    showPendingRequests,
    setSelectedUnit,
    setShowPendingRequests,
    loadUnits,
    addUnit,
    updateUnit,
    deleteUnit,
    createBooking,
    updateBookingStatus,
    scrollToBooking,
    deleteBooking,
    changeMonth,
  } = useBookingCalendar();

  const breadcrumbs = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    { name: 'Календарь бронирований', url: '/booking-calendar' }
  ]);

  return (
    <SubscriptionGuard feature="hasCalendar" featureName="календаря бронирования">
      <JsonLd data={breadcrumbs} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <CalendarHeader
          user={user}
          onShowPendingRequests={() => setShowPendingRequests(true)}
        />
        
        <div className="max-w-7xl mx-auto">
          <UnitsManagement
            units={units}
            selectedUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
            onAddUnit={addUnit}
            onUpdateUnit={updateUnit}
            onDeleteUnit={deleteUnit}
          />

          <PricingAccordion 
            selectedUnit={selectedUnit}
            onUnitUpdate={loadUnits}
          />

          <div id="calendar-view">
            <CalendarView
              selectedUnit={selectedUnit}
              currentDate={currentDate}
              bookings={bookings}
              onChangeMonth={changeMonth}
              onDeleteBooking={deleteBooking}
              renderBookingButton={
                <CreateBookingDialog
                  selectedUnit={selectedUnit}
                  onCreateBooking={createBooking}
                />
              }
            />
          </div>

          <div className="mt-6">
            <SBPSettings />
          </div>

          <IntegrationAccordion 
            botLink={botLink} 
            units={units}
          />
        </div>

        <PendingRequestsDialog
          open={showPendingRequests}
          onOpenChange={setShowPendingRequests}
          units={units}
          onScrollToBooking={scrollToBooking}
          onUpdateBookingStatus={updateBookingStatus}
        />
      </div>
    </SubscriptionGuard>
  );
}