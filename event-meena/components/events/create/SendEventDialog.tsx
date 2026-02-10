"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContactsStore } from "@/store/contactsStore";
import { Contact, Group } from "@/types/contact";
import { Search, Users, Mail, Phone, Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { eventsService } from "@/lib/api/services/eventsService";

interface SendEventDialogProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventUrl: string;
  mode?: "contacts" | "groups"; // جعلها اختيارية للتوافق مع الاستخدام القديم
}

export default function SendEventDialog({
  open,
  onClose,
  eventId,
  eventTitle,
  eventUrl,
  mode: initialMode,
}: SendEventDialogProps) {
  const { toast } = useToast();
  const { contacts, groups, fetchContacts, fetchGroups } = useContactsStore();

  // Tab الداخلي للتبديل بين جهات الاتصال والمجموعات
  const [activeTab, setActiveTab] = useState<"contacts" | "groups">(initialMode || "contacts");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Fetch data on mount - جلب كلاهما
  useEffect(() => {
    if (open) {
      fetchContacts();
      fetchGroups();
    }
  }, [open, fetchContacts, fetchGroups]);

  // Reset search when tab changes
  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  // Filter contacts/groups based on search
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle selection
  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Select all
  const handleSelectAll = () => {
    if (activeTab === "contacts") {
      if (selectedContactIds.length === filteredContacts.length) {
        setSelectedContactIds([]);
      } else {
        setSelectedContactIds(filteredContacts.map((c) => c.id));
      }
    } else {
      if (selectedGroupIds.length === filteredGroups.length) {
        setSelectedGroupIds([]);
      } else {
        setSelectedGroupIds(filteredGroups.map((g) => g.id));
      }
    }
  };

  // Calculate total recipients - مجموع الاثنين
  const getTotalRecipients = () => {
    const contactsCount = selectedContactIds.length;
    const groupsCount = selectedGroupIds.reduce((total, groupId) => {
      const group = groups.find((g) => g.id === groupId);
      return total + (group?.contactIds.length || 0);
    }, 0);
    return contactsCount + groupsCount;
  };

  // Handle send - إرسال لكليهما
  const handleSend = async () => {
    if (selectedContactIds.length === 0 && selectedGroupIds.length === 0) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار جهة اتصال أو مجموعة واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // استدعاء API الحقيقي - إرسال لجهات الاتصال والمجموعات معاً
      const response = await eventsService.send(eventId, {
        contactIds: selectedContactIds.length > 0 ? selectedContactIds : undefined,
        groupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
        sendMethod: "email",
      });

      // عرض رسالة النجاح مع تفاصيل الإرسال
      const successCount = response.successCount ?? response.successfulSends ?? 0;
      const failureCount = response.failureCount ?? response.failedSends ?? 0;

      if (successCount > 0) {
        toast({
          title: "تم الإرسال بنجاح! 🎉",
          description: `تم إرسال الحدث إلى ${successCount} جهة اتصال${failureCount > 0 ? ` (فشل ${failureCount})` : ""}`,
        });
      } else {
        toast({
          title: "تحذير",
          description: "لم يتم إرسال أي دعوات. تحقق من وجود بريد إلكتروني لجهات الاتصال.",
          variant: "destructive",
        });
      }

      // Reset and close
      setSelectedContactIds([]);
      setSelectedGroupIds([]);
      setSearchQuery("");
      onClose();
    } catch (error) {
      console.error("Error sending event:", error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل إرسال الحدث، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] !flex !flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl">مشاركة الحدث</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            اختر جهات الاتصال أو المجموعات التي تريد إرسال الحدث إليها
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {/* Tabs للتبديل بين جهات الاتصال والمجموعات */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveTab("contacts")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "contacts"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              جهات الاتصال
              {selectedContactIds.length > 0 && (
                <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedContactIds.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "groups"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="w-4 h-4" />
              المجموعات
              {selectedGroupIds.length > 0 && (
                <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedGroupIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={`ابحث عن ${activeTab === "contacts" ? "جهة اتصال" : "مجموعة"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleSelectAll}>
              <Checkbox
                checked={
                  activeTab === "contacts"
                    ? selectedContactIds.length === filteredContacts.length &&
                      filteredContacts.length > 0
                    : selectedGroupIds.length === filteredGroups.length &&
                      filteredGroups.length > 0
                }
                onCheckedChange={handleSelectAll}
                onClick={(e) => e.stopPropagation()}
              />
              <Label className="cursor-pointer">
                تحديد الكل
              </Label>
            </div>
            <span className="text-sm text-gray-600">
              {activeTab === "contacts"
                ? `${selectedContactIds.length} من ${filteredContacts.length}`
                : `${selectedGroupIds.length} من ${filteredGroups.length}`}
            </span>
          </div>

          {/* List */}
          <ScrollArea className="h-[250px] border rounded-lg">
            <div className="p-4 space-y-2">
              {activeTab === "contacts" ? (
                filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <ContactItem
                      key={contact.id}
                      contact={contact}
                      selected={selectedContactIds.includes(contact.id)}
                      onToggle={() => toggleContactSelection(contact.id)}
                    />
                  ))
                ) : (
                  <EmptyState message="لا توجد جهات اتصال" />
                )
              ) : (
                filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <GroupItem
                      key={group.id}
                      group={group}
                      selected={selectedGroupIds.includes(group.id)}
                      onToggle={() => toggleGroupSelection(group.id)}
                    />
                  ))
                ) : (
                  <EmptyState message="لا توجد مجموعات" />
                )
              )}
            </div>
          </ScrollArea>

          {/* Summary - ملخص الاختيارات */}
          {getTotalRecipients() > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">
                    سيتم إرسال الحدث إلى {getTotalRecipients()} مستلم
                  </p>
                  <p className="text-sm text-blue-700">
                    {selectedContactIds.length > 0 && `${selectedContactIds.length} جهة اتصال`}
                    {selectedContactIds.length > 0 && selectedGroupIds.length > 0 && " • "}
                    {selectedGroupIds.length > 0 && `${selectedGroupIds.length} مجموعة`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            إلغاء
          </Button>
          {getTotalRecipients() > 0 && (
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 ml-2" />
                  إرسال الحدث
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Contact Item Component
function ContactItem({
  contact,
  selected,
  onToggle,
}: {
  contact: Contact;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${
        selected ? "border-primary bg-blue-50" : "border-gray-200"
      }`}
      onClick={onToggle}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{contact.name}</p>
        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {contact.email}
          </span>
          {contact.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {contact.phone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Group Item Component
function GroupItem({
  group,
  selected,
  onToggle,
}: {
  group: Group;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${
        selected ? "border-primary bg-blue-50" : "border-gray-200"
      }`}
      onClick={onToggle}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: group.color }}
      >
        {group.name.charAt(0)}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{group.name}</p>
        <p className="text-sm text-gray-600">
          {group.contactIds.length} عضو
          {group.description && ` • ${group.description}`}
        </p>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

