/**
 * Zustand Store لإدارة جهات الاتصال والمجموعات
 * مربوط بـ Backend API
 */

import { create } from "zustand";
import {
  Contact,
  ContactFormData,
  Group,
  GroupFormData,
  ContactsFilter,
  GroupsFilter,
} from "@/types/contact";
import { contactsService, groupsService } from "@/lib/api/services/contactsService";
import { ApiError } from "@/lib/api/client";

interface ContactsStoreState {
  // State
  contacts: Contact[];
  groups: Group[];
  currentContact: Contact | null;
  currentGroup: Group | null;
  isLoading: boolean;
  error: string | null;
  filters: ContactsFilter;
  groupsFilters: GroupsFilter;

  // Contacts CRUD
  fetchContacts: () => Promise<void>;
  fetchContactById: (id: string) => Promise<void>;
  createContact: (data: ContactFormData) => Promise<Contact>;
  updateContact: (id: string, data: Partial<ContactFormData>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  // Groups CRUD
  fetchGroups: () => Promise<void>;
  fetchGroupById: (id: string) => Promise<void>;
  createGroup: (data: GroupFormData) => Promise<Group>;
  updateGroup: (id: string, data: Partial<GroupFormData>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;

  // Group membership
  addContactsToGroup: (groupId: string, contactIds: string[]) => Promise<void>;
  removeContactsFromGroup: (groupId: string, contactIds: string[]) => Promise<void>;

  // Utility functions
  setFilters: (filters: ContactsFilter) => void;
  setGroupsFilters: (filters: GroupsFilter) => void;
  getFilteredContacts: () => Contact[];
  getFilteredGroups: () => Group[];
  getContactsByGroup: (groupId: string) => Contact[];
  getGroupsByContact: (contactId: string) => Group[];
  searchContacts: (query: string) => Contact[];
  searchGroups: (query: string) => Group[];
}

// متغيرات خارجية لمنع الاستدعاءات المتكررة (deduplication)
let pendingFetchContacts: Promise<void> | null = null;
let pendingFetchGroups: Promise<void> | null = null;

export const useContactsStore = create<ContactsStoreState>((set, get) => ({
  // Initial state
  contacts: [],
  groups: [],
  currentContact: null,
  currentGroup: null,
  isLoading: false,
  error: null,
  filters: {},
  groupsFilters: {},

  // جلب جميع جهات الاتصال - متصل بـ Backend API
  // محسّن: يستخدم الـ cache لو البيانات موجودة + يمنع الاستدعاءات المتكررة
  fetchContacts: async () => {
    // ✅ لو فيه طلب شغال، ننتظره بدل ما نرسل طلب جديد
    if (pendingFetchContacts) {
      await pendingFetchContacts;
      return;
    }

    set({ isLoading: true, error: null });

    pendingFetchContacts = (async () => {
      try {
        const contacts = await contactsService.getAll();
        set({
          contacts,
          isLoading: false,
        });
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "فشل تحميل جهات الاتصال";
        set({
          error: errorMessage,
          isLoading: false,
        });
      } finally {
        pendingFetchContacts = null;
      }
    })();

    await pendingFetchContacts;
  },

  // جلب جهة اتصال بواسطة ID - متصل بـ Backend API
  fetchContactById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const contact = await contactsService.getById(id);
      set({
        currentContact: contact,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "فشل تحميل جهة الاتصال";
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  // إنشاء جهة اتصال - متصل بـ Backend API
  createContact: async (data: ContactFormData) => {
    set({ isLoading: true, error: null });
    try {
      const newContact = await contactsService.create(data);

      set((state) => ({
        contacts: [newContact, ...state.contacts],
        isLoading: false,
      }));

      // تحديث المجموعات إذا تم إضافة جهة الاتصال لمجموعات
      if (data.groupIds && data.groupIds.length > 0) {
        await get().fetchGroups();
      }

      return newContact;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "فشل إنشاء جهة الاتصال";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // تحديث جهة اتصال - متصل بـ Backend API
  updateContact: async (id: string, data: Partial<ContactFormData>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedContact = await contactsService.update(id, data);

      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === id ? updatedContact : c)),
        currentContact:
          state.currentContact?.id === id ? updatedContact : state.currentContact,
        isLoading: false,
      }));

      // تحديث المجموعات
      await get().fetchGroups();
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "فشل تحديث جهة الاتصال";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // حذف جهة اتصال - متصل بـ Backend API
  deleteContact: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await contactsService.delete(id);

      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
        currentContact: state.currentContact?.id === id ? null : state.currentContact,
        isLoading: false,
      }));

      // تحديث المجموعات
      await get().fetchGroups();
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "فشل حذف جهة الاتصال";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // جلب جميع المجموعات - متصل بـ Backend API
  // محسّن: يستخدم الـ cache لو البيانات موجودة + يمنع الاستدعاءات المتكررة
  fetchGroups: async () => {
    // ✅ لو فيه طلب شغال، ننتظره بدل ما نرسل طلب جديد
    if (pendingFetchGroups) {
      await pendingFetchGroups;
      return;
    }

    set({ isLoading: true, error: null });

    pendingFetchGroups = (async () => {
      try {
        const groups = await groupsService.getAll();
        set({
          groups,
          isLoading: false,
        });
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "فشل تحميل المجموعات";
        set({
          error: errorMessage,
          isLoading: false,
        });
      } finally {
        pendingFetchGroups = null;
      }
    })();

    await pendingFetchGroups;
  },

  // جلب مجموعة بواسطة ID - متصل بـ Backend API
  fetchGroupById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const group = await groupsService.getById(id);
      set({
        currentGroup: group,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "فشل تحميل المجموعة";
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  // إنشاء مجموعة - متصل بـ Backend API
  createGroup: async (data: GroupFormData) => {
    set({ isLoading: true, error: null });
    try {
      const newGroup = await groupsService.create(data);

      set((state) => ({
        groups: [newGroup, ...state.groups],
        isLoading: false,
      }));

      // تحديث جهات الاتصال إذا تم إضافة جهات اتصال للمجموعة
      if (data.contactIds && data.contactIds.length > 0) {
        await get().fetchContacts();
      }

      return newGroup;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "فشل إنشاء المجموعة";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // تحديث مجموعة - متصل بـ Backend API
  updateGroup: async (id: string, data: Partial<GroupFormData>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedGroup = await groupsService.update(id, data);

      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? updatedGroup : g)),
        currentGroup:
          state.currentGroup?.id === id ? updatedGroup : state.currentGroup,
        isLoading: false,
      }));

      // تحديث جهات الاتصال
      await get().fetchContacts();
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "فشل تحديث المجموعة";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // حذف مجموعة - متصل بـ Backend API
  deleteGroup: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await groupsService.delete(id);

      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
        currentGroup: state.currentGroup?.id === id ? null : state.currentGroup,
        isLoading: false,
      }));

      // تحديث جهات الاتصال
      await get().fetchContacts();
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "فشل حذف المجموعة";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // إضافة جهات اتصال إلى مجموعة - متصل بـ Backend API
  addContactsToGroup: async (groupId: string, contactIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await groupsService.addContacts(groupId, contactIds);

      // تحديث البيانات
      await get().fetchGroups();
      await get().fetchContacts();

      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "فشل إضافة جهات الاتصال";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // إزالة جهات اتصال من مجموعة - متصل بـ Backend API
  removeContactsFromGroup: async (groupId: string, contactIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await groupsService.removeContacts(groupId, contactIds);

      // تحديث البيانات
      await get().fetchGroups();
      await get().fetchContacts();

      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "فشل إزالة جهات الاتصال";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // Set filters
  setFilters: (filters: ContactsFilter) => {
    set({ filters });
  },

  // Set groups filters
  setGroupsFilters: (filters: GroupsFilter) => {
    set({ groupsFilters: filters });
  },

  // Get filtered contacts
  getFilteredContacts: () => {
    const { contacts, filters } = get();
    let filtered = [...contacts];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.phone?.toLowerCase().includes(search)
      );
    }

    if (filters.groupId) {
      filtered = filtered.filter((c) => c.groupIds.includes(filters.groupId!));
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((c) =>
        filters.tags!.some((tag) => c.tags.includes(tag))
      );
    }

    return filtered;
  },

  // Get filtered groups
  getFilteredGroups: () => {
    const { groups, groupsFilters } = get();
    let filtered = [...groups];

    if (groupsFilters.search) {
      const search = groupsFilters.search.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(search) ||
          g.description?.toLowerCase().includes(search)
      );
    }

    return filtered;
  },

  // Get contacts by group
  getContactsByGroup: (groupId: string) => {
    const { contacts } = get();
    return contacts.filter((c) => c.groupIds.includes(groupId));
  },

  // Get groups by contact
  getGroupsByContact: (contactId: string) => {
    const { groups } = get();
    return groups.filter((g) => g.contactIds.includes(contactId));
  },

  // Search contacts
  searchContacts: (query: string) => {
    const { contacts } = get();
    const search = query.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone?.toLowerCase().includes(search)
    );
  },

  // Search groups
  searchGroups: (query: string) => {
    const { groups } = get();
    const search = query.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(search) ||
        g.description?.toLowerCase().includes(search)
    );
  },
}));

