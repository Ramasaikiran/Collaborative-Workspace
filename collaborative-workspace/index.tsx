import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// --- MOCK DATA ---
const initialTeam = [
  { id: 'aarav', name: 'Aarav', avatar: 'https://i.pravatar.cc/40?u=aarav' },
  { id: 'ria', name: 'Ria', avatar: 'https://i.pravatar.cc/40?u=ria' },
  { id: 'karan', name: 'Karan', avatar: 'https://i.pravatar.cc/40?u=karan' },
];

const initialTasks: Task[] = [
  { id: 'task-1', title: 'Setup GitHub repository', status: 'Done', assigneeId: 'aarav', dueDate: '2024-07-20', priority: 'High' },
  { 
    id: 'task-2', 
    title: 'Design initial UI mockups', 
    status: 'In Progress', 
    assigneeId: 'ria', 
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    priority: 'Medium',
    checklist: [
        { id: 'cl-1', text: 'Wireframe homepage', completed: true },
        { id: 'cl-2', text: 'Design task cards', completed: false },
    ],
    attachments: [
        { id: 'att-1', name: 'style_guide.pdf', url: '#', type: 'application/pdf' },
    ]
  }, // Due in 2 days
  { id: 'task-3', title: 'Develop frontend components', status: 'To Do', assigneeId: 'karan', dueDate: '2024-07-25', priority: 'High' },
  { id: 'task-4', title: 'Integrate Google Docs API', status: 'To Do', assigneeId: 'aarav', dueDate: '2024-07-28', priority: 'Low' },
  { id: 'task-5', title: 'Weekly Timesheet Automation', status: 'In Progress', assigneeId: 'ria', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'High' }, // Overdue
  { id: 'task-6', title: 'Schedule standup meetings', status: 'Done', assigneeId: 'karan', dueDate: '2024-07-19', priority: 'Medium' },
];

const initialFeedback = [
    { id: 'fb-1', from: 'Mentor', to: 'aarav', text: 'Great progress on the repo setup. Keep it up!', date: '2024-07-21' },
    { id: 'fb-2', from: 'ria', to: 'karan', text: 'Peer Review: The components look clean and well-structured.', date: '2024-07-23' },
    { id: 'fb-3', from: 'karan', to: 'ria', text: 'The UI mockups are looking fantastic.', date: '2024-07-22' },
];


// --- TYPES ---
type Status = 'To Do' | 'In Progress' | 'Done';
type Priority = 'Low' | 'Medium' | 'High';
type ChecklistItem = { id: string; text: string; completed: boolean; };
type Attachment = { id: string; name: string; url: string; type: string; };
type Task = { 
    id: string; 
    title: string; 
    status: Status; 
    assigneeId: string; 
    dueDate: string; 
    priority: Priority; 
    voiceNote?: string; 
    checklist?: ChecklistItem[];
    attachments?: Attachment[];
};
type TeamMember = { id: string; name: string; avatar: string; };
type Feedback = { id: string; from: string; to: string; text: string; date: string; };
type Notification = { id: string; message: string; read: boolean; };
type View = 'board' | 'calendar' | 'feedback' | 'timesheets' | 'integrations';
type User = TeamMember | 'guest' | null;

// --- HELPER FUNCTIONS ---
const getTeamMember = (id: string, team: TeamMember[]) => team.find(m => m.id === id);

const getTaskUrgencyClass = (dueDate: string): string => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'due-soon';
    return '';
};

// --- COMPONENTS ---

const LoginPage = ({ onLogin, team }: { onLogin: (user: User) => void; team: TeamMember[] }) => (
    <div className="login-container">
        <div className="login-box">
            <h1>Welcome to CodeHustlers</h1>
            <p>Choose your profile to continue</p>
            <div className="login-actions">
                {team.map(member => (
                    <button key={member.id} onClick={() => onLogin(member)}>{member.name}</button>
                ))}
                <button className="guest-btn" onClick={() => onLogin('guest')}>Continue as Guest</button>
            </div>
        </div>
    </div>
);

