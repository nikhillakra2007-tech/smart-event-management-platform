import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { api } from '../../api/client';
import { ScheduleItem, PlannerTask, BudgetItem, PlannerOverview } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge, BadgeVariant } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import {
  CalendarDays,
  ListTodo,
  DollarSign,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  CheckSquare,
  Square,
  ArrowRight,
  TrendingUp,
  Loader2,
  Check,
} from 'lucide-react';
import clsx from 'clsx';

export const EventPlanner: React.FC = () => {
  const { currentEvent } = useEvent();
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'budget'>('timeline');
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Modals
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState<boolean>(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState<boolean>(false);

  // Template Form State
  const [templateType, setTemplateType] = useState<string>('hackathon_24h');
  const [templateBudget, setTemplateBudget] = useState<number>(5000);

  // Schedule Form State
  const [schedTitle, setSchedTitle] = useState('');
  const [schedDay, setSchedDay] = useState(1);
  const [schedStart, setSchedStart] = useState('09:00 AM');
  const [schedEnd, setSchedEnd] = useState('10:00 AM');
  const [schedLoc, setSchedLoc] = useState('');
  const [schedCat, setSchedCat] = useState<'general' | 'keynote' | 'workshop' | 'milestone' | 'meal' | 'ceremony' | 'networking' | 'judging'>('general');
  const [schedSpeaker, setSchedSpeaker] = useState('');
  const [schedMilestone, setSchedMilestone] = useState(false);

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCategory, setTaskCategory] = useState<'logistics' | 'marketing' | 'sponsors' | 'mentors' | 'prizes' | 'catering' | 'platform'>('logistics');
  const [taskPriority, setTaskPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [taskDue, setTaskDue] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  // Budget Form State
  const [budgetItemName, setBudgetItemName] = useState('');
  const [budgetCat, setBudgetCat] = useState<'venue' | 'catering' | 'prizes' | 'marketing' | 'tech' | 'logistics' | 'general'>('general');
  const [budgetPlan, setBudgetPlan] = useState<number>(500);
  const [budgetActual, setBudgetActual] = useState<number>(0);
  const [budgetVendor, setBudgetVendor] = useState('');

  // Fallback sample data generator if DB table is unpopulated
  const generateInitialSampleData = useCallback(() => {
    const defaultSchedule: ScheduleItem[] = [
      { id: '1', event_id: currentEvent?.id || 'demo', title: 'Check-in, Badges & Morning Fuel', day_number: 1, start_time: '08:30 AM', end_time: '09:30 AM', location: 'Main Entrance & Lobby', category: 'meal', is_milestone: false, order_index: 1, created_at: new Date().toISOString() },
      { id: '2', event_id: currentEvent?.id || 'demo', title: 'Opening Ceremony & Track Briefing', day_number: 1, start_time: '09:30 AM', end_time: '10:30 AM', location: 'Auditorium Hall A', category: 'ceremony', speaker: 'Organizing Leads', is_milestone: true, order_index: 2, created_at: new Date().toISOString() },
      { id: '3', event_id: currentEvent?.id || 'demo', title: 'Smart Team Formation & Discovery', day_number: 1, start_time: '10:30 AM', end_time: '11:30 AM', location: 'Collaboration Floor', category: 'networking', is_milestone: false, order_index: 3, created_at: new Date().toISOString() },
      { id: '4', event_id: currentEvent?.id || 'demo', title: 'Official Hacking Kickoff 🚀', day_number: 1, start_time: '11:30 AM', location: 'All Hacker Pods', category: 'milestone', is_milestone: true, order_index: 4, created_at: new Date().toISOString() },
      { id: '5', event_id: currentEvent?.id || 'demo', title: 'Mentorship Rounds: Architecture Review', day_number: 1, start_time: '03:30 PM', end_time: '05:30 PM', location: 'Mentor Booths', category: 'workshop', is_milestone: false, order_index: 5, created_at: new Date().toISOString() },
      { id: '6', event_id: currentEvent?.id || 'demo', title: 'Midnight Snack & Energy Boost 🍕', day_number: 1, start_time: '11:59 PM', location: 'Cafeteria', category: 'meal', is_milestone: false, order_index: 6, created_at: new Date().toISOString() },
      { id: '7', event_id: currentEvent?.id || 'demo', title: 'Submission Deadline & Repo Freeze ⏰', day_number: 2, start_time: '11:00 AM', location: 'Portal Platform', category: 'milestone', is_milestone: true, order_index: 7, created_at: new Date().toISOString() },
      { id: '8', event_id: currentEvent?.id || 'demo', title: 'Judges Evaluation & Team Pitches', day_number: 2, start_time: '11:30 AM', end_time: '01:30 PM', location: 'Demo Stage', category: 'judging', is_milestone: true, order_index: 8, created_at: new Date().toISOString() },
      { id: '9', event_id: currentEvent?.id || 'demo', title: 'Grand Finale & Awards Ceremony 🏆', day_number: 2, start_time: '02:30 PM', end_time: '03:30 PM', location: 'Auditorium', category: 'ceremony', is_milestone: true, speaker: 'Jury & Sponsors', order_index: 9, created_at: new Date().toISOString() },
    ];

    const defaultTasks: PlannerTask[] = [
      { id: 't1', event_id: currentEvent?.id || 'demo', title: 'Verify High-Density WiFi & Power Pods', description: 'Ensure backup generator is operational and venue router bandwidth is unthrottled.', status: 'completed', priority: 'critical', category: 'logistics', assignee: 'Alex Chen', due_date: '2 Days Before', order_index: 1, created_at: new Date().toISOString() },
      { id: 't2', event_id: currentEvent?.id || 'demo', title: 'Confirm 6 Industry Judges & Load Rubrics', description: 'Check that all judging accounts are verified with rubric weights loaded.', status: 'completed', priority: 'critical', category: 'mentors', assignee: 'Sarah Miller', due_date: '3 Days Before', order_index: 2, created_at: new Date().toISOString() },
      { id: 't3', event_id: currentEvent?.id || 'demo', title: 'Receive & Assemble Participant Swag Bags', description: 'Pack t-shirts, badge lanyards, stickers, and sponsor cheat sheets.', status: 'in_progress', priority: 'high', category: 'prizes', assignee: 'Dev Team', due_date: '1 Day Before', order_index: 3, created_at: new Date().toISOString() },
      { id: 't4', event_id: currentEvent?.id || 'demo', title: 'Coordinate Day 1 & Midnight Catering Delivery', description: 'Confirm vegetarian/vegan food counts and espresso bar timing.', status: 'in_progress', priority: 'high', category: 'catering', assignee: 'Rohan Sharma', due_date: 'Day of Event', order_index: 4, created_at: new Date().toISOString() },
      { id: 't5', event_id: currentEvent?.id || 'demo', title: 'Broadcast Welcome & Arrival Checklist', description: 'Publish initial event broadcast with venue entry instructions.', status: 'todo', priority: 'medium', category: 'marketing', assignee: 'Ops Lead', due_date: '12 Hours Before', order_index: 5, created_at: new Date().toISOString() },
      { id: 't6', event_id: currentEvent?.id || 'demo', title: 'Prepare Winner Trophies & Prize Cheques', description: 'Laser engraved glass trophies for 1st, 2nd, and 3rd place teams.', status: 'todo', priority: 'high', category: 'prizes', assignee: 'Sarah Miller', due_date: 'Day 2 Morning', order_index: 6, created_at: new Date().toISOString() },
    ];

    const defaultBudget: BudgetItem[] = [
      { id: 'b1', event_id: currentEvent?.id || 'demo', item_name: 'Convention Center Arena & A/V Stage', category: 'venue', planned_cost: 1800, actual_cost: 1800, status: 'paid', vendor: 'Grand Innovation Center', created_at: new Date().toISOString() },
      { id: 'b2', event_id: currentEvent?.id || 'demo', item_name: 'Catering (3 Full Meals + Midnight Pizza)', category: 'catering', planned_cost: 1400, actual_cost: 1320, status: 'approved', vendor: 'Epicurean Events', created_at: new Date().toISOString() },
      { id: 'b3', event_id: currentEvent?.id || 'demo', item_name: 'Hackathon Prize Pool & Winner Grants', category: 'prizes', planned_cost: 1000, actual_cost: 1000, status: 'approved', vendor: 'Sponsor Grant Fund', created_at: new Date().toISOString() },
      { id: 'b4', event_id: currentEvent?.id || 'demo', item_name: 'Swag Bags, Lanyards & Printed QR Badges', category: 'logistics', planned_cost: 500, actual_cost: 460, status: 'paid', vendor: 'PrintCraft Studio', created_at: new Date().toISOString() },
      { id: 'b5', event_id: currentEvent?.id || 'demo', item_name: 'Emergency Cloud Credits & Hardware Spare', category: 'tech', planned_cost: 300, actual_cost: 0, status: 'planned', vendor: 'Cloud Credits Pool', created_at: new Date().toISOString() },
    ];

    setScheduleItems(defaultSchedule);
    setTasks(defaultTasks);
    setBudgetItems(defaultBudget);
  }, [currentEvent]);

  // Load Planner Data
  const loadPlannerData = useCallback(async () => {
    if (!currentEvent) return;
    try {
      setLoading(true);
      const data = await api.getPlannerOverview(currentEvent.id);
      if (data && data.schedule_items && data.schedule_items.length > 0) {
        setScheduleItems(data.schedule_items);
        setTasks(data.tasks || []);
        setBudgetItems(data.budget_items || []);
      } else {
        generateInitialSampleData();
      }
    } catch {
      generateInitialSampleData();
    } finally {
      setLoading(false);
    }
  }, [currentEvent, generateInitialSampleData]);

  useEffect(() => {
    loadPlannerData();
  }, [loadPlannerData]);

  // 1-Click Smart Generator Trigger
  const handleGenerateTemplate = async () => {
    if (!currentEvent) return;
    setIsGenerating(true);
    try {
      const result = await api.generatePlannerTemplate(currentEvent.id, {
        template_type: templateType,
        estimated_budget: Number(templateBudget),
      });
      if (result && result.schedule_items) {
        setScheduleItems(result.schedule_items);
        setTasks(result.tasks || []);
        setBudgetItems(result.budget_items || []);
      }
      setIsGeneratorOpen(false);
    } catch {
      generateInitialSampleData();
      setIsGeneratorOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Add Schedule Item
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !schedTitle.trim()) return;

    const newItem: Partial<ScheduleItem> = {
      title: schedTitle.trim(),
      day_number: Number(schedDay),
      start_time: schedStart,
      end_time: schedEnd || undefined,
      location: schedLoc.trim() || undefined,
      category: schedCat,
      speaker: schedSpeaker.trim() || undefined,
      is_milestone: schedMilestone,
      order_index: scheduleItems.length + 1,
    };

    try {
      const created = await api.createScheduleItem(currentEvent.id, newItem);
      setScheduleItems((prev) => [...prev, created]);
    } catch {
      const localItem: ScheduleItem = {
        id: `local-${Date.now()}`,
        event_id: currentEvent.id,
        title: schedTitle.trim(),
        day_number: Number(schedDay),
        start_time: schedStart,
        end_time: schedEnd || null,
        location: schedLoc.trim() || null,
        category: schedCat,
        speaker: schedSpeaker.trim() || null,
        is_milestone: schedMilestone,
        order_index: scheduleItems.length + 1,
        created_at: new Date().toISOString(),
      };
      setScheduleItems((prev) => [...prev, localItem]);
    }

    setIsAddScheduleOpen(false);
    setSchedTitle('');
    setSchedLoc('');
    setSchedSpeaker('');
  };

  // Delete Schedule Item
  const handleDeleteSchedule = async (itemId: string) => {
    if (!currentEvent) return;
    setScheduleItems((prev) => prev.filter((s) => s.id !== itemId));
    try {
      await api.deleteScheduleItem(currentEvent.id, itemId);
    } catch {
      // Ignored
    }
  };

  // Add Planner Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !taskTitle.trim()) return;

    const newTask: Partial<PlannerTask> = {
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      category: taskCategory,
      priority: taskPriority,
      status: 'todo',
      due_date: taskDue.trim() || undefined,
      assignee: taskAssignee.trim() || undefined,
      order_index: tasks.length + 1,
    };

    try {
      const created = await api.createPlannerTask(currentEvent.id, newTask);
      setTasks((prev) => [created, ...prev]);
    } catch {
      const localTask: PlannerTask = {
        id: `task-${Date.now()}`,
        event_id: currentEvent.id,
        title: taskTitle.trim(),
        description: taskDesc.trim() || null,
        category: taskCategory,
        priority: taskPriority,
        status: 'todo',
        due_date: taskDue.trim() || null,
        assignee: taskAssignee.trim() || null,
        order_index: tasks.length + 1,
        created_at: new Date().toISOString(),
      };
      setTasks((prev) => [localTask, ...prev]);
    }

    setIsAddTaskOpen(false);
    setTaskTitle('');
    setTaskDesc('');
    setTaskDue('');
    setTaskAssignee('');
  };

  // Toggle Task Status
  const handleToggleTaskStatus = async (task: PlannerTask) => {
    if (!currentEvent) return;
    const nextStatusMap: Record<string, 'todo' | 'in_progress' | 'completed'> = {
      todo: 'in_progress',
      in_progress: 'completed',
      completed: 'todo',
      blocked: 'todo',
    };
    const nextStatus = nextStatusMap[task.status] || 'todo';

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await api.updatePlannerTask(currentEvent.id, task.id, { status: nextStatus });
    } catch {
      // Ignored
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!currentEvent) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.deletePlannerTask(currentEvent.id, taskId);
    } catch {
      // Ignored
    }
  };

  // Add Budget Item
  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !budgetItemName.trim()) return;

    const newItem: Partial<BudgetItem> = {
      item_name: budgetItemName.trim(),
      category: budgetCat,
      planned_cost: Number(budgetPlan) || 0,
      actual_cost: Number(budgetActual) || 0,
      status: Number(budgetActual) > 0 ? 'paid' : 'approved',
      vendor: budgetVendor.trim() || undefined,
    };

    try {
      const created = await api.createBudgetItem(currentEvent.id, newItem);
      setBudgetItems((prev) => [...prev, created]);
    } catch {
      const localBudget: BudgetItem = {
        id: `budget-${Date.now()}`,
        event_id: currentEvent.id,
        item_name: budgetItemName.trim(),
        category: budgetCat,
        planned_cost: Number(budgetPlan) || 0,
        actual_cost: Number(budgetActual) || 0,
        status: Number(budgetActual) > 0 ? 'paid' : 'approved',
        vendor: budgetVendor.trim() || null,
        created_at: new Date().toISOString(),
      };
      setBudgetItems((prev) => [...prev, localBudget]);
    }

    setIsAddBudgetOpen(false);
    setBudgetItemName('');
    setBudgetVendor('');
  };

  // Delete Budget Item
  const handleDeleteBudget = async (itemId: string) => {
    if (!currentEvent) return;
    setBudgetItems((prev) => prev.filter((b) => b.id !== itemId));
    try {
      await api.deleteBudgetItem(currentEvent.id, itemId);
    } catch {
      // Ignored
    }
  };

  // Computed metrics
  const totalPlannedBudget = budgetItems.reduce((sum, b) => sum + (Number(b.planned_cost) || 0), 0);
  const totalActualBudget = budgetItems.reduce((sum, b) => sum + (Number(b.actual_cost) || 0), 0);
  const budgetUtilization = totalPlannedBudget > 0 ? Math.round((totalActualBudget / totalPlannedBudget) * 100) : 0;

  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const taskProgressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // Filter schedule by day
  const filteredSchedule = scheduleItems.filter((s) => s.day_number === selectedDay);
  const availableDays = Array.from(new Set(scheduleItems.map((s) => s.day_number))).sort((a, b) => a - b);
  if (availableDays.length === 0) availableDays.push(1);

  const getCategoryBadgeVariant = (cat: string): BadgeVariant => {
    switch (cat) {
      case 'keynote':
      case 'ceremony':
        return 'purple';
      case 'workshop':
        return 'cyan';
      case 'milestone':
        return 'critical';
      case 'meal':
        return 'warning';
      case 'judging':
        return 'success';
      default:
        return 'info';
    }
  };

  const getPriorityBadgeVariant = (pri: string): BadgeVariant => {
    switch (pri) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'warning';
      case 'medium':
        return 'cyan';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white shadow-glow-indigo">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Event Planner & Master Schedule
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-lifecycle roadmap, timeline builder, task kanban & resource planner for{' '}
                <span className="text-indigo-300 font-semibold">{currentEvent?.name}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>AI Plan Generator</span>
          </button>

          {activeTab === 'timeline' && (
            <button
              onClick={() => setIsAddScheduleOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-lighter hover:bg-surface-hover border border-surface-border text-slate-200 text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Session</span>
            </button>
          )}

          {activeTab === 'tasks' && (
            <button
              onClick={() => setIsAddTaskOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-lighter hover:bg-surface-hover border border-surface-border text-slate-200 text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Task</span>
            </button>
          )}

          {activeTab === 'budget' && (
            <button
              onClick={() => setIsAddBudgetOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-lighter hover:bg-surface-hover border border-surface-border text-slate-200 text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Scheduled Agenda"
          value={scheduleItems.length}
          subtitle={`${availableDays.length} day(s) planned`}
          icon={<CalendarDays className="w-5 h-5" />}
          accentColor="indigo"
        />

        <StatCard
          title="Milestone Tasks"
          value={`${completedTasksCount}/${tasks.length} (${taskProgressPercent}%)`}
          subtitle={`${tasks.filter((t) => t.status === 'in_progress').length} tasks active in progress`}
          icon={<ListTodo className="w-5 h-5" />}
          accentColor="emerald"
        />

        <StatCard
          title="Planned Budget"
          value={`$${totalPlannedBudget.toLocaleString()}`}
          subtitle={`$${totalActualBudget.toLocaleString()} actual spent (${budgetUtilization}%)`}
          icon={<DollarSign className="w-5 h-5" />}
          accentColor="cyan"
        />

        <StatCard
          title="Budget Variance"
          value={`$${Math.max(0, totalPlannedBudget - totalActualBudget).toLocaleString()}`}
          subtitle={totalPlannedBudget >= totalActualBudget ? 'Within budget bounds' : 'Budget overrun'}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="violet"
        />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-1">
        <button
          onClick={() => setActiveTab('timeline')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all',
            activeTab === 'timeline'
              ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-lighter/50'
          )}
        >
          <Clock className="w-4 h-4" />
          <span>Timeline & Agenda ({scheduleItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all',
            activeTab === 'tasks'
              ? 'bg-emerald-600/15 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-lighter/50'
          )}
        >
          <ListTodo className="w-4 h-4" />
          <span>Milestone Checklist ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all',
            activeTab === 'budget'
              ? 'bg-cyan-600/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-lighter/50'
          )}
        >
          <DollarSign className="w-4 h-4" />
          <span>Budget & Logistics ({budgetItems.length})</span>
        </button>
      </div>

      {/* TAB 1: TIMELINE & AGENDA */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Event Days:</span>
              <div className="flex items-center gap-1.5">
                {availableDays.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                      selectedDay === d
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-surface-lighter text-slate-400 hover:text-slate-200'
                    )}
                  >
                    Day {d}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-400">
              Showing <strong className="text-white">{filteredSchedule.length}</strong> session(s)
            </span>
          </div>

          {filteredSchedule.length === 0 ? (
            <Card className="p-12 text-center space-y-3 border-dashed">
              <CalendarDays className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No sessions scheduled for Day {selectedDay}</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your first agenda item or click "AI Plan Generator" to auto-populate the master schedule.
              </p>
              <button
                onClick={() => setIsAddScheduleOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Session</span>
              </button>
            </Card>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-surface-border/80 space-y-4">
              {filteredSchedule.map((item) => (
                <div key={item.id} className="relative group">
                  <div
                    className={clsx(
                      'absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center transition-all',
                      item.is_milestone
                        ? 'bg-rose-500 ring-4 ring-rose-500/20'
                        : 'bg-indigo-500 ring-4 ring-indigo-500/20'
                    )}
                  />

                  <Card className="p-4 sm:p-5 hover:border-indigo-500/40 transition-all space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-surface-lighter font-mono font-bold text-xs text-indigo-300 border border-surface-border">
                          {item.start_time} {item.end_time ? `– ${item.end_time}` : ''}
                        </span>

                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          {item.title}
                          {item.is_milestone && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Key Milestone
                            </span>
                          )}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={getCategoryBadgeVariant(item.category)} size="sm">
                          {item.category}
                        </Badge>
                        <button
                          onClick={() => handleDeleteSchedule(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap">
                      {item.location && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {item.location}
                        </span>
                      )}
                      {item.speaker && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          {item.speaker}
                        </span>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TASKS KANBAN */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Planning Checklist Completion
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {completedTasksCount} / {tasks.length} ({taskProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${taskProgressPercent}%` }}
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column: To Do */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  To Do ({tasks.filter((t) => t.status === 'todo').length})
                </span>
                <button
                  onClick={() => setIsAddTaskOpen(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-lighter"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 min-h-[250px]">
                {tasks
                  .filter((t) => t.status === 'todo')
                  .map((task) => (
                    <Card
                      key={task.id}
                      className="p-4 space-y-2.5 hover:border-slate-600 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className="mt-0.5 text-slate-500 hover:text-indigo-400 transition-colors shrink-0"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-white flex-1 leading-snug">
                          {task.title}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
                            {task.priority}
                          </Badge>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            {task.category}
                          </span>
                        </div>
                        {task.due_date && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {task.due_date}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className="w-full py-1 rounded bg-surface-lighter hover:bg-surface-hover text-[11px] font-semibold text-slate-300 flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Start Task</span>
                        <ArrowRight className="w-3 h-3 text-indigo-400" />
                      </button>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Column: In Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                  In Progress ({tasks.filter((t) => t.status === 'in_progress').length})
                </span>
              </div>

              <div className="space-y-3 min-h-[250px]">
                {tasks
                  .filter((t) => t.status === 'in_progress')
                  .map((task) => (
                    <Card
                      key={task.id}
                      className="p-4 space-y-2.5 border-indigo-500/30 bg-indigo-950/10 hover:border-indigo-500/50 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className="mt-0.5 text-indigo-400 hover:text-emerald-400 transition-colors shrink-0"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-white flex-1 leading-snug">
                          {task.title}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-300 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
                            {task.priority}
                          </Badge>
                          {task.assignee && (
                            <span className="text-[10px] text-indigo-300 flex items-center gap-1 font-semibold">
                              <User className="w-3 h-3" />
                              {task.assignee}
                            </span>
                          )}
                        </div>
                        {task.due_date && (
                          <span className="text-[10px] font-mono text-amber-300">
                            {task.due_date}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className="w-full py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1 transition-colors border border-emerald-500/30"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Completed</span>
                      </button>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Column: Completed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Completed ({tasks.filter((t) => t.status === 'completed').length})
                </span>
              </div>

              <div className="space-y-3 min-h-[250px]">
                {tasks
                  .filter((t) => t.status === 'completed')
                  .map((task) => (
                    <Card
                      key={task.id}
                      className="p-4 space-y-2 opacity-75 hover:opacity-100 hover:border-emerald-500/40 transition-all text-left group bg-emerald-950/5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className="mt-0.5 text-emerald-400 shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold text-slate-300 line-through flex-1 leading-snug">
                          {task.title}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                        <span>Done</span>
                        {task.completed_at ? (
                          <span>{new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : null}
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUDGET */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Expense Ledger & Allocation</h2>
                <p className="text-xs text-slate-400">Track and manage vendors, venue costs, prizes, and operational funds</p>
              </div>

              <button
                onClick={() => setIsAddBudgetOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense Item</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-surface-border">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-lighter/60 border-b border-surface-border text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3 px-4">Expense Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Vendor / Source</th>
                    <th className="py-3 px-4">Planned</th>
                    <th className="py-3 px-4">Actual</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-sans">
                  {budgetItems.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-lighter/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        {item.item_name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="info" size="sm">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {item.vendor || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        ${Number(item.planned_cost).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        ${Number(item.actual_cost).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            item.status === 'paid'
                              ? 'success'
                              : item.status === 'approved'
                              ? 'cyan'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteBudget(item.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: AI GENERATOR */}
      <Modal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        title="1-Click Event Plan & Schedule Generator"
      >
        <div className="space-y-5">
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>
              Instantly generate an end-to-end timeline, organizer checklist, and budget breakdown tailored to your event type.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Event Template Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTemplateType('hackathon_24h')}
                className={clsx(
                  'p-3 rounded-xl border text-left transition-all',
                  templateType === 'hackathon_24h'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-surface-lighter/50 border-surface-border text-slate-400 hover:text-slate-200'
                )}
              >
                <span className="font-bold text-xs block text-white">24h Hackathon</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Full overnight sprint & demo day</span>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('conference')}
                className={clsx(
                  'p-3 rounded-xl border text-left transition-all',
                  templateType === 'conference'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-surface-lighter/50 border-surface-border text-slate-400 hover:text-slate-200'
                )}
              >
                <span className="font-bold text-xs block text-white">Tech Conference</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Keynotes, panels & breakout tracks</span>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('workshop')}
                className={clsx(
                  'p-3 rounded-xl border text-left transition-all',
                  templateType === 'workshop'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-surface-lighter/50 border-surface-border text-slate-400 hover:text-slate-200'
                )}
              >
                <span className="font-bold text-xs block text-white">Masterclass Lab</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Guided code & review sessions</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Estimated Total Budget ($ USD)
            </label>
            <input
              type="number"
              value={templateBudget}
              onChange={(e) => setTemplateBudget(Number(e.target.value))}
              placeholder="5000"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsGeneratorOpen(false)}
              className="px-4 py-2 rounded-xl border border-surface-border text-slate-300 text-xs font-semibold hover:bg-surface-lighter"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerateTemplate}
              disabled={isGenerating}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/25"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Master Plan
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: ADD SCHEDULE ITEM */}
      <Modal
        isOpen={isAddScheduleOpen}
        onClose={() => setIsAddScheduleOpen(false)}
        title="Add Timeline / Agenda Session"
      >
        <form onSubmit={handleAddSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Session Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={schedTitle}
              onChange={(e) => setSchedTitle(e.target.value)}
              placeholder="e.g. AI Product Demos & Mentorship"
              className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Day Number</label>
              <input
                type="number"
                min={1}
                value={schedDay}
                onChange={(e) => setSchedDay(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Start Time</label>
              <input
                type="text"
                value={schedStart}
                onChange={(e) => setSchedStart(e.target.value)}
                placeholder="09:00 AM"
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">End Time</label>
              <input
                type="text"
                value={schedEnd}
                onChange={(e) => setSchedEnd(e.target.value)}
                placeholder="10:00 AM"
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={schedCat}
                onChange={(e) => setSchedCat(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="general">General</option>
                <option value="keynote">Keynote</option>
                <option value="workshop">Workshop</option>
                <option value="milestone">Milestone / Deadline</option>
                <option value="meal">Meal / Snack</option>
                <option value="ceremony">Ceremony</option>
                <option value="judging">Judging</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Location / Stage</label>
              <input
                type="text"
                value={schedLoc}
                onChange={(e) => setSchedLoc(e.target.value)}
                placeholder="e.g. Auditorium Hall B"
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Speaker / Host</label>
            <input
              type="text"
              value={schedSpeaker}
              onChange={(e) => setSchedSpeaker(e.target.value)}
              placeholder="e.g. Dr. Alex Vance"
              className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isMilestoneCheck"
              checked={schedMilestone}
              onChange={(e) => setSchedMilestone(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600"
            />
            <label htmlFor="isMilestoneCheck" className="text-xs font-semibold text-slate-300">
              Highlight as a Key Milestone (e.g. Kickoff, Submission Deadline, Awards)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddScheduleOpen(false)}
              className="px-4 py-2 rounded-xl border border-surface-border text-slate-300 text-xs font-semibold hover:bg-surface-lighter"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Add Session
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: ADD TASK */}
      <Modal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        title="Add Planning Milestone Task"
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Test live scoring rubric submission"
              className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Additional details and notes..."
              className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="logistics">Logistics</option>
                <option value="marketing">Marketing</option>
                <option value="sponsors">Sponsors</option>
                <option value="mentors">Mentors / Judges</option>
                <option value="prizes">Prizes & Swag</option>
                <option value="catering">Catering</option>
                <option value="platform">Platform / Tech</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assignee</label>
              <input
                type="text"
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                placeholder="e.g. Sarah Miller"
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Due Timeline</label>
              <input
                type="text"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                placeholder="e.g. 2 Days Before"
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddTaskOpen(false)}
              className="px-4 py-2 rounded-xl border border-surface-border text-slate-300 text-xs font-semibold hover:bg-surface-lighter"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Add Task
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: ADD BUDGET ITEM */}
      <Modal
        isOpen={isAddBudgetOpen}
        onClose={() => setIsAddBudgetOpen(false)}
        title="Add Expense / Budget Item"
      >
        <form onSubmit={handleAddBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Item Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={budgetItemName}
              onChange={(e) => setBudgetItemName(e.target.value)}
              placeholder="e.g. Stage Sound & Video Rig"
              className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={budgetCat}
                onChange={(e) => setBudgetCat(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="venue">Venue & Production</option>
                <option value="catering">Catering & Food</option>
                <option value="prizes">Prizes & Grants</option>
                <option value="marketing">Marketing & Signs</option>
                <option value="tech">Tech & Cloud</option>
                <option value="logistics">Logistics & Swag</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vendor / Source</label>
              <input
                type="text"
                value={budgetVendor}
                onChange={(e) => setBudgetVendor(e.target.value)}
                placeholder="e.g. Media AV Corp"
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Planned Cost ($)</label>
              <input
                type="number"
                min={0}
                value={budgetPlan}
                onChange={(e) => setBudgetPlan(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Actual Spent ($)</label>
              <input
                type="number"
                min={0}
                value={budgetActual}
                onChange={(e) => setBudgetActual(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter/50 border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddBudgetOpen(false)}
              className="px-4 py-2 rounded-xl border border-surface-border text-slate-300 text-xs font-semibold hover:bg-surface-lighter"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
            >
              Add Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
