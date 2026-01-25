import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { VenueDetail } from './pages/VenueDetail';
import { Booking } from './pages/Booking';
import { BookingConfirmation } from './pages/BookingConfirmation';
import { MyBookings } from './pages/MyBookings';
import { Admin } from './pages/Admin';
import { VenueForm } from './pages/VenueForm';
import { VenueManagement } from './pages/VenueManagement';

type Page =
  | 'login'
  | 'home'
  | 'venue-detail'
  | 'booking'
  | 'booking-confirmation'
  | 'my-bookings'
  | 'admin'
  | 'venue-form'
  | 'venue-management';

interface NavigationData {
  venueId?: string;
  venue?: any;
  date?: string;
  time?: string;
  partySize?: number;
  bookingId?: string;
  mode?: 'create' | 'edit';
}

function AppContent() {
  const { loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [navigationData, setNavigationData] = useState<NavigationData>({});

  const navigate = (page: Page, data?: NavigationData) => {
    setCurrentPage(page);
    setNavigationData(data || {});
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentPage === 'login') {
    return <Login onNavigate={navigate} />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={navigate}>
      {currentPage === 'home' && <Home onNavigate={navigate} />}
      {currentPage === 'venue-detail' && navigationData.venueId && (
        <VenueDetail venueId={navigationData.venueId} onNavigate={navigate} />
      )}
      {currentPage === 'booking' &&
        navigationData.venueId &&
        navigationData.venue &&
        navigationData.date &&
        navigationData.time && (
          <Booking
            venueId={navigationData.venueId}
            venue={navigationData.venue}
            date={navigationData.date}
            time={navigationData.time}
            partySize={navigationData.partySize || 2}
            onNavigate={navigate}
          />
        )}
      {currentPage === 'booking-confirmation' && navigationData.bookingId && (
        <BookingConfirmation bookingId={navigationData.bookingId} onNavigate={navigate} />
      )}
      {currentPage === 'my-bookings' && <MyBookings onNavigate={navigate} />}
      {currentPage === 'admin' && <Admin onNavigate={navigate} />}
      {currentPage === 'venue-form' && (
        <VenueForm
          mode={navigationData.mode || 'create'}
          venueId={navigationData.venueId}
          onNavigate={navigate}
        />
      )}
      {currentPage === 'venue-management' && <VenueManagement onNavigate={navigate} />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
