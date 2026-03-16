"use client";

import { Contact, Group } from "@/types/contact";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Edit,
  Trash2,
  Briefcase,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContactCardProps {
  contact: Contact;
  groups: Group[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export default function ContactCard({
  contact,
  groups,
  onEdit,
  onDelete,
}: ContactCardProps) {
  // الحصول على المجموعات التي ينتمي إليها
  const contactGroups = groups.filter((g) =>
    contact.groupIds.includes(g.id)
  );

  // الحرف الأول من الاسم للأفاتار
  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 mb-1 truncate">
              {contact.name}
            </h3>
            {contact.jobTitle && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <Briefcase className="w-3 h-3" />
                <span className="truncate">{contact.jobTitle}</span>
              </div>
            )}
            {contact.company && (
              <p className="text-xs text-gray-500 truncate">
                {contact.company}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(contact)}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(contact.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="p-3 bg-gray-50 rounded-xl space-y-2.5 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm text-gray-700 truncate">{contact.email}</span>
        </div>
        {contact.phone && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-700 truncate" dir="ltr">{contact.phone}</span>
          </div>
        )}
      </div>

      {/* Groups */}
      {contactGroups.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {contactGroups.slice(0, 3).map((group) => (
              <Badge
                key={group.id}
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: group.color,
                  color: group.color,
                }}
              >
                {group.name}
              </Badge>
            ))}
            {contactGroups.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{contactGroups.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {contact.tags.slice(0, 3).map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </div>
            ))}
            {contact.tags.length > 3 && (
              <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                +{contact.tags.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {contact.notes && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-600 line-clamp-2">{contact.notes}</p>
        </div>
      )}
    </Card>
  );
}

