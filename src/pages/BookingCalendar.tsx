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
import BaseInfoSettings from '@/components/booking/BaseInfoSettings';
import ModificationRequests from '@/components/booking/ModificationRequests';

export default function BookingCalendar() {
  usePageMeta({
    title: 'Календарь бронирований',
    description: 'Управление бронированиями объектов размещения: календарь загрузки, цены, автоматизация через Telegram',
    keywords: 'календарь бронирований, управление объектами, турбаза, глэмпинг, бронирование онлайн'
  });

  const {
    units,
    bookings,
    pendingBookings,
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
      
      {/* Fixed navigation buttons - outside scroll container */}
      <button
        onClick={() => window.location.href = '/'}
        className="fixed top-4 left-4 z-[9999] flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-md hover:bg-card border border-border rounded-lg shadow-lg transition-all hover:shadow-xl"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        На главную
      </button>
      
      <CalendarHeader
        user={user}
        onShowPendingRequests={() => setShowPendingRequests(true)}
      />
      <div className="min-h-screen bg-background p-6">
        
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
              pendingBookings={pendingBookings}
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

          <div className="mt-6">
            <BaseInfoSettings />
          </div>

          <div className="mt-6">
            <ModificationRequests />
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