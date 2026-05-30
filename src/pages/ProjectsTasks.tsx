import React, { useState, useMemo, useEffect } from 'react';
import { 
  FolderKanban, 
  Briefcase, 
  CheckSquare, 
  DollarSign, 
  Plus, 
  Trash2, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Tag, 
  Layers, 
  MoreVertical, 
  Check, 
  X, 
  Edit3, 
  FileText, 
  Link2, 
  Cpu, 
  ArrowUpRight, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useFinance, Project, Task, Subtask, ToolCost } from '@/context/FinanceContext';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';

type TabType = 'projects' | 'kanban' | 'finance';

export default function ProjectsTasks() {
  const {
    projects,
    tasks,
    subscriptions,
    accounts,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    addTransaction,
    formatCurrency,
    formatDate
  } = useFinance();

  const [activeTab, setActiveTab] = useState<TabType>('projects');
  
  // Local notification/toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // State for Project CRUD Modals/Forms
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStatus, setProjStatus] = useState<Project['status']>('Em Planeamento');
  const [projBudget, setProjBudget] = useState('');
  const [projDueDate, setProjDueDate] = useState('');
  const [projNotes, setProjNotes] = useState('');

  // Selected active project for filtering Tab 2 & Tab 3
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // State for Task CRUD
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium');
  const [taskStatus, setTaskStatus] = useState<Task['status']>('todo');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskRevenue, setTaskRevenue] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');

  // Sidebar task detail view state
  const [activeDetailTaskId, setActiveDetailTaskId] = useState<string | null>(null);
  const activeDetailTask = useMemo(() => tasks.find(t => t.id === activeDetailTaskId), [tasks, activeDetailTaskId]);

  // Sidebar checklist state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTagText, setNewTagText] = useState('');

  // Milestone Revenue popup/prompt
  const [milestonePrompt, setMilestonePrompt] = useState<{
    task: Task;
    revenue: number;
    isOpen: boolean;
  } | null>(null);
  const [targetAccountId, setTargetAccountId] = useState('');

  // Subscription allocation local map state (Project ID -> list of subscription IDs)
  const [allocatedSubscriptions, setAllocatedSubscriptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Load subscription allocations
    const saved = localStorage.getItem('vukapay_allocated_subscriptions');
    if (saved) {
      try {
        setAllocatedSubscriptions(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveAllocations = (newAlloc: Record<string, string[]>) => {
    setAllocatedSubscriptions(newAlloc);
    localStorage.setItem('vukapay_allocated_subscriptions', JSON.stringify(newAlloc));
  };

  // Set default selected project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Project Submit Handler
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) {
      showToast('O nome do projeto é obrigatório.', 'error');
      return;
    }

    const budgetVal = projBudget ? Number(projBudget) : undefined;

    if (editingProject) {
      await updateProject(editingProject.id, {
        name: projName.trim(),
        description: projDesc.trim(),
        status: projStatus,
        budgetLimit: budgetVal,
        dueDate: projDueDate || undefined,
        notes: projNotes.trim()
      });
      showToast('Projeto atualizado com sucesso!');
    } else {
      await addProject({
        name: projName.trim(),
        description: projDesc.trim(),
        status: projStatus,
        budgetLimit: budgetVal,
        dueDate: projDueDate || undefined,
        notes: projNotes.trim()
      });
      showToast('Projeto criado com sucesso!');
    }

    setIsProjectModalOpen(false);
    setEditingProject(null);
    clearProjectForm();
  };

  const clearProjectForm = () => {
    setProjName('');
    setProjDesc('');
    setProjStatus('Em Planeamento');
    setProjBudget('');
    setProjDueDate('');
    setProjNotes('');
  };

  const handleEditProject = (proj: Project) => {
    setEditingProject(proj);
    setProjName(proj.name);
    setProjDesc(proj.description || '');
    setProjStatus(proj.status);
    setProjBudget(proj.budgetLimit ? proj.budgetLimit.toString() : '');
    setProjDueDate(proj.dueDate || '');
    setProjNotes(proj.notes || '');
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Deseja realmente eliminar este projeto? Todas as tarefas vinculadas também serão excluídas.')) {
      await deleteProject(id);
      if (selectedProjectId === id) {
        setSelectedProjectId(projects.find(p => p.id !== id)?.id || '');
      }
      showToast('Projeto excluído com sucesso.');
    }
  };

  // Task Submit Handler
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      showToast('O título da tarefa é obrigatório.', 'error');
      return;
    }

    const revVal = taskRevenue ? Number(taskRevenue) : undefined;
    const projId = taskProjectId || selectedProjectId || undefined;

    if (editingTask) {
      const oldTask = tasks.find(t => t.id === editingTask.id);
      await updateTask(editingTask.id, {
        projectId: projId,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        status: taskStatus,
        dueDate: taskDueDate || undefined,
        estimatedRevenue: revVal
      });

      // Se passou para 'done' e tem receita, e antes não estava concluída
      if (taskStatus === 'done' && oldTask && oldTask.status !== 'done' && revVal && revVal > 0) {
        setMilestonePrompt({
          task: { ...editingTask, title: taskTitle.trim(), estimatedRevenue: revVal, projectId: projId },
          revenue: revVal,
          isOpen: true
        });
        if (accounts.length > 0) setTargetAccountId(accounts[0].id);
      }
      showToast('Tarefa atualizada!');
    } else {
      await addTask({
        projectId: projId,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        status: taskStatus,
        dueDate: taskDueDate || undefined,
        estimatedRevenue: revVal,
        subtasks: [],
        tags: [],
        toolsCost: []
      });
      
      if (taskStatus === 'done' && revVal && revVal > 0) {
        // Obter a última tarefa adicionada (geralmente a com maior timestamp/id, simplificado por matching de título)
        setTimeout(() => {
          const added = tasks.find(t => t.title === taskTitle.trim() && t.status === 'done');
          if (added) {
            setMilestonePrompt({
              task: added,
              revenue: revVal,
              isOpen: true
            });
            if (accounts.length > 0) setTargetAccountId(accounts[0].id);
          }
        }, 800);
      }
      showToast('Tarefa criada!');
    }

    setIsTaskModalOpen(false);
    setEditingTask(null);
    clearTaskForm();
  };

  const clearTaskForm = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskStatus('todo');
    setTaskDueDate('');
    setTaskRevenue('');
    setTaskProjectId('');
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskDueDate(task.dueDate || '');
    setTaskRevenue(task.estimatedRevenue ? task.estimatedRevenue.toString() : '');
    setTaskProjectId(task.projectId || '');
    setIsTaskModalOpen(true);
  };

  // Handle Drag / Quick Status Updates
  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const oldStatus = task.status;
    await updateTask(taskId, { status: newStatus });
    
    // Alerta de faturamento se movido para concluído
    if (newStatus === 'done' && oldStatus !== 'done' && task.estimatedRevenue && task.estimatedRevenue > 0) {
      setMilestonePrompt({
        task: { ...task, status: newStatus },
        revenue: task.estimatedRevenue,
        isOpen: true
      });
      if (accounts.length > 0) setTargetAccountId(accounts[0].id);
    }
    showToast(`Tarefa atualizada para ${newStatus === 'todo' ? 'A Fazer' : newStatus === 'doing' ? 'Em Progresso' : 'Concluído'}`);
  };

  // Milestone Revenue Confirm
  const handleMilestoneConfirm = async () => {
    if (!milestonePrompt || !targetAccountId) return;
    try {
      await addTransaction({
        description: `Marco Concluído: ${milestonePrompt.task.title}`,
        amount: milestonePrompt.revenue,
        currency: 'AOA',
        type: 'income',
        category: 'Salário', // ou Freelance
        account_id: targetAccountId,
        date: new Date().toISOString(),
        status: 'paid',
        payment_method: 'Transferência'
      });
      showToast(`Receita de ${formatCurrency(milestonePrompt.revenue)} registrada com sucesso!`);
    } catch (e) {
      console.error(e);
      showToast('Erro ao registrar receita.', 'error');
    } finally {
      setMilestonePrompt(null);
    }
  };

  // Subtask management
  const handleToggleSubtask = async (subtaskId: string) => {
    if (!activeDetailTask) return;
    const updatedSubtasks = activeDetailTask.subtasks.map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await updateTask(activeDetailTask.id, { subtasks: updatedSubtasks });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailTask || !newSubtaskTitle.trim()) return;
    
    const newSub: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    
    const updatedSubtasks = [...activeDetailTask.subtasks, newSub];
    await updateTask(activeDetailTask.id, { subtasks: updatedSubtasks });
    setNewSubtaskTitle('');
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!activeDetailTask) return;
    const updatedSubtasks = activeDetailTask.subtasks.filter(s => s.id !== subtaskId);
    await updateTask(activeDetailTask.id, { subtasks: updatedSubtasks });
  };

  // Tag management
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailTask || !newTagText.trim()) return;
    const tag = newTagText.trim();
    if (activeDetailTask.tags.includes(tag)) return;

    const updatedTags = [...activeDetailTask.tags, tag];
    await updateTask(activeDetailTask.id, { tags: updatedTags });
    setNewTagText('');
  };

  const handleRemoveTag = async (tag: string) => {
    if (!activeDetailTask) return;
    const updatedTags = activeDetailTask.tags.filter(t => t !== tag);
    await updateTask(activeDetailTask.id, { tags: updatedTags });
  };

  // Operational costs & software calculations
  const projectTasks = useMemo(() => {
    return tasks.filter(t => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Completed percentage
  const projectCompletionPercentage = useMemo(() => {
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.status === 'done').length;
    return Math.round((completed / projectTasks.length) * 100);
  }, [projectTasks]);

  // Tasks one-off tools costs
  const tasksToolsCostsSum = useMemo(() => {
    return projectTasks.reduce((sum, task) => {
      const taskCost = (task.toolsCost || []).reduce((tSum, tool) => tSum + tool.cost, 0);
      return sum + taskCost;
    }, 0);
  }, [projectTasks]);

  // Subscriptions alocated costs sum
  const projectSubscriptions = useMemo(() => {
    const ids = allocatedSubscriptions[selectedProjectId] || [];
    return subscriptions.filter(s => ids.includes(s.id));
  }, [subscriptions, selectedProjectId, allocatedSubscriptions]);

  const subscriptionsCostSum = useMemo(() => {
    return projectSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  }, [projectSubscriptions]);

  const totalOperationalCost = useMemo(() => {
    return tasksToolsCostsSum + subscriptionsCostSum;
  }, [tasksToolsCostsSum, subscriptionsCostSum]);

  // Allocate / Deallocate Subscription Handler
  const handleToggleSubscriptionAllocation = (subId: string) => {
    if (!selectedProjectId) return;
    const currentList = allocatedSubscriptions[selectedProjectId] || [];
    let newList: string[];
    if (currentList.includes(subId)) {
      newList = currentList.filter(id => id !== subId);
      showToast('Assinatura desvinculada do projeto.');
    } else {
      newList = [...currentList, subId];
      showToast('Assinatura alocada ao projeto!');
    }
    const updated = { ...allocatedSubscriptions, [selectedProjectId]: newList };
    saveAllocations(updated);
  };

  // Add tool cost directly to task details
  const [newToolName, setNewToolName] = useState('');
  const [newToolCost, setNewToolCost] = useState('');

  const handleAddTaskToolCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailTask || !newToolName.trim() || !newToolCost) return;
    
    const newTool: ToolCost = {
      name: newToolName.trim(),
      cost: Number(newToolCost)
    };

    const updatedTools = [...(activeDetailTask.toolsCost || []), newTool];
    await updateTask(activeDetailTask.id, { toolsCost: updatedTools });
    setNewToolName('');
    setNewToolCost('');
    showToast('Despesa de ferramenta registrada!');
  };

  const handleRemoveTaskToolCost = async (index: number) => {
    if (!activeDetailTask) return;
    const updatedTools = (activeDetailTask.toolsCost || []).filter((_, idx) => idx !== index);
    await updateTask(activeDetailTask.id, { toolsCost: updatedTools });
    showToast('Despesa de ferramenta removida.');
  };

  // Checking overdue project status
  const isProjectOverdue = (proj: Project) => {
    if (!proj.dueDate) return false;
    if (proj.status === 'Concluído') return false;
    return new Date(proj.dueDate) < new Date();
  };

  return (
    <PageTransition className="space-y-8 pb-20 relative">
      {/* Toast HUD */}
      {toast && (
        <div className={cn(
          "fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300",
          toast.type === 'success' ? "bg-emerald-500/90 border-emerald-400 text-white shadow-emerald-500/10" :
          toast.type === 'error' ? "bg-red-500/90 border-red-400 text-white shadow-red-500/10" :
          "bg-indigo-500/90 border-indigo-400 text-white shadow-indigo-500/10"
        )}>
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Milestone billing popup */}
      {milestonePrompt && milestonePrompt.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-indigo-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
              <DollarSign className="w-6 h-6 text-indigo-600 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Marco Concluído!</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Você concluiu a tarefa **"{milestonePrompt.task.title}"**. Deseja registrar a receita futura de **{formatCurrency(milestonePrompt.revenue)}** associada a este marco diretamente no VukaPay?
            </p>

            <div className="space-y-4 mb-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest">Registrar na Conta:</label>
              <select
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-gray-800 font-semibold"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleMilestoneConfirm}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2"
              >
                Sim, lançar receita <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMilestonePrompt(null)}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-semibold rounded-2xl text-xs"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal Form */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => { setIsProjectModalOpen(false); setEditingProject(null); clearProjectForm(); }}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-indigo-600" />
              {editingProject ? 'Editar Iniciativa' : 'Cadastrar Iniciativa / Projeto'}
            </h3>

            <form onSubmit={handleProjectSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Nome do Projeto/Empresa</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="Ex: Campanha Marketing Begeq"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Descrição Curta</label>
                <textarea
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Detalhes básicos sobre o propósito..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900 h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Orçamento (Teto Kz)</label>
                  <input
                    type="number"
                    value={projBudget}
                    onChange={(e) => setProjBudget(e.target.value)}
                    placeholder="Sem limite"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Prazo Final</label>
                  <input
                    type="date"
                    value={projDueDate}
                    onChange={(e) => setProjDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                <select
                  value={projStatus}
                  onChange={(e) => setProjStatus(e.target.value as any)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900 font-medium"
                >
                  <option value="Em Planeamento">Em Planeamento</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Suspenso">Suspenso</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Associação de Contrato / Contatos (Notas)</label>
                <textarea
                  value={projNotes}
                  onChange={(e) => setProjNotes(e.target.value)}
                  placeholder="Ex: Contato prestador: Carlos (+244...) | Termos acordados: Entrega em 3 fases..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900 h-28"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-bold rounded-xl text-xs"
                >
                  Salvar Projeto
                </button>
                <button
                  type="button"
                  onClick={() => { setIsProjectModalOpen(false); setEditingProject(null); clearProjectForm(); }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-medium rounded-xl text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal Form */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => { setIsTaskModalOpen(false); setEditingTask(null); clearTaskForm(); }}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h3>

            <form onSubmit={handleTaskSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Projeto Associado</label>
                <select
                  value={taskProjectId || selectedProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900 font-medium"
                >
                  <option value="">Sem Projeto (Tarefa Geral)</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Título da Tarefa</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ex: Gravar vídeo promocional"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Descrição</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="O que deve ser feito nesta atividade..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900 h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Prioridade</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900 font-medium"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Vencimento</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Receita Estimada (Kz)</label>
                  <input
                    type="number"
                    value={taskRevenue}
                    onChange={(e) => setTaskRevenue(e.target.value)}
                    placeholder="Ex: 50000"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm text-gray-900 font-medium"
                  >
                    <option value="todo">A Fazer</option>
                    <option value="doing">Em Progresso</option>
                    <option value="done">Concluído</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-bold rounded-xl text-xs"
                >
                  Salvar Tarefa
                </button>
                <button
                  type="button"
                  onClick={() => { setIsTaskModalOpen(false); setEditingTask(null); clearTaskForm(); }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-medium rounded-xl text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header and Menu Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-indigo-600" />
            Tarefas & Projetos
          </h1>
          <p className="text-gray-500 mt-1">Gerencie iniciativas executivas e execute o dia-a-dia de forma interligada.</p>
        </div>

        <div className="flex bg-white/80 backdrop-blur border border-gray-150 p-1.5 rounded-2xl shadow-sm self-start">
          {(['projects', 'kanban', 'finance'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-bold transition-all capitalize",
                activeTab === tab ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:text-gray-900"
              )}
            >
              {tab === 'projects' ? 'Iniciativas (Projetos)' : tab === 'kanban' ? 'Quadro de Tarefas' : 'Vínculo Financeiro'}
            </button>
          ))}
        </div>
      </div>

      {/* -------------------- TAB 1: PROJECTS (EXECUTIVE) -------------------- */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gray-600" />
              Grandes Iniciativas ({projects.length})
            </h3>
            <button
              onClick={() => { setEditingProject(null); clearProjectForm(); setIsProjectModalOpen(true); }}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nova Iniciativa
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">Nenhum projeto cadastrado.</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Crie seu primeiro projeto executivo para começar a delegar tarefas e controlar custos operacionais.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => {
                const isOverdue = isProjectOverdue(proj);
                const projTasks = tasks.filter(t => t.projectId === proj.id);
                const completedCount = projTasks.filter(t => t.status === 'done').length;
                const percentage = projTasks.length > 0 ? Math.round((completedCount / projTasks.length) * 100) : 0;

                return (
                  <div key={proj.id} className="bg-white rounded-3xl border border-gray-150 shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-6 flex flex-col justify-between group hover:border-indigo-100 transition-all duration-300 relative overflow-hidden">
                    {/* Alerta de Atraso visual */}
                    {isOverdue && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 text-[10px] font-bold rounded-bl-xl flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Atrasado
                      </div>
                    )}

                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider",
                            proj.status === 'Ativo' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            proj.status === 'Suspenso' ? "bg-amber-50 text-amber-700 border border-amber-100" :
                            proj.status === 'Concluído' ? "bg-blue-50 text-blue-700 border border-blue-100" :
                            "bg-gray-100 text-gray-600"
                          )}>
                            {proj.status}
                          </span>
                          <h4 className="text-base font-bold text-gray-900 mt-2 group-hover:text-indigo-600 transition-colors">
                            {proj.name}
                          </h4>
                        </div>

                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditProject(proj)}
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-5">
                        {proj.description || 'Nenhuma descrição fornecida.'}
                      </p>

                      {/* Progresso visual */}
                      <div className="space-y-1.5 mb-5">
                        <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                          <span>Progresso de Metas</span>
                          <span className="font-mono text-gray-700">{percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              percentage === 100 ? "bg-emerald-500" : "bg-indigo-600"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-gray-400" />
                          <span>{completedCount} de {projTasks.length} tarefas concluídas</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Info details */}
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Prazo Final</span>
                        <span className={cn("font-mono", isOverdue ? "text-red-600 font-bold" : "text-gray-700")}>
                          {proj.dueDate ? formatDate(proj.dueDate) : 'Sem prazo'}
                        </span>
                      </div>

                      {proj.budgetLimit && (
                        <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                          <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-gray-400" /> Orçamento Limite</span>
                          <span className="font-mono text-gray-800">{formatCurrency(proj.budgetLimit)}</span>
                        </div>
                      )}

                      {proj.notes && (
                        <div className="mt-2 p-3 bg-gray-50/50 rounded-xl border border-gray-100/50 text-[10px] text-gray-500 leading-normal flex items-start gap-2">
                          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <div className="whitespace-pre-line truncate">{proj.notes}</div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setActiveTab('kanban');
                        }}
                        className="w-full mt-2 py-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-[11px] font-bold text-gray-600 transition-colors flex items-center justify-center gap-1"
                      >
                        Abrir Quadro Kanban <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB 2: KANBAN BOARD -------------------- */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Board Area (Cols 1-8 or 1-12 depending on if detail sidebar is open) */}
          <div className={cn(
            "lg:col-span-12 space-y-6 transition-all duration-300",
            activeDetailTaskId && "lg:col-span-8"
          )}>
            {/* Filter and task creation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 p-4 rounded-3xl border border-gray-150">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Iniciativa:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none"
                >
                  <option value="">Todas as Tarefas Gerais</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingTask(null);
                  clearTaskForm();
                  setTaskProjectId(selectedProjectId);
                  setIsTaskModalOpen(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Nova Tarefa
              </button>
            </div>

            {/* Kanban Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column Helper */}
              {(['todo', 'doing', 'done'] as Task['status'][]).map((colStatus) => {
                const colTasks = projectTasks.filter(t => t.status === colStatus);
                const colTitle = colStatus === 'todo' ? 'A Fazer' : colStatus === 'doing' ? 'Em Progresso' : 'Concluído';
                const colColor = colStatus === 'todo' ? 'bg-indigo-600' : colStatus === 'doing' ? 'bg-amber-500' : 'bg-emerald-500';

                return (
                  <div key={colStatus} className="bg-gray-100/70 border border-gray-150 rounded-3xl p-5 min-h-[500px] flex flex-col">
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", colColor)} />
                        <h4 className="text-sm font-bold text-gray-800">{colTitle}</h4>
                      </div>
                      <span className="font-mono text-xs font-bold bg-white text-gray-500 px-2 py-0.5 rounded-lg border border-gray-200">
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Column Tasks Cards */}
                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] scrollbar-thin">
                      {colTasks.length === 0 ? (
                        <div className="h-28 border border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-center p-4">
                          <p className="text-xs text-gray-400">Nenhuma tarefa nesta coluna</p>
                        </div>
                      ) : (
                        colTasks.map((task) => {
                          const doneSub = task.subtasks.filter(s => s.completed).length;
                          const totalSub = task.subtasks.length;

                          return (
                            <div
                              key={task.id}
                              onClick={() => setActiveDetailTaskId(task.id)}
                              className={cn(
                                "bg-white p-5 rounded-2xl border border-gray-150 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer relative group",
                                activeDetailTaskId === task.id && "border-indigo-600 ring-2 ring-indigo-100"
                              )}
                            >
                              {/* Top priority banner */}
                              <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-md text-[8px] font-bold uppercase",
                                  task.priority === 'critical' ? "bg-red-50 text-red-700 border border-red-100" :
                                  task.priority === 'high' ? "bg-orange-50 text-orange-700 border border-orange-100" :
                                  task.priority === 'medium' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                  "bg-gray-100 text-gray-600"
                                )}>
                                  {task.priority === 'critical' ? 'Crítica' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>

                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                                    className="p-1 text-gray-400 hover:text-indigo-600"
                                    title="Editar"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); if (confirm('Excluir esta tarefa?')) deleteTask(task.id); }}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h5 className="text-sm font-bold text-gray-900 line-clamp-1">{task.title}</h5>
                              
                              {task.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              {/* Checklist & Tags Indicators */}
                              {(totalSub > 0 || task.tags.length > 0 || task.estimatedRevenue) && (
                                <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
                                  {totalSub > 0 && (
                                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-150">
                                      <CheckSquare className="w-3 h-3 text-indigo-500" />
                                      {doneSub}/{totalSub} Subtarefas
                                    </span>
                                  )}

                                  {task.tags.map(t => (
                                    <span key={t} className="flex items-center gap-0.5 bg-gray-50 text-indigo-600 px-1.5 py-0.5 rounded-md border border-indigo-50">
                                      <Tag className="w-2.5 h-2.5" /> {t}
                                    </span>
                                  ))}

                                  {task.estimatedRevenue && task.estimatedRevenue > 0 && (
                                    <span className="flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-100 ml-auto font-bold font-mono">
                                      +{formatCurrency(task.estimatedRevenue)}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Date Info */}
                              <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}</span>
                                
                                {/* Status selection buttons (drag simulation click) */}
                                <div className="flex gap-1">
                                  {colStatus !== 'todo' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleUpdateTaskStatus(task.id, colStatus === 'done' ? 'doing' : 'todo'); }}
                                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600"
                                      title="Mover para esquerda"
                                    >
                                      &larr;
                                    </button>
                                  )}
                                  {colStatus !== 'done' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleUpdateTaskStatus(task.id, colStatus === 'todo' ? 'doing' : 'done'); }}
                                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600"
                                      title="Mover para direita"
                                    >
                                      &rarr;
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Detail Sidebar Overlay Panel (Cols 4) */}
          {activeDetailTask && (
            <div className="lg:col-span-4 bg-white border border-gray-150 rounded-3xl p-6 shadow-xl animate-in slide-in-from-right-4 duration-300 relative sticky top-20">
              <button
                onClick={() => setActiveDetailTaskId(null)}
                className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Fechar Detalhes"
              >
                <X className="w-4 h-4" />
              </button>

              <span className={cn(
                "px-2 py-0.5 rounded-md text-[8px] font-bold uppercase",
                activeDetailTask.priority === 'critical' ? "bg-red-50 text-red-700 border border-red-100" :
                activeDetailTask.priority === 'high' ? "bg-orange-50 text-orange-700 border border-orange-100" :
                activeDetailTask.priority === 'medium' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                "bg-gray-100 text-gray-600"
              )}>
                Prioridade: {activeDetailTask.priority === 'critical' ? 'Crítica' : activeDetailTask.priority === 'high' ? 'Alta' : activeDetailTask.priority === 'medium' ? 'Média' : 'Baixa'}
              </span>

              <h4 className="text-base font-bold text-gray-900 mt-3">{activeDetailTask.title}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed border-b border-gray-100 pb-4">
                {activeDetailTask.description || 'Sem descrição.'}
              </p>

              {/* Subtasks (Checklist) */}
              <div className="mt-4">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between mb-3">
                  <span>Subtarefas Checklist</span>
                  <span className="font-mono text-gray-400">
                    {activeDetailTask.subtasks.filter(s => s.completed).length}/{activeDetailTask.subtasks.length}
                  </span>
                </h5>

                <div className="space-y-2 mb-3">
                  {activeDetailTask.subtasks.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100/50 hover:border-gray-200 transition-colors">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          onChange={() => handleToggleSubtask(sub.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className={cn("text-xs font-medium text-gray-700", sub.completed && "line-through text-gray-400")}>
                          {sub.title}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar passo..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-gray-900 text-white font-bold rounded-xl text-xs"
                  >
                    Adicionar
                  </button>
                </form>
              </div>

              {/* Tags Section */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Etiquetas (Tags)</h5>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {activeDetailTask.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100 text-xs font-medium">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-600 font-bold">&times;</button>
                    </span>
                  ))}
                  {activeDetailTask.tags.length === 0 && <span className="text-[10px] text-gray-400">Nenhuma tag vinculada.</span>}
                </div>

                <form onSubmit={handleAddTag} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova tag..."
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors">
                    Inserir
                  </button>
                </form>
              </div>

              {/* Task Tool / Softwares direct costs */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Despesa da Atividade</span>
                  <span className="font-mono text-gray-600 font-bold">
                    {formatCurrency((activeDetailTask.toolsCost || []).reduce((s, c) => s + c.cost, 0))}
                  </span>
                </h5>

                <div className="space-y-2 mb-3">
                  {(activeDetailTask.toolsCost || []).map((tool, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100/50 text-xs">
                      <span className="font-medium text-gray-700">{tool.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-red-600">-{formatCurrency(tool.cost)}</span>
                        <button
                          onClick={() => handleRemoveTaskToolCost(idx)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddTaskToolCost} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ferramenta/Serviço..."
                      value={newToolName}
                      onChange={(e) => setNewToolName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="Valor Kz..."
                      value={newToolCost}
                      onChange={(e) => setNewToolCost(e.target.value)}
                      className="w-24 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-gray-900 text-white font-bold rounded-xl text-xs hover:bg-gray-800 transition-colors"
                  >
                    Adicionar Custo de Ferramenta
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB 3: FINANCIAL INTEGRATION -------------------- */}
      {activeTab === 'finance' && (
        <div className="space-y-8">
          {/* Top selection project summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 p-4 rounded-3xl border border-gray-150">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Iniciativa para Análise:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {activeProject && (
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Prazo final: {activeProject.dueDate ? formatDate(activeProject.dueDate) : 'Sem data definida'}
              </span>
            )}
          </div>

          {activeProject ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Financial Dashboard (Grid 1-7) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm space-y-6">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                    Orçamento do Projeto vs Custo Operacional Real
                  </h4>

                  {/* Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Teto Orçado Limite</span>
                      <h5 className="text-xl font-bold font-mono text-gray-800 mt-2">
                        {activeProject.budgetLimit ? formatCurrency(activeProject.budgetLimit) : 'Sem Limite Definido'}
                      </h5>
                    </div>

                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custo Operacional Total</span>
                      <h5 className="text-xl font-bold font-mono text-red-600 mt-2">
                        -{formatCurrency(totalOperationalCost)}
                      </h5>
                    </div>
                  </div>

                  {/* Budget Limit Progress Alert */}
                  {activeProject.budgetLimit && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-gray-500">
                        <span>Consumo de Limite de Custo</span>
                        <span className={cn(
                          "font-mono", 
                          (totalOperationalCost / activeProject.budgetLimit) >= 1 ? "text-red-600 font-black" : 
                          (totalOperationalCost / activeProject.budgetLimit) >= 0.8 ? "text-amber-600" : "text-gray-700"
                        )}>
                          {Math.round((totalOperationalCost / activeProject.budgetLimit) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            (totalOperationalCost / activeProject.budgetLimit) >= 1 ? "bg-red-500" :
                            (totalOperationalCost / activeProject.budgetLimit) >= 0.8 ? "bg-amber-500" : "bg-indigo-600"
                          )}
                          style={{ width: `${Math.min(100, (totalOperationalCost / activeProject.budgetLimit) * 100)}%` }}
                        />
                      </div>

                      {/* Warnings and alerts */}
                      {(totalOperationalCost / activeProject.budgetLimit) >= 1 ? (
                        <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100 flex items-center gap-2 mt-2">
                          <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
                          <span>ATENÇÃO: Custo operacional ultrapassou o teto financeiro definido!</span>
                        </div>
                      ) : (totalOperationalCost / activeProject.budgetLimit) >= 0.8 ? (
                        <div className="p-4 bg-amber-50 text-amber-700 text-xs font-semibold rounded-2xl border border-amber-100 flex items-center gap-2 mt-2">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <span>AVISO: Custo operacional atingiu 80% do limite!</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Summary lists of cost categories */}
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Detalhamento Financeiro</h5>
                    
                    <div className="flex justify-between items-center text-xs font-medium pb-2 border-b border-gray-50">
                      <span className="text-gray-600">Assinaturas e Serviços Alocados</span>
                      <span className="font-bold text-gray-800 font-mono">-{formatCurrency(subscriptionsCostSum)}/mês</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-medium pb-2 border-b border-gray-50">
                      <span className="text-gray-600">Ferramentas de Atividades Únicas</span>
                      <span className="font-bold text-gray-800 font-mono">-{formatCurrency(tasksToolsCostsSum)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold pt-2">
                      <span className="text-gray-800">Custo Total de Manutenção</span>
                      <span className="font-mono text-red-600">-{formatCurrency(totalOperationalCost)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscriptions allocation panel (Grid 8-12) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Cpu className="w-5 h-5 text-indigo-600" />
                    Associações de Softwares / Assinaturas
                  </h4>

                  <p className="text-xs text-gray-500 leading-relaxed mb-6">
                    Selecione quais assinaturas cadastradas no sistema VukaPay (ex: licenças de design, servidores de hospedagem ou ferramentas de IA) estão ativamente alocadas a este projeto para cálculo do custo operacional.
                  </p>

                  <div className="space-y-3">
                    {subscriptions.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">Nenhuma assinatura cadastrada no VukaPay.</p>
                    ) : (
                      subscriptions.map((sub) => {
                        const isAllocated = (allocatedSubscriptions[selectedProjectId] || []).includes(sub.id);

                        return (
                          <div 
                            key={sub.id} 
                            onClick={() => handleToggleSubscriptionAllocation(sub.id)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none",
                              isAllocated 
                                ? "bg-indigo-50/50 border-indigo-200 hover:border-indigo-300" 
                                : "bg-gray-50 border-gray-150 hover:bg-gray-100/50"
                            )}
                          >
                            <div>
                              <p className="text-xs font-bold text-gray-800">{sub.name}</p>
                              <p className="text-[10px] text-gray-450 mt-0.5">Ciclo: {sub.cycle === 'monthly' ? 'Mensal' : 'Anual'}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-gray-700">-{formatCurrency(sub.amount)}</span>
                              <div className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center border transition-colors",
                                isAllocated ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 bg-white"
                              )}>
                                {isAllocated && <Check className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-650 font-bold">Nenhum projeto cadastrado.</p>
              <p className="text-xs text-gray-400 mt-1">É necessário selecionar ou cadastrar um projeto para gerenciar os custos operacionais.</p>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}
