
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  Star, 
  Clock, 
  Search, 
  Filter,
  Video,
  Send,
  MoreVertical,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

type Profile = {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageAt?: string;
  messageCount?: number;
  unreadCount?: number;
};

type DbMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  is_read?: boolean;
};

const MentorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'chat' | 'meetings'>('overview');
  const [mentorName, setMentorName] = useState<string>('Mentor');
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [students, setStudents] = useState<Profile[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [chatError, setChatError] = useState<string>('');
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [mentorPhotoUrl, setMentorPhotoUrl] = useState<string>('');
  const [photoInput, setPhotoInput] = useState<string>('');
  const [savingPhoto, setSavingPhoto] = useState<boolean>(false);
  const [messageText, setMessageText] = useState('');
  const [totalSessionCount, setTotalSessionCount] = useState<number>(0);
  const [mentorRating, setMentorRating] = useState<number | null>(null);
  const [successRate, setSuccessRate] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [slotTime, setSlotTime] = useState<string>('10:00');
  const [slotNotes, setSlotNotes] = useState<string>('');
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);
  const [mentorSchedules, setMentorSchedules] = useState<any[]>([]);
  const [incomingToast, setIncomingToast] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: '',
  });
  const navigate = useNavigate();

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const selectedDate = new Date(now.getFullYear(), now.getMonth(), selectedDay);
  const selectedDateStr = selectedDate.toISOString().slice(0, 10);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      setMyId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      setMentorName(profile?.name || 'Mentor');

      const { data: mentorPhotoRow } = await supabase
        .from('mentors')
        .select('image_url')
        .eq('id', user.id)
        .maybeSingle();
      const existingPhoto = mentorPhotoRow?.image_url || '';
      setMentorPhotoUrl(existingPhoto);
      setPhotoInput(existingPhoto);

      // Sessions for this mentor
      const { data: sessions } = await supabase
        .from('mentor_sessions')
        .select('user_id')
        .eq('mentor_id', user.id)
        .order('session_date', { ascending: false })
        .limit(500);
      setTotalSessionCount((sessions || []).length);

      const sessionStudentIds = Array.from(new Set((sessions || []).map((s: any) => s.user_id))).filter(Boolean);
      const { data: myMessages } = await supabase
        .from('messages')
        .select('sender_id,receiver_id,text,created_at,is_read')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .limit(500);

      const byStudent: Record<string, { lastMessage: string; lastMessageAt: string; messageCount: number; unreadCount: number; mentorSent: boolean; studentSent: boolean }> = {};
      for (const m of myMessages || []) {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!otherId || otherId === user.id) continue;
        if (!byStudent[otherId]) {
          byStudent[otherId] = {
            lastMessage: m.text || '',
            lastMessageAt: m.created_at || '',
            messageCount: 0,
            unreadCount: 0,
            mentorSent: false,
            studentSent: false,
          };
        }
        byStudent[otherId].messageCount += 1;
        if (m.receiver_id === user.id && m.sender_id === otherId && !m.is_read) {
          byStudent[otherId].unreadCount += 1;
        }
        if (m.sender_id === user.id) byStudent[otherId].mentorSent = true;
        if (m.sender_id === otherId) byStudent[otherId].studentSent = true;
        if (!byStudent[otherId].lastMessageAt || new Date(m.created_at).getTime() > new Date(byStudent[otherId].lastMessageAt).getTime()) {
          byStudent[otherId].lastMessageAt = m.created_at;
          byStudent[otherId].lastMessage = m.text || '';
        }
      }

      const chatStudentIds = Object.keys(byStudent);
      const threads = Object.values(byStudent);
      const twoWayThreads = threads.filter((t) => t.mentorSent && t.studentSent).length;
      const nextSuccessRate = threads.length > 0 ? Math.round((twoWayThreads / threads.length) * 100) : 0;
      setSuccessRate(nextSuccessRate);

      const studentIds = Array.from(new Set([...sessionStudentIds, ...chatStudentIds])).filter(Boolean);
      if (studentIds.length === 0) {
        setStudents([]);
        return;
      }

      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id,name')
        .in('id', studentIds);

      const profileMap = new Map<string, Profile>();
      (studentProfiles as Profile[] | null)?.forEach((p) => {
        profileMap.set(p.id, p);
      });
      const merged: Profile[] = studentIds.map((id) => {
        const base = profileMap.get(id);
        return {
          id,
          name: base?.name || 'Student',
          lastMessage: byStudent[id]?.lastMessage || '',
          lastMessageAt: byStudent[id]?.lastMessageAt || '',
          messageCount: byStudent[id]?.messageCount || 0,
          unreadCount: byStudent[id]?.unreadCount || 0,
        };
      });
      merged.sort((a, b) => {
        const aTs = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTs = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTs - aTs;
      });
      setStudents(merged);

      const { data: mentorRatingRow } = await supabase
        .from('mentors')
        .select('rating')
        .eq('id', user.id)
        .maybeSingle();
      setMentorRating(typeof mentorRatingRow?.rating === 'number' ? mentorRatingRow.rating : null);

      const { data: scheduleRows } = await supabase
        .from('mentor_schedules')
        .select('*')
        .eq('mentor_id', user.id)
        .order('schedule_date', { ascending: true });
      setMentorSchedules(scheduleRows || []);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedStudent && students.length > 0) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent]);

  const fetchConversation = async (mentorId: string, studentId: string) => {
    setChatError('');
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${mentorId},receiver_id.eq.${studentId}),and(sender_id.eq.${studentId},receiver_id.eq.${mentorId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      setChatError(error.message || 'Could not load conversation.');
      setLoadingMessages(false);
      return;
    }

    setMessages((data as DbMessage[]) || []);
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', mentorId)
      .eq('sender_id', studentId)
      .eq('is_read', false);

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, unreadCount: 0 } : s))
    );
    setLoadingMessages(false);
  };

  useEffect(() => {
    if (!myId || !selectedStudent) return;
    fetchConversation(myId, selectedStudent.id);
  }, [myId, selectedStudent?.id]);

  useEffect(() => {
    if (!myId || !selectedStudent) return;

    const channel = supabase
      .channel(`mentor-dashboard-chat:${myId}:${selectedStudent.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as DbMessage;
          const isForCurrentChat =
            (row.sender_id === myId && row.receiver_id === selectedStudent.id) ||
            (row.sender_id === selectedStudent.id && row.receiver_id === myId);
          if (!isForCurrentChat) return;
          setMessages((prev) => [...prev, row]);
          if (row.receiver_id === myId && row.sender_id === selectedStudent.id) {
            setIncomingToast({
              visible: true,
              text: `New message from ${selectedStudent.name}: ${row.text?.slice(0, 60) || ''}`,
            });
            setTimeout(() => setIncomingToast({ visible: false, text: '' }), 2500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, selectedStudent?.id]);

  useEffect(() => {
    if (!myId) return;
    const channel = supabase
      .channel(`mentor-dashboard-incoming:${myId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as DbMessage;
          if (row.receiver_id !== myId || row.sender_id === myId) return;
          const sender = students.find((s) => s.id === row.sender_id);
          setIncomingToast({
            visible: true,
            text: `New message from ${sender?.name || 'Student'}: ${row.text?.slice(0, 60) || ''}`,
          });
          setTimeout(() => setIncomingToast({ visible: false, text: '' }), 2500);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, students]);

  const sendMessage = async () => {
    if (!myId || !selectedStudent) return;
    const trimmed = messageText.trim();
    if (!trimmed) return;

    setMessageText('');
    setChatError('');
    const { error } = await supabase.from('messages').insert([
      {
        sender_id: myId,
        receiver_id: selectedStudent.id,
        text: trimmed,
      },
    ]);

    if (error) {
      setChatError(error.message || 'Failed to send message.');
    }
  };

  const saveMentorPhoto = async () => {
    if (!myId) return;
    const trimmed = photoInput.trim();
    setSavingPhoto(true);
    const { error } = await supabase.from('mentors').upsert(
      [
        {
          id: myId,
          name: mentorName || 'Mentor',
          image_url: trimmed || null,
        },
      ],
      { onConflict: 'id' }
    );
    setSavingPhoto(false);

    if (error) {
      setChatError(error.message || 'Failed to save mentor photo.');
      return;
    }
    setMentorPhotoUrl(trimmed);
  };

  const saveSchedule = async () => {
    if (!myId || !slotTime) return;
    setSavingSchedule(true);
    const { error } = await supabase.from('mentor_schedules').upsert(
      [
        {
          mentor_id: myId,
          schedule_date: selectedDateStr,
          slot_time: slotTime,
          notes: slotNotes.trim() || null,
        },
      ],
      { onConflict: 'mentor_id,schedule_date,slot_time' }
    );
    setSavingSchedule(false);
    if (error) {
      setChatError(error.message || 'Failed to save schedule.');
      return;
    }
    setSlotNotes('');
    const { data: scheduleRows } = await supabase
      .from('mentor_schedules')
      .select('*')
      .eq('mentor_id', myId)
      .order('schedule_date', { ascending: true });
    setMentorSchedules(scheduleRows || []);
  };

  const schedulesForSelectedDay = mentorSchedules.filter((s) => s.schedule_date === selectedDateStr);

  const stats = [
    { label: 'Active Students', value: `${students.length}`, icon: Users, color: 'text-blue-400' },
    { label: 'Sessions', value: `${totalSessionCount}`, icon: Clock, color: 'text-purple-400' },
    { label: 'Avg. Rating', value: mentorRating !== null ? mentorRating.toFixed(1) : '--', icon: Star, color: 'text-yellow-400' },
    { label: 'Reply Rate', value: `${successRate}%`, icon: TrendingUp, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-8 pt-20 md:pt-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{mentorName.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-400">Real mentor activity from your students and chats</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/mentor-login');
            }}
            className="px-5 py-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
            type="button"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center gap-2"
            type="button"
          >
            <Calendar className="w-5 h-5 text-blue-400" /> Schedule
          </button>
          <button
            onClick={() => window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl font-black text-white hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
            type="button"
          >
            Go Live
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-3xl border border-white/5"
          >
            <div className={`p-3 rounded-2xl bg-white/5 w-fit mb-4 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl w-fit">
        {(['overview', 'students', 'chat', 'meetings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
              activeTab === tab 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {incomingToast.visible && (
        <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-200 text-sm">
          {incomingToast.text}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Recent Students */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black">Recent Students</h3>
                <button className="text-sm text-blue-400 font-bold hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map((student) => (
                  <div key={student.id} className="glass p-6 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-black text-xl">
                        {student.name[0]}
                      </div>
                      <div>
                        <h4 className="font-black">{student.name}</h4>
                        <p className="text-xs text-gray-400">
                          {student.lastMessageAt ? `Last chat: ${new Date(student.lastMessageAt).toLocaleString()}` : 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500 uppercase tracking-widest">Progress</span>
                        <span className="text-blue-400">{student.messageCount || 0} msgs</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000"
                          style={{ width: `${Math.min(100, (student.messageCount || 0) * 10)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentor Profile */}
            <div className="space-y-6">
              <h3 className="text-xl font-black">Mentor Profile</h3>
              <div className="glass p-5 rounded-3xl border border-white/5 space-y-4">
                <img
                  src={mentorPhotoUrl || 'https://placehold.co/200x200/png'}
                  alt={mentorName}
                  className="w-20 h-20 rounded-2xl object-cover border border-white/10"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/200x200/png';
                  }}
                />
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                    Photo URL
                  </label>
                  <input
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={saveMentorPhoto}
                  disabled={savingPhoto}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm font-black"
                >
                  {savingPhoto ? 'Saving...' : 'Save Photo'}
                </button>
              </div>

              <h3 className="text-xl font-black">Upcoming Meetings</h3>
              <div className="space-y-4">
                <div className="glass p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-sm">Instant Google Meet</h4>
                    <p className="text-xs text-gray-400">Click “Go Live” to start</p>
                  </div>
                  <button className="p-2 hover:bg-white/5 rounded-xl transition-colors" type="button">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[2.5rem] border border-white/5 h-[600px] flex overflow-hidden"
          >
            {/* Sidebar */}
            <div className="w-80 border-r border-white/5 flex flex-col">
              <div className="p-6 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search chats..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors ${selectedStudent?.id === student.id ? 'bg-white/5' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                      {student.name[0]}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{student.name}</p>
                        {(student.unreadCount || 0) > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                            {student.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate w-40">
                        {student.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedStudent ? (
                <>
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                        {selectedStudent.name[0]}
                      </div>
                      <div>
                        <h4 className="font-black">{selectedStudent.name}</h4>
                      <p className="text-xs text-green-400">1:1 student chat</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer')}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <Video className="w-5 h-5" />
                      </button>
                      <button className="p-2 hover:bg-white/5 rounded-xl transition-colors"><MoreVertical className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {chatError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                        {chatError}
                      </div>
                    )}
                    {loadingMessages && (
                      <p className="text-sm text-gray-500">Loading conversation...</p>
                    )}
                    {!loadingMessages && messages.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No messages yet. Send the first message to start mentoring chat.
                      </p>
                    )}
                    {messages.map((m) => {
                      const mine = m.sender_id === myId;
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                              mine
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none'
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{m.text}</div>
                            <div className="text-[10px] opacity-70 mt-1">
                              {new Date(m.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-6 border-t border-white/5">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                      className="flex gap-4"
                    >
                      <input 
                        type="text" 
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="submit" className="p-3 bg-blue-600 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                        <Send className="w-6 h-6" />
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => navigate(`/chat/${selectedStudent.id}`)}
                      className="mt-3 text-xs text-blue-300 hover:underline"
                    >
                      Open full chat page
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-bold">Select a student to start chatting</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'students' && (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-2xl font-black">Manage Mentees</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search students..."
                    className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {students.map((student) => (
                <div key={student.id} className="glass p-8 rounded-[2.5rem] border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6">
                    <div className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full">Active</div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/20">
                      {student.name[0]}
                    </div>
                    <div>
                      <h4 className="text-xl font-black">{student.name}</h4>
                      <p className="text-sm text-gray-400">
                        {student.lastMessageAt ? `Last message: ${new Date(student.lastMessageAt).toLocaleString()}` : 'No messages yet'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-bold">Credibility</span>
                      <span className="text-blue-400 font-black">{student.messageCount || 0}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all">Profile</button>
                    <button 
                      onClick={() => {
                        navigate(`/chat/${student.id}`);
                      }}
                      className="py-3 bg-blue-600 rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'meetings' && (
          <motion.div
            key="meetings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-2xl font-black">Schedule</h3>
              <div className="glass p-8 rounded-[2.5rem] border border-white/5">
                {/* Mock Calendar UI */}
                <div className="grid grid-cols-7 gap-4 mb-8">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">{day}</div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => (
                    <button 
                      key={i} 
                      type="button"
                      onClick={() => setSelectedDay(i + 1)}
                      className={`aspect-square rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${
                        i + 1 === selectedDay ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-white/5 text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 border-t border-white/10 pt-6">
                  <p className="text-sm font-bold text-gray-300">
                    Set availability for {selectedDate.toDateString()}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="time"
                      value={slotTime}
                      onChange={(e) => setSlotTime(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm"
                    />
                    <input
                      type="text"
                      value={slotNotes}
                      onChange={(e) => setSlotNotes(e.target.value)}
                      placeholder="Optional note"
                      className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveSchedule}
                    disabled={savingSchedule}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-sm font-black"
                  >
                    {savingSchedule ? 'Saving...' : 'Save Slot'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black">Today's Sessions</h3>
              <div className="space-y-4">
                {schedulesForSelectedDay.length === 0 && (
                  <div className="glass p-6 rounded-3xl border border-white/5 text-sm text-gray-400">
                    No slots set for this day.
                  </div>
                )}
                {schedulesForSelectedDay.map((slot) => (
                  <div key={slot.id} className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-bold text-blue-400">
                          {slot.slot_time?.slice(0, 2) || 'M'}
                        </div>
                        <div>
                          <h4 className="font-black text-sm">{slot.slot_time}</h4>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{slot.notes || 'Available slot'}</p>
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-lg">Google Meet</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer')}
                      className="w-full py-3 bg-blue-600 rounded-2xl text-sm font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" /> Go Live
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorDashboard;
