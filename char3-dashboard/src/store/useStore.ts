import { create } from 'zustand';

export interface Deliverable {
  id: string;
  name: string;
  due: string;
  client: string;
  project: string;
  labels: Array<{ name: string; color: string }>;
}

export interface AdminTask {
  id: string;
  name: string;
  due: string;
  client: string;
  project: string;
  assignee: string;
  labels: Array<{ name: string; color: string }>;
}

export interface Client {
  name: string;
  deliverables: Deliverable[];
  adminTasks: AdminTask[];
}

interface DashboardStore {
  clients: Client[];
  customFields: {
    projects: string[];
    clients: string[];
  };
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setClients: (clients: Client[]) => void;
  setCustomFields: (fields: { projects: string[]; clients: string[] }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // CRUD operations
  addDeliverable: (client: string, deliverable: Omit<Deliverable, 'id'>) => void;
  addAdminTask: (client: string, task: Omit<AdminTask, 'id'>) => void;
  updateDeliverable: (id: string, updates: Partial<Deliverable>) => void;
  updateAdminTask: (id: string, updates: Partial<AdminTask>) => void;
  deleteDeliverable: (id: string) => void;
  deleteAdminTask: (id: string) => void;
}

export const useStore = create<DashboardStore>((set, get) => ({
  clients: [],
  customFields: { projects: [], clients: [] },
  isLoading: false,
  error: null,

  setClients: (clients) => set({ clients }),
  setCustomFields: (customFields) => set({ customFields }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addDeliverable: (clientName, deliverable) => {
    const { clients } = get();
    const updatedClients = clients.map(client => {
      if (client.name === clientName) {
        return {
          ...client,
          deliverables: [...client.deliverables, { ...deliverable, id: Date.now().toString() }]
        };
      }
      return client;
    });
    set({ clients: updatedClients });
  },

  addAdminTask: (clientName, task) => {
    const { clients } = get();
    const updatedClients = clients.map(client => {
      if (client.name === clientName) {
        return {
          ...client,
          adminTasks: [...client.adminTasks, { ...task, id: Date.now().toString() }]
        };
      }
      return client;
    });
    set({ clients: updatedClients });
  },

  updateDeliverable: (id, updates) => {
    const { clients } = get();
    const updatedClients = clients.map(client => ({
      ...client,
      deliverables: client.deliverables.map(deliverable =>
        deliverable.id === id ? { ...deliverable, ...updates } : deliverable
      )
    }));
    set({ clients: updatedClients });
  },

  updateAdminTask: (id, updates) => {
    const { clients } = get();
    const updatedClients = clients.map(client => ({
      ...client,
      adminTasks: client.adminTasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    }));
    set({ clients: updatedClients });
  },

  deleteDeliverable: (id) => {
    const { clients } = get();
    const updatedClients = clients.map(client => ({
      ...client,
      deliverables: client.deliverables.filter(deliverable => deliverable.id !== id)
    }));
    set({ clients: updatedClients });
  },

  deleteAdminTask: (id) => {
    const { clients } = get();
    const updatedClients = clients.map(client => ({
      ...client,
      adminTasks: client.adminTasks.filter(task => task.id !== id)
    }));
    set({ clients: updatedClients });
  },
}));