type TaskCardProps = {
  task: Task;
  team: TeamMember[];
  onClick: () => void;
};

const TaskCard: React.FC<TaskCardProps> = ({ task, team, onClick }) => {
  const assignee = getTeamMember(task.assigneeId, team);
  const urgencyClass = getTaskUrgencyClass(task.dueDate);
  const checklistProgress = useMemo(() => {
    if (!task.checklist || task.checklist.length === 0) return null;
    const completed = task.checklist.filter(item => item.completed).length;
    return `${completed}/${task.checklist.length}`;
  }, [task.checklist]);

  return (
    <div
      className={`task-card ${urgencyClass} priority-${task.priority.toLowerCase()}`}
      draggable
      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
      onClick={onClick}
    >
      <h3>{task.title}</h3>
      <div className="task-indicators">
        {task.voiceNote && <span className="task-indicator" title="Has voice note">🎤</span>}
        {checklistProgress && <span className="task-indicator" title="Checklist progress">📋 {checklistProgress}</span>}
        {task.attachments && task.attachments.length > 0 && <span className="task-indicator" title="Has attachments">📎</span>}
      </div>
      <div className="task-meta">
        <span className="task-due-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
        {assignee && (
          <div className="task-assignee">
            <img src={assignee.avatar} alt={assignee.name} title={assignee.name} />
          </div>
        )}
      </div>
    </div>
  );
};

type TaskColumnProps = {
  title: string;
  tasks: Task[];
  team: TeamMember[];
  status: Status;
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: Status) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onTaskClick: (task: Task) => void;
};

const TaskColumn: React.FC<TaskColumnProps> = ({ title, tasks, team, status, onDrop, onDragOver, onDragLeave, onTaskClick }) => {
    return (
      <div className="task-column">
        <div className="column-header">
          <h2>{title}</h2>
          <span className="task-count">{tasks.length}</span>
        </div>
        <div
          className="task-list"
          onDrop={(e) => onDrop(e, status)}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          {tasks.map(task => <TaskCard key={task.id} task={task} team={team} onClick={() => onTaskClick(task)} />)}
        </div>
      </div>
    );
};

