import { useEffect, useState } from 'react';
import { eventApi } from '@/db/api';
import type { Event } from '@/types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 100 }
  }
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getAllEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = events.filter((e) => e.event_type === 'upcoming').sort((a, b) => 
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
  
  const pastEvents = events.filter((e) => e.event_type === 'past').sort((a, b) => 
    new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  const EventCard = ({ event }: { event: Event }) => {
    const eventDate = new Date(event.event_date);
    const isUpcoming = event.event_type === 'upcoming';
    
    return (
      <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col h-full hover:shadow-[0_12px_48px_rgba(0,0,0,0.06)] transition-all duration-300">
          <div className="flex items-start justify-between gap-5 mb-6 border-b border-slate-100 pb-6">
            <div className="space-y-2 flex-1 w-full">
              <h3 className="text-2xl md:text-[28px] font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans']">{event.title}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium font-['Be_Vietnam_Pro'] bg-slate-50 w-fit px-4 py-1.5 rounded-full border border-slate-100">
                <span className="material-symbols-outlined text-[18px] text-blue-500">calendar_today</span>
                <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
            </div>
            {isUpcoming && (
              <span className="flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-extrabold tracking-widest uppercase bg-blue-50 text-blue-700 border border-blue-100 shadow-sm shadow-blue-100/50">
                Coming Up
              </span>
            )}
          </div>
          
          <div className="space-y-6 font-['Be_Vietnam_Pro'] flex-1">
            <p className="text-lg text-slate-600 leading-relaxed">{event.description}</p>
            {event.photos && event.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                {event.photos.map((photo, idx) => (
                  <motion.img
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    src={photo}
                    alt={`${event.title} photo ${idx + 1}`}
                    className="w-full h-40 md:h-48 object-cover rounded-2xl shadow-sm border border-slate-200/60"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4 md:p-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div><div className="h-16 w-80 bg-slate-200 rounded-2xl mb-4"></div><div className="h-6 w-64 bg-slate-100 rounded-lg"></div></div>
          <div className="h-14 w-48 bg-slate-200 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-8 h-[600px] w-full bg-slate-200 rounded-3xl"></div>
          <div className="col-span-12 md:col-span-4 h-[600px] w-full bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full font-['Plus_Jakarta_Sans']">
      
      {/* Tabs Area */}
      <div className="flex justify-end mb-8 w-full">
        <motion.div variants={itemVariants} className="bg-slate-100 p-[6px] rounded-full flex gap-1 font-['Be_Vietnam_Pro'] border border-slate-200/50 shadow-inner">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 md:px-10 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === 'upcoming' ? 'bg-white shadow-md text-blue-600 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`px-6 md:px-10 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === 'past' ? 'bg-white shadow-md text-blue-600 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Past
          </button>
        </motion.div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Main Events Feed */}
        <div className="md:col-span-8 flex flex-col gap-8">
          <AnimatePresence mode="wait">
            {displayedEvents.length === 0 ? (
              <motion.div 
                key={`empty-${activeTab}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-slate-100 rounded-2xl p-6 min-h-[300px] flex flex-col items-center justify-center text-center shadow-[0_4px_16px_rgba(0,0,0,0.01)] transition-transform duration-300 hover:scale-[1.01] h-full"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 mb-4 bg-blue-50/50 rounded-[32px] rotate-3 flex items-center justify-center relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-pink-100/30"></div>
                  <span className="material-symbols-outlined text-blue-200/80 text-[60px] md:text-[80px] relative z-10 -rotate-3" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
                </div>
                <h2 className="text-2xl md:text-[28px] font-extrabold text-slate-900 mb-2 tracking-tight">No {activeTab} events</h2>
                <p className="text-slate-500 text-base md:text-lg max-w-sm font-['Be_Vietnam_Pro'] leading-relaxed">
                  {activeTab === 'upcoming' 
                    ? 'Check back soon for new events and upcoming celebrations!' 
                    : 'Memories from past events will elegantly appear here.'}
                </p>
                <button onClick={() => loadEvents()} className="mt-8 px-8 py-3 md:py-3 bg-blue-600 text-white rounded-full font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 hover:scale-[1.03] active:scale-95 transition-all text-base flex items-center justify-center gap-2 font-['Be_Vietnam_Pro'] tracking-wide">
                  Refresh Schedule
                  <span className="material-symbols-outlined text-[20px]">refresh</span>
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key={`populated-${activeTab}`}
                variants={containerVariants} initial="hidden" animate="visible" exit="hidden"
                className="flex flex-col gap-6 lg:gap-8"
              >
                {displayedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Bento Column */}
        <div className="md:col-span-4 flex flex-col gap-6 lg:gap-8">
          
          {/* Mini Calendar Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.01)] border border-slate-100 font-['Be_Vietnam_Pro']">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 w-full">
              <h3 className="text-[18px] lg:text-[22px] font-extrabold text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">May 2026</h3>
              <div className="flex gap-1.5">
                <button className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all border border-slate-200">
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all border border-slate-200">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center w-full">
              {/* Day Labels */}
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, i) => (
                <div key={day} className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${i >= 5 ? 'text-pink-400' : 'text-slate-400'}`}>{day}</div>
              ))}
              
              {/* Days Grid */}
              {[27, 28, 29, 30].map(day => (
                <div key={`prev-${day}`} className="py-1.5 lg:py-2 w-full text-[13px] font-medium text-slate-300">{day}</div>
              ))}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(day => (
                <div key={`curr-${day}`} className={`py-1.5 lg:py-2 w-full text-[13px] font-bold hover:bg-slate-100 rounded-lg transition-all cursor-pointer ${day === 2 || day === 3 || day === 9 || day === 10 ? 'text-pink-600 hover:bg-pink-50' : 'text-slate-700'}`}>{day}</div>
              ))}
              {/* Active Day */}
              <div className="py-1.5 lg:py-2 w-full text-[13px] font-extrabold bg-blue-600 text-white rounded-lg shadow-md shadow-blue-500/30 scale-105 z-10">15</div>
              {[16, 17].map(day => (
                <div key={`curr-${day}`} className="py-1.5 lg:py-2 w-full text-[13px] font-bold text-pink-600 hover:bg-pink-50 rounded-lg transition-all cursor-pointer">{day}</div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>

      {/* Footer / Additional Info Area */}
      <motion.div variants={containerVariants} className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <motion.div variants={itemVariants} className="flex items-center gap-4 p-4 bg-blue-50/40 rounded-2xl border border-blue-100/40 hover:bg-blue-50/60 transition-colors cursor-pointer group shadow-sm">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl shrink-0 flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>event_note</span>
          </div>
          <div>
            <h4 className="font-bold text-[16px] text-slate-900 mb-0.5 font-['Plus_Jakarta_Sans']">Calendar Sync</h4>
            <p className="text-[13px] text-slate-500 font-medium font-['Be_Vietnam_Pro'] leading-tight">Sync events with Google/Apple calendars.</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex items-center gap-4 p-4 bg-pink-50/40 rounded-2xl border border-pink-100/40 hover:bg-pink-50/60 transition-colors cursor-pointer group shadow-sm">
          <div className="w-12 h-12 bg-pink-600 text-white rounded-xl shrink-0 flex items-center justify-center shadow-md shadow-pink-500/20">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
          </div>
          <div>
            <h4 className="font-bold text-[16px] text-slate-900 mb-0.5 font-['Plus_Jakarta_Sans']">Parent Volunteering</h4>
            <p className="text-[13px] text-slate-500 font-medium font-['Be_Vietnam_Pro'] leading-tight">Participate in school activities.</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex items-center gap-4 p-4 bg-orange-50/40 rounded-2xl border border-orange-100/40 hover:bg-orange-50/60 transition-colors cursor-pointer group shadow-sm">
          <div className="w-12 h-12 bg-orange-600 text-white rounded-xl shrink-0 flex items-center justify-center shadow-md shadow-orange-500/20">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
          </div>
          <div>
            <h4 className="font-bold text-[16px] text-slate-900 mb-0.5 font-['Plus_Jakarta_Sans']">Event Gallery</h4>
            <p className="text-[13px] text-slate-500 font-medium font-['Be_Vietnam_Pro'] leading-tight">View high-res photos of celebrations.</p>
          </div>
        </motion.div>
      </motion.div>

    </motion.div>
  );
}
