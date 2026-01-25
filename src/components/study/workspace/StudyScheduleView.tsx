import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, isToday } from "date-fns";
import { 
  Plus, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  MoreHorizontal, Edit2, Trash2, CheckCircle2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  title: string;
  section_type: string;
  parent_section_id: string | null;
}

interface ScheduleItem {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  is_completed: boolean;
  color: string;
  section_id: string | null;
}

interface Props {
  templateId: string;
  sections: Section[];
}

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

const colorOptions = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
];

export const StudyScheduleView = ({ templateId, sections }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_date: new Date(),
    start_time: "09:00",
    end_time: "10:00",
    duration_minutes: 60,
    color: "#3b82f6",
    section_id: "",
  });

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
  });

  // Fetch schedule items
  const { data: scheduleItems = [], isLoading } = useQuery({
    queryKey: ["study-schedule", templateId, format(currentWeekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      const { data, error } = await supabase
        .from("user_study_schedule")
        .select("*")
        .eq("user_template_id", templateId)
        .gte("scheduled_date", format(currentWeekStart, "yyyy-MM-dd"))
        .lte("scheduled_date", format(weekEnd, "yyyy-MM-dd"))
        .order("scheduled_date")
        .order("start_time");
      
      if (error) throw error;
      return data as ScheduleItem[];
    },
    enabled: !!templateId,
  });

  // Add/update schedule item
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        user_id: user!.id,
        user_template_id: templateId,
        title: data.title,
        description: data.description || null,
        scheduled_date: format(data.scheduled_date, "yyyy-MM-dd"),
        start_time: data.start_time,
        end_time: data.end_time,
        duration_minutes: data.duration_minutes,
        color: data.color,
        section_id: data.section_id || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("user_study_schedule")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_study_schedule")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-schedule"] });
      setShowAddDialog(false);
      setEditingItem(null);
      resetForm();
      toast.success(editingItem ? "Schedule updated" : "Schedule added");
    },
  });

  // Delete schedule item
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_study_schedule")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-schedule"] });
      toast.success("Schedule removed");
    },
  });

  // Toggle completion
  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("user_study_schedule")
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-schedule"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      scheduled_date: selectedDate || new Date(),
      start_time: "09:00",
      end_time: "10:00",
      duration_minutes: 60,
      color: "#3b82f6",
      section_id: "",
    });
  };

  const handleAddClick = (date: Date) => {
    setSelectedDate(date);
    setFormData(prev => ({ ...prev, scheduled_date: date }));
    setShowAddDialog(true);
  };

  const handleEditClick = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      scheduled_date: new Date(item.scheduled_date),
      start_time: item.start_time || "09:00",
      end_time: item.end_time || "10:00",
      duration_minutes: item.duration_minutes,
      color: item.color,
      section_id: item.section_id || "",
    });
    setShowAddDialog(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    saveMutation.mutate(editingItem ? { ...formData, id: editingItem.id } : formData);
  };

  const getItemsForDay = (date: Date) => {
    return scheduleItems.filter(item => isSameDay(new Date(item.scheduled_date), date));
  };

  // Get root sections for linking
  const rootSections = sections.filter(s => !s.parent_section_id);

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentWeekStart(prev => addDays(prev, -7))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <h3 className="font-medium">
                {format(currentWeekStart, "MMM d")} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}
              </h3>
              <Button 
                variant="link" 
                className="text-xs h-auto p-0"
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              >
                Go to this week
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentWeekStart(prev => addDays(prev, 7))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayItems = getItemsForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <Card 
              key={day.toISOString()} 
              className={cn(
                "border-border/50 min-h-[200px]",
                isCurrentDay && "ring-2 ring-primary"
              )}
            >
              <CardHeader className="p-2 pb-1">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "text-sm font-medium",
                    isCurrentDay && "text-primary"
                  )}>
                    {format(day, "EEE")}
                  </div>
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm",
                    isCurrentDay ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}>
                    {format(day, "d")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {dayItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-2 rounded-md text-xs cursor-pointer transition-opacity",
                      item.is_completed && "opacity-60"
                    )}
                    style={{ backgroundColor: `${item.color}20`, borderLeft: `3px solid ${item.color}` }}
                    onClick={() => handleEditClick(item)}
                  >
                    <div className="flex items-start gap-1">
                      <Checkbox
                        checked={item.is_completed}
                        onCheckedChange={(checked) => {
                          toggleCompletionMutation.mutate({ id: item.id, completed: checked === true });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 h-3 w-3"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium truncate",
                          item.is_completed && "line-through"
                        )}>
                          {item.title}
                        </p>
                        {item.start_time && (
                          <p className="text-muted-foreground">
                            {item.start_time.slice(0, 5)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-muted-foreground"
                  onClick={() => handleAddClick(day)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingItem(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Schedule" : "Add Study Session"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder="Study session title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Optional notes..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(formData.scheduled_date, "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.scheduled_date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, scheduled_date: date }))}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Link to Section</label>
                <Select
                  value={formData.section_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, section_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {rootSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Time</label>
                <Select
                  value={formData.start_time}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, start_time: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Time</label>
                <Select
                  value={formData.end_time}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, end_time: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: formData.color }}
                        />
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {editingItem && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  deleteMutation.mutate(editingItem.id);
                  setShowAddDialog(false);
                  setEditingItem(null);
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingItem(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {editingItem ? "Save Changes" : "Add Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