const TaskBoard = ({ tasks, team, onTaskStatusChange, onAddTask, onTaskClick }: { tasks: Task[], team: TeamMember[], onTaskStatusChange: (taskId: string, newStatus: Status) => void, onAddTask: () => void, onTaskClick: (task: Task) => void }) => {
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const columns: Status[] = ['To Do', 'In Progress', 'Done'];

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    onTaskStatusChange(taskId, newStatus);
    (e.target as HTMLDivElement).classList.remove('drag-over');
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.currentTarget as HTMLDivElement).classList.add('drag-over');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.currentTarget as HTMLDivElement).classList.remove('drag-over');
  };

  const filteredTasks = tasks.filter(task => 
      (assigneeFilter === 'all' || task.assigneeId === assigneeFilter) &&
      (statusFilter === 'all' || task.status === statusFilter) &&
      (task.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <div className="board-header">
          <div className="filter-container">
            <input 
              type="text" 
              placeholder="Search tasks by title..." 
              className="search-bar"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} 
            />
            <label htmlFor="assignee-filter">Assignee:</label>
            <select id="assignee-filter" value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
              <option value="all">All</option>
              {team.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
            <label htmlFor="status-filter">Status:</label>
            <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value as Status | 'all')}>
              <option value="all">All</option>
              {columns.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <button className="new-task-btn" onClick={onAddTask}>+ New Task</button>
      </div>
      <div className="task-board">
        {columns.map(status => (
          <TaskColumn
            key={status}
            title={status}
            tasks={filteredTasks.filter(t => t.status === status)}
            team={team}
            status={status}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </>
  );
};

const CalendarView = ({ tasks }: { tasks: Task[] }) => {
    const [currentDate, setCurrentDate] = useState(new Date(2024, 6, 1));
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    
    const tasksByDate = useMemo(() => {
        return tasks.reduce((acc, task) => {
            (acc[task.dueDate] = acc[task.dueDate] || []).push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [tasks]);

    const renderDays = () => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day other-month"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const tasksForDay = tasksByDate[dateStr] || [];
            const hasTasks = tasksForDay.length > 0;
            days.push(
                <div key={day} className={`calendar-day ${hasTasks ? 'has-tasks' : ''}`} onClick={() => hasTasks && setSelectedDate(dateStr)}>
                    <span className="day-number">{day}</span>
                    {tasksForDay.slice(0, 2).map(task => (
                        <div key={task.id} className="calendar-task" title={task.title}>{task.title}</div>
                    ))}
                    {tasksForDay.length > 2 && <div className="calendar-task-more">...</div>}
                </div>
            );
        }
        return days;
    };
    
    return (
        <div className="calendar-view-container">
            <div className="calendar-view">
                <div className="calendar-header">
                    <button onClick={handlePrevMonth}>{"<"}</button>
                    <h2>{monthName} {year}</h2>
                    <button onClick={handleNextMonth}>{">"}</button>
                </div>
                <div className="calendar-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="calendar-day-name">{day}</div>)}
                    {renderDays()}
                </div>
            </div>
            {selectedDate && tasksByDate[selectedDate] && (
                <div className="selected-day-tasks">
                    <h3>Tasks for {new Date(selectedDate).toLocaleDateString()}</h3>
                    <ul>
                        {tasksByDate[selectedDate].map(task => <li key={task.id}>{task.title}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};

const FeedbackView = ({ team, feedback, onAddFeedback, onEditFeedback, currentUser }: { team: TeamMember[], feedback: Feedback[], onAddFeedback: (newFeedback: Omit<Feedback, 'id' | 'date'>) => void, onEditFeedback: (feedback: Feedback) => void, currentUser: User }) => {
    const [recipient, setRecipient] = useState(team[0]?.id || '');
    const [comment, setComment] = useState('');
    const teamNameMap = useMemo(() => team.reduce((acc, member) => ({...acc, [member.id]: member.name}), { 'Mentor': 'Mentor' } as Record<string, string>), [team]);

    const sortedFeedback = useMemo(() => [...feedback].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [feedback]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!recipient || !comment.trim() || !currentUser || currentUser === 'guest') return;
        onAddFeedback({ from: currentUser.id, to: recipient, text: comment });
        setComment('');
    };

    return (
        <div className="feedback-view">
            <div className="feedback-form">
                <h2>Submit Feedback</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="recipient">Team Member</label>
                        <select id="recipient" value={recipient} onChange={e => setRecipient(e.target.value)}>
                            {team.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="comment">Feedback / Peer Review</label>
                        <textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} required></textarea>
                    </div>
                    <button type="submit" className="submit-btn" disabled={!currentUser || currentUser === 'guest'}>Submit</button>
                    {currentUser === 'guest' && <p className="guest-warning">You must be logged in to submit feedback.</p>}
                </form>
            </div>
            <div className="feedback-list-container">
                <h2>Received Feedback</h2>
                <div className="feedback-list">
                    {sortedFeedback.map(fb => (
                        <div key={fb.id} className="feedback-item">
                            <p>"{fb.text}"</p>
                            <div className="feedback-meta">
                                - from {teamNameMap[fb.from] || fb.from} to {teamNameMap[fb.to] || fb.to} on {new Date(fb.date).toLocaleDateString()}
                                {currentUser && typeof currentUser === 'object' && currentUser.id === fb.from && (
                                    <button className="edit-btn" onClick={() => onEditFeedback(fb)}>Edit</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TaskFormModal = ({ task, team, onClose, onSave }: { task: Partial<Task> | null, team: TeamMember[], onClose: () => void, onSave: (task: Omit<Task, 'id'>) => void }) => {
    const [title, setTitle] = useState('');
    const [assigneeId, setAssigneeId] = useState(team[0]?.id || '');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState<Priority>('Medium');
    const [status, setStatus] = useState<Status>('To Do');
    const [voiceNote, setVoiceNote] = useState<string | undefined>(undefined);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        setTitle(task?.title || '');
        setAssigneeId(task?.assigneeId || team[0]?.id || '');
        setDueDate(task?.dueDate || '');
        setPriority(task?.priority || 'Medium');
        setStatus(task?.status || 'To Do');
        setVoiceNote(task?.voiceNote);
        setChecklist(task?.checklist || []);
        setAttachments(task?.attachments || []);
    }, [task, team]);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    setVoiceNote(reader.result as string);
                };
                audioChunksRef.current = [];
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied:", err);
            alert("Microphone access is required to record a voice note.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleAddChecklistItem = () => {
        if (newChecklistItem.trim()) {
            setChecklist([...checklist, { id: `cl-${Date.now()}`, text: newChecklistItem, completed: false }]);
            setNewChecklistItem('');
        }
    };

    const handleToggleChecklistItem = (id: string) => {
        setChecklist(checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
    };
    
    const handleRemoveChecklistItem = (id: string) => {
        setChecklist(checklist.filter(item => item.id !== id));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setAttachments([...attachments, { id: `att-${Date.now()}`, name: file.name, url: event.target?.result as string, type: file.type }]);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveAttachment = (id: string) => {
        setAttachments(attachments.filter(att => att.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !assigneeId || !dueDate) return;
        onSave({ title, assigneeId, dueDate, priority, status, voiceNote, checklist, attachments });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{task?.id ? 'Edit Task' : 'Create New Task'}</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label htmlFor="task-title">Task Title</label>
                            <input id="task-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="task-assignee">Assignee</label>
                            <select id="task-assignee" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                                {team.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                            </select>
                        </div>
                         <div className="form-group">
                             <label htmlFor="task-status">Status</label>
                             <select id="task-status" value={status} onChange={e => setStatus(e.target.value as Status)}>
                                 <option value="To Do">To Do</option>
                                 <option value="In Progress">In Progress</option>
                                 <option value="Done">Done</option>
                             </select>
                         </div>
                        <div className="form-group">
                            <label htmlFor="task-due-date">Due Date</label>
                            <input id="task-due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                        </div>
                         <div className="form-group">
                             <label htmlFor="task-priority">Priority</label>
                             <select id="task-priority" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                                 <option value="Low">Low</option>
                                 <option value="Medium">Medium</option>
                                 <option value="High">High</option>
                             </select>
                         </div>
                        <div className="form-group checklist-section">
                            <label>Checklist</label>
                            <div className="checklist-items">
                                {checklist.map(item => (
                                    <div key={item.id} className="checklist-item">
                                        <input type="checkbox" checked={item.completed} onChange={() => handleToggleChecklistItem(item.id)} />
                                        <span className={item.completed ? 'completed' : ''}>{item.text}</span>
                                        <button type="button" onClick={() => handleRemoveChecklistItem(item.id)}>&times;</button>
                                    </div>
                                ))}
                            </div>
                            <div className="add-checklist-item">
                                <input type="text" value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} placeholder="Add new item..." />
                                <button type="button" onClick={handleAddChecklistItem}>+</button>
                            </div>
                        </div>
                        <div className="form-group attachments-section">
                            <label>Attachments</label>
                            <div className="attachment-items">
                                {attachments.map(att => (
                                    <div key={att.id} className="attachment-item">
                                        <span>📎 {att.name}</span>
                                        <button type="button" onClick={() => handleRemoveAttachment(att.id)}>&times;</button>
                                    </div>
                                ))}
                            </div>
                            <input type="file" onChange={handleFileChange} />
                        </div>
                        <div className="form-group">
                            <label>Voice Note</label>
                            {voiceNote && !isRecording && <audio src={voiceNote} controls />}
                            <button type="button" onClick={isRecording ? handleStopRecording : handleStartRecording} className={`voice-note-btn ${isRecording ? 'recording' : ''}`}>
                                {isRecording ? 'Stop Recording' : 'Record Voice Note'}
                            </button>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="submit-btn">{task?.id ? 'Save Changes' : 'Create Task'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FeedbackEditModal = ({ feedback, onSave, onClose }: { feedback: Feedback | null, onSave: (feedback: Feedback) => void, onClose: () => void }) => {
    const [text, setText] = useState('');

    useEffect(() => {
        if (feedback) {
            setText(feedback.text);
        }
    }, [feedback]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (feedback && text.trim()) {
            onSave({ ...feedback, text });
        }
    };

    if (!feedback) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Edit Feedback</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label htmlFor="feedback-text">Feedback Text</label>
                            <textarea id="feedback-text" value={text} onChange={e => setText(e.target.value)} required></textarea>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="submit-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TimesheetsView = ({ tasks, feedback, currentUser }: { tasks: Task[], feedback: Feedback[], currentUser: User }) => {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const currentUserId = typeof currentUser === 'object' ? currentUser?.id : null;
    
    const completedTasksLastWeek = tasks.filter(task => 
        task.status === 'Done' && new Date(task.dueDate) >= lastWeek && task.assigneeId === currentUserId
    );
    
    const feedbackLastWeek = feedback.filter(fb =>
        new Date(fb.date) >= lastWeek && (fb.from === currentUserId || fb.to === currentUserId)
    );

    return (
        <div className="timesheets-view">
            <h2>Weekly Timesheet</h2>
            <div className="timesheet-section">
                <h3>Tasks Completed (Last 7 Days)</h3>
                {completedTasksLastWeek.length > 0 ? (
                    <ul>
                        {completedTasksLastWeek.map(task => <li key={task.id}>{task.title}</li>)}
                    </ul>
                ) : <p>No tasks completed in the last week.</p>}
            </div>
            <div className="timesheet-section">
                <h3>Feedback Activity (Last 7 Days)</h3>
                 {feedbackLastWeek.length > 0 ? (
                    <ul>
                        {feedbackLastWeek.map(fb => <li key={fb.id}>From {fb.from} to {fb.to}: "{fb.text}"</li>)}
                    </ul>
                ) : <p>No feedback activity in the last week.</p>}
            </div>
        </div>
    );
};

const IntegrationsView = () => (
    <div className="integrations-view">
        <h2>Team Collaboration Integrations</h2>
        <div className="integrations-grid">
            <div className="integration-card">
                <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" />
                <h3>GitHub</h3>
                <p>Connect repositories, track issues, and sync pull requests.</p>
                <button disabled>Coming Soon</button>
            </div>
            <div className="integration-card">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Google_Docs_logo_%282014-2020%29.svg/1481px-Google_Docs_logo_%282014-2020%29.svg.png" alt="Google Docs" />
                <h3>Google Docs</h3>
                <p>Attach documents, collaborate on files, and share updates.</p>
                <button disabled>Coming Soon</button>
            </div>
            <div className="integration-card">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" alt="Notion" />
                <h3>Notion</h3>
                <p>Link your Notion pages and databases to your tasks.</p>
                <button disabled>Coming Soon</button>
            </div>
        </div>
    </div>
);

const NotificationBell = ({ notifications, onClear }: { notifications: Notification[], onClear: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        if (!isOpen && unreadCount > 0) {
            onClear();
        }
    };

    return (
        <div className="notification-bell">
            <button onClick={handleToggle} className="notification-btn">
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            {isOpen && (
                <div className="notification-dropdown">
                    {notifications.length === 0 ? <p className="no-notifications">No notifications yet.</p> : (
                        <ul>
                            {notifications.slice().reverse().map(n => <li key={n.id}>{n.message}</li>)}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};


const App = () => {
  const [user, setUser] = useState<User>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback);
  const [activeView, setActiveView] = useState<View>('board');
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleTaskStatusChange = useCallback((taskId: string, newStatus: Status) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  }, []);

  const handleAddFeedback = useCallback((newFeedbackData: Omit<Feedback, 'id' | 'date'>) => {
    const newFeedback = { 
        ...newFeedbackData, 
        id: `fb-${Date.now()}`, 
        date: new Date().toISOString().split('T')[0] 
    };
    setFeedback(prev => [...prev, newFeedback]);
    
    // Create notification
    const fromUser = team.find(m => m.id === newFeedback.from) || { name: 'Someone' };
    const toUser = team.find(m => m.id === newFeedback.to);
    if (toUser && user && typeof user === 'object' && user.id === toUser.id) {
        setNotifications(prev => [...prev, {
            id: `notif-${Date.now()}`,
            message: `${fromUser.name} left feedback for you.`,
            read: false
        }]);
    }
  }, [team, user]);
  
  const handleSaveTask = useCallback((taskData: Omit<Task, 'id'>) => {
    if (editingTask?.id) { // Editing existing task
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData, id: editingTask.id } : t));
    } else { // Creating new task
       const newTask: Task = {
          ...taskData,
          id: `task-${Date.now()}`,
      };
      setTasks(prev => [...prev, newTask]);
      
      // Create notification for assignee
      const assignee = team.find(m => m.id === newTask.assigneeId);
      const currentUser = user && typeof user === 'object' ? user : null;

      if (assignee && assignee.id !== currentUser?.id) {
        setNotifications(prev => [...prev, {
            id: `notif-${Date.now()}`,
            message: `New task "${newTask.title}" assigned to you.`,
            read: false,
        }]);
      }
    }
    setEditingTask(null);
  }, [editingTask, team, user]);

  const handleUpdateFeedback = useCallback((updatedFeedback: Feedback) => {
      setFeedback(prev => prev.map(fb => fb.id === updatedFeedback.id ? updatedFeedback : fb));
      setEditingFeedback(null);
  }, []);

  const handleMarkNotificationsAsRead = useCallback(() => {
      setNotifications(prev => prev.map(n => ({...n, read: true})));
  }, []);


  const renderView = () => {
    switch(activeView) {
        case 'calendar': return <CalendarView tasks={tasks} />;
        case 'feedback': return <FeedbackView team={team} feedback={feedback} onAddFeedback={handleAddFeedback} onEditFeedback={setEditingFeedback} currentUser={user} />;
        case 'timesheets': return <TimesheetsView tasks={tasks} feedback={feedback} currentUser={user} />;
        case 'integrations': return <IntegrationsView />;
        case 'board':
        default:
            return <TaskBoard tasks={tasks} team={team} onTaskStatusChange={handleTaskStatusChange} onAddTask={() => setEditingTask({})} onTaskClick={(task) => setEditingTask(task)} />;
    }
  }

  if (!user) {
      return <LoginPage onLogin={setUser} team={team} />;
  }

  return (
    <div className="app-container">
      <header>
        <h1>CodeHustlers</h1>
        <nav>
          <ul>
            <li><button className={activeView === 'board' ? 'active' : ''} onClick={() => setActiveView('board')}>Task Board</button></li>
            <li><button className={activeView === 'calendar' ? 'active' : ''} onClick={() => setActiveView('calendar')}>Calendar</button></li>
            <li><button className={activeView === 'feedback' ? 'active' : ''} onClick={() => setActiveView('feedback')}>Feedback</button></li>
            <li><button className={activeView === 'timesheets' ? 'active' : ''} onClick={() => setActiveView('timesheets')}>Timesheets</button></li>
            <li><button className={activeView === 'integrations' ? 'active' : ''} onClick={() => setActiveView('integrations')}>Integrations</button></li>
          </ul>
        </nav>
        <div className="header-actions">
            <NotificationBell notifications={notifications} onClear={handleMarkNotificationsAsRead} />
            <span className="welcome-message">Welcome, {typeof user === 'object' ? user.name : 'Guest'}</span>
            <button onClick={() => setUser(null)} className="logout-btn">Logout</button>
        </div>
      </header>
      <main>
        {renderView()}
      </main>
      {editingTask !== null && <TaskFormModal task={editingTask} team={team} onClose={() => setEditingTask(null)} onSave={handleSaveTask} />}
      {editingFeedback !== null && <FeedbackEditModal feedback={editingFeedback} onSave={handleUpdateFeedback} onClose={() => setEditingFeedback(null)} />}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);