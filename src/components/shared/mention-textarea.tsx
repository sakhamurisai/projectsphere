"use client";

import { useRef, useState } from "react";
import { useWorkspaceMembers } from "@/hooks/use-workspaces";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  workspaceId: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function MentionTextarea({
  value,
  onChange,
  workspaceId,
  placeholder = "Write something… use @ to mention a teammate",
  rows = 4,
  className,
  id,
  disabled,
}: MentionTextareaProps) {
  const { members } = useWorkspaceMembers(workspaceId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredMembers =
    mentionQuery !== null
      ? members
          .filter((m) => {
            const name = (m.user?.name || m.user?.email || "").toLowerCase();
            return name.includes(mentionQuery.toLowerCase());
          })
          .slice(0, 6)
      : [];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart ?? newValue.length;
    const textBefore = newValue.slice(0, cursor);
    const atIdx = textBefore.lastIndexOf("@");

    if (atIdx !== -1) {
      const afterAt = textBefore.slice(atIdx + 1);
      if (!afterAt.includes(" ") && !afterAt.includes("\n")) {
        setMentionQuery(afterAt);
        setMentionStart(atIdx);
        setActiveIndex(0);
      } else {
        setMentionQuery(null);
        setMentionStart(-1);
      }
    } else {
      setMentionQuery(null);
      setMentionStart(-1);
    }

    onChange(newValue);
  };

  const insertMention = (name: string) => {
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    const firstName = name.split(" ")[0];
    const inserted = `@${firstName} `;
    const newValue = `${before}${inserted}${after}`;
    onChange(newValue);
    setMentionQuery(null);
    setMentionStart(-1);

    setTimeout(() => {
      const pos = mentionStart + inserted.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery === null || filteredMembers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const member = filteredMembers[activeIndex];
      if (member) insertMention(member.user?.name || member.user?.email || "");
    } else if (e.key === "Escape") {
      setMentionQuery(null);
      setMentionStart(-1);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-none",
          className
        )}
      />

      {/* Mention dropdown */}
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div className="absolute z-50 left-0 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <div className="px-3 py-1.5 border-b border-border/60">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Mention a teammate
            </p>
          </div>
          {filteredMembers.map((member, i) => {
            const name = member.user?.name || member.user?.email || "Unknown";
            const email = member.user?.email || "";
            const initials = name.slice(0, 2).toUpperCase();
            return (
              <button
                key={member.userId}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(member.user?.name || email);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                  i === activeIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <Avatar className="size-7 shrink-0">
                  {member.user?.avatarUrl && (
                    <AvatarImage src={member.user.avatarUrl} alt={name} />
                  )}
                  <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-none truncate">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{email}</p>
                </div>
                <span className="ml-auto text-[10px] text-muted-foreground/60 capitalize shrink-0">
                  {member.role}
                </span>
              </button>
            );
          })}
          <div className="px-3 py-1.5 border-t border-border/60 flex items-center gap-2">
            <kbd className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono text-muted-foreground">↑↓</kbd>
            <span className="text-[10px] text-muted-foreground">navigate</span>
            <kbd className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono text-muted-foreground">↵</kbd>
            <span className="text-[10px] text-muted-foreground">select</span>
            <kbd className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono text-muted-foreground">esc</kbd>
            <span className="text-[10px] text-muted-foreground">dismiss</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Render description with @mention highlights ── */
export function RenderWithMentions({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  if (!text) return <span className={className}>—</span>;

  const parts = text.split(/(@\w+)/g);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        /^@\w+$/.test(part) ? (
          <span
            key={i}
            className="inline-flex items-center rounded px-1 py-0.5 text-[0.85em] font-medium bg-primary/10 text-primary"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
